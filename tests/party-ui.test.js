import test from 'node:test';import assert from 'node:assert/strict';import {partyHealth,partyHud,partyLifeBar,partyLocation} from '../src/party-ui.js';
test('party life wells clamp health and escape names while showing only your party',()=>{
 const self={id:'self',party:'oath',partyLeader:'friend',area:'wilderness:0'},friend={id:'friend',name:'<Alden>',party:'oath',level:12,area:'stronghold:1',zone:'dungeon',hp:60,maxHp:120};
 assert.equal(partyHealth({...friend,hp:999}).percent,100);assert.equal(partyHealth({...friend,hp:-4}).percent,0);assert.equal(partyHealth({...friend,hp:NaN}).percent,0);
 const html=partyHud([self,friend,{...friend,id:'stranger',party:'other',name:'Hidden'}],'self');
 assert.match(html,/&lt;Alden&gt;/);assert.match(html,/--life:50%/);assert.match(html,/Party leader/);assert.match(html,/Tithe Granary · Away/);assert.doesNotMatch(html,/Hidden|<meter/);assert.match(partyLifeBar(friend),/aria-valuenow="60"/);
 assert.equal(partyHud([self],'self'),'');assert.equal(partyLocation({zone:'town'}),'Emberfall');
});
