import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,random,findPath,distance,isWalkable} from '../src/game.js';
import {createCampaign,generateWilderness} from '../src/campaign.js';
import {openingStage,openingComplete,recordHerdKill,claimHerdReward,recoverProvisions,claimProvisionsReward} from '../src/opening-quests.js';
import {createRelic} from '../src/itemization.js';
test('the opening errands reward once, survive reload, and remain optional',()=>{
 const p=createPlayer();p.campaign=createCampaign();assert.equal(openingStage(p),'meet');const independent=createPlayer();independent.campaign=createCampaign();assert.equal(recoverProvisions(independent).ok,true);assert.equal(claimProvisionsReward(independent).ok,true);assert.equal(independent.quests.herdRewarded,undefined);assert.equal(claimHerdReward(p).ok,false);p.quests.guideMet=true;
 for(let i=0;i<6;i++){assert.equal(recordHerdKill(p,{herdId:'herd-'+i}),true);assert.equal(recordHerdKill(p,{herdId:'herd-'+i}),false);}assert.equal(openingStage(p),'report-herd');assert.equal(claimHerdReward(p).ok,true);assert.equal(p.inventory[0].look,'leather');const gold=p.gold;assert.equal(claimHerdReward(p).ok,false);assert.equal(p.gold,gold);assert.equal(openingComplete(p),false);assert.equal(recoverProvisions(p).ok,true);
 const restored=JSON.parse(JSON.stringify(p));assert.equal(openingStage(restored),'report-provisions');assert.equal(claimProvisionsReward(restored).ok,true);assert.equal(openingComplete(restored),true);assert.equal(claimProvisionsReward(restored).ok,false);
});
test('livestock, provisions and the distant gate have continuous routes outside the camp',()=>{
 for(const seed of [17,809,42817]){const p=createPlayer();p.campaign=createCampaign();const d=generateWilderness(seed,1,p);assert.ok(distance(d.start,d.portal)>65);assert.equal(d.enemies.filter(e=>e.herdId).length,6);for(const e of d.enemies.filter(e=>e.herdId)){assert.ok(isWalkable(d,e.x,e.y));assert.ok(findPath(d,d.start,e).length);}for(const at of [d.provisions,d.field,d.portal,d.waypoint])assert.ok(findPath(d,d.start,at).length);recordHerdKill(p,{herdId:'herd-0'});assert.equal(generateWilderness(seed,1,p).enemies.filter(e=>e.herdId).length,5);}
});
test('early drops strongly favour common leather gear and jewellery remains scarce',()=>{
 const rng=random(8301),counts={body:0,jewellery:0,leather:0,plate:0,normal:0};for(let i=0;i<12000;i++){const item=createRelic(rng,1);if(item.slot==='armor'){counts.body++;if(item.look==='leather')counts.leather++;if(item.look==='plate')counts.plate++;}if(['ring','charm'].includes(item.slot))counts.jewellery++;if(item.rarity==='normal')counts.normal++;}assert.ok(counts.body>counts.jewellery*30);assert.ok(counts.leather/counts.body>.75);assert.equal(counts.plate,0);assert.ok(counts.normal>7200);const later=Array.from({length:2000},()=>createRelic(rng,8));assert.ok(later.some(i=>i.look==='plate'));assert.ok(later.filter(i=>i.slot==='armor').length>later.filter(i=>['ring','charm'].includes(i.slot)).length*5);
});
