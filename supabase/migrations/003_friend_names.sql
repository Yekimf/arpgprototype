-- Apply after 001 and 002. Existing codes and pending friendships are retained.
create index if not exists social_profile_name_lookup on public.social_profiles(lower(display_name));
create or replace function public.social_add_friend(p_code text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare other uuid;matches integer;lookup text:=trim(p_code);
begin
 if not exists(select 1 from social_profiles where id=auth.uid()) then raise exception 'Choose a display name first';end if;
 if lookup is null or char_length(lookup)<2 or char_length(lookup)>25 then raise exception 'Enter an exact username, display name or friend code';end if;
 -- Serialize requests by the sender so parallel submissions obey the same limits.
 perform 1 from social_profiles where id=auth.uid() for update;
 if(select count(*) from social_friends where requester=auth.uid() and created_at>now()-interval '1 minute')>=10 then raise exception 'Please wait before sending more friend requests';end if;
 if(select count(*) from social_friends where requester=auth.uid() or recipient=auth.uid())>=200 then raise exception 'Your friends list is full';end if;
 if left(lookup,1)='@' then
  select p.id into other from social_profiles p join game_accounts a on a.id=p.id where a.username=lower(substr(lookup,2));
 else
  select id into other from social_profiles where friend_code=upper(lookup);
  if other is null then
   select p.id into other from social_profiles p join game_accounts a on a.id=p.id where a.username=lower(lookup);
  end if;
  if other is null then
   select count(*) into matches from social_profiles where lower(display_name)=lower(lookup);
   if matches>1 then raise exception 'Several players use that display name. Ask for their @username or friend code';end if;
   select id into other from social_profiles where lower(display_name)=lower(lookup);
  end if;
 end if;
 if other is null then raise exception 'No player found. Enter their exact username, display name or friend code';end if;
 if other=auth.uid() then raise exception 'You cannot add yourself';end if;
 if exists(select 1 from social_friends where requester=auth.uid() and recipient=other or requester=other and recipient=auth.uid()) then
  raise exception 'You are already friends or have a pending request. Check your friends list';
 end if;
 insert into social_friends(requester,recipient) values(auth.uid(),other) on conflict do nothing;
end $$;
revoke all on function public.social_add_friend(text) from public,anon;
grant execute on function public.social_add_friend(text) to authenticated;
notify pgrst, 'reload schema';
