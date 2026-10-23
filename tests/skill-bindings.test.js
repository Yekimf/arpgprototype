import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../src/game.js';
import {assignSkill,boundSkill,primaryRange} from '../src/skill-bindings.js';
import {migratePlayer} from '../src/settlement.js';
test('six independently configurable bindings only accept learned active skills',()=>{
 const p=createPlayer();p.skills={bolt:1,cleave:1};
 for(const slot of [0,1,2,3,'primary','mouse']){assert.equal(assignSkill(p,slot,'bolt'),true);assert.equal(boundSkill(p,slot),'bolt');}
 assert.equal(assignSkill(p,'mouse','meteor'),false);assert.equal(assignSkill(p,'primary','unknown'),false);assert.equal(assignSkill(p,8,'bolt'),false);
 assert.equal(assignSkill(p,0,null),true);assert.equal(p.slots[0],null);assert.equal(p.primarySkill,'bolt');
 assert.equal(assignSkill(p,'primary',null),false);assert.equal(assignSkill(p,'primary','basic'),true);assert.equal(assignSkill(p,1,'basic'),false);
 assert.equal(primaryRange(p,{reach:2}),1.7);p.primarySkill='bolt';assert.equal(primaryRange(p,{reach:2}),7);
});
test('old saves retain right mouse and gain basic left mouse; configured left mouse survives migration',()=>{
 const p=createPlayer();delete p.primarySkill;p.skills={bolt:1};p.mouseSkill='bolt';migratePlayer(p);assert.equal(p.primarySkill,'basic');assert.equal(p.mouseSkill,'bolt');
 p.primarySkill='bolt';migratePlayer(p);assert.equal(p.primarySkill,'bolt');p.primarySkill='missing';migratePlayer(p);assert.equal(p.primarySkill,'basic');
});
