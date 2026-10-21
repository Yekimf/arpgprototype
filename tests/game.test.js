import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,random,isWalkable,moveEntity,findPath,createPlayer,playerStats,learnSkill,canLearn,masteryPoints,generateItem,xpNeeded} from '../src/game.js';

test('100 generated dungeons have connected rooms, reachable bosses, and safe spawn points',()=>{
  for(let seed=0;seed<100;seed++){
    const d=generateDungeon(seed,1+seed%8),start=[Math.floor(d.start.x),Math.floor(d.start.y)],seen=new Set([start.join(',')]),queue=[start];
    for(let i=0;i<queue.length;i++){
      const[x,y]=queue[i];
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(d.tiles[ny]?.[nx]&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}}
    }
    const floorCount=d.tiles.flat().filter(Boolean).length;
    assert.equal(seen.size,floorCount,`Disconnected dungeon at seed ${seed}`);
    assert.ok(d.rooms.length>=8);
    assert.ok(seen.has(`${Math.floor(d.portal.x)},${Math.floor(d.portal.y)}`));
    assert.ok(isWalkable(d,d.start.x,d.start.y));
    assert.equal(d.enemies.filter(e=>e.type==='warden').length,1);
    for(const e of d.enemies)assert.ok(isWalkable(d,e.x,e.y,.05),`Enemy spawned in a wall at seed ${seed}`);
  }
});
test('seed reproduces map, rooms, boss location, and enemy roster',()=>{
  const a=generateDungeon(84920),b=generateDungeon(84920);
  assert.deepEqual(a.tiles,b.tiles);assert.deepEqual(a.rooms,b.rooms);assert.deepEqual(a.portal,b.portal);
  assert.deepEqual(a.enemies.map(e=>[e.x,e.y,e.type,e.elite]),b.enemies.map(e=>[e.x,e.y,e.type,e.elite]));
  assert.notDeepEqual(a.tiles,generateDungeon(84921).tiles);
});
test('collision stops walls while allowing movement over open floor',()=>{
  const d={tiles:[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]},e={x:1.5,y:1.5};
  moveEntity(d,e,-.8,0);assert.equal(e.x,1.5);
  moveEntity(d,e,.4,.4);assert.equal(e.x,1.9);assert.equal(e.y,1.9);
  assert.equal(isWalkable(d,-10,0),false);
});
test('masteries enforce tier requirements, rank caps, and point costs',()=>{
  const p=createPlayer();p.points=30;
  assert.equal(canLearn(p,'quake'),false);assert.equal(learnSkill(p,'quake'),false);
  assert.ok(learnSkill(p,'vigor'));assert.ok(learnSkill(p,'vigor'));
  assert.equal(masteryPoints(p,'iron'),3);assert.ok(learnSkill(p,'quake'));
  for(let i=0;i<10;i++)learnSkill(p,'cleave');assert.equal(p.skills.cleave,5);
  const old=p.points;assert.equal(learnSkill(p,'cleave'),false);assert.equal(p.points,old);
  p.points=0;assert.equal(learnSkill(p,'precision'),false);
});
test('click movement finds a walkable route around obstacles to the boss',()=>{
  const d=generateDungeon(19284),path=findPath(d,d.start,d.portal);
  assert.ok(path.length>2);assert.deepEqual(path.at(-1),d.portal);
  let previous=d.start;for(const step of path){assert.ok(isWalkable(d,step.x,step.y));assert.ok(Math.hypot(step.x-previous.x,step.y-previous.y)<=1.01);previous=step;}
  assert.deepEqual(findPath(d,d.start,{x:0,y:0}),[]);
});
test('passives, equipment, and cross-mastery convergence affect actual combat stats',()=>{
  const p=createPlayer(),base=playerStats(p);p.skills.vigor=3;p.skills.precision=2;p.skills.spirit=2;p.skills.flow=5;p.skills.convergence=2;
  const s=playerStats(p);
  assert.equal(s.maxHp,base.maxHp+54);assert.equal(s.armor,base.armor+6);assert.equal(s.crit,base.crit+6);
  assert.equal(s.maxMana,base.maxMana+24);assert.equal(s.cdr,.8);assert.ok(s.bonus>1);
  p.equipment.charm={bonus:20,life:30,crit:5};const geared=playerStats(p);assert.equal(geared.maxHp,s.maxHp+30);assert.equal(geared.crit,s.crit+5);assert.ok(geared.bonus>s.bonus);
});
test('boss rewards are rare or legendary and item power scales with depth',()=>{
  for(let seed=0;seed<100;seed++){
    const item=generateItem(random(seed),1,true);assert.ok(['rare','legendary'].includes(item.rarity));assert.ok(item.life>0);
  }
  const shallow=generateItem(random(88),1,true),deep=generateItem(random(88),8,true);
  assert.equal(shallow.slot,deep.slot);assert.ok(deep.life>shallow.life);assert.ok(xpNeeded(2)>xpNeeded(1));
});
