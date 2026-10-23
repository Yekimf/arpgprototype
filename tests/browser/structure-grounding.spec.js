import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign} from '../../src/campaign.js';
test('town structures cache contact shadows and the compact chest opens by clicking',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const p=createPlayer();p.campaign=createCampaign();
 await page.addInitScript(p=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1})),p);
 await page.goto('/');await page.locator('[data-front=continue]').click();await expect(page.locator('#area-loading')).toBeHidden();
 await page.waitForFunction(()=>window.__reliquary.snapshot().artLoaded&&window.__reliquary.snapshot().structureShadows>0);
 await page.waitForTimeout(500);
 const s=await page.evaluate(()=>window.__reliquary.snapshot()),chest=s.stash[0];expect(chest.width).toBe(64);expect(chest.height).toBe(48);
 await page.screenshot({path:'/tmp/v332-grounded-town.png'});
 await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__reliquary.snapshot().structureShadows)).toBe(s.structureShadows);
 await page.mouse.click(chest.screen.x,chest.screen.y-20);
 await expect.poll(()=>page.evaluate(()=>window.__reliquary.snapshot().panel),{timeout:12000}).toBe('stash');
 await expect(page.locator('[data-bag-grid=stash]')).toBeVisible();expect(errors).toEqual([]);
});
