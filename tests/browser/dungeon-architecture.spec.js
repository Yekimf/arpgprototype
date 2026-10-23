import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign,generateWilderness,generateStronghold} from '../../src/campaign.js';
import {continueFixture,followPath} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function load(page,chapter,zone){
 const p=createPlayer();p.campaign=createCampaign();p.campaign.chapters[1]=chapter;p.equipment.boots={id:'test-boots',slot:'boots',rarity:'normal',speed:12};p.equipment.armor={id:'test-armour',slot:'armor',rarity:'normal',armor:10000,life:10000};p.hp=10000;page.fixtureZone=zone;
 await page.addInitScript(({p,zone,chapter})=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone,act:1,chapter,depth:1,seed:42710})),{p,zone,chapter});await page.goto('/');await continueFixture(page);await expect(page.locator('#area-loading')).toBeHidden();
}
test('walking through Marchgate arrives at the visible gate, then enters enclosed decorated courts',async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page,0,'wilderness');let s=await state(page);const wild=generateWilderness(s.areaSeed,1);expect((await followPath(page,wild,wild.portal)).i).toBeGreaterThan(0);await page.locator('#interact-button').click();await expect.poll(()=>state(page).then(s=>s.zone)).toBe('dungeon');await expect(page.locator('#area-loading')).toBeHidden();await page.waitForTimeout(350);s=await state(page);
 expect(s.wallSegments).toBeGreaterThan(200);expect(s.dungeonDressing).toBeGreaterThan(30);expect(Math.hypot(s.position.x-s.entryGate.x,s.position.y-s.entryGate.y)).toBeLessThan(7);expect(s.entryGate.screen.x).toBeGreaterThan(150);expect(s.entryGate.screen.x).toBeLessThan(1290);expect(s.entryGate.screen.y).toBeLessThan(850);expect(Math.hypot(s.waypoint.x-s.entryGate.x,s.waypoint.y-s.entryGate.y)).toBeGreaterThan(10);await page.screenshot({path:'/tmp/v341-marchgate-arrival.png'});
 const d=generateStronghold(s.areaSeed,1),r=d.rooms[0];const route=await followPath(page,d,{x:r.x+r.w/2,y:r.y+r.h/2});expect(route.i).toBe(route.length);await page.screenshot({path:'/tmp/v341-marchgate-walls.png'});expect(errors).toEqual([]);
});
test('redoubt burial rooms use continuous walls and crypt furnishings',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page,2,'dungeon');const s=await state(page);expect(s.wallSegments).toBeGreaterThan(200);expect(s.dungeonDressing).toBeGreaterThan(30);await page.screenshot({path:'/tmp/v341-redoubt-walls.png'});expect(errors).toEqual([]);
});
