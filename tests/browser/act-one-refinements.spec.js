import {test,expect} from '@playwright/test';
import {createPlayer,playerStats} from '../../src/game.js';
import {createCampaign,generateWilderness,locationId} from '../../src/campaign.js';
import {continueJourney,continueFixture,speak,followPath} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());

test('the opening journal and Maelin explain the sheep attack; glass and gold controls fit the stash',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.campaign=createCampaign();p.gold=234;
 await page.addInitScript(p=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},p);
 await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();
 await speak(page,'guide');await page.locator('[data-talk=accept]').click();await expect(page.locator('#npc-dialogue')).toContainText('butcher the sheep');await expect(page.locator('#npc-dialogue')).toContainText('southern lane');await page.locator('[data-talk=leave]').click();
 await page.keyboard.press('j');await expect(page.locator('.quest-selected-title')).toHaveText('The Last Herd');await expect(page.locator('.quest-parchment')).toContainText('Hadrin ordered the dead');await expect(page.locator('.quest-seal')).toHaveCount(6);await page.keyboard.press('Escape');
 expect(await page.locator('.orb-gloss').first().evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await page.keyboard.press('i');await page.locator('[data-town-action=stash]').click();await page.locator('#bank-amount').fill('41');await page.getByRole('button',{name:'Increase gold amount',exact:true}).click();await expect(page.locator('#bank-amount')).toHaveValue('42');await page.getByRole('button',{name:'Decrease gold amount',exact:true}).click();await expect(page.locator('#bank-amount')).toHaveValue('41');await page.locator('[data-town-action=deposit]').click();expect((await state(page)).bankGold).toBe(41);
 await expect(page.locator('.gold-steppers')).toBeInViewport();await page.screenshot({path:'test-results/v360-glass-stash.png'});expect(errors).toEqual([]);
});

test('the granary gate stands on the wagon road and enters through a matching field gate',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.campaign=createCampaign();p.campaign.chapters[1]=1;const id=locationId(1,'wilderness',1);p.campaign.waypoints.push(id);p.equipment.shield.speed=6;
 await page.addInitScript(p=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},p);
 await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();await page.locator('[data-test-option=god]').check();await page.keyboard.press('Escape');
 await page.keyboard.press('g');await page.locator(`.waypoint-list [data-waypoint="${id}"]`).click();await expect(page.locator('#area-loading')).toBeHidden();
 const s=await state(page),d=generateWilderness(s.areaSeed,1,p,1);await followPath(page,d,{x:d.portal.x,y:d.portal.y+2});await page.waitForTimeout(250);await page.screenshot({path:'test-results/v360-granary-approach.png'});
 const at=await page.evaluate(()=>{const s=window.__reliquary.snapshot();return window.__reliquary.project(s.portal.x,s.portal.y);});await page.mouse.click(at.x,at.y-50);await expect.poll(()=>state(page).then(s=>s.biome),{timeout:15000}).toBe('tithe-granary');await expect(page.locator('#area-loading')).toBeHidden();await page.screenshot({path:'test-results/v360-granary-arrival.png'});expect(errors).toEqual([]);
});

for(const resist of [0,75])test(`Righteous Fire applies continuous fire damage with ${resist}% resistance`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.campaign=createCampaign();p.campaign.chapters[1]=1;p.level=12;p.skills={inferno:1};p.slots=['inferno',null,null,null];p.equipment.shield.fireResist=resist;p.hp=playerStats(p).maxHp;
 await page.addInitScript(p=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'wilderness',act:1,chapter:1,seed:42710,depth:5}));},p);
 page.fixtureZone='wilderness';await page.goto('/');await continueFixture(page);await page.keyboard.press('q');await expect.poll(()=>state(page).then(s=>!!s.pyre)).toBe(true);
 const before=await state(page);expect(before.pyre.selfDps).toBeCloseTo(before.pyre.selfFireDps*(1-resist/100));await page.waitForTimeout(900);const after=await state(page);expect(before.hp-after.hp).toBeGreaterThan(before.pyre.selfDps*.6);expect(after.hp).toBeGreaterThan(0);await page.screenshot({path:`test-results/v360-righteous-fire-${resist}.png`});
 if(!resist){await expect(page.locator('[data-action=revive]')).toBeVisible({timeout:10000});expect((await state(page)).hp).toBe(0);}else{await page.keyboard.press('q');expect((await state(page)).pyre).toBe(null);}expect(errors).toEqual([]);
});
