-- Apply after 004. Only visible gear shape data is returned; saves stay private.
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
   'account', ranked.account,
   'portrait', ranked.portrait
  ) order by ranked.level desc, ranked.updated_at asc, ranked.id)
  from (
   select c.id,
    left(c.save#>>'{player,name}',24) as character,
    case when c.save#>>'{player,level}' ~ '^[0-9]{1,3}$'
     then least((c.save#>>'{player,level}')::int,100) else 1 end as level,
    case c.save#>>'{player,origin}' when 'vanguard' then 'Royal Guard'
     else 'Loyalist' end as class,
    left(p.display_name,24) as account,
    jsonb_build_object(
     'appearance', left(coalesce(c.save#>>'{player,appearance}','crimson'),24),
     'equipment', (
      select coalesce(jsonb_object_agg(gear.slot,
       case when jsonb_typeof(gear.item)='object' then jsonb_strip_nulls(jsonb_build_object(
        'slot',case when gear.slot='ring2' then 'ring' else gear.slot end,
        'look',left(coalesce(gear.item->>'look',case gear.slot when 'weapon' then 'sword' when 'armor' then 'leather' when 'helm' then 'sallet' when 'shield' then 'round' else 'leather' end),24),
        'rarity',left(coalesce(gear.item->>'rarity','normal'),16),
        'setId',left(gear.item->>'setId',32),
        'twoHanded',gear.item->'twoHanded',
        'weaponIcon',case when gear.item->>'weaponIcon' ~ '^[0-9]{1,2}$' then least((gear.item->>'weaponIcon')::int,15) else null end,
        'identified',gear.item->'identified'
       )) else null end
      ),'{}'::jsonb)
      from jsonb_each(coalesce(c.save#>'{player,equipment}','{}'::jsonb)) as gear(slot,item)
      where gear.slot in ('weapon','armor','helm','shield','gloves','boots','belt','ring','ring2','charm')
     )
    ) as portrait,
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
