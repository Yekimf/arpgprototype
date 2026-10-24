-- Run once in the Supabase SQL editor. Anonymous Auth must also be enabled.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table public.social_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 24),
 friend_code text not null unique default upper(encode(extensions.gen_random_bytes(6),'hex')),
 last_seen timestamptz not null default now(), hosting jsonb,
 updated_at timestamptz not null default now()
);
create table public.social_friends (
 id uuid primary key default gen_random_uuid(),
 requester uuid not null references public.social_profiles(id) on delete cascade,
 recipient uuid not null references public.social_profiles(id) on delete cascade,
 accepted boolean not null default false, created_at timestamptz not null default now(),
 check(requester<>recipient)
);
create unique index social_friend_pair on public.social_friends(least(requester,recipient),greatest(requester,recipient));
create table public.social_joins (
 id uuid primary key default gen_random_uuid(), requester uuid not null references public.social_profiles(id) on delete cascade,
 host uuid not null references public.social_profiles(id) on delete cascade, room_id text not null,
 state text not null default 'pending' check(state in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '2 minutes',check(requester<>host)
);
create index social_join_participants on public.social_joins(host,requester,created_at);
create table public.social_signals (
 id bigint generated always as identity primary key, request_id uuid not null references public.social_joins(id) on delete cascade,
 sender uuid not null references public.social_profiles(id) on delete cascade, recipient uuid not null references public.social_profiles(id) on delete cascade,
 kind text not null check(kind in ('offer','answer','ice')), payload jsonb not null,
 created_at timestamptz not null default now()
);
create index social_signal_inbox on public.social_signals(recipient,id);
alter table public.social_profiles enable row level security;
alter table public.social_friends enable row level security;
alter table public.social_joins enable row level security;
alter table public.social_signals enable row level security;
-- All access goes through the checked RPCs below. No table is public-readable.
revoke all on public.social_profiles,public.social_friends,public.social_joins,public.social_signals from anon,authenticated;
create function public.social_are_friends(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from social_friends where accepted and ((requester=a and recipient=b) or(requester=b and recipient=a)));
$$;
create function public.social_register(p_name text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p social_profiles;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 p_name:=trim(regexp_replace(p_name,'\s+',' ','g'));
 if p_name !~ '^[[:alnum:]][[:alnum:] _''-]{1,23}$' then raise exception 'Use 2–24 letters, numbers, spaces, apostrophes or hyphens';end if;
 insert into social_profiles(id,display_name) values(auth.uid(),p_name)
 on conflict(id) do update set display_name=excluded.display_name,updated_at=now(),last_seen=now() returning * into p;
 return jsonb_build_object('id',p.id,'display_name',p.display_name,'friend_code',p.friend_code);
end $$;
create function public.social_heartbeat(p_hosting jsonb default null) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 if p_hosting is not null and (jsonb_typeof(p_hosting)<>'object' or char_length(p_hosting::text)>500 or coalesce(p_hosting->>'id','') !~ '^[a-zA-Z0-9-]{1,80}$') then raise exception 'Invalid company';end if;
 update social_profiles set last_seen=now(),hosting=p_hosting where id=auth.uid();
 -- Short-lived negotiation records contain network candidates, not game saves.
 delete from social_joins where (host=auth.uid() or requester=auth.uid()) and created_at<now()-interval '1 day';
end $$;
create function public.social_roster() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 return jsonb_build_object('profile',(select jsonb_build_object('id',id,'display_name',display_name,'friend_code',friend_code) from social_profiles where id=auth.uid()),'friends',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'user_id',p.id,'display_name',p.display_name,'friend_code',p.friend_code,'accepted',f.accepted,'incoming',f.recipient=auth.uid(),'online',p.last_seen>now()-interval '45 seconds','hosting',case when f.accepted and p.last_seen>now()-interval '45 seconds' then p.hosting else null end) order by p.display_name) from social_friends f join social_profiles p on p.id=case when f.requester=auth.uid() then f.recipient else f.requester end where f.requester=auth.uid() or f.recipient=auth.uid()),'[]'::jsonb));
end $$;
create function public.social_add_friend(p_code text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare other uuid;
begin
 if not exists(select 1 from social_profiles where id=auth.uid()) then raise exception 'Choose a display name first';end if;
 if(select count(*) from social_friends where requester=auth.uid() and created_at>now()-interval '1 minute')>=10 then raise exception 'Please wait before sending more friend requests';end if;
 if(select count(*) from social_friends where requester=auth.uid() or recipient=auth.uid())>=200 then raise exception 'Your friends list is full';end if;
 select id into other from social_profiles where friend_code=upper(trim(p_code));
 if other is null or other=auth.uid() then raise exception 'That friend code is unavailable';end if;
 insert into social_friends(requester,recipient) values(auth.uid(),other) on conflict do nothing;
end $$;
create function public.social_reply_friend(p_id uuid,p_accept boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from social_friends where id=p_id and recipient=auth.uid() and not accepted) then raise exception 'Friend request expired';end if;
 if p_accept then update social_friends set accepted=true where id=p_id;else delete from social_friends where id=p_id;end if;
end $$;
create function public.social_remove_friend(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare f social_friends;
begin
 select * into f from social_friends where id=p_id and auth.uid() in(requester,recipient);
 if f.id is null then raise exception 'Friend is unavailable';end if;
 delete from social_joins where (host=f.requester and requester=f.recipient)or(host=f.recipient and requester=f.requester);
 delete from social_friends where id=p_id;
end $$;
create function public.social_request_join(p_host uuid,p_room text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j social_joins;
begin
 if not social_are_friends(auth.uid(),p_host) then raise exception 'Become friends before joining';end if;
 if not exists(select 1 from social_profiles where id=p_host and last_seen>now()-interval '45 seconds' and hosting->>'id'=p_room) then raise exception 'Your friend is no longer hosting';end if;
 if(select count(*) from social_joins where requester=auth.uid() and created_at>now()-interval '1 minute')>=6 then raise exception 'Please wait before requesting again';end if;
 update social_joins set state='cancelled' where requester=auth.uid() and state in('pending','accepted');
 insert into social_joins(requester,host,room_id) values(auth.uid(),p_host,p_room) returning * into j;
 return to_jsonb(j);
end $$;
create function public.social_reply_join(p_id uuid,p_accept boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from social_joins j join social_profiles p on p.id=j.host where j.id=p_id and j.host=auth.uid() and j.state='pending' and j.expires_at>now() and social_are_friends(j.requester,j.host) and p.hosting->>'id'=j.room_id) then raise exception 'Join request expired';end if;
 update social_joins set state=case when p_accept then 'accepted' else 'declined' end where id=p_id;
end $$;
create function public.social_cancel_join(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update social_joins set state='cancelled' where id=p_id and auth.uid() in(requester,host);
end $$;
create function public.social_signal(p_request uuid,p_kind text,p_payload jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare j social_joins;other uuid;
begin
 select * into j from social_joins where id=p_request and auth.uid() in(requester,host) and state='accepted' and expires_at>now();
 if j.id is null or not social_are_friends(j.host,j.requester) then raise exception 'The connection request expired';end if;
 if p_kind not in('offer','answer','ice') or jsonb_typeof(p_payload)<>'object' or char_length(p_payload::text)>200000 then raise exception 'Invalid connection message';end if;
 if(p_kind='offer' and auth.uid()<>j.host)or(p_kind='answer' and auth.uid()<>j.requester) then raise exception 'Invalid connection direction';end if;
 if(select count(*) from social_signals where request_id=p_request and sender=auth.uid())>=150 then raise exception 'Too many connection messages';end if;
 other:=case when j.host=auth.uid() then j.requester else j.host end;
 insert into social_signals(request_id,sender,recipient,kind,payload) values(p_request,auth.uid(),other,p_kind,p_payload);
end $$;
create function public.social_poll(p_after bigint default 0) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 return jsonb_build_object('requests',coalesce((select jsonb_agg(to_jsonb(j)||jsonb_build_object('display_name',p.display_name)) from social_joins j join social_profiles p on p.id=case when j.host=auth.uid() then j.requester else j.host end where auth.uid() in(j.host,j.requester) and j.expires_at>now() and social_are_friends(j.host,j.requester)),'[]'::jsonb),'signals',coalesce((select jsonb_agg(to_jsonb(s) order by s.id) from social_signals s join social_joins j on j.id=s.request_id where s.recipient=auth.uid() and s.id>p_after and j.state='accepted' and j.expires_at>now() and social_are_friends(j.host,j.requester)),'[]'::jsonb));
end $$;
-- PostgreSQL grants PUBLIC execution by default. Restrict every exposed RPC.
revoke all on function public.social_are_friends(uuid,uuid) from public,anon,authenticated;
revoke all on function public.social_register(text),public.social_heartbeat(jsonb),public.social_roster(),public.social_add_friend(text),public.social_reply_friend(uuid,boolean),public.social_remove_friend(uuid),public.social_request_join(uuid,text),public.social_reply_join(uuid,boolean),public.social_cancel_join(uuid),public.social_signal(uuid,text,jsonb),public.social_poll(bigint) from public,anon;
grant execute on function public.social_register(text),public.social_heartbeat(jsonb),public.social_roster(),public.social_add_friend(text),public.social_reply_friend(uuid,boolean),public.social_remove_friend(uuid),public.social_request_join(uuid,text),public.social_reply_join(uuid,boolean),public.social_cancel_join(uuid),public.social_signal(uuid,text,jsonb),public.social_poll(bigint) to authenticated;
