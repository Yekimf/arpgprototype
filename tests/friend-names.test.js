import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';

test('friend requests resolve exact names and codes with ambiguity, consent and permissions preserved',async()=>{
 const db=new PGlite(),ids=Array.from({length:6},()=>crypto.randomUUID());
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid() to authenticated;create schema extensions;create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile as $$select decode(substr(repeat(md5(random()::text),3),1,n*2),'hex')$$;`);
 for(const file of ['001_browser_friends.sql','002_accounts_online_characters.sql','003_friend_names.sql'])await db.exec((await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replace('create extension if not exists pgcrypto with schema extensions;',''));
 const usernames=['alden','bran','cedric','daria','eowyn','wild_name'],names=['Alden Stone','The Raven','The Raven','Daria Vale','Éowyn','Literal Name'];
 for(let i=0;i<ids.length;i++)await db.query('insert into auth.users values($1,$2)',[ids[i],usernames[i]+'@accounts.forgotten-kingdom.invalid']);
 const as=async(i,fn,args=[])=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[i]]);await db.exec('set role authenticated');return(await db.query(`select ${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args)).rows[0].value;};
 const profiles=[];for(let i=0;i<ids.length;i++)profiles.push(await as(i,'account_register',[usernames[i],names[i]]));
 await assert.rejects(as(0,'social_add_friend',['the raven']),/Several players/);
 await assert.rejects(as(0,'social_add_friend',['ALDEN']),/yourself/);
 await assert.rejects(as(0,'social_add_friend',['Daria V']),/No player/); // exact names, no prefix search
 await assert.rejects(as(0,'social_add_friend',['wild%']),/No player/);
 await as(0,'social_add_friend',['  @BRAN  ']);
 let roster=await as(1,'social_roster');assert.equal(roster.friends[0].incoming,true);assert.equal(roster.friends[0].accepted,false);
 await assert.rejects(as(1,'social_add_friend',['alden']),/pending/);
 await as(1,'social_reply_friend',[roster.friends[0].id,true]);
 await as(0,'social_add_friend',['dArIa VaLe']);
 await as(0,'social_add_friend',[profiles[2].friend_code.toLowerCase()]);
 await as(0,'social_add_friend',['éowyn']);
 await as(0,'social_add_friend',['wild_name']);
 roster=await as(0,'social_roster');assert.equal(roster.friends.length,5);assert.equal(roster.friends.filter(f=>f.accepted).length,1);
 await db.exec('reset role;set role anon');await assert.rejects(db.query("select social_add_friend('bran')"),/permission denied/);
 await db.exec('reset role;set role authenticated');await assert.rejects(db.query('select * from game_accounts'),/permission denied/);
 }finally{await db.close();}
});
