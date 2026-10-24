import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bufferCombatAction,takeBufferedAction,hitReaction,skillContactTiming} from '../src/combat-feel.js';
import {attackTiming} from '../src/weapon-rig.js';
test('late combat inputs buffer the most recent ability with a snapshot of its aimed point',()=>{
  const game={actionRecovery:.15,attackCooldown:.12,dodgeTime:0},aim={x:4,y:7};
  assert.equal(bufferCombatAction(game,'basic',aim),true);aim.x=99;assert.equal(game.queuedSkill.target.x,4);
  assert.equal(takeBufferedAction(game,.05),null);assert.equal(bufferCombatAction(game,'nova',{x:8,y:2}),true);
  game.actionRecovery=0;game.attackCooldown=0;const next=takeBufferedAction(game,.016);assert.equal(next.id,'nova');assert.deepEqual(next.target,{x:8,y:2});assert.equal(game.queuedSkill,null);
});
test('held skills never overwrite an explicit buffered input; long recovery and stale inputs do not fire',()=>{
  const game={actionRecovery:.2};assert.equal(bufferCombatAction(game,'bolt',{x:1,y:1}),true);
  assert.equal(bufferCombatAction(game,'basic',{x:2,y:2},true),false);assert.equal(game.queuedSkill.id,'bolt');
  game.actionRecovery=1;assert.equal(bufferCombatAction(game,'nova',null),false);assert.equal(takeBufferedAction(game,.4),null);assert.equal(game.queuedSkill,null);
});
test('a buffered basic attack waits for its weapon recovery and a skill waits for evade to finish',()=>{
  const game={actionRecovery:0,attackCooldown:.1,dodgeTime:0};bufferCombatAction(game,'basic',null);assert.equal(takeBufferedAction(game,.016),null);
  game.attackCooldown=0;assert.equal(takeBufferedAction(game,.016).id,'basic');game.dodgeTime=.1;bufferCombatAction(game,'bolt',null);assert.equal(takeBufferedAction(game,.016),null);game.dodgeTime=0;assert.equal(takeBufferedAction(game,.016).id,'bolt');
});
test('skill recovery never truncates contact animation, including very high attack speed',()=>{
  for(const speed of [.65,1,2,5])for(const melee of [false,true]){
    const t=skillContactTiming({cadence:.44/speed},attackTiming({look:'sword'},speed),melee);
    assert.ok(t.impact>0&&t.impact<t.duration);assert.ok(t.recovery>=t.duration);
  }
});
test('confirmed hit feedback has bounded strength and direction without changing enemy position',()=>{
  const enemy={x:4,y:2,maxHp:100},before={...enemy},normal=hitReaction(enemy,8,{from:{x:2,y:2}}),critical=hitReaction(enemy,8,{from:{x:2,y:2},critical:true});
  assert.equal(normal.dx,1);assert.equal(normal.dy,0);assert.ok(critical.strength>normal.strength);assert.equal(hitReaction(enemy,1e6).strength,1);assert.deepEqual(enemy,before);
});
