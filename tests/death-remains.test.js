import test from 'node:test';
import assert from 'node:assert/strict';
import {leaveCorpse,scatterRemains,advanceRemains,remainsKind,REMAINS_LIMITS} from '../src/death-remains.js';

test('deaths preserve body appearance without changing enemy health or combat state',()=>{
 const area={},enemy={x:5,y:8,hp:3,type:'skeleton',role:'brute',visual:{family:'butcher',frame:2,flip:true,back:false},attackAnim:.2};
 const body=leaveCorpse(area,enemy,{x:4,y:9});
 assert.equal(body.kind,'blood');assert.equal(enemy.hp,3);assert.equal(enemy.dead,undefined);assert.equal(body.body.attackAnim,0);
 assert.deepEqual(body.body.visual,enemy.visual);assert.notEqual(body.body.visual,enemy.visual);
 assert.equal(leaveCorpse(area,enemy,{x:0,y:0}),null);assert.equal(area.remains.corpses.length,1);
 for(let i=0;i<15;i++)advanceRemains(area,.1);
 assert.ok(body.age>=body.duration);assert.equal(area.remains.bursts.length,0);assert.equal(area.remains.corpses.length,1);assert.equal(area.remains.stains.length,1);
});
test('skeletal soldiers scatter bones and spirits disperse without blood pools',()=>{
 assert.equal(remainsKind({type:'skeleton',role:'guard'}),'bone');assert.equal(remainsKind({type:'wraith',role:'hexer'}),'ash');assert.equal(remainsKind({type:'warden',bossId:'knight-1'}),'blood');
 const area={},spirit=leaveCorpse(area,{x:1,y:2,type:'wraith',role:'hexer'},{x:1,y:1});assert.equal(spirit.kind,'ash');assert.equal(area.remains.stains.length,0);
});
test('hit sprays are throttled, deaths bypass throttling, and area decoration is bounded',()=>{
 const area={},enemy={x:2,y:3,type:'crawler',role:'lunge'};
 scatterRemains(area,enemy,null,{time:1});scatterRemains(area,enemy,null,{time:1.1});assert.equal(area.remains.bursts.length,1);
 assert.equal(enemy.nextSplatter,undefined); // Particle timing must never leak into a character save.
 leaveCorpse(area,enemy,null,{time:1.15});assert.equal(area.remains.bursts.length,2);
 for(let i=0;i<300;i++)leaveCorpse(area,{...enemy,x:i},null);
 assert.equal(area.remains.corpses.length,REMAINS_LIMITS.corpses);assert.equal(area.remains.stains.length,REMAINS_LIMITS.stains);assert.equal(area.remains.bursts.length,REMAINS_LIMITS.bursts);
 assert.equal(({}).remains,undefined);
});
test('a player can leave another corpse after returning to the same area',()=>{
 const area={},player={x:4,y:6,equipment:{}};leaveCorpse(area,player,null,{player:true});player.x=8;leaveCorpse(area,player,null,{player:true});
 assert.equal(area.remains.corpses.length,2);assert.equal(area.remains.corpses[0].body.x,4);assert.equal(area.remains.corpses[1].body.x,8);
});
