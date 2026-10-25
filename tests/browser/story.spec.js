import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign,generateStronghold} from '../../src/campaign.js';
import {CHARACTER_SAVE_KEY} from '../../src/character-saves.js';
import {continueJourney,continueFixture,followPath,speak} from './helpers.js';

const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function seedCharacters(page,{expedition=false}={}){
 const first=createPlayer({name:'Road Witness'}),second=createPlayer({name:'Unwritten Oath'});
 first.campaign=createCampaign();second.campaign=createCampaign();
 const save=player=>({version:1,player,depth:1,seed:42710,zone:'town',act:1,chapter:0});
 const firstSave=save(first);if(expedition)firstSave.expedition={kind:'stronghold',act:1,chapter:0};
 const archive={version:1,activeId:'witness',sharedStashes:[[],[],[]],characters:[
  {id:'witness',createdAt:1,updatedAt:1,save:firstSave},
  {id:'unwritten',createdAt:2,updatedAt:2,save:save(second)},
 ]};
 // Subsequent page loads must exercise the game's saved archive, not reseed it.
 await page.addInitScript(({key,archive})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(archive));},{key:CHARACTER_SAVE_KEY,archive});
}
async function expectInsideViewport(locator,page){
 const box=await locator.boundingBox(),viewport=page.viewportSize();expect(box).toBeTruthy();
 expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
 expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
}

test('reactive conversations keep services and optional stories readable at 1024×720',async({page})=>{
 await page.setViewportSize({width:1024,height:720});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await seedCharacters(page);await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();
 await expect(page.locator('#story-caption')).toBeVisible();expect((await state(page)).story.seen).toContain('town-arrival');
 expect(await page.locator('#story-caption').evaluate(e=>getComputedStyle(e).pointerEvents)).toBe('none');
 await page.screenshot({path:'/tmp/v470-story-caption.png'});
 await speak(page,'guide');await expect(page.locator('#story-caption')).toBeHidden();const dialogue=page.locator('#npc-dialogue');
 await expect(dialogue.locator('.npc-spoken')).toContainText('Alaric');
 await expect(dialogue.locator('[data-talk=heal]')).toBeVisible();await expect(dialogue.locator('[data-talk=accept]')).toContainText('herd');
 await expectInsideViewport(dialogue,page);await dialogue.locator('[data-talk=talk]').click();
 await expect(dialogue.locator('[data-talk^="lore:"]')).toHaveCount(3);
 await dialogue.locator('[data-talk^="lore:"]').first().click();await expect(dialogue.locator('.npc-spoken')).not.toBeEmpty();
 await expectInsideViewport(dialogue,page);await expect(dialogue.locator('[data-talk=leave]')).toBeVisible();
 await page.screenshot({path:'/tmp/v470-npc-story.png'});
 await dialogue.locator('[data-talk=topics]').click();await expect(dialogue.locator('[data-talk=heal]')).toBeVisible();
 await dialogue.locator('[data-talk=journal]').click();await expect(page.locator('.quest-seal')).toHaveCount(6);
 await page.locator('[data-quest="4"]').click();await expect(page.locator('.quest-selected-title')).toHaveText('An unopened chapter');
 await expect(page.locator('.quest-parchment')).not.toContainText(/Aldren|Edrin|Thorn Choir/);
 await page.locator('[data-story-book=accounts]').click();await expect(page.locator('.quest-selected-title')).toHaveText('No accounts recorded');
 await expectInsideViewport(page.locator('#modal'),page);expect((await state(page)).story.records).toEqual([]);expect(errors).toEqual([]);
});

test('field accounts are discovered by clicking, survive reload, and belong to the selected character',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await seedCharacters(page,{expedition:true});
 page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);
 await expect.poll(()=>state(page).then(s=>s.loading)).toBe(false);
 // Account reading does not pause a hostile area. Isolate this persistence test
 // using the same practice option available to a player, rather than killing AI.
 await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();
 await page.locator('[data-test-option=god]').check();await page.keyboard.press('Escape');
 let s=await state(page);expect(s.tileset).toBe('marchgate');expect(s.story.records).toEqual([]);
 const marker=s.storyMarkers.find(record=>record.id==='marchgate-roll');expect(marker).toBeTruthy();
 const dungeon=generateStronghold(s.areaSeed,1,0);const walked=await followPath(page,dungeon,marker);expect(walked.i).toBe(walked.length);
 await page.waitForTimeout(300);s=await state(page);const current=s.storyMarkers.find(record=>record.id===marker.id);
 await page.mouse.click(current.screen.x,current.screen.y-35);
 const reading=page.locator('#npc-dialogue.story-reading');await expect(reading).toBeVisible();
 await expect(reading).toContainText('The duty roll');await expect(reading.locator('button')).toHaveCount(0);
 await expect.poll(()=>state(page).then(s=>s.story.records)).toEqual(['marchgate-roll']);
 await page.keyboard.press('Escape');await page.keyboard.press('j');await page.locator('[data-story-book=accounts]').click();
 await expect(page.locator('.quest-selected-title')).toHaveText('The duty roll');await expect(page.locator('.story-record-text')).toContainText('Signed Vaelor');
 expect(await page.locator('.story-record-text').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(13);
 await page.screenshot({path:'/tmp/v470-account-book.png'});
 await expect(page.locator('[data-story-account-page]').first()).toBeDisabled();await expect(page.locator('[data-story-account-page]').last()).toBeDisabled();
 const recorded=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).characters.find(c=>c.id==='witness').save.player.story,CHARACTER_SAVE_KEY);
 expect(recorded.records).toEqual(['marchgate-roll']);expect(new Set(recorded.seen).size).toBe(recorded.seen.length);
 await page.reload();await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();
 expect((await state(page)).story.records).toEqual(['marchgate-roll']);
 await page.keyboard.press('j');await page.locator('[data-story-book=accounts]').click();await expect(page.locator('.quest-selected-title')).toHaveText('The duty roll');
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.locator('[data-action=main-menu]').click();
 await page.locator('[data-front=continue]').click();await page.locator('[data-character-id=unwritten]').click();await page.locator('[data-front=play]').click();
 await expect(page.locator('#area-loading')).toBeHidden();s=await state(page);expect(s.characterName).toBe('Unwritten Oath');expect(s.story.records).toEqual([]);
 await page.keyboard.press('j');await page.locator('[data-story-book=accounts]').click();await expect(page.locator('.quest-selected-title')).toHaveText('No accounts recorded');expect(errors).toEqual([]);
});

test('story captions can be switched off independently and the option survives reload',async({page})=>{
 await seedCharacters(page);await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();
 await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();
 const captions=page.locator('[data-option=storyCaptions]');await expect(captions).toBeChecked();await captions.uncheck();
 expect((await state(page)).settings.storyCaptions).toBe(false);
 await page.reload();await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();expect((await state(page)).settings.storyCaptions).toBe(false);
 await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();await expect(page.locator('[data-option=storyCaptions]')).not.toBeChecked();
});
