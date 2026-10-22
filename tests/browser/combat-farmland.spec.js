import {test,expect} from '@playwright/test';
import {createPlayer,generateDungeon} from '../../src/game.js';
import {createCampaign,generateStronghold} from '../../src/campaign.js';
import {followPath} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function saved(page,{campaign=false,chapter=0}={}){
 const p=createPlayer();if(campaign){p.campaign=createCampaign();p.campaign.chapters[1]=chapter;p.quests.herdRewarded=true;p.quests.provisionsRewarded=true;p.equipment.shield={...p.equipment.shield,life:10000,armor:10000,speed:4};p.hp=10000;}
 await page.addInitScript(save=>{if(!localStorage.getItem('ashen-reliquary-save-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save));},{version:1,player:p,zone:'dungeon',act:1,chapter,seed:42710,depth:1});
 await page.goto('/');await page.locator('[data-front=continue]').click();await expect(page.locator('#area-loading')).toBeHidden();
}
async function depart(page){await page.keyboard.press('t');await page.locator('[data-town-action=depart]').click();await expect(page.locator('#area-loading')).toBeHidden();}
test('continuing starts in town, then a real enemy damages a stationary starting character',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await saved(page);expect((await state(page)).zone).toBe('town');await depart(page);let s=await state(page);expect(s.zone).toBe('dungeon');expect(s.terrainPrepared).toBe(true);expect(s.groundChunks).toBe(Math.ceil(s.areaSize/8)**2);const chunks=s.groundChunks;
 const d=generateDungeon(42710),enemy=d.enemies.filter(e=>e.type!=='warden').sort((a,b)=>Math.hypot(a.x-s.position.x,a.y-s.position.y)-Math.hypot(b.x-s.position.x,b.y-s.position.y))[0];
 await followPath(page,d,enemy);const hp=(await state(page)).hp;await expect.poll(()=>state(page).then(s=>s.hp),{timeout:6000}).toBeLessThan(hp-5);expect((await state(page)).groundChunks).toBe(chunks);
 await page.screenshot({path:'test-results/v16-dungeon-light.png'});await page.reload();await page.locator('[data-front=continue]').click();await expect(page.locator('#area-loading')).toBeHidden();expect((await state(page)).zone).toBe('town');expect(errors).toEqual([]);
});
test('the granary is an open farm prepared before entry and menus return to town',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await saved(page,{campaign:true,chapter:1});expect((await state(page)).zone).toBe('town');await depart(page);const s=await state(page);expect(s.zone).toBe('dungeon');expect(s.biome).toBe('tithe-granary');expect(s.outdoor).toBe(true);expect(s.terrainPrepared).toBe(true);expect(s.groundChunks).toBe(121);expect(s.passiveCreatures).toBeGreaterThan(4);await expect(page.locator('#location')).toHaveText('The Tithe Granary');await page.screenshot({path:'test-results/v16-granary.png'});const d=generateStronghold(s.areaSeed,1,1);let route=await followPath(page,d,{x:43.5,y:42.5});expect(route.i).toBe(route.length);await page.screenshot({path:'test-results/v16-granary-yard.png'});route=await followPath(page,d,d.returnGate);expect(route.i).toBe(route.length);await page.keyboard.press('f');await expect(page.locator('#area-loading')).toBeHidden();expect((await state(page)).biome).toBe('widows-fields');await page.screenshot({path:'test-results/v16-widows-fields.png'});expect(errors).toEqual([]);
});
