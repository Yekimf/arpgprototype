import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign} from '../../src/campaign.js';
import {speak} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function load(page){const p=createPlayer();p.campaign=createCampaign();p.inventory=[{id:'click-coat',name:'Leather Jerkin',slot:'armor',look:'leather',rarity:'normal',armor:4}];await page.addInitScript(p=>{if(!localStorage.getItem('ashen-reliquary-save-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},p);await page.goto('/');await page.locator('[data-front=continue]').click();await expect(page.locator('#area-loading')).toBeHidden();}
test('F has no interaction action; NPCs, fountains and ground item labels still accept clicks',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page);await expect(page.locator('#interact-button kbd')).toHaveCount(0);await page.keyboard.press('f');let s=await state(page);expect(s.panel).toBeNull();expect(s.dialogue).toBeNull();expect(s.campaign.fountains||[]).not.toContain('emberfall');await page.locator('#interact-button').click();expect((await state(page)).campaign.fountains).toContain('emberfall');
 await speak(page,'guide');await expect(page.locator('#npc-dialogue')).toBeVisible();await page.locator('[data-talk=leave]').click();await page.keyboard.press('f');expect((await state(page)).dialogue).toBeNull();
 await page.keyboard.press('i');const item=page.locator('[data-pack-id=click-coat]'),r=await item.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+12,r.y+r.height/2+3);await page.mouse.move(100,350,{steps:10});await page.mouse.up();await expect(item).toHaveCount(0);await expect.poll(()=>state(page).then(s=>s.lootLabels.some(l=>l.itemId==='click-coat'))).toBe(true);
 await page.keyboard.press('f');await page.waitForTimeout(150);expect((await state(page)).inventory).toBe(0);const label=(await state(page)).lootLabels.find(l=>l.itemId==='click-coat');await page.mouse.click(label.x+label.w/2,label.y+label.h/2);await expect(item).toBeVisible();
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.locator('[data-action=help]').click();await expect(page.locator('.help-grid')).not.toContainText(/\bF\b/);await expect(page.locator('.help-grid')).toContainText('Click the character');expect(errors).toEqual([]);
});
