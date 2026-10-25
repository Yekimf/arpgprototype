import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {continueJourney} from './helpers.js';
test('equipped Magic Find is visible in the character ledger and item tooltip',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.equipment.helm={id:'fortune-hood',name:'Pilgrim Hood of Fortune',slot:'helm',look:'hood',art:7,rarity:'magic',level:1,identified:true,magicFind:12,durability:100};
 await page.addInitScript(p=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,seed:42710,depth:1,zone:'town'})),p);await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();await page.keyboard.press('c');const line=page.locator('.character-stat-ledger').getByText('Magic Find').locator('..');await expect(line).toContainText('12%');await page.keyboard.press('Escape');await page.keyboard.press('i');await page.locator('[data-equip-slot=helm]').hover();await expect(page.locator('#item-tooltip')).toContainText('+12 % Magic Find');expect(errors).toEqual([]);
});
