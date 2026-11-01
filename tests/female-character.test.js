import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../src/game.js';
import {OnlineCharacters} from '../src/network/online-characters.js';

test('female online creation saves the selected model through a leased account save',async()=>{
 const calls=[];const base={id:'online-mira',revision:0,save:{version:1,player:{...createPlayer({name:'Ser Mira'}),onlineCharacterId:'online-mira'}}};
 const service={createOnline:async()=>structuredClone(base),openOnline:async(id,lease)=>{calls.push(['open',id,lease]);return base;},saveOnline:async(id,lease,revision,save)=>{calls.push(['save',id,lease,revision,save.player.sex]);return {revision:1};},releaseOnline:async(id,lease)=>calls.push(['release',id,lease])};
 const archive=new OnlineCharacters(service);const record=await archive.create('Ser Mira','female');
 assert.equal(record.save.player.sex,'female');assert.equal(record.revision,1);assert.equal(archive.characters.length,1);
 assert.deepEqual(calls.map(c=>c[0]),['open','save','release']);assert.equal(calls[1][4],'female');
});
