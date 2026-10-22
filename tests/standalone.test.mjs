import {generateWilderness} from '../src/campaign.js';
import {findPath} from '../src/game.js';
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
  await page.setContent(await readFile(new URL('../dist/forgotten-kingdom.html',import.meta.url),'utf8'));await page.waitForFunction(()=>window.__reliquary?.snapshot().artLoaded);
  await page.waitForFunction(()=>document.querySelector('.kingdom-title')?.textContent.includes('FORGOTTEN'));
  assert.match(await page.locator('.title-art').evaluate(e=>getComputedStyle(e).backgroundImage),/blob:/);
  const snapshot=()=>page.evaluate(()=>window.__reliquary.snapshot());assert.equal((await snapshot()).frontScreen,true);
  await page.locator('[data-front="create"]').click();await page.locator('#character-name').fill('Offline Loyalist');await page.locator('#creation-form button[type="submit"]').click();assert.match(await page.locator('.sketch-page').getAttribute('aria-label'),/A kingdom worth defending/);assert.equal(await page.locator('#front-end button').count(),0);await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);
  await page.keyboard.press('Control+Escape');await page.waitForFunction(()=>!window.__reliquary.snapshot().cursor.captured);const before=await snapshot();assert.equal(before.zone,'town');assert.deepEqual(before.skills,{});assert.equal(before.points,0);
  await page.keyboard.down('ArrowRight');await page.waitForFunction(start=>{const p=window.__reliquary.snapshot().position;return Math.hypot(start.x-p.x,start.y-p.y)>.25;},before.position,{timeout:5000});await page.keyboard.up('ArrowRight');const after=await snapshot();assert.ok(Math.hypot(before.position.x-after.position.x,before.position.y-after.position.y)>.2);
  const guide=(await snapshot()).npcs.find(n=>n.id==='guide');await page.mouse.click(guide.x,guide.y-35);await page.waitForFunction(()=>window.__reliquary.snapshot().dialogue==='guide');await page.locator('[data-talk="accept"]').click();assert.ok((await snapshot()).quests.guideMet);await page.locator('[data-talk="leave"]').click();
  await page.keyboard.press('i');await page.locator('[data-pack-id="maelin-talisman"]').hover();assert.equal(await page.locator('#item-tooltip').isVisible(),true);assert.equal(await page.locator('#modal').evaluate(e=>e.scrollHeight<=e.clientHeight+1),true);await page.keyboard.press('i');
  await page.keyboard.press('g');assert.equal(await page.locator('[data-map-act="2"]').isDisabled(),true);await page.locator('[data-action="close"]').last().click();
  const current=await snapshot(),field=generateWilderness(current.seed+107,1),path=findPath(field,current.position,{x:field.townExit.x+7,y:field.townExit.y},{smooth:false});
  const arrived=await page.evaluate(async path=>{const press=(key,down)=>document.body.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));let active=[],i=0;const start=performance.now();while(i<path.length&&performance.now()-start<20000){await new Promise(requestAnimationFrame);const s=window.__reliquary.snapshot(),dx=path[i].x-s.position.x,dy=path[i].y-s.position.y;if(Math.hypot(dx,dy)<.2){i++;continue;}const next=Math.abs(dx)>Math.abs(dy)?dx>0?['ArrowDown','ArrowRight']:['ArrowUp','ArrowLeft']:dy>0?['ArrowDown','ArrowLeft']:['ArrowUp','ArrowRight'];for(const k of active)if(!next.includes(k))press(k,false);for(const k of next)if(!active.includes(k))press(k,true);active=next;}for(const k of active)press(k,false);return i===path.length;},path);assert.ok(arrived);assert.equal((await snapshot()).zone,'wilderness');assert.equal((await snapshot()).areaSeed,current.areaSeed);
  await page.waitForTimeout(700);if((await snapshot()).panel)await page.locator('[data-action="close"]').last().click();
  await page.keyboard.down('Shift');await page.mouse.click(700,430);await page.keyboard.up('Shift');assert.ok((await snapshot()).attackAnim>0);
  await page.keyboard.press('Tab');assert.equal(await page.locator('#map-overlay').isVisible(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 }finally{await browser.close();}
});
