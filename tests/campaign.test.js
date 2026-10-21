import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,grantExperience,spendAttribute,xpNeeded,canLearn,learnSkill,playerStats,findPath,isWalkable} from '../src/game.js';
import {ACTS,createCampaign,generateWilderness,generateStronghold,attuneWaypoint,canTravel,defeatCampaignBoss,advanceCampaign,locationId} from '../src/campaign.js';

test('new loyalists start with only a basic attack, and leveling grants spendable progression',()=>{
 const p=createPlayer({name:'Galen',origin:'templar'});assert.deepEqual(p.skills,{});assert.deepEqual(p.slots,[null,null,null,null]);assert.equal(p.mouseSkill,'basic');assert.equal(p.points,0);assert.equal(p.attributePoints,0);assert.equal(canLearn(p,'bolt'),false);
 const needed=xpNeeded(1);assert.equal(grantExperience(p,needed-1),0);assert.equal(p.level,1);assert.equal(grantExperience(p,1),1);assert.equal(p.level,2);assert.equal(p.points,2);assert.equal(p.attributePoints,5);
 assert.ok(learnSkill(p,'bolt'));assert.equal(p.slots[0],'bolt');assert.equal(p.mouseSkill,'bolt');assert.equal(p.points,1);
 const before=playerStats(p);assert.ok(spendAttribute(p,'vitality'));assert.equal(playerStats(p).maxHp,before.maxHp+6);assert.equal(p.attributePoints,4);assert.equal(spendAttribute(p,'gold'),false);
 const old=p.xp;assert.equal(grantExperience(p,-100),0);assert.equal(p.xp,old);
});
test('ability tiers require both character level and mastery investment',()=>{
 const p=createPlayer();p.points=100;assert.equal(canLearn(p,'cleave'),false);p.level=2;assert.ok(learnSkill(p,'cleave'));assert.ok(learnSkill(p,'vigor'));assert.ok(learnSkill(p,'vigor'));assert.equal(canLearn(p,'quake'),false);p.level=4;assert.ok(learnSkill(p,'quake'));
 p.skills.vigor=5;p.skills.cleave=5;assert.equal(canLearn(p,'whirl'),false);p.level=8;assert.ok(canLearn(p,'whirl'));
});
test('all five wilderness roads and strongholds have connected entrances, waypoints, shrines and bosses',()=>{
 for(const a of ACTS)for(let seed=1;seed<=20;seed++){
  for(const d of [generateWilderness(seed,a.id),generateStronghold(seed,a.id)]){
   assert.ok(findPath(d,d.start,d.portal).length,`${a.id}/${seed} portal`);assert.ok(findPath(d,d.start,d.waypoint).length,`${a.id}/${seed} waypoint`);assert.ok(findPath(d,d.start,d.spirit).length,`${a.id}/${seed} spirit`);assert.ok(findPath(d,d.start,d.shrine).length,`${a.id}/${seed} shrine`);
   for(const e of d.enemies)assert.ok(isWalkable(d,e.x,e.y,.05));
  }
  const d=generateStronghold(seed,a.id);assert.equal(d.enemies.find(e=>e.type==='warden').bossId,`knight-${a.id}`);
 }
});
test('waypoints stay locked until attuned and campaign acts require their knight',()=>{
 const p=createPlayer();p.campaign=createCampaign();assert.ok(canTravel(p,'emberfall'));assert.equal(canTravel(p,'act-1-wilderness'),false);assert.equal(advanceCampaign(p),false);
 assert.ok(attuneWaypoint(p,'wilderness',1));assert.equal(attuneWaypoint(p,'wilderness',1),false);assert.ok(canTravel(p,locationId(1,'wilderness')));assert.equal(canTravel(p,'act-2-wilderness'),false);
 assert.equal(defeatCampaignBoss(p,'knight-2'),false);
 for(let i=1;i<=5;i++){assert.equal(p.campaign.act,i);assert.ok(defeatCampaignBoss(p,`knight-${i}`));assert.equal(defeatCampaignBoss(p,`knight-${i}`),false);if(i<5)assert.ok(advanceCampaign(p));}
 assert.equal(defeatCampaignBoss(p,'wanderer'),false);assert.ok(defeatCampaignBoss(p,'king'));assert.ok(defeatCampaignBoss(p,'wanderer'));assert.equal(p.campaign.completed,true);
 const restored=JSON.parse(JSON.stringify(p));assert.ok(canTravel(restored,'act-1-wilderness'));assert.equal(restored.campaign.completed,true);
});

test('Emberfall sits inside a broad connected wilderness with four physical exits and a safe camp',()=>{
 for(let seed=1;seed<=12;seed++){
  const p=createPlayer(),d=generateWilderness(seed,1,p),b=d.townBounds;
  assert.equal(d.size,96);assert.ok(d.tiles.flat().filter(Boolean).length>5000);
  for(const target of [{x:48.5,y:36.5},{x:48.5,y:67.5},{x:34.5,y:51.5},{x:64.5,y:51.5},d.portal,d.townWaypoint,...d.npcs])assert.ok(findPath(d,d.start,target).length,`seed ${seed}, route ${JSON.stringify(target)}`);
  assert.ok(d.enemies.length>35);for(const e of d.enemies)assert.equal(e.x>b.x1&&e.x<b.x2&&e.y>b.y1&&e.y<b.y2,false);
  assert.ok(d.water.size>100);assert.ok(d.roads.size>100);assert.ok(d.props.some(p=>p.type==='palisade'));
 }
});
