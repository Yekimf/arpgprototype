-- Apply after 001, 002 and 003. The ladder exposes only public character fields.
create or replace function public.online_ladder() returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from game_accounts where id=auth.uid()) then
  raise exception 'Sign in with a username and password first';
 end if;
 return coalesce((
  select jsonb_agg(jsonb_build_object(
   'id', ranked.id,
   'character', ranked.character,
   'level', ranked.level,
   'class', ranked.class,
   'account', ranked.account
  ) order by ranked.level desc, ranked.updated_at asc, ranked.id)
  from (
   select c.id,
    left(c.save#>>'{player,name}',24) as character,
    case when c.save#>>'{player,level}' ~ '^[0-9]{1,3}$'
     then least((c.save#>>'{player,level}')::int,100) else 1 end as level,
    case c.save#>>'{player,origin}' when 'vanguard' then 'Royal Guard'
     else 'Loyalist' end as class,
    left(p.display_name,24) as account,
    c.updated_at
   from online_characters c
   join social_profiles p on p.id=c.owner
   order by level desc,c.updated_at asc,c.id
   limit 100
  ) ranked
 ),'[]'::jsonb);
end $$;
revoke all on function public.online_ladder() from public,anon;
grant execute on function public.online_ladder() to authenticated;
notify pgrst, 'reload schema';
