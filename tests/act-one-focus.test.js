import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ACTS,createCampaign,ensureCampaign,canTravel,advanceCampaign,generateWilderness,generateStronghold} from '../src/campaign.js';
import {createPlayer,random,generateItem,findPath,xpNeeded,grantExperience,playerStats} from '../src/game.js';
import {encounterXP,actOneLootLevel} from '../src/act-one-balance.js';
import {floorMaterial} from '../src/act-one-materials.js';
test('only Act I can be entered, including old endgame saves, without deleting equipment or history',()=>{
 assert.equal(ACTS.length,1);const p=createPlayer();const sword=p.equipment.weapon;p.campaign={...createCampaign(),act:5,chapters:{1:2,5:3},defeated:['knight-1','knight-5'],waypoints:['emberfall','act-5-stronghold-4']};ensureCampaign(p);assert.equal(p.campaign.act,1);assert.equal(p.campaign.completed,true);assert.equal(canTravel(p,'act-5-stronghold-4'),false);assert.equal(advanceCampaign(p),false);assert.equal(p.equipment.weapon,sword);assert.ok(p.campaign.defeated.includes('knight-5'));assert.equal(p.campaign.chapters[5],3);assert.throws(()=>generateStronghold(1,2),RangeError);assert.throws(()=>generateWilderness(1,2),RangeError);
});
test('each stronghold has a distinct entrance and floor, connected wings, and optional veterans',()=>{
 const styles=new Set(),materials=new Set();for(let chapter=0;chapter<3;chapter++)for(const seed of [3,51,42817,992]){
  const d=generateStronghold(seed,1,chapter);styles.add(d.entranceStyle);materials.add(floorMaterial(d,Math.floor(d.start.x),Math.floor(d.start.y)));assert.equal(d.enemies.filter(e=>e.veteran).length,2);
  for(const target of [d.portal,d.returnGate,d.waypoint,d.supplies,...d.rooms.map(r=>({x:r.x+r.w/2,y:r.y+r.h/2}))])assert.ok(findPath(d,d.start,target).length,`${chapter}/${seed}: ${JSON.stringify(target)}`);
  for(const e of d.enemies.filter(e=>e.veteran))assert.ok(findPath(d,d.start,e).length);
  const path=findPath(d,d.start,d.portal,{smooth:false});assert.ok(path.length>(chapter===2?200:100));
  if(chapter===2){const w=generateWilderness(seed,1,undefined,chapter);assert.ok(w.props.some(p=>p.type==='crypt-entrance'));assert.ok(w.props.every(p=>!p.type.startsWith('kingdom-gate')));}
 }assert.equal(styles.size,3);assert.equal(materials.size,3);
});
test('progression preserves five attributes and one mastery per level, while repeated low-tier kills taper off',()=>{
 const p=createPlayer();p.campaign=createCampaign();grantExperience(p,xpNeeded(1));assert.equal(p.points,1);assert.equal(p.passivePoints,1);assert.equal(p.attributePoints,5);const before=playerStats(p).damage;p.attributes.might+=5;assert.ok(Math.abs(playerStats(p).damage-before-2)<.001);
 const low={type:'skeleton',level:1};assert.ok(encounterXP(low,8)<encounterXP(low,1)/2);assert.ok(xpNeeded(5)>xpNeeded(1)*3);
 for(const chapter of [0,1,2]){const d=generateStronghold(51,1,chapter),boss=d.enemies.find(e=>e.type==='warden');assert.ok(boss.hp>=1900+chapter*1800);assert.ok(d.lootLevel<d.areaLevel);}
 for(let seed=1;seed<=80;seed++){const i=generateItem(random(seed),actOneLootLevel(11));assert.equal(i.baseTier,'standard');if(i.slot==='weapon')assert.ok(i.damage<40||i.rarity==='legendary');}
});
