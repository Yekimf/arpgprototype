import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';

test('standalone title, creation, prologue, inventory, maps and combat work offline without storage',async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({offline:true,viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  // The managed browser blocks file: URLs, so use an isolated document. This also
  // verifies the localStorage-denied fallback used by restricted downloaded files.
  await page.setContent(await readFile(new URL('../dist/ashen-reliquary.html',import.meta.url),'utf8'));await page.waitForFunction(()=>window.__reliquary?.snapshot().artLoaded);
  const snapshot=()=>page.evaluate(()=>window.__reliquary.snapshot());assert.equal((await snapshot()).frontScreen,true);
  await page.locator('[data-front="create"]').click();await page.locator('#character-name').fill('Offline Loyalist');await page.locator('#creation-form button[type="submit"]').click();assert.equal(await page.locator('.cinematic-subtitles h2').textContent(),'A kingdom worth defending');await page.locator('[data-front="skip"]').click();
  const before=await snapshot();assert.equal(before.zone,'town');assert.deepEqual(before.skills,{});assert.equal(before.points,0);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');const after=await snapshot();assert.ok(Math.hypot(before.position.x-after.position.x,before.position.y-after.position.y)>.2);
  await page.locator('[data-npc="guide"]').click();await page.locator('[data-town-action="accept-quest"]').click();assert.ok((await snapshot()).quests.guideMet);await page.locator('[data-action="close"]').last().click();
  await page.keyboard.press('i');await page.locator('[data-pack-id="maelin-talisman"]').hover();assert.equal(await page.locator('#item-tooltip').isVisible(),true);assert.equal(await page.locator('#modal').evaluate(e=>e.scrollHeight<=e.clientHeight+1),true);await page.keyboard.press('i');
  await page.keyboard.press('g');assert.equal(await page.locator('[data-map-act="2"]').isDisabled(),true);await page.locator('[data-action="close"]').last().click();
  await page.locator('#journey-button').click();await page.locator('[data-town-action="depart"]').click();assert.equal((await snapshot()).zone,'wilderness');
  await page.waitForTimeout(700);if((await snapshot()).panel)await page.locator('[data-action="close"]').last().click();
  await page.keyboard.down('Shift');await page.mouse.click(700,430);await page.keyboard.up('Shift');assert.ok((await snapshot()).attackAnim>0);
  await page.keyboard.press('Tab');assert.equal(await page.locator('#map-overlay').isVisible(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 }finally{await browser.close();}
});
