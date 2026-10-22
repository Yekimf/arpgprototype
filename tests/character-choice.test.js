import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer} from '../src/game.js';
import {migratePlayer} from '../src/settlement.js';
import {appearanceOf} from '../src/itemization.js';
test('new loyalists have only a sword and shield equipped',()=>{
 const p=createPlayer();assert.equal(p.sex,'male');assert.deepEqual(Object.entries(p.equipment).filter(([,item])=>item).map(([slot])=>slot).sort(),['shield','weapon']);assert.equal(p.inventory.length,0);
 const look=appearanceOf(p);for(const slot of ['armor','helm','gloves','boots'])assert.equal(look[slot],'none');assert.equal(look.weapon,'sword');assert.equal(look.shield,'round');
});
test('retired female saves use the male model and keep earned equipment and progress',()=>{
 const p=createPlayer();p.sex='female';p.level=8;p.gold=125;p.equipment.armor={id:'earned-mail',slot:'armor',name:'Earned Hauberk',rarity:'normal',armor:12};
 const reloaded=migratePlayer(JSON.parse(JSON.stringify(p)));assert.equal(reloaded.sex,'male');assert.equal(reloaded.level,8);assert.equal(reloaded.gold,125);assert.equal(reloaded.equipment.armor.id,'earned-mail');assert.equal(createPlayer({sex:'female'}).sex,'male');
});
