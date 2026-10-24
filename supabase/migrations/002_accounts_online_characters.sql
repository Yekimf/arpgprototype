-- Apply AFTER 001_browser_friends.sql. No existing local save is uploaded.
create table public.game_accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check(username ~ '^[a-z][a-z0-9_]{2,19}$'),created_at timestamptz not null default now()
);
create table public.online_characters (
 id uuid primary key default gen_random_uuid(),owner uuid not null references public.game_accounts(id) on delete cascade,
 save jsonb not null,revision bigint not null default 0,lease_id uuid,lease_until timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index online_character_owner on public.online_characters(owner,created_at);
create table public.online_starter(singleton boolean primary key default true check(singleton),save jsonb not null);
-- Generated from the current fresh-character factory; only the migration owner
-- can edit this template. Character creation never accepts an imported save.
insert into public.online_starter(save) values('{"version":1,"player":{"sex":"male","name":"The Loyalist","origin":"vanguard","appearance":"crimson","progressionVersion":2,"passiveVersion":1,"passives":[],"passivePoints":0,"skillMods":{},"dungeonGeneration":0,"attributes":{"might":2,"vitality":2,"will":0,"dexterity":0},"attributePoints":0,"x":0,"y":0,"level":1,"xp":0,"gold":0,"points":0,"skills":{},"slots":[null,null,null,null],"mouseSkill":"basic","primarySkill":"basic","equipment":{"weapon":{"name":"King’s Service Sword","slot":"weapon","rarity":"normal","damage":5,"level":1,"icon":"⚔","id":"starter-sword","requiredLevel":1,"requiredStats":{"might":10},"requirementsVersion":1,"durability":100,"identified":true,"reforges":0},"armor":null,"charm":null,"boots":null,"helm":null,"gloves":null,"belt":null,"ring":null,"ring2":null,"shield":{"id":"starter-buckler","name":"Scarred Buckler","slot":"shield","rarity":"normal","level":1,"armor":1,"block":4,"look":"round","requiredLevel":1,"requiredStats":{"might":10},"requirementsVersion":1,"durability":100,"identified":true,"reforges":0}},"inventory":[],"stash":[],"shards":0,"scrollInventoryVersion":2,"buyback":[],"shopStock":null,"quests":{"guideMet":false,"scholarRescued":false,"wardenDefeated":false,"guideRewarded":false},"hp":132,"mana":80,"potions":3,"kills":0,"deaths":0,"chronicle":{"version":1,"unlocked":{},"stats":{},"seenChickens":[],"title":null},"setCollection":[],"bankGold":0,"goldEarned":0,"flask":{"charges":60,"healing":0,"remaining":0},"campaign":{"actOneVersion":3,"act":1,"chapters":{},"records":[],"defeated":[],"waypoints":["emberfall"],"visited":["emberfall"],"guidance":[],"completed":false,"introSeen":true}},"seed":1,"depth":1,"zone":"town","act":1,"chapter":0}'::jsonb);
alter table public.game_accounts enable row level security;
alter table public.online_characters enable row level security;
alter table public.online_starter enable row level security;
revoke all on public.game_accounts,public.online_characters,public.online_starter from public,anon,authenticated;
alter table public.social_joins add column online_character_id uuid references public.online_characters(id) on delete cascade;
create function public.account_info() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 return (select jsonb_build_object('id',a.id,'username',a.username,'display_name',p.display_name,'friend_code',p.friend_code) from game_accounts a join social_profiles p on p.id=a.id where a.id=auth.uid());
end $$;
create function public.account_register(p_username text,p_name text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare email text;existing text;
begin
 p_username:=lower(trim(p_username));
 if auth.uid() is null or p_username !~ '^[a-z][a-z0-9_]{2,19}$' then raise exception 'Invalid account username';end if;
 select u.email into email from auth.users u where u.id=auth.uid();
 if email is distinct from p_username||'@accounts.forgotten-kingdom.invalid' then raise exception 'Complete username/password registration first. Check Email provider and confirmation settings';end if;
 select username into existing from game_accounts where id=auth.uid();
 if existing is not null and existing<>p_username then raise exception 'Your account username cannot be changed';end if;
 insert into game_accounts(id,username) values(auth.uid(),p_username) on conflict(id) do nothing;
 if not exists(select 1 from social_profiles where id=auth.uid()) then perform social_register(p_name);end if;
 return account_info();
end $$;
create function public.online_roster() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from game_accounts where id=auth.uid()) then raise exception 'Sign in with a username and password first';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'save',save,'revision',revision,'createdAt',created_at,'updatedAt',updated_at,'online',true) order by created_at,id) from online_characters where owner=auth.uid()),'[]'::jsonb);
end $$;
create function public.online_create(p_name text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c online_characters;s jsonb;identity uuid:=gen_random_uuid();secret text:=encode(extensions.gen_random_bytes(20),'hex');
begin
 if not exists(select 1 from game_accounts where id=auth.uid()) then raise exception 'Sign in with a username and password first';end if;
 perform 1 from game_accounts where id=auth.uid() for update;
 if(select count(*) from online_characters where owner=auth.uid())>=20 then raise exception 'You can have up to 20 online characters';end if;
 p_name:=trim(regexp_replace(p_name,'\s+',' ','g'));
 if p_name !~ '^[[:alnum:]][[:alnum:] _''-]{1,23}$' then raise exception 'Choose a character name of 2–24 letters or numbers';end if;
 select save into s from online_starter where singleton;
 s:=jsonb_set(s,'{seed}',to_jsonb(floor(random()*1000000000)::bigint));
 s:=jsonb_set(s,'{player}',(s->'player')||jsonb_build_object('name',p_name,'onlineCharacterId',identity,'onlineOwnerId',auth.uid(),'lanIdentity',jsonb_build_object('id',identity,'secret',secret)));
 insert into online_characters(id,owner,save) values(identity,auth.uid(),s) returning * into c;
 return jsonb_build_object('id',c.id,'save',c.save,'revision',c.revision,'online',true);
end $$;
create function public.online_open(p_id uuid,p_lease uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c online_characters;
begin
 select * into c from online_characters where id=p_id and owner=auth.uid() for update;
 if c.id is null then raise exception 'That online character belongs to another account or no longer exists';end if;
 if p_lease is null then raise exception 'Invalid character session';end if;
 if c.lease_until>now() and c.lease_id is distinct from p_lease then raise exception 'This online character is already in use. Close its other session or wait 90 seconds';end if;
 update online_characters set lease_id=p_lease,lease_until=now()+interval '90 seconds' where id=p_id;
 return jsonb_build_object('id',c.id,'save',c.save,'revision',c.revision,'online',true);
end $$;
create function public.online_save(p_id uuid,p_lease uuid,p_revision bigint,p_save jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c online_characters;
begin
 select * into c from online_characters where id=p_id and owner=auth.uid() for update;
 if c.id is null or p_lease is null or c.lease_id is distinct from p_lease or c.lease_until is null or c.lease_until<now() then raise exception 'Online character session expired. Return to character select';end if;
 if p_revision is null or c.revision<>p_revision then raise exception 'This character changed in another session. Reload its online save';end if;
 if char_length(p_save::text)>1500000 or p_save->>'version' is distinct from '1' or jsonb_typeof(p_save->'player') is distinct from 'object' or jsonb_typeof(p_save#>'{player,inventory}') is distinct from 'array' or jsonb_typeof(p_save#>'{player,equipment}') is distinct from 'object' or jsonb_typeof(p_save#>'{player,skills}') is distinct from 'object' then raise exception 'Invalid character save';end if;
 if p_save#>>'{player,onlineCharacterId}' is distinct from c.id::text or p_save#>>'{player,onlineOwnerId}' is distinct from auth.uid()::text or p_save#>'{player,lanIdentity}' is distinct from c.save#>'{player,lanIdentity}' then raise exception 'A local or different character cannot replace an online character';end if;
 update online_characters set save=p_save,revision=revision+1,updated_at=now(),lease_until=now()+interval '90 seconds' where id=p_id returning * into c;
 return jsonb_build_object('id',c.id,'revision',c.revision,'updatedAt',c.updated_at);
end $$;
create function public.online_release(p_id uuid,p_lease uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin update online_characters set lease_id=null,lease_until=null where id=p_id and owner=auth.uid() and lease_id=p_lease;end $$;
create function public.online_delete(p_id uuid,p_name text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare c online_characters;
begin
 select * into c from online_characters where id=p_id and owner=auth.uid() for update;
 if c.id is null then raise exception 'Online character unavailable';end if;
 if c.save#>>'{player,name}' is distinct from p_name then raise exception 'Enter the exact character name';end if;
 if c.lease_until>now() then raise exception 'Leave the active character session before deleting';end if;
 delete from online_characters where id=p_id;
end $$;
-- Old anonymous/local characters cannot request admission to an online company.
drop function public.social_request_join(uuid,text);
create function public.social_request_join(p_host uuid,p_room text,p_character uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j social_joins;
begin
 if not exists(select 1 from game_accounts where id=auth.uid()) or not exists(select 1 from game_accounts where id=p_host) then raise exception 'Online play requires a username/password account';end if;
 if not exists(select 1 from online_characters where id=p_character and owner=auth.uid() and lease_until>now()) then raise exception 'Select your own online character before joining';end if;
 if not social_are_friends(auth.uid(),p_host) then raise exception 'Become friends before joining';end if;
 if not exists(select 1 from social_profiles where id=p_host and last_seen>now()-interval '45 seconds' and hosting->>'id'=p_room and hosting->>'online'='true') then raise exception 'Your friend is no longer hosting an online company';end if;
 if(select count(*) from social_joins where requester=auth.uid() and created_at>now()-interval '1 minute')>=6 then raise exception 'Please wait before requesting again';end if;
 update social_joins set state='cancelled' where requester=auth.uid() and state in('pending','accepted');
 insert into social_joins(requester,host,room_id,online_character_id) values(auth.uid(),p_host,p_room,p_character) returning * into j;
 return to_jsonb(j);
end $$;
create function public.online_peer_character(p_request uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j social_joins;c online_characters;
begin
 select * into j from social_joins where id=p_request and host=auth.uid() and state='accepted' and expires_at>now();
 if j.id is null or not social_are_friends(j.host,j.requester) or not exists(select 1 from social_profiles where id=auth.uid() and hosting->>'id'=j.room_id) then raise exception 'No approved online join request';end if;
 select * into c from online_characters where id=j.online_character_id and owner=j.requester and lease_until>now();
 if c.id is null then raise exception 'Your friend must reopen their online character';end if;
 return jsonb_build_object('id',c.id,'save',c.save,'revision',c.revision,'online',true);
end $$;
revoke all on function public.account_info(),public.account_register(text,text),public.online_roster(),public.online_create(text),public.online_open(uuid,uuid),public.online_save(uuid,uuid,bigint,jsonb),public.online_release(uuid,uuid),public.online_delete(uuid,text),public.social_request_join(uuid,text,uuid),public.online_peer_character(uuid) from public,anon;
grant execute on function public.account_info(),public.account_register(text,text),public.online_roster(),public.online_create(text),public.online_open(uuid,uuid),public.online_save(uuid,uuid,bigint,jsonb),public.online_release(uuid,uuid),public.online_delete(uuid,text),public.social_request_join(uuid,text,uuid),public.online_peer_character(uuid) to authenticated;
