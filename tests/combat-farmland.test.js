import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,playerStats,makeEnemy,mitigateDamage,grantExperience,xpNeeded,findPath} from '../src/game.js';
import {generateWilderness,generateStronghold} from '../src/campaign.js';
import {MELEE,BOSS_MELEE,hostileAim,bossCadence} from '../src/combat-balance.js';
import {bossPlan} from '../src/boss-abilities.js';

test('early enemies take several sword hits and threaten an unequipped loyalist',()=>{
 const p=createPlayer(),s=playerStats(p),enemy=makeEnemy(1,0,0,'skeleton',1),boss=makeEnemy(2,0,0,'warden',1,true);
 assert.ok(enemy.hp/s.damage>=3&&enemy.hp/s.damage<=5);
 assert.ok(mitigateDamage(enemy.damage,s)>=s.maxHp*.08);
 assert.ok(mitigateDamage(boss.damage*1.6,s)>=s.maxHp*.25);
 assert.ok(boss.hp/s.damage<35,'boss pressure comes from attacks rather than a huge health pool');
 assert.ok(MELEE.hitReach>MELEE.reach);assert.ok(BOSS_MELEE.windup>MELEE.windup);
 assert.ok(bossCadence({...boss,hp:boss.hp*.4})<bossCadence(boss));
 const aim=hostileAim({x:0,y:0},{x:5,y:0},{x:0,y:3});assert.ok(aim.dy>0);assert.ok(Math.abs(Math.hypot(aim.dx,aim.dy)-1)<.00001);
});
test('every level awards exactly one mastery point and five attributes without removing old investment',()=>{
 const p=createPlayer();p.points=4;p.skills.vigor=3;const n=grantExperience(p,xpNeeded(1)+xpNeeded(2)+xpNeeded(3));assert.equal(n,3);assert.equal(p.points,7);assert.equal(p.attributePoints,15);assert.equal(p.skills.vigor,3);
});
test('farm regions are seeded open fields with distinct scenery and a connected wooden entrance',()=>{
 for(const seed of [7,31,42710]){
  const wild=generateWilderness(seed,1,undefined,1),farm=generateStronghold(seed,1,1),again=generateStronghold(seed,1,1);
  assert.equal(wild.biome,'widows-fields');assert.ok(wild.props.every(p=>!(['frontier','palisade','road-gate'].includes(p.type)&&Math.abs(p.x-wild.portal.x)<7&&Math.abs(p.y-wild.portal.y)<7)));assert.equal(farm.biome,'tithe-granary');assert.equal(farm.outdoor,true);assert.ok(farm.critters.length>=5);assert.deepEqual(farm.cropPlots,again.cropPlots);assert.deepEqual(farm.props,again.props);
  assert.ok(farm.props.some(p=>p.farmSprite===12));assert.ok(farm.props.some(p=>p.farmSprite===13));assert.ok(wild.props.some(p=>p.type==='farm-entrance'));assert.ok(farm.props.every(p=>!['kingdom-gate','kingdom-gate-inside','building','wall'].includes(p.type)));
  for(const at of [farm.portal,farm.returnGate,farm.waypoint,farm.supplies])assert.ok(findPath(farm,farm.start,at).length);
  const boss=farm.enemies.find(e=>e.type==='warden');assert.equal(boss.phaseType,'harvest');assert.notDeepEqual(bossPlan(boss,farm.start,0).commands,bossPlan(boss,farm.start,1).commands);
 }
});
