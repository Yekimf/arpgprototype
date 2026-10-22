import test from 'node:test';
import assert from 'node:assert/strict';
import {facingPose,walkingLeg,WALK_FRAMES} from '../src/locomotion.js';
import {collectGold,GOLD_PICKUP_RADIUS} from '../src/economy.js';
const front={legs:[{hip:[.52,.60],ankle:[.52,.945]},{hip:[.67,.60],ankle:[.73,.91]}]};
test('sixteen facing sectors follow the projected direction, including the intermediate headings',()=>{
 const rows=new Set();for(let row=0;row<16;row++){const a=row*Math.PI/8,sx=Math.sin(a),sy=-Math.cos(a),p=facingPose({x:sx+2*sy,y:2*sy-sx});rows.add(p.index);assert.equal(p.index,row);assert.ok(p.profile>=.72&&p.profile<=1);assert.ok(Math.abs(Math.hypot(p.forward.x,p.forward.y)-1)<1e-9);}assert.equal(rows.size,16);assert.equal(WALK_FRAMES,16);
});
test('a narrow walk keeps the heel lanes fixed while each leg alternates contact and recovery',()=>{
 for(let i=0;i<64;i++){const phase=i/64*Math.PI*2,a=walkingLeg(phase,0,front,{x:0,y:1}),b=walkingLeg(phase,1,front,{x:0,y:1});assert.equal(a.stance,!b.stance);assert.equal(Math.abs(a.heel.x-b.heel.x),34);assert.ok(Math.abs(a.hip.x-b.hip.x)<=38);assert.ok(Math.abs(a.heel.x-b.heel.x)<(.73-.52)*320);if(a.stance)assert.equal(a.lift,0);if(b.stance)assert.equal(b.lift,0);assert.ok(a.lift<=15&&b.lift<=15);}
 const a=walkingLeg(0,0,front,{x:1,y:0}),b=walkingLeg(Math.PI,0,front,{x:1,y:0});assert.ok(Math.abs(a.heel.x-b.heel.x)>100,'side-on stride remains long without widening the lanes');
});
test('walking over a gold pile credits its exact amount once and preserves equipment drops',()=>{
 const p={x:0,y:0,gold:0},loot=[{x:1.2,y:0,gold:17},{x:0,y:0,item:{id:'sword'}}];assert.ok(GOLD_PICKUP_RADIUS<1.2);assert.equal(collectGold(p,loot),0);p.x=.3;assert.equal(collectGold(p,loot),17);assert.equal(p.gold,17);assert.equal(p.goldEarned,17);assert.equal(collectGold(p,loot),0);assert.equal(p.gold,17);assert.equal(loot.length,1);assert.equal(loot[0].item.id,'sword');
});
