import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,findPath,playerStats,random} from '../src/game.js';
import {CHAPTERS,ENEMY_ROSTERS,chapterFor} from '../src/campaign-content.js';
import {createCampaign,ensureCampaign,generateWilderness,generateStronghold,nextChapter,completeField,captainId,defeatCampaignBoss,advanceCampaign,canAdvance,attuneWaypoint,canTravel,locationId} from '../src/campaign.js';
import {bossPlan} from '../src/boss-abilities.js';
test('nineteen chapters have reachable field tasks, strongholds and distinct act rosters',()=>{
 assert.equal(CHAPTERS.length,5);assert.equal(new Set(ENEMY_ROSTERS.flat().map(e=>e.name)).size,15);
 for(let act=1;act<=5;act++)for(let chapter=0;chapter<CHAPTERS[act-1].length;chapter++)for(const seed of [17,809]){
  const wild=generateWilderness(seed,act,undefined,chapter),keep=generateStronghold(seed,act,chapter),ch=chapterFor(act,chapter);
  for(const target of [wild.field,wild.portal,wild.waypoint].filter(Boolean))assert.ok(findPath(wild,wild.start,target).length,`${act}/${chapter} ${JSON.stringify(target)}`);
  assert.ok(findPath(keep,keep.start,keep.portal).length);assert.ok(keep.outdoor?keep.cropPlots.length>=6:keep.rooms.length>=15);assert.equal(keep.enemies.find(e=>e.type==='warden').bossId,captainId(act,chapter));
  assert.equal(ch.number,chapter+1);assert.ok(ch.account.length>80);assert.ok(ch.aftermath.length>100);
  for(const enemy of [...wild.enemies,...keep.enemies].filter(e=>e.type!=='warden')){assert.equal(enemy.faction,act);assert.ok(act===1||enemy.herdId||ENEMY_ROSTERS[act-1].some(e=>e.name===enemy.name));assert.ok(Number.isFinite(enemy.hp));}
 }
});
test('chapter completion, field records and waypoint identities survive save migration',()=>{
 const p=createPlayer();p.campaign=createCampaign();assert.equal(nextChapter(p),false);
 for(let act=1;act<=5;act++){
  for(let ch=0;ch<CHAPTERS[act-1].length;ch++){assert.ok(completeField(p,act,ch));assert.equal(completeField(p,act,ch),false);assert.ok(attuneWaypoint(p,'wilderness',act,ch));assert.ok(canTravel(p,locationId(act,'wilderness',ch)));assert.ok(defeatCampaignBoss(p,captainId(act,ch)));if(ch<CHAPTERS[act-1].length-1){assert.equal(canAdvance(p),false);assert.ok(nextChapter(p));}}
  assert.equal(nextChapter(p),false);if(act<5)assert.ok(advanceCampaign(p));
 }
 const copy={campaign:JSON.parse(JSON.stringify(p.campaign))};ensureCampaign(copy);assert.equal(copy.campaign.records.length,19);assert.equal(copy.campaign.defeated.length,19);assert.equal(copy.campaign.chapters[5],3);
});
test('unarmed basic attacks have shorter reach and faster recovery than swords',()=>{
 const p=createPlayer(),armed=playerStats(p);p.equipment.weapon=null;const unarmed=playerStats(p);assert.ok(unarmed.reach<armed.reach);assert.ok(unarmed.attackSpeed>armed.attackSpeed);assert.ok(unarmed.damage<armed.damage);
});
test('every main boss has different telegraphed patterns, including a second phase',()=>{
 const signatures=new Set();for(const phaseType of ['thorns','flood','fire','frost','oath','king','wanderer']){
  const boss={phaseType,x:10,y:10,hp:100,maxHp:100,damage:23},target={x:14,y:13};
  const plans=[bossPlan(boss,target,0),bossPlan(boss,target,1),bossPlan({...boss,hp:40},target,1)];
  signatures.add(JSON.stringify(plans.map(p=>p.commands)));assert.equal(plans[2].phase,2);
  for(const plan of plans){assert.ok(plan.commands.length);for(const c of plan.commands){if(c.kind==='mark')assert.ok(c.delay>=.7);if(c.kind==='shot')assert.ok(Math.abs(Math.hypot(c.dx,c.dy)-1)<.0001);}}
 }assert.equal(signatures.size,7);
});

test('pre-chapter saves keep their completed acts and recovered history',()=>{const p={campaign:{act:3,defeated:['knight-1','knight-2'],waypoints:['emberfall','act-2-stronghold']}};ensureCampaign(p);assert.equal(p.campaign.chapters[1],2);assert.equal(p.campaign.chapters[2],3);assert.equal(p.campaign.chapters[3],0);assert.equal(p.campaign.records.length,7);assert.ok(canTravel(p,'act-2-stronghold'));});
