import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign} from '../../src/campaign.js';
import {continueFixture} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
for(const [chapter,tileset,style]of [[0,'marchgate','fortress'],[1,'granary','farm'],[2,'redoubt','crypt']])test(`${tileset} loads distinct floors and entrance; map and quests contain only Act I`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.campaign=createCampaign();p.campaign.chapters[1]=chapter;page.fixtureZone='dungeon';
 await page.addInitScript(p=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'dungeon',act:1,chapter:p.campaign.chapters[1],depth:1,seed:42710}));},p);
 await page.goto('/');await continueFixture(page);await expect.poll(()=>state(page).then(s=>s.loading)).toBe(false);await expect.poll(()=>state(page).then(s=>s.artLoaded)).toBe(true);
 const s=await state(page);expect(s.tileset).toBe(tileset);expect(s.entranceStyle).toBe(style);expect(s.areaLevel).toBe(3+chapter*4);expect(s.boss[0].hp).toBeGreaterThan(1900+chapter*1800);
 await page.screenshot({path:`/tmp/v340-${tileset}.png`});
 await page.keyboard.press('g');await expect(page.locator('.kingdom-map .map-act')).toHaveCount(7);await expect(page.locator('.waypoint-list [data-waypoint]').last()).toBeInViewport();if(chapter===2)await page.screenshot({path:'/tmp/v340-act-one-map.png'});await expect(page.locator('#modal')).not.toContainText(/Mourning Fen|Act II|Cinderfields|Frostwold|Throne of Black Glass/);await page.keyboard.press('Escape');
 await page.keyboard.press('j');await expect(page.locator('[data-quest-act]')).toHaveCount(1);await expect(page.locator('.quest-seal')).toHaveCount(6);expect(errors).toEqual([]);
});
