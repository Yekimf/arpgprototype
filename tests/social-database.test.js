import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];

test('friends SQL enforces participant access, host approval, live rooms and private signaling',async()=>{
 const db=new PGlite();try{
  // Supabase provides auth.uid(), auth.users and pgcrypto. The test supplies
  // those boundaries; every application table and RPC runs the real migration.
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid() to authenticated;create schema extensions;create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile as $$select decode(substr(md5(random()::text),1,n*2),'hex')$$;`);
  const sql=(await readFile(new URL('../supabase/migrations/001_browser_friends.sql',import.meta.url),'utf8')).replace('create extension if not exists pgcrypto with schema extensions;','');await db.exec(sql);
  for(const id of ids)await db.query('insert into auth.users values($1)',[id]);
  const as=async(index,fn,args=[])=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[index]]);await db.exec('set role authenticated');return (await db.query(`select public.${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args)).rows[0].value;};
  const a=await as(0,'social_register',['Alden']),b=await as(1,'social_register',['Bran']),c=await as(2,'social_register',['Cora']);assert.equal(a.friend_code.length,12);
  await assert.rejects(as(2,'social_request_join',[a.id,'room-one']),/friends/);await as(0,'social_add_friend',[b.friend_code]);const request=(await as(1,'social_roster')).friends[0];assert.equal(request.incoming,true);
  await assert.rejects(as(2,'social_reply_friend',[request.id,true]),/expired/);await as(1,'social_reply_friend',[request.id,true]);assert.equal((await as(0,'social_roster')).friends[0].accepted,true);
  await as(0,'social_heartbeat',[{id:'room-one',name:'The company'}]);const join=await as(1,'social_request_join',[a.id,'room-one']);await assert.rejects(as(1,'social_signal',[join.id,'offer',{type:'offer',sdp:'bad'}]),/expired/);
  await assert.rejects(as(2,'social_reply_join',[join.id,true]),/expired/);await as(0,'social_reply_join',[join.id,true]);await assert.rejects(as(1,'social_signal',[join.id,'offer',{type:'offer',sdp:'bad'}]),/direction/);
  await as(0,'social_signal',[join.id,'offer',{type:'offer',sdp:'session'}]);assert.equal((await as(1,'social_poll',[0])).signals[0].payload.sdp,'session');assert.equal((await as(2,'social_poll',[0])).signals.length,0);assert.equal((await as(0,'social_poll',[0])).signals.length,0);
  await db.exec('reset role');await db.exec('set role authenticated');await assert.rejects(db.query('select * from social_signals'),/permission denied/);await assert.rejects(db.query("update social_profiles set display_name='Hijacked'"),/permission denied/);
  await as(0,'social_remove_friend',[request.id]);assert.equal((await as(1,'social_poll',[0])).signals.length,0);await assert.rejects(as(1,'social_request_join',[a.id,'room-one']),/friends/);
  await db.exec('reset role');await db.exec('set role anon');await assert.rejects(db.query("select social_register('Intruder')"),/permission denied/);
 }finally{await db.close();}
});
