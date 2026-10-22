import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign} from '../../src/campaign.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
test('parchment illustrations fade in, pause cleanly, and keep captions out of a narrative panel',async({page})=>{
 await page.goto('/');await page.locator('[data-front="story"]').click();const drawing=page.locator('.sketch-page');await expect.poll(()=>drawing.getAttribute('data-reveal').then(Number)).toBeGreaterThan(2);
 await page.locator('[data-front="hold"]').click();const held=await drawing.getAttribute('data-reveal');await page.waitForTimeout(250);expect(await drawing.getAttribute('data-reveal')).toBe(held);
 const style=await page.locator('.cinematic-subtitles').evaluate(e=>({background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderTopWidth}));expect(style).toEqual({background:'rgba(0, 0, 0, 0)',border:'0px'});
 await page.locator('[data-front="captions"]').click();await expect(page.locator('.cinematic-subtitles')).toBeHidden();await page.locator('[data-front="hold"]').click();await expect.poll(()=>drawing.getAttribute('data-reveal').then(Number)).toBeGreaterThan(Number(held));
 for(let scene=0;scene<6;scene++){
  const canvas=page.locator('.sketch-page');await expect(canvas).toHaveAttribute('data-scene',String(scene));await expect.poll(()=>canvas.getAttribute('data-reveal').then(Number)).toBeGreaterThan(90);
  expect(await canvas.evaluate(c=>{const r=c.getBoundingClientRect(),s=getComputedStyle(c),p=c.getContext('2d').getImageData(Math.floor(c.width*.5),Math.floor(c.height*.1),1,1).data;return r.left===0&&r.top===0&&r.width>=innerWidth&&r.height>=innerHeight&&s.objectFit==='cover'&&p[0]>p[1]&&p[1]>p[2];})).toBe(true);
  if(scene===0||scene===5)await page.screenshot({path:`test-results/parchment-scene-${scene}.png`});
  if(scene<5)await page.locator('[data-front="next"]').click();
 }
await page.locator('[data-front="skip"]').click();await expect(page.locator('.title-copy')).toBeVisible();
});
test('eight-frame walking preserves its heading at rest and common gear needs no identification',async({page})=>{
 const p=createPlayer();p.campaign=createCampaign();p.inventory=[{id:'plain',name:'Plain Falchion',slot:'weapon',rarity:'normal',damage:12,identified:false}];
 await page.addInitScript(save=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save)),{version:1,player:p,zone:'town',depth:1,seed:42710});await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();
 const frames=new Set();await page.keyboard.down('ArrowLeft');for(let i=0;i<14;i++){await page.waitForTimeout(45);const s=await state(page);if(s.moving)frames.add(s.animation.column);}await page.keyboard.up('ArrowLeft');expect(frames.size).toBeGreaterThan(4);await page.waitForTimeout(80);const idle=await state(page);expect(idle.animation.action).toBe('idle');const row=idle.animation.row;await page.mouse.move(20,70);await page.waitForTimeout(100);expect((await state(page)).animation.row).toBe(row);
 await page.keyboard.press('i');await expect(page.locator('.inventory-sheet')).toHaveCSS('transform','none');await page.locator('[data-pack-id="plain"]').click();await expect(page.locator('[data-town-action="identify"]')).toHaveCount(0);await page.locator('[data-pack-id="plain"]').click({button:'right'});await expect(page.locator('[data-equip-slot="weapon"]')).toHaveAttribute('aria-label',/Plain Falchion/);
});
