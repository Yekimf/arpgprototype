import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign} from '../../src/campaign.js';
import {continueFixture} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function load(page,{campaign=true,chapter=0,combat=false}={}){
 const p=createPlayer();p.level=10;p.passivePoints=9;p.gold=1000;p.mana=1;p.equipment.charm={id:'reservoir',name:'Reservoir',slot:'charm',rarity:'normal',spirit:500,life:10000};p.hp=10000;p.inventory=[{id:'hood',name:'Pilgrim Hood',slot:'helm',look:'hood',art:7,rarity:'normal',armor:2},{id:'helm',name:'Great Helm',slot:'helm',look:'greathelm',art:7,rarity:'normal',armor:5}];
 if(campaign){p.campaign=createCampaign();p.campaign.chapters[1]=chapter;if(chapter===2)p.campaign.defeated=['captain-1-0','captain-1-1'];}
 await page.addInitScript(p=>{if(!localStorage.getItem('ashen-reliquary-save-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},p);
 await page.goto('/');page.fixtureZone=combat?'dungeon':'town';await continueFixture(page);await expect.poll(()=>state(page).then(s=>s.artLoaded)).toBe(true);
}
async function capturedClick(page,selector){
 const r=await page.locator(selector.startsWith('[data-passive-detail')?selector+'>path':selector).boundingBox({timeout:5000});expect(r).toBeTruthy();
 // Steer the displayed cursor; browser calibration may scale raw movement deltas.
 await page.evaluate(({x,y})=>{for(let i=0;i<5;i++){const c=window.__reliquary.snapshot().cursor;if(Math.hypot(x-c.x,y-c.y)<1.5)break;document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,movementX:x-c.x,movementY:y-c.y,pointerType:'mouse'}));}},{x:r.x+r.width/2,y:r.y+r.height/2});
 await page.mouse.down();await page.mouse.up();
}
test('passive nodes select and allocate with normal and captured cursor, then persist',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page);await page.keyboard.press('k');await page.locator('[data-progression=passives]').click();await expect(page.locator('#passive-atlas [data-passive-detail]')).toHaveCount(469);await expect(page.locator('#passive-atlas span')).toHaveCount(0);await expect(page.locator('.atlas-disciplines .skill-glyph')).toHaveCount(6);await expect(page.locator('.atlas-disciplines .skill-glyph').first()).toBeVisible();
 await page.locator('[data-passive-detail="well-1-1"]').click();await page.locator('[data-allocate-passive="well-1-1"]').click();expect((await state(page)).passives).toContain('well-1-1');expect((await state(page)).passivePoints).toBe(8);
 await page.keyboard.press('Escape');await page.locator('#capture-cursor').click();await page.keyboard.press('k');await expect.poll(()=>state(page).then(s=>s.cursor.captured)).toBe(true);await capturedClick(page,'[data-passive-detail="well-2-1"]');await capturedClick(page,'[data-allocate-passive="well-2-1"]');expect((await state(page)).passives).toContain('well-2-1');expect((await state(page)).passivePoints).toBe(7);await page.screenshot({path:'test-results/v32-passive-atlas.png'});await page.keyboard.press('Control+Escape');await page.reload();await continueFixture(page);expect((await state(page)).passives).toEqual(['well-1-1','well-2-1']);expect(errors).toEqual([]);
});
test('key 2 and mana flask click spend charges and recover mana; material icons differ',async({page})=>{
 await load(page,{campaign:false,combat:true});const before=await state(page);await page.keyboard.press('2');let s=await state(page);expect(s.manaFlask.charges).toBeLessThan(before.manaFlask.charges-19);expect(s.mana).toBeGreaterThan(before.mana);await page.locator('#mana-potion-slot').click();s=await state(page);expect(s.manaFlask.charges).toBeLessThan(before.manaFlask.charges-39);await page.waitForTimeout(1000);expect((await state(page)).mana).toBeGreaterThan(s.mana);await page.keyboard.press('i');await expect(page.locator('[data-pack-id=hood] [data-equipment-look=hood]')).toHaveCount(1);await expect(page.locator('[data-pack-id=helm] [data-equipment-look=greathelm]')).toHaveCount(1);const boxes=await page.locator('[data-pack-id] .item-art').evaluateAll(es=>es.map(e=>e.getAttribute('viewBox')));expect(new Set(boxes).size).toBe(2);await page.screenshot({path:'test-results/v32-material-icons.png'});
});
test('Act I journal has exactly six combat quests and its final road is Blackthorn Hollow',async({page})=>{
 await load(page,{chapter:2,combat:true});await expect(page.locator('#location')).toHaveText('Blackthorn Hollow');expect((await state(page)).biome).toBe('blackthorn-hollow');expect((await state(page)).field).toBeNull();expect((await state(page)).provisions).toBeNull();await page.keyboard.press('j');await expect(page.locator('[data-quest]')).toHaveCount(6);for(let i=0;i<6;i++){await page.locator(`[data-quest="${i}"]`).click();await expect(page.locator('.quest-objective')).toContainText(/Defeat|The way is open/);}await page.locator('[data-quest="5"]').click();await expect(page.locator('.journal-pages')).toContainText('Aldren');await page.screenshot({path:'test-results/v32-act-one-quests.png'});
});
