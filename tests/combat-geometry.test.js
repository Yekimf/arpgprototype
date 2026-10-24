import test from 'node:test';
import assert from 'node:assert/strict';
import {segmentCircleTime,projectileContacts,firstWallTime} from '../src/combat-geometry.js';
import {LanWorld} from '../src/network/shared-world.js';
const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} should be near ${expected}`);

test('swept projectile contacts catch targets crossed between slow frames',()=>{
  const from={x:0,y:0},to={x:1.8,y:0},enemy={id:1,x:.9,y:0};
  assert.ok(Math.hypot(to.x-enemy.x,to.y-enemy.y)>.3);
  near(segmentCircleTime(from,to,enemy,.3),1/3);
  near(segmentCircleTime({x:1.8,y:0},{x:0,y:0},enemy,.3),1/3);
});

test('segment contact handles tangent, endpoint, stationary and initially overlapping shots',()=>{
  const from={x:0,y:0},to={x:2,y:0};
  near(segmentCircleTime(from,to,{x:1,y:1},1),.5);
  assert.equal(segmentCircleTime(from,to,{x:1,y:1.01},1),null);
  assert.equal(segmentCircleTime(from,to,{x:3,y:0},1),1);
  assert.equal(segmentCircleTime(from,to,{x:1,y:0},1),0);
  assert.equal(segmentCircleTime(from,from,{x:0,y:0},.2),0);
  assert.equal(segmentCircleTime(from,from,{x:1,y:0},.2),null);
  assert.equal(segmentCircleTime(from,to,{x:3.1,y:0},1),null);
  assert.equal(segmentCircleTime(from,to,{x:-1,y:0},.1),null);
  assert.equal(segmentCircleTime({x:NaN,y:0},to,{x:1,y:0},1),null);
});

test('contacts follow travel order rather than enemy array order and skip dead/already hit enemies',()=>{
  const enemies=[{id:'far',x:7,y:0},{id:'dead',x:1,y:0,dead:true},{id:'old',x:2,y:0},{id:'near',x:3,y:0},{id:'miss',x:4,y:2}];
  const contacts=projectileContacts({x:0,y:0},{x:10,y:0},enemies,{hitIds:new Set(['old']),radius:.5});
  assert.deepEqual(contacts.map(c=>c.enemy.id),['near','far']);
  near(contacts[0].t,.25);near(contacts[1].t,.65);
  assert.equal(enemies[0].id,'far');
});

test('first wall collision blocks contacts behind the wall while preserving nearer and exact-end hits',()=>{
  const from={x:0,y:0},to={x:12,y:0},wall=firstWallTime(from,to,(x,y,r)=>x+r<4||x-r>=5);
  near(wall,(4-.05)/12,.0001);
  const enemies=[{id:'behind',x:6,y:0},{id:'front',x:2,y:0},{id:'wall-contact',x:wall*12+.4,y:0}];
  assert.deepEqual(projectileContacts(from,to,enemies,{radius:.4,before:wall}).map(c=>c.enemy.id),['front']);
  near(projectileContacts(from,to,[{id:'end',x:12.4,y:0}],{radius:.4})[0].t,1);
  assert.deepEqual(projectileContacts(from,to,enemies,{before:0}),[]);
});

test('thin tile walls and diagonal corner footprints cannot be skipped during long ticks',()=>{
  const open=(x,y,r)=>!(x+r>=3&&x-r<3.35);
  near(firstWallTime({x:0,y:1},{x:15,y:1},open),2.95/15,.0001);
  const closedTile=(x,y,r)=>![[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]].some(([px,py])=>Math.floor(px)===2&&Math.floor(py)===2);
  const t=firstWallTime({x:.5,y:.5},{x:5.5,y:5.5},closedTile);
  near(t,(2-.05-.5)/5,.0002);
});

test('wall sampling stays bounded, handles invalid jumps and supports stationary open positions',()=>{
  let calls=0;const open=()=>{calls++;return true;};
  assert.equal(firstWallTime({x:1,y:1},{x:1,y:1},open),null);
  assert.equal(firstWallTime({x:1,y:1},{x:1,y:1},()=>false),0);
  assert.equal(firstWallTime({x:0,y:0},{x:10000,y:0},open),0);assert.ok(calls<=2);
  assert.equal(firstWallTime({x:Infinity,y:0},{x:1,y:0},open),0);
  calls=0;assert.equal(firstWallTime({x:0,y:0},{x:5,y:0},open,{maxStep:0}),null);assert.ok(calls<=1025);
  assert.deepEqual(projectileContacts({x:NaN,y:0},{x:1,y:0},[]),[]);
});

function hostileFixture(positions,{wallColumn=null,life=2}={}){
  const world=new LanWorld(),key='wilderness:0',tiles=Array.from({length:12},()=>Array(12).fill(1));
  if(wallColumn!==null)for(const row of tiles)row[wallColumn]=0;
  const shot={x:1,y:6,dx:1,dy:0,speed:40,life,damage:12,element:'fire',source:{x:1,y:6,level:5,type:'skeleton'}};
  const area={key,d:{tiles,enemies:[]},shots:[shot],actions:[],tick:0},room={players:new Map(),worlds:new Map([[key,area]])},events=[];
  for(const [id,pos] of positions){const peer={id,token:id,room,area:key,player:{hp:100},pos};room.players.set(id,peer);world.sessions.set(id,peer);world.on(id,event=>events.push({id,...event}));}
  return{world,area,room,shot,events};
}

test('authoritative hostile projectiles hit the first player crossed, regardless of room player order',()=>{
  const f=hostileFixture([['far',{x:8,y:6}],['near',{x:3,y:6}]]);
  f.world.tickArea(f.room,f.area,.2);
  assert.equal(f.area.shots.length,0);assert.equal(f.events.length,1);assert.equal(f.events[0].id,'near');
  assert.deepEqual(f.events[0].source,{x:1,y:6,level:5,attackRating:32});
  assert.equal(f.events[0].amount,12);assert.equal(f.events[0].element,'fire');near(f.shot.x,2.4);
});

test('authoritative hostile projectile sweeps stop at terrain before a player behind it',()=>{
  const f=hostileFixture([['blocked',{x:7,y:6}]],{wallColumn:4});f.world.tickArea(f.room,f.area,.2);
  assert.equal(f.events.length,0);assert.equal(f.area.shots.length,0);near(f.shot.x,3.95,.001);
});

test('a projectile can hit before its lifetime expires but cannot reach a target beyond that lifetime',()=>{
  const hits=hostileFixture([['reachable',{x:2,y:6}]],{life:.05});hits.world.tickArea(hits.room,hits.area,.2);assert.equal(hits.events.length,1);
  const misses=hostileFixture([['too-far',{x:5,y:6}]],{life:.05});misses.world.tickArea(misses.room,misses.area,.2);assert.equal(misses.events.length,0);assert.equal(misses.area.shots.length,0);near(misses.shot.x,3);
});
