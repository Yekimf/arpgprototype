import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';

test('standalone game works without a server, network, or storage access',async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({offline:true,viewport:{width:1280,height:800}});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
    // An isolated document also exercises the fallback when localStorage is denied.
    // The managed cloud Chromium blocks file: navigation by browser policy.
    await page.setContent(await readFile(new URL('../dist/ashen-reliquary.html',import.meta.url),'utf8'));
    await page.waitForFunction(()=>window.__reliquary?.snapshot().artLoaded);
    const snapshot=()=>page.evaluate(()=>window.__reliquary.snapshot());
    const before=await snapshot();
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');
    const after=await snapshot();
    assert.ok(Math.hypot(before.position.x-after.position.x,before.position.y-after.position.y)>.2);
    assert.equal((await snapshot()).zone,'town');
    await page.keyboard.press('f');await page.locator('[data-town-action="accept-quest"]').click();
    assert.ok((await snapshot()).quests.guideMet);
    await page.keyboard.press('k');await page.locator('[data-learn="vigor"]').click();
    assert.equal((await snapshot()).points,3);
    await page.locator('[data-action="close"]').last().click();
    await page.locator('#journey-button').click();await page.locator('[data-town-action="depart"]').click();
    assert.equal((await snapshot()).zone,'dungeon');
    await page.keyboard.press('e');assert.ok((await snapshot()).cooldowns.nova>0);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  }finally{await browser.close();}
});
