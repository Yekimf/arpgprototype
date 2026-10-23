import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,grantExperience,spendAttribute,xpNeeded,canLearn,learnSkill,playerStats,findPath,isWalkable} from '../src/game.js';
import {ACTS,createCampaign,generateWilderness,generateStronghold,attuneWaypoint,canTravel,defeatCampaignBoss,advanceCampaign,locationId} from '../src/campaign.js';

test('new loyalists start with only a basic attack, and leveling grants spendable progression',()=>{
 const p=createPlayer({name:'Galen',origin:'templar'});assert.deepEqual(p.skills,{});assert.deepEqual(p.slots,[null,null,null,null]);assert.equal(p.mouseSkill,'basic');assert.equal(p.points,0);assert.equal(p.attributePoints,0);assert.equal(canLearn(p,'bolt'),false);
 const needed=xpNeeded(1);assert.equal(grantExperience(p,needed-1),0);assert.equal(p.level,1);assert.equal(grantExperience(p,1),1);assert.equal(p.level,2);assert.equal(p.points,1);assert.equal(p.attributePoints,5);
 assert.ok(learnSkill(p,'bolt'));assert.equal(p.slots[0],'bolt');assert.equal(p.mouseSkill,'bolt');assert.equal(p.points,0);
 const before=playerStats(p);assert.ok(spendAttribute(p,'vitality'));assert.equal(playerStats(p).maxHp,before.maxHp+6);assert.equal(p.attributePoints,4);assert.equal(spendAttribute(p,'gold'),false);
 const old=p.xp;assert.equal(grantExperience(p,-100),0);assert.equal(p.xp,old);
});
test('ability tiers require both character level and mastery investment',()=>{
 const p=createPlayer();p.points=100;assert.equal(canLearn(p,'cleave'),false);p.level=2;assert.ok(learnSkill(p,'cleave'));assert.ok(learnSkill(p,'vigor'));assert.ok(learnSkill(p,'vigor'));assert.equal(canLearn(p,'quake'),false);p.level=4;assert.ok(learnSkill(p,'quake'));
 p.skills.vigor=5;p.skills.cleave=5;assert.equal(canLearn(p,'whirl'),false);p.level=8;assert.ok(canLearn(p,'whirl'));
});
test('Act I wilderness and strongholds have connected entrances, waypoints, supply caches and bosses',()=>{
 for(const a of ACTS)for(let seed=1;seed<=20;seed++){
  for(const d of [generateWilderness(seed,a.id),generateStronghold(seed,a.id)]){
   assert.ok(findPath(d,d.start,d.portal).length,`${a.id}/${seed} portal`);assert.ok(findPath(d,d.start,d.waypoint).length,`${a.id}/${seed} waypoint`);assert.equal(d.spirit,undefined);assert.equal(d.shrine,undefined);assert.ok(findPath(d,d.start,d.supplies).length,`${a.id}/${seed} shrine`);
   for(const e of d.enemies)assert.ok(isWalkable(d,e.x,e.y,.05));
  }
  const d=generateStronghold(seed,a.id);assert.equal(d.enemies.find(e=>e.type==='warden').bossId,`captain-${a.id}-0`);
 }
});
test('waypoints stay locked until attuned and campaign acts require their knight',()=>{
 const p=createPlayer();p.campaign=createCampaign();assert.ok(canTravel(p,'emberfall'));assert.equal(canTravel(p,'act-1-wilderness'),false);assert.equal(advanceCampaign(p),false);
 assert.ok(attuneWaypoint(p,'wilderness',1));assert.equal(attuneWaypoint(p,'wilderness',1),false);assert.ok(canTravel(p,locationId(1,'wilderness')));assert.equal(canTravel(p,'act-2-wilderness'),false);
 assert.equal(defeatCampaignBoss(p,'knight-2'),false);
 assert.ok(defeatCampaignBoss(p,'knight-1'));assert.equal(defeatCampaignBoss(p,'knight-1'),false);assert.equal(advanceCampaign(p),false);assert.equal(p.campaign.act,1);assert.equal(defeatCampaignBoss(p,'king'),false);assert.equal(defeatCampaignBoss(p,'wanderer'),false);assert.equal(p.campaign.completed,true);
 const restored=JSON.parse(JSON.stringify(p));assert.ok(canTravel(restored,'act-1-wilderness'));assert.equal(restored.campaign.completed,true);
});

test('Emberfall sits inside a broad connected wilderness with one east exit and a safe camp',()=>{
 for(let seed=1;seed<=12;seed++){
  const p=createPlayer(),d=generateWilderness(seed,1,p),b=d.townBounds;
  assert.equal(d.size,224);assert.ok(d.tiles.flat().filter(Boolean).length>25000);
  for(const target of [d.townExit,d.herd,d.supplies,d.portal,d.townWaypoint,...d.npcs])assert.ok(findPath(d,d.start,target).length,`seed ${seed}, route ${JSON.stringify(target)}`);
  for(let x=b.x1;x<=b.x2;x++){assert.equal(d.tiles[b.y1][x],0);assert.equal(d.tiles[b.y2][x],0);}for(let y=b.y1;y<=b.y2;y++)assert.equal(d.tiles[y][b.x1],0);const openings=Array.from({length:b.y2-b.y1+1},(_,i)=>i+b.y1).filter(y=>d.tiles[y][b.x2]);assert.ok(openings.length>=3&&openings.length<=5);assert.ok(openings.every(y=>Math.abs(y-51.5)<3));assert.ok(d.enemies.length>150);for(const e of d.enemies)assert.equal(e.x>b.x1&&e.x<b.x2&&e.y>b.y1&&e.y<b.y2,false);
  assert.ok(d.water.size>100);assert.ok(d.roads.size>100);assert.ok(d.props.some(p=>p.type==='palisade'));
 }
});
