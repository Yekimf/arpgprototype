import test from 'node:test';import assert from 'node:assert/strict';
import {LanWorld} from '../src/network/shared-world.js';
import {createPlayer} from '../src/game.js';
import {createCampaign} from '../src/campaign.js';
import {acceptActOneQuest,claimActOneQuest} from '../src/act-one.js';
import {applySharedQuests,createSharedQuests,recordSharedQuest} from '../src/network/shared-quests.js';
const identity=()=>({id:crypto.randomUUID(),secret:crypto.randomUUID()});
const player=()=>{const p=createPlayer();p.campaign=createCampaign();return p;};
async function join(w,data){return w.join({player:player(),identity:identity(),...data});}
async function kill(w,s,area,enemy){enemy.hp=1;await w.action(s.token,{type:'enter',area,x:enemy.x,y:enemy.y});await w.action(s.token,{type:'hit',enemyId:enemy.id,damage:10,element:'fire',direct:false,skill:'test'});assert.equal(enemy.dead,true);}
test('company shares objective kills without a party, across areas and with late joiners; XP and loot stay local',async()=>{
 const w=new LanWorld(),a=await join(w,{create:true}),b=await join(w,{roomId:a.room.id}),sa=w.session(a.token),sb=w.session(b.token),room=sa.room;
 await w.action(b.token,{type:'enter',area:'stronghold:0',x:20,y:20});
 const field=w.area(room,'wilderness:0'),enemies=field.d.enemies.filter(e=>e.questId==='last-herd');assert.equal(enemies.length,6);
 for(const e of enemies)await kill(w,sa,'wilderness:0',e);
 const state=w.snapshot(sb);assert.equal(state.questProgress.kills['last-herd'].length,6);assert.ok(sb.player.campaign.records.includes('field-1-0'));assert.equal(state.kills.length,0);assert.equal(state.loot.length,0);assert.equal(sb.player.xp,0);
 const c=await join(w,{roomId:room.id});assert.ok(c.player.campaign.records.includes('field-1-0'));assert.equal(c.player.campaign.questFlow.claimed.length,0);
 // A stale client save cannot erase combat objectives already earned in the room.
 const stale=player();stale.lanIdentity=sb.player.lanIdentity;await w.action(b.token,{type:'sync',player:stale,revision:sb.revision});assert.ok(sb.player.campaign.records.includes('field-1-0'));
 const boss=w.area(room,'stronghold:0').d.enemies.find(e=>e.type==='warden');await kill(w,sa,'stronghold:0',boss);assert.ok(sb.player.campaign.defeated.includes('captain-1-0'));
 const local=player();applySharedQuests(local,w.snapshot(sb).questProgress);acceptActOneQuest(local,'last-herd');assert.ok(claimActOneQuest(local,'last-herd'));assert.equal(claimActOneQuest(local,'last-herd'),null);assert.equal(sb.player.campaign.questFlow.claimed.length,0);
 const other=await join(w,{create:true});assert.deepEqual(w.session(other.token).room.questProgress,createSharedQuests());
});
test('shared marks are idempotent, preserve personal progress and unlock Edrin without granting rewards',()=>{
 const p=player(),progress=createSharedQuests();p.campaign.records.push('personal-note');
 assert.equal(recordSharedQuest(progress,{questId:'last-herd',questMark:0}),true);assert.equal(recordSharedQuest(progress,{questId:'last-herd',questMark:0}),false);assert.equal(recordSharedQuest(progress,{questId:'last-herd',questMark:99}),false);
 assert.equal(recordSharedQuest(progress,{bossId:'knight-1'}),true);const gold=p.gold,xp=p.xp;assert.equal(applySharedQuests(p,progress),true);assert.equal(applySharedQuests(p,progress),false);assert.ok(p.campaign.records.includes('personal-note'));assert.equal(p.quests.scholarRescued,true);assert.equal(p.campaign.completed,true);assert.equal(p.gold,gold);assert.equal(p.xp,xp);assert.equal(p.shards,0);
});
