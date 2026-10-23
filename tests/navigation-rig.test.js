import test from 'node:test';
import assert from 'node:assert/strict';
import {findPath,clearPath,isWalkable,moveEntity} from '../src/game.js';
import {planWalk} from '../src/navigation.js';
import {joint,punchPose} from '../src/animation-rig.js';
import {generateWilderness} from '../src/campaign.js';
test('click routes clear corners for a body with width and retain exact destinations',()=>{
 const d={tiles:Array.from({length:16},(_,y)=>Array.from({length:16},(_,x)=>x>0&&y>0&&x<15&&y<15?1:0))};for(let y=1;y<13;y++)d.tiles[y][7]=0;
 const start={x:3.5,y:3.5},end={x:12.73,y:4.29},path=findPath(d,start,end);assert.deepEqual(path.at(-1),end);assert.ok(path.some(p=>p.y>=13));
 for(const speed of [3.8,11]){const p={...start};for(const target of path){let steps=0;while(Math.hypot(p.x-target.x,p.y-target.y)>.035&&steps++<2000){const length=Math.hypot(target.x-p.x,target.y-p.y),step=Math.min(length,speed/60);moveEntity(d,p,(target.x-p.x)/length*step,(target.y-p.y)/length*step);assert.ok(isWalkable(d,p.x,p.y));}assert.ok(steps<2000);}assert.ok(Math.hypot(p.x-end.x,p.y-end.y)<.04);}
 const open={tiles:[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]};assert.equal(findPath(open,{x:1.5,y:1.5},{x:2.7,y:2.6}).length,1);
 const corner={tiles:[[1,0],[0,1]]};assert.deepEqual(findPath(corner,{x:.5,y:.5},{x:1.5,y:1.5}),[]);
});
test('wall-edge clicks choose reachable ground instead of silently dropping the order',()=>{
 const d={tiles:[[0,0,0,0,0],[0,1,0,1,0],[0,1,0,1,0],[0,1,0,1,0],[0,0,0,0,0]]},p={x:1.5,y:2.5};
 const plan=planWalk(d,p,{x:2.8,y:2.5},findPath);assert.ok(plan);assert.equal(plan.target.x,1.5);assert.equal(plan.exact,false);assert.equal(planWalk(d,p,{x:100,y:100},findPath),null);
});
test('joint lengths and punch extension remain stable',()=>{
 const root={x:0,y:0},pose=joint(root,{x:40,y:30},30,35);assert.ok(Math.abs(Math.hypot(pose.knee.x,pose.knee.y)-30)<.001);assert.ok(Math.abs(Math.hypot(pose.end.x-pose.knee.x,pose.end.y-pose.knee.y)-35)<.001);assert.equal(punchPose(0).extension,0);assert.equal(punchPose(1).extension,0);assert.ok(punchPose(.5).extension>.99);
});
test('wilderness frontiers have visible barriers and the keep gate blocks passage behind its approach',()=>{
 for(let act=1;act<=1;act++){const d=generateWilderness(701,act);assert.ok(d.props.filter(p=>p.type==='frontier').length>100);assert.ok(d.props.some(p=>p.type==='road-gate'||p.type==='kingdom-gate'));for(let x=74;x<=79;x++)assert.equal(d.tiles[17][x],0);assert.ok(findPath(d,d.start,d.portal).length);assert.equal(findPath(d,d.start,{x:d.portal.x,y:16.5}).length,0);for(const enemy of d.enemies)assert.ok(enemy.y>=18);}
});
