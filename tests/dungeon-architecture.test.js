import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateStronghold} from '../src/campaign.js';
import {dressDungeon} from '../src/dungeon-architecture.js';
import {findPath,isWalkable,distance} from '../src/game.js';
test('dungeon rooms are enclosed on all exposed floor edges, with a clear authored gateway',()=>{
 for(const chapter of [0,2])for(const seed of [17,809,42710]){
  const d=generateStronghold(seed,1,chapter),tiles=JSON.stringify(d.tiles);dressDungeon(d);assert.ok(d.wallSegments.length>200);assert.equal(JSON.stringify(d.tiles),tiles);
  const edges=new Set(d.wallSegments.map(w=>`${w.x},${w.y},${w.side}`));assert.equal(edges.size,d.wallSegments.length);
  for(const w of d.wallSegments){const inside={x:w.x+(w.side==='west'?.5:w.side==='east'?-.5:0),y:w.y+(w.side==='north'?.5:w.side==='south'?-.5:0)};assert.ok(isWalkable(d,inside.x,inside.y,.01));assert.ok(distance(w,d.entryGate)>=4.5);}
  assert.ok(findPath(d,d.start,d.portal).length);for(const p of d.props.filter(p=>p.type==='dungeon-dressing'))assert.ok(isWalkable(d,p.x,p.y,.2));
 }
});
test('room dressing is deterministic, reusable, and distinct in the fortress and crypt',()=>{
 for(const chapter of [0,2]){const d=dressDungeon(generateStronghold(51,1,chapter)),again=dressDungeon(generateStronghold(51,1,chapter)),count=d.props.length;assert.deepEqual(d.props,again.props);dressDungeon(d);assert.equal(d.props.length,count);const dressing=d.props.filter(p=>p.type==='dungeon-dressing');assert.ok(dressing.length>30);assert.ok(dressing.some(p=>p.kind===(chapter===0?'rack':'ossuary')));assert.ok(d.props.some(p=>p.type==='wall-fixture'));}
 const farm=generateStronghold(51,1,1);dressDungeon(farm);assert.equal(farm.wallSegments,undefined);
});
test('Marchgate starts at its visible threshold and provides a walkable arrival into the barbican',()=>{
 for(const seed of [1,17,809,42710]){const d=generateStronghold(seed,1);assert.ok(distance(d.start,d.entryGate)<=2.1);assert.ok(findPath(d,d.start,d.arrival).length);assert.ok(d.arrival.y<d.start.y);assert.ok(distance(d.waypoint,d.entryGate)>10);assert.ok(distance(d.supplies,d.entryGate)>10);assert.ok(findPath(d,d.arrival,d.portal,{smooth:false}).length>110);}
});
