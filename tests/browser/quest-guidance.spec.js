import {test,expect} from '@playwright/test';
import {createPlayer,distance} from '../../src/game.js';
import {createCampaign,generateWilderness} from '../../src/campaign.js';
import {continueJourney,continueFixture,speak,followPath} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function seed(page,{ready=false,chapter=0}={}){
 const p=createPlayer({name:'The Returned'});p.campaign=createCampaign();p.campaign.chapters[1]=chapter;
 if(ready){p.campaign.records=['field-1-0'];p.quests.herdRewarded=true;p.quests.guideMet=true;p.campaign.questFlow.accepted='last-herd';}
 if(chapter===1){p.campaign.questFlow={version:1,claimed:['last-herd','marchgate'],accepted:'tithe-enforcers'};p.campaign.records=['field-1-0'];p.campaign.defeated=['captain-1-0'];}
 await page.addInitScript(({p,chapter})=>{if(!localStorage.getItem('forgotten-kingdom-characters-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,seed:42710,depth:1,zone:'town',act:1,chapter,expedition:chapter?{kind:'wilderness',act:1,chapter}:null}));},{p,chapter});
 await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();
}
async function finishSpeech(page){await page.keyboard.press('Space');await page.keyboard.press('Space');}
async function god(page){await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();await page.locator('[data-test-option=god]').check();await page.keyboard.press('Escape');}

test('the giver automatically presents one quest with paced text and no service buttons during speech',async({page})=>{
 await page.setViewportSize({width:1024,height:720});const errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await speak(page,'guide');
 await expect(page.locator('#npc-dialogue nav')).toBeHidden();await expect(page.locator('#npc-dialogue button:visible')).toHaveCount(0);
 const first=await page.locator('.npc-speech-reveal').textContent();await page.waitForTimeout(250);expect((await page.locator('.npc-speech-reveal').textContent()).length).toBeGreaterThan(first.length);
 expect((await state(page)).questFlow.accepted).toBe(null);await page.keyboard.press('q');expect((await state(page)).castCounts).toEqual({});
 expect(await page.locator('#npc-dialogue').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);await page.screenshot({path:'/tmp/v480-quest-speech.png'});await finishSpeech(page);expect((await state(page)).questFlow.accepted).toBe('last-herd');
 await expect(page.locator('[data-talk=heal]')).toBeVisible();await page.keyboard.press('Escape');await page.keyboard.press('j');
 await expect(page.locator('.quest-seal.active')).toHaveCount(1);await expect(page.locator('.quest-seal.locked')).toHaveCount(5);expect(errors).toEqual([]);
});

test('returning to the giver pays once and offers the next quest only after the reward dialogue',async({page})=>{
 await seed(page,{ready:true});const before=await state(page);await speak(page,'guide');expect((await state(page)).gold).toBe(before.gold);
 await finishSpeech(page);const paid=await state(page);expect(paid.gold).toBe(before.gold+65);expect(paid.questFlow.claimed).toEqual(['last-herd']);expect(paid.questFlow.accepted).toBe(null);
 await expect(page.locator('#npc-dialogue nav')).toBeHidden();await expect(page.locator('.npc-spoken')).toHaveAttribute('aria-label',/Captain Hadrin/);
 await finishSpeech(page);expect((await state(page)).questFlow.accepted).toBe('marchgate');await page.keyboard.press('Escape');
 await speak(page,'guide');await finishSpeech(page);expect((await state(page)).gold).toBe(paid.gold);await page.reload();await continueJourney(page);
 expect((await state(page)).questFlow).toEqual(paid.questFlow.accepted?paid.questFlow:{...paid.questFlow,accepted:'marchgate'});
});

test('a town portal close to Emberfall provides visible reusable endpoints and returns to the field position',async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);await god(page);
 let s=await state(page);const d=generateWilderness(s.areaSeed,1),target={x:d.townExit.x+2,y:d.townExit.y};const walked=await followPath(page,d,target);expect(walked.i).toBe(walked.length);
 s=await state(page);expect(s.zone).toBe('wilderness');const origin=s.position;await page.keyboard.press('t');
 await expect.poll(()=>state(page).then(s=>s.townPortals.length),{timeout:12000}).toBe(2);await expect.poll(()=>state(page).then(s=>s.loading)).toBe(false);s=await state(page);expect(s.zone).toBe('town');expect(distance(s.position,d.start)).toBeLessThan(8);
 for(const side of ['town','field','town']){
  await page.waitForTimeout(400);s=await state(page);const portal=s.townPortals.find(p=>p.side===side);expect(portal).toBeTruthy();await page.mouse.click(portal.screen.x,portal.screen.y-35);
  await expect.poll(()=>state(page).then(s=>s.zone),{timeout:12000}).toBe(side==='town'?'wilderness':'town');await expect.poll(()=>state(page).then(s=>s.loading)).toBe(false);
  if(side==='town')expect(distance((await state(page)).position,origin)).toBeLessThan(2);
 }
 await page.screenshot({path:'/tmp/v480-return-portal.png'});expect(errors).toEqual([]);
});

test('commanders have matching names, directions and a gothic health frame when encountered',async({page})=>{
 test.setTimeout(90000);await seed(page,{chapter:1});await god(page);await page.keyboard.press('t');await page.locator('[data-town-action=depart]').click();await expect(page.locator('#area-loading')).toBeHidden();
 let s=await state(page);expect(s.chapter).toBe(1);const d=generateWilderness(s.areaSeed,1,{quests:{},campaign:createCampaign()},1),leader=d.enemies.find(e=>e.miniBoss&&e.questDirection==='South');expect(leader).toBeTruthy();
 const walked=await followPath(page,d,{x:leader.x-5,y:leader.y});expect(walked.i).toBe(walked.length);await expect(page.locator('#miniboss-health')).toBeVisible();await expect(page.locator('#miniboss-name')).toHaveText(leader.name);expect(await page.locator('#miniboss-fill').evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(6);await page.screenshot({path:'/tmp/v480-commander-frame.png'});
 await page.keyboard.press('j');await page.locator('[data-quest="2"]').click();for(const direction of ['east','north','south'])await expect(page.locator('.quest-objective')).toContainText(direction);
 for(const name of ['The Famine Collector','The Empty Sickle','The Widowmaker'])await expect(page.locator('.quest-objective')).toContainText(name);
});

// Original crypt characters still use the same paired-portal interaction.
test('legacy crypt characters can make repeated portal round trips',async({page})=>{
 const p=createPlayer();await page.addInitScript(p=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,seed:42710,depth:1,zone:'town'})),p);
 await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();await god(page);await page.keyboard.press('t');await page.locator('[data-town-action=depart]').click();await expect(page.locator('#area-loading')).toBeHidden();
 const origin=(await state(page)).position;await page.keyboard.press('t');await expect.poll(()=>state(page).then(s=>s.zone),{timeout:12000}).toBe('town');
 for(const side of ['town','field','town','field']){
  await expect.poll(()=>state(page).then(s=>s.loading)).toBe(false);await page.waitForTimeout(350);const s=await state(page),portal=s.townPortals.find(p=>p.side===side);expect(portal).toBeTruthy();await page.mouse.click(portal.screen.x,portal.screen.y-35);
  await expect.poll(()=>state(page).then(s=>s.zone),{timeout:12000}).toBe(side==='town'?'dungeon':'town');if(side==='town')expect(distance((await state(page)).position,origin)).toBeLessThan(2);
 }
});
