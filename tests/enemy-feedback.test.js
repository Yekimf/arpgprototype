import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enemyHitPose,enemyHealthTrail} from '../src/enemy-feedback.js';

test('enemy recoil settles back to its planted position without changing collision coordinates',()=>{
  const enemy={x:3,y:4,type:'skeleton',hitReaction:{remaining:.2,duration:.2,dx:1,dy:-1,strength:1,critical:true}},start=structuredClone(enemy);
  const first=enemyHitPose(enemy);assert.ok(first.x>0);assert.equal(first.y,0);assert.ok(Math.hypot(first.x,first.y)<7);
  const peak=enemyHitPose({...enemy,hitReaction:{...enemy.hitReaction,remaining:.156}});
  const settling=enemyHitPose({...enemy,hitReaction:{...enemy.hitReaction,remaining:.02}});
  assert.ok(peak.x>first.x);assert.ok(settling.x<first.x);assert.deepEqual(enemy,start);
  assert.deepEqual(enemyHitPose({...enemy,hitReaction:{...enemy.hitReaction,remaining:0}}),{x:0,y:0,tilt:0,active:false});
});

test('bosses retain their footing and reduced motion removes recoil entirely',()=>{
  const enemy={type:'skeleton',hitReaction:{remaining:.15,duration:.2,dx:-1,dy:0,strength:1}};
  const normal=enemyHitPose(enemy),boss=enemyHitPose({...enemy,type:'warden'});
  assert.ok(Math.hypot(boss.x,boss.y)<Math.hypot(normal.x,normal.y)*.5);
  assert.equal(enemyHitPose(enemy,true).active,false);assert.equal(enemyHitPose({...enemy,dead:true}).active,false);
  for(const hitReaction of [null,{}, {duration:0,remaining:1},{duration:1,remaining:1,dx:NaN,dy:Infinity}]){
    const pose=enemyHitPose({hitReaction});assert.ok([pose.x,pose.y,pose.tilt].every(Number.isFinite));
  }
});

test('enemy health after-image holds briefly, drains toward actual health and handles repeated hits or time resets',()=>{
  const full=enemyHealthTrail(null,1,0),hit=enemyHealthTrail(full,.7,.01),held=enemyHealthTrail(hit,.7,.1);
  assert.equal(hit.hp,.7);assert.equal(hit.trail,1);assert.equal(held.trail,1);
  const drain=enemyHealthTrail(held,.7,.2);assert.ok(drain.trail<1&&drain.trail>.7);
  const next=enemyHealthTrail(drain,.4,.21);assert.equal(next.trail,drain.trail);assert.ok(Math.abs(next.holdUntil-.33)<1e-10);
  assert.deepEqual(enemyHealthTrail(next,.8,0),{hp:.8,trail:.8,holdUntil:0,time:0});
  assert.equal(enemyHealthTrail(next,2,.3).trail,1);
});
