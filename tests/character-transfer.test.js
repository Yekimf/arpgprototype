import test from 'node:test';import assert from 'node:assert/strict';
import {characterFile,readCharacterFile} from '../src/character-transfer.js';
import {CharacterSaves} from '../src/character-saves.js';import {createPlayer} from '../src/game.js';
test('character files carry gear, progression and stable LAN identity between browser archives',()=>{
 const original=new CharacterSaves(),record=original.create({version:1,player:createPlayer({name:'Traveller'}),seed:71,depth:1,zone:'town'}),file=characterFile(record.save),restored=readCharacterFile(JSON.parse(JSON.stringify(file)));assert.equal(restored.player.name,'Traveller');assert.ok(restored.player.lanIdentity.secret.length>=24);assert.equal(restored.seed,71);assert.deepEqual(characterFile(restored).save.player.lanIdentity,file.save.player.lanIdentity);
 const target=new CharacterSaves(),imported=target.importCharacter(restored);restored.player.gold=70;assert.ok(target.importCharacter(restored,imported.id));assert.equal(target.characters.length,1);assert.equal(target.active.save.player.gold,70);assert.equal(original.active.save.player.gold,0);
});
test('malformed transfers are rejected before they can replace a working save',()=>{
 const good=characterFile({version:1,player:createPlayer(),seed:7});assert.throws(()=>readCharacterFile({}),/export/);const invalid=structuredClone(good);invalid.save.player.equipment='bad';assert.throws(()=>readCharacterFile(invalid),/invalid/);const invalidItem=structuredClone(good);invalidItem.save.player.inventory=[null];assert.throws(()=>readCharacterFile(invalidItem),/invalid/);assert.equal(readCharacterFile(good).player.level,1);
});
