import test from 'node:test';
import assert from 'node:assert/strict';
import {facingPose,walkingLeg,WALK_FRAMES} from '../src/locomotion.js';
import {collectGold,GOLD_PICKUP_RADIUS} from '../src/economy.js';
const front={legs:[{hip:[.52,.60],ankle:[.52,.945]},{hip:[.67,.60],ankle:[.73,.91]}]};
test('sixteen facing sectors follow the projected direction, including the intermediate headings',()=>{
 const rows=new Set();for(let row=0;row<16;row++){const a=row*Math.PI/8,sx=Math.sin(a),sy=-Math.cos(a),p=facingPose({x:sx+2*sy,y:2*sy-sx});rows.add(p.index);assert.equal(p.index,row);assert.ok(p.profile>=.72&&p.profile<=1);assert.ok(Math.abs(Math.hypot(p.forward.x,p.forward.y)-1)<1e-9);}assert.equal(rows.size,16);assert.equal(WALK_FRAMES,16);
});
test('painted legs move only vertically on fixed narrow tracks and lift alternately',()=>{
 const previous=[null,null];
 for(let i=0;i<64;i++){
  const phase=i/64*Math.PI*2,steps=[walkingLeg(phase,0,front),walkingLeg(phase,1,front)];
  assert.equal(steps[1].heel.x-steps[0].heel.x,44);
  assert.ok(steps.some(step=>step.lift<1e-9),'one foot remains planted');
  steps.forEach((step,leg)=>{if(previous[leg])assert.equal(step.x,previous[leg].x);assert.ok(step.lift>=0&&step.lift<=14);assert.ok(Math.abs(front.legs[leg].ankle[1]*320+step.y-step.heel.y)<1e-9);previous[leg]=step;});
 }
 assert.ok(walkingLeg(Math.PI/2,0,front).lift>13);
 assert.ok(walkingLeg(Math.PI*1.5,1,front).lift>13);
});
test('walking over a gold pile credits its exact amount once and preserves equipment drops',()=>{
 const p={x:0,y:0,gold:0},loot=[{x:1.2,y:0,gold:17},{x:0,y:0,item:{id:'sword'}}];assert.ok(GOLD_PICKUP_RADIUS<1.2);assert.equal(collectGold(p,loot),0);p.x=.3;assert.equal(collectGold(p,loot),17);assert.equal(p.gold,17);assert.equal(p.goldEarned,17);assert.equal(collectGold(p,loot),0);assert.equal(p.gold,17);assert.equal(loot.length,1);assert.equal(loot[0].item.id,'sword');
});
