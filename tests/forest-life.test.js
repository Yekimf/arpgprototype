import test from 'node:test';
import assert from 'node:assert/strict';
import {generateOpeningForest} from '../src/opening-forest.js';
import {createPlayer,isWalkable} from '../src/game.js';
import {createFlock,updateFlock,roadFacing} from '../src/forest-life.js';

test('a larger flock wanders and grazes without escaping even through the open pen gate',()=>{
 const pen={x1:101,y1:104,x2:127,y2:129},d={pasture:pen,livestock:createFlock(713,pen)},original=structuredClone(d.livestock),walked=new Set(),grazed=new Set();
 // Multiple in-game hours includes repeated boundary turns and destination changes.
 for(let step=0;step<72000;step++){
  updateFlock(d,.1);
  for(const s of d.livestock){assert.ok(s.x>=102.6&&s.x<=125.4&&s.y>=105.6&&s.y<=127.4);if(s.moving)walked.add(s.id);else grazed.add(s.id);}
 }
 assert.equal(walked.size,22);assert.equal(grazed.size,22);assert.ok(d.livestock.every((s,i)=>Math.hypot(s.x-original[i].x,s.y-original[i].y)>1));assert.deepEqual(createFlock(713,pen),original);
});

test('roadside arrows follow destinations and the generated ground has layered grass off the roads',()=>{
 const d=generateOpeningForest(42817,createPlayer(),'Patrol orders');
 for(const s of d.signs){assert.ok(Math.abs(Math.hypot(s.dx,s.dy)-1)<1e-9);const dx=s.target.x-s.x,dy=s.target.y-s.y;assert.ok(dx*s.dx+dy*s.dy>0);assert.ok(s.text.length>100);assert.ok(isWalkable(d,s.x,s.y));}
 for(const lamp of d.props.filter(p=>p.type==='road-lantern'))assert.ok(Number.isFinite(lamp.angle)&&Math.abs(Math.hypot(lamp.dx,lamp.dy)-1)<1e-9);
 const grass=d.props.filter(p=>p.type==='forest-grass');assert.ok(grass.length>5000);assert.ok(grass.every(p=>isWalkable(d,p.x,p.y)&&!d.roads.has(Math.floor(p.y)*d.size+Math.floor(p.x))));
 assert.ok(roadFacing(1,0).angle>0);assert.ok(roadFacing(0,1).angle>Math.PI/2);
});
