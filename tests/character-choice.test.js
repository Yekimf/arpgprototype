import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,playerStats} from '../src/game.js';
import {migratePlayer} from '../src/settlement.js';
import {appearanceOf} from '../src/itemization.js';
test('female characters keep the same starting power and a distinct persisted appearance',()=>{
 const male=createPlayer(),female=createPlayer({sex:'female',name:'Mara'});
 assert.equal(male.sex,'male');assert.equal(female.sex,'female');assert.deepEqual(playerStats(male),playerStats(female));assert.equal(female.equipment.helm.look,'hood');
 const reloaded=migratePlayer(JSON.parse(JSON.stringify(female)));assert.equal(reloaded.sex,'female');assert.equal(reloaded.name,'Mara');
 assert.notDeepEqual(appearanceOf(male),appearanceOf(female));
});
test('old and invalid character choices retain the male appearance',()=>{
 for(const sex of [undefined,'invalid']){const p=createPlayer();p.sex=sex;assert.equal(migratePlayer(p).sex,'male');}assert.equal(createPlayer({sex:'invalid'}).sex,'male');
});
