import {test,expect} from '@playwright/test';

test('slow startup shows the gothic title and hides the HUD until the menu is ready',async({page})=>{
 let release;const held=new Promise(resolve=>release=resolve);
 await page.route(/\/assets\/index-.*\.js$/,async route=>{await held;await route.continue();});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'commit'});
 try{
  await expect(page.locator('#boot-screen')).toBeVisible();
  await expect(page.locator('.boot-title')).toContainText('FORGOTTEN');
  await expect(page.locator('.bottom-hud')).toBeHidden();
  await expect(page.locator('#app')).toHaveAttribute('inert','');
  await page.screenshot({path:'/tmp/v471-gothic-loading.png'});
 }finally{release();}
 await expect(page.locator('#boot-screen')).toHaveCount(0,{timeout:30000});
 await expect(page.locator('#front-end.title-screen')).toBeVisible();
 await expect(page.locator('[data-front=create]')).toBeVisible();
 await expect(page.locator('#app')).not.toHaveAttribute('inert','');
 expect(errors).toEqual([]);
});

for(const extension of ['js','css'])test(`a failed ${extension} download keeps the HUD covered and offers retry`,async({page})=>{
 const asset=new RegExp('/assets/index-.*\\.'+extension+'$');
 await page.route(asset,route=>route.abort());
 await page.goto('/');await expect(page.locator('#boot-status')).toHaveText('The kingdom could not be opened');
 await expect(page.locator('.boot-retry')).toBeVisible();await expect(page.locator('.bottom-hud')).toBeHidden();
 await page.unroute(asset);await page.locator('.boot-retry').click();
 await expect(page.locator('#boot-screen')).toHaveCount(0,{timeout:30000});await expect(page.locator('#front-end.title-screen')).toBeVisible();
});
