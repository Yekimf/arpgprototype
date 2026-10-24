import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LanWorld,assets} from '../server/lan-world.mjs';
import {createPlayer} from '../src/game.js';
import {createLanServer} from '../server/lan-server.mjs';
const identity=()=>({id:randomUUID(),secret:randomUUID()});
const character=(name)=>{const p=createPlayer({name});p.gold=500;return p;};
async function company(w=new LanWorld()){const a=await w.join({create:true,name:'Test company',player:character('Alden'),identity:identity()}),b=await w.join({roomId:a.room.id,player:character('Bran'),identity:identity()});return {w,a,b,sa:w.session(a.token),sb:w.session(b.token)};}
async function readyTrade({w,a,b}){await w.action(a.token,{type:'trade-request',to:b.id});await w.action(b.token,{type:'trade-accept'});return w.session(a.token).room.trades.get(w.session(a.token).trade);}

test('LAN parties share nearby kill credit and receive private, independently claimable loot',async()=>{
 const c=await company(),{w,a,b,sa,sb}=c;await w.action(a.token,{type:'party-invite',to:b.id});const invite=w.snapshot(sb).invites[0];await w.action(b.token,{type:'party-accept',id:invite.id});assert.equal(sa.party,sb.party);
 const area=w.area(sa.room),enemy=area.d.enemies.find(e=>e.herdId);for(const s of [sa,sb])await w.action(s.token,{type:'enter',area:'wilderness:0',x:enemy.x,y:enemy.y+1});
 await w.action(a.token,{type:'hit',enemyId:enemy.id,damage:100,element:'fire',skill:'test',direct:false});assert.equal(enemy.dead,true);const left=w.snapshot(sa),right=w.snapshot(sb);assert.equal(left.kills.length,1);assert.equal(right.kills.length,1);assert.ok(left.loot.length);assert.ok(right.loot.length);assert.notEqual(left.loot[0].id,right.loot[0].id);
 const gold=sb.player.gold;await w.action(b.token,{type:'pickup',id:left.loot[0].id});assert.equal(sb.player.gold,gold);await w.action(a.token,{type:'pickup',id:left.loot[0].id});assert.ok(sa.player.gold>500);assert.equal(w.snapshot(sb).loot.length,right.loot.length);
 await w.action(a.token,{type:'kill-ack',key:left.kills[0].key});assert.equal(w.snapshot(sa).kills.length,0);assert.equal(w.snapshot(sb).kills.length,1);
});

