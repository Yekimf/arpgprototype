import {continueFixture} from './helpers.js';
import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign,generateWilderness,generateStronghold} from '../../src/campaign.js';
import {followPath} from './helpers.js';
const snapshot=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function seed(page,zone='wilderness',unarmed=false){page.fixtureZone=zone;const p=createPlayer();p.quests.herdRewarded=true;p.quests.provisionsRewarded=true;p.campaign=createCampaign();p.equipment.weapon=unarmed?null:{...p.equipment.weapon,damage:5000};p.equipment.armor={...p.equipment.armor,armor:10000,life:10000};p.equipment.boots={...p.equipment.boots,speed:12};p.hp=10000;await page.addInitScript(save=>{if(!localStorage.getItem('ashen-reliquary-save-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save));},{version:1,player:p,zone,act:1,chapter:0,depth:1,seed:42710});await page.goto('/');await continueFixture(page);await expect.poll(()=>snapshot(page).then(s=>s.loading)).toBe(false);}
test('three Act I strongholds lead to the new region, free Edrin and open Act II without pickups',async({page})=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
 for(let chapter=0;chapter<3;chapter++){
  let current=await snapshot(page);expect(current.chapter).toBe(chapter);expect(current.field).toBeNull();expect(current.provisions).toBeNull();
  const wild=generateWilderness(current.areaSeed,1,{quests:{}},chapter);const road=await followPath(page,wild,wild.portal);expect(road.i).toBe(road.length);await page.locator('#interact-button').click();await expect.poll(()=>snapshot(page).then(s=>s.zone)).toBe('dungeon');await expect(page.locator('#area-loading')).toBeHidden();
  current=await snapshot(page);const keep=generateStronghold(current.areaSeed,1,chapter);const path=await followPath(page,keep,keep.portal);expect(path.i).toBe(path.length);await page.waitForTimeout(200);const boss=(await snapshot(page)).visibleEnemies.find(e=>e.bossId);expect(boss).toBeTruthy();await page.mouse.click(boss.screen.x,boss.screen.y);await expect.poll(()=>snapshot(page).then(s=>s.bossDead),{timeout:10000}).toBe(true);
  if(chapter===0)await page.screenshot({path:'test-results/v32-marchgate-stone.png'});
  await page.locator('#interact-button').click();await page.locator('#interact-button').click();
  if(chapter<2){await expect(page.locator('[data-campaign-action="next-chapter"]')).toBeVisible();await page.locator('[data-campaign-action="next-chapter"]').click();await expect(page.locator('#area-loading')).toBeHidden();}
  else{expect((await snapshot(page)).quests.scholarRescued).toBe(true);await expect(page.locator('[data-campaign-action="advance"]')).toBeVisible();await page.locator('[data-campaign-action="advance"]').click();await expect(page.locator('#area-loading')).toBeHidden();expect((await snapshot(page)).act).toBe(2);}
 }
 expect(errors).toEqual([]);
});
test('outdoor ground is prepared before movement while the automap remains unexplored',async({page})=>{await seed(page);const before=await snapshot(page);expect(before.terrainPrepared).toBe(true);expect(before.groundChunks).toBe(Math.ceil(before.areaSize/8)**2);expect(before.exploredTiles).toBeLessThan(before.areaSize**2/2);await page.keyboard.down('ArrowUp');await page.waitForTimeout(1000);await page.keyboard.up('ArrowUp');const after=await snapshot(page);expect(after.groundChunks).toBe(before.groundChunks);expect(after.exploredTiles).toBeGreaterThanOrEqual(before.exploredTiles);await page.keyboard.press('Tab');await expect(page.locator('#map-overlay')).toBeVisible();});
test('an empty weapon slot uses a punch animation and punch bindings',async({page})=>{await seed(page,'dungeon',true);await expect(page.locator('#basic-slot .ability-name')).toHaveText('Punch');await expect(page.locator('#mouse-slot .ability-name')).toHaveText('Punch');await page.keyboard.down('Shift');await page.mouse.move(850,460);await page.mouse.down();await expect.poll(()=>snapshot(page).then(s=>s.animation.action)).toBe('punch');expect((await snapshot(page)).attackStyle).toBe('punch');expect((await snapshot(page)).combatStats.reach).toBe(1.15);await page.mouse.up();await page.keyboard.up('Shift');});
