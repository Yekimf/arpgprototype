import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enemyFamily,enemyPose,ENEMY_FAMILIES} from '../src/enemy-appearance.js';
import {ENEMY_ROSTERS} from '../src/campaign-content.js';
test('six painted families cover every combat role and Act I quest enemies',()=>{
 assert.equal(new Set(ENEMY_FAMILIES.map(f=>f.row)).size,6);
 for(const [role,id] of Object.entries({guard:'spearman',lunge:'ravager',venom:'ravager',archer:'crossbowman',brute:'butcher',hexer:'chanter',bomber:'bombardier'}))assert.equal(enemyFamily({type:'skeleton',role}).id,id);
 for(const roster of ENEMY_ROSTERS)for(const profile of roster)assert.ok(enemyFamily(profile));
 assert.equal(enemyFamily({type:'skeleton',role:'guard',questId:'tithe-enforcers'}).id,'butcher');assert.equal(enemyFamily({type:'skeleton',role:'guard',name:'Levy Butcher'}).id,'butcher');assert.equal(enemyFamily({type:'wraith',name:'Hollow Cantor'}).id,'chanter');assert.equal(enemyFamily({type:'warden'}),null);assert.equal(enemyFamily({type:'skeleton',bossId:'captain-1-0'}),null);
});
test('walking uses alternating strides, attacks use their own art, and facing selects front/back and reflection',()=>{
 const e={};assert.equal(enemyPose(e,{x:1,y:0},2,false).frame,0);assert.deepEqual([0,1,2,3].map(n=>enemyPose(e,{x:1,y:0},n,true).frame),[0,1,0,2]);assert.equal(enemyPose({attackAnim:.3},{x:1,y:0},1,true).frame,3);assert.equal(enemyPose({rangedWindup:{}},{x:1,y:0},1,false).action,'attack');assert.equal(enemyPose({charge:{delay:0}},{x:1,y:0},0,true).frame,3);
 const sides=[[1,0,false,false],[0,1,false,true],[0,-1,true,false],[-1,0,true,true]];for(const [x,y,back,flip]of sides){const pose=enemyPose(e,{x,y},0,false);assert.equal(pose.back,back);assert.equal(pose.flip,flip);}
});