test('trading swaps assets atomically, invalidates confirmations after edits, and persists both characters',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kingdom-lan-'));try{const file=join(dir,'characters.json'),c=await company(await new LanWorld({file}).load()),{w,a,b,sa,sb}=c;
 sa.player.inventory=[{id:'blade',name:'Falchion',slot:'weapon',rarity:'normal',damage:8}];sb.player.inventory=[{id:'ring',name:'Signet',slot:'ring',rarity:'normal',crit:2}];const t=await readyTrade(c);
 await w.action(a.token,{type:'trade-offer',items:['blade'],gold:100});await w.action(a.token,{type:'trade-confirm',revision:t.revision});assert.equal(t.confirmed.length,1);
 await w.action(b.token,{type:'trade-offer',items:['ring'],gold:20});assert.equal(t.confirmed.length,0);await assert.rejects(w.action(a.token,{type:'trade-confirm',revision:t.revision-1}),/changed/);
 await w.action(a.token,{type:'trade-confirm',revision:t.revision});await w.action(b.token,{type:'trade-confirm',revision:t.revision});assert.equal(sa.trade,null);assert.equal(sa.player.gold,420);assert.equal(sb.player.gold,580);assert.ok(sa.player.inventory.some(i=>i.id==='ring'));assert.ok(sb.player.inventory.some(i=>i.id==='blade'));assert.equal(sa.player.inventory.some(i=>i.id==='blade'),false);
 const reloaded=await new LanWorld({file}).load();assert.equal(reloaded.records[a.id].player.gold,420);assert.ok(reloaded.records[b.id].player.inventory.some(i=>i.id==='blade'));
 const stale=character('Alden');stale.lanRevision=0;const joined=await reloaded.join({create:true,player:stale,identity:sa.player.lanIdentity});assert.equal(joined.player.gold,420);assert.ok(joined.player.inventory.some(i=>i.id==='ring'));
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('full backpacks, stale sync, cancellation and disconnect cannot duplicate or lose trade items',async()=>{
 const c=await company(),{w,a,b,sa,sb}=c;sa.player.inventory=[{id:'coat',name:'Coat',slot:'armor',width:2,height:3,rarity:'normal'}];sb.player.inventory=Array.from({length:72},(_,i)=>({id:'r'+i,name:'Ring',slot:'ring',width:1,height:1,rarity:'normal'}));const beforeA=structuredClone(assets(sa.player)),beforeB=structuredClone(assets(sb.player)),t=await readyTrade(c);
 await w.action(a.token,{type:'trade-offer',items:['coat'],gold:5});await w.action(a.token,{type:'trade-confirm',revision:t.revision});await assert.rejects(w.action(b.token,{type:'trade-confirm',revision:t.revision}),/room/);assert.deepEqual(assets(sa.player),beforeA);assert.deepEqual(assets(sb.player),beforeB);assert.equal(t.confirmed.length,0);
 await w.action(b.token,{type:'leave'});assert.equal(sa.trade,null);assert.ok(sa.player.inventory.some(i=>i.id==='coat'));const old=structuredClone(sa.player);await w.commitAssets([sa]);const result=await w.action(a.token,{type:'sync',player:old,revision:0});assert.equal(result.conflict,true);assert.equal(sa.revision,1);
});

test('duplicate character sessions and private chat leakage are rejected',async()=>{
 const {w,a,b,sa,sb}=await company();await assert.rejects(w.join({roomId:a.room.id,player:sa.player,identity:sa.player.lanIdentity}),/already/);await assert.rejects(w.action(a.token,{type:'chat',channel:'party',text:'secret'}),/party/);
 await w.action(a.token,{type:'party-invite',to:b.id});await w.action(b.token,{type:'party-accept',id:w.snapshot(sb).invites[0].id});await w.action(a.token,{type:'chat',channel:'party',text:'party secret'});const third=await w.join({roomId:a.room.id,player:character('C'),identity:identity()});assert.equal(third.chat.some(m=>m.text==='party secret'),false);
});

test('the host serves the game and authenticated event stream without external dependencies',async()=>{
 const app=await createLanServer({port:0,host:'127.0.0.1',file:null}),base='http://127.0.0.1:'+app.port;try{
 const info=await (await fetch(base+'/api/lan')).json();assert.equal(info.protocol,1);const res=await fetch(base+'/api/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'HTTP company',player:character('Http'),identity:identity()})});const data=await res.json();assert.equal(data.ok,true);
 const controller=new AbortController(),events=await fetch(base+'/api/events?token='+data.result.token,{signal:controller.signal});assert.match(events.headers.get('content-type'),/event-stream/);const reader=events.body.getReader(),first=await reader.read();assert.match(new TextDecoder().decode(first.value),/state/);controller.abort();assert.equal((await fetch(base+'/server/lan-world.mjs')).status,404);
 }finally{await app.close();}
});

test('failed disk writes roll back both trade participants and personal loot claims',async()=>{
 const c=await company(),{w,a,b,sa,sb}=c;sa.player.inventory=[{id:'one',name:'One',slot:'ring',rarity:'normal'}];sb.player.inventory=[{id:'two',name:'Two',slot:'ring',rarity:'normal'}];const t=await readyTrade(c);await w.action(a.token,{type:'trade-offer',items:['one'],gold:10});await w.action(b.token,{type:'trade-offer',items:['two'],gold:0});await w.action(a.token,{type:'trade-confirm',revision:t.revision});const before=structuredClone([assets(sa.player),assets(sb.player)]);w.persist=async()=>{throw Error('disk full');};await assert.rejects(w.action(b.token,{type:'trade-confirm',revision:t.revision}),/disk full/);assert.deepEqual([assets(sa.player),assets(sb.player)],before);assert.equal(sa.revision,0);assert.equal(sb.revision,0);
 await w.action(a.token,{type:'trade-cancel'});w.drop(sa,{x:sa.pos.x,y:sa.pos.y,gold:50});const drop=w.snapshot(sa).loot[0];await assert.rejects(w.action(a.token,{type:'pickup',id:drop.id}),/disk full/);assert.equal(sa.player.gold,500);assert.equal(w.snapshot(sa).loot[0].id,drop.id);
});

test('imported duplicate fixed item IDs are repaired, and an incoming trophy never overwrites an owned copy',async()=>{
 const w=new LanWorld(),p=character('Collector');p.inventory=[{id:'starter-sword',name:'Old sword',slot:'weapon',rarity:'normal'}];const a=await w.join({create:true,player:p,identity:identity()}),s=w.session(a.token);assert.notEqual(s.player.inventory[0].id,s.player.equipment.weapon.id);w.drop(s,{x:s.pos.x,y:s.pos.y,item:{id:s.player.inventory[0].id,name:'Another sword',slot:'weapon',rarity:'normal'}});await w.action(a.token,{type:'pickup',id:w.snapshot(s).loot[0].id});assert.equal(new Set(s.player.inventory.map(i=>i.id)).size,2);
});


test('a failed character sync can retry without advancing the committed revision',async()=>{
 const {w,a,sa}=await company(),before=structuredClone(sa.player),updated=structuredClone(sa.player);updated.gold+=75;const persist=w.persist;w.persist=async()=>{throw Error('disk full');};await assert.rejects(w.action(a.token,{type:'sync',player:updated,revision:0}),/disk full/);assert.equal(sa.revision,0);assert.equal(sa.player.gold,before.gold);w.persist=persist;const reply=await w.action(a.token,{type:'sync',player:updated,revision:0});assert.equal(reply.revision,1);assert.equal(sa.player.gold,575);
});

test('party leadership survives a departing leader and only the new leader can remove a member',async()=>{
 const {w,a,b,sa,sb}=await company(),c=await w.join({roomId:a.room.id,player:character('C'),identity:identity()}),sc=w.session(c.token);
 for(const peer of [b,c]){await w.action(a.token,{type:'party-invite',to:peer.id});await w.action(peer.token,{type:'party-accept',id:w.snapshot(w.session(peer.token)).invites[0].id});}
 await assert.rejects(w.action(c.token,{type:'party-kick',to:b.id}),/leader/);await w.action(a.token,{type:'party-leave'});assert.equal(w.snapshot(sb).players.find(p=>p.id===b.id).partyLeader,b.id);await w.action(b.token,{type:'party-kick',to:c.id});assert.equal(sc.party,null);assert.ok(sb.party);assert.equal(sa.party,null);
});
