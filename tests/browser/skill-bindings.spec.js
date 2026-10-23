import {continueJourney} from './helpers.js';
import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {continueFixture} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
test('six skill boxes bind without firing; both mouse attacks cast and survive reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.level=12;p.skills={bolt:2,nova:2,cleave:1};p.slots=['cleave',null,null,null];p.equipment.charm={id:'test',name:'Test reservoir',slot:'charm',rarity:'normal',spirit:5000,life:10000};p.mana=5000;p.hp=10000;
 await page.addInitScript(p=>{if(!localStorage.getItem('ashen-reliquary-save-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},p);
 page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);
 for(const [selector,id] of [['[data-slot="0"]','nova'],['#basic-slot','bolt'],['#mouse-slot','nova']]){await page.locator(selector).click();await expect(page.locator('#skill-picker')).toBeVisible();await page.locator(`[data-choose-skill="${id}"]`).click();await expect(page.locator('#skill-picker')).toBeHidden();}
 let s=await state(page);expect(s.slots[0]).toBe('nova');expect(s.primarySkill).toBe('bolt');expect(s.mouseSkill).toBe('nova');expect(s.castCounts).toEqual({});
 await page.locator('#basic-slot').click();await expect(page.locator('[data-choose-skill="bolt"]')).toHaveAttribute('aria-pressed','true');await page.screenshot({path:'test-results/v31-skill-picker.png'});await page.keyboard.press('Escape');
 await page.keyboard.down('Shift');await page.mouse.click(900,430);await page.keyboard.up('Shift');await expect.poll(()=>state(page).then(s=>s.castCounts.bolt||0)).toBeGreaterThan(0);
 await expect.poll(()=>state(page).then(s=>s.actionRecovery)).toBe(0);await page.mouse.click(900,430,{button:'right'});await expect.poll(()=>state(page).then(s=>s.castCounts.nova||0)).toBeGreaterThan(0);
 await page.locator('[data-slot="0"]').click();await page.locator('[data-choose-skill=""]').click();expect((await state(page)).slots[0]).toBeNull();
 await page.reload();await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();s=await state(page);expect(s.primarySkill).toBe('bolt');expect(s.mouseSkill).toBe('nova');expect(s.slots[0]).toBeNull();
 for(const [width,height] of [[1440,1000],[1280,720],[1024,768]]){await page.setViewportSize({width,height});await page.locator('#basic-slot').click();expect(await page.locator('#skill-picker').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})).toBe(true);await page.keyboard.press('Escape');}
 const graphics=await page.locator('.orb-sculpture').evaluateAll(es=>es.map(e=>({image:getComputedStyle(e).backgroundImage,pointer:getComputedStyle(e).pointerEvents})));expect(graphics.every(g=>g.image.includes('blob:')&&g.pointer==='none')).toBe(true);expect(errors).toEqual([]);
});
