import {continueJourney} from './helpers.js';
import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign} from '../../src/campaign.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
test('cinematics use black letterboxing, plain subtitles and automatic scene changes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto('/');await page.locator('[data-front="story"]').click();
 for(let scene=0;scene<6;scene++){
  const canvas=page.locator('.sketch-page');await expect(canvas).toHaveAttribute('data-scene',String(scene));await expect(canvas).toHaveAttribute('data-ready','true');await page.clock.runFor(1100);await expect(canvas).toHaveAttribute('data-reveal','100');
  await expect(page.locator('#front-end button,.cinematic-top,.cinematic-controls,.cinematic-progress,.scene-dots,.cinematic-subtitles h2')).toHaveCount(0);
  for(const [width,height]of scene===0?[[1200,720],[1920,1080],[1024,768],[1366,600]]:[[1440,1000]]){
   await page.setViewportSize({width,height});const dims=await page.locator('.cinematic-frame').evaluate(frame=>{const r=frame.getBoundingClientRect(),root=frame.parentElement,caption=frame.querySelector('.cinematic-subtitles').getBoundingClientRect();return{black:getComputedStyle(root).backgroundColor,ratio:r.width/r.height,top:r.top,bottom:r.bottom,captionTop:caption.top,captionBottom:caption.bottom,cursor:getComputedStyle(root).cursor};});
   expect(dims.black).toBe('rgb(0, 0, 0)');expect(dims.ratio).toBeCloseTo(2.35,2);expect(dims.top).toBeGreaterThan(20);expect(dims.bottom).toBeLessThan(height);expect(dims.captionTop).toBeGreaterThan(dims.bottom);expect(dims.captionBottom).toBeLessThan(height);expect(dims.cursor).toBe('none');
   if(scene===0)await page.screenshot({path:`test-results/cinema-${width}-${height}.png`});
  }
  if(scene===0){await page.keyboard.press('Space');await page.keyboard.press('ArrowRight');await page.mouse.click(700,400);await expect(canvas).toHaveAttribute('data-scene','0');}
  if(scene===5)await page.screenshot({path:'test-results/cinema-final.png'});
  const duration=await page.locator('#front-end').evaluate(e=>parseFloat(e.style.getPropertyValue('--scene-duration')));await page.clock.fastForward(duration+30);
 }
 await expect(page.locator('.title-copy')).toBeVisible();expect(errors).toEqual([]);
});
test('Escape skips a replay to the menu and skips a new-character prologue into town',async({page})=>{
 await page.goto('/');await page.locator('[data-front="story"]').click();await page.keyboard.press('Escape');await expect(page.locator('.title-copy')).toBeVisible();
 await page.locator('[data-front="create"]').click();await page.locator('#creation-form button').click();await expect(page.locator('.cinematic-screen')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#front-end')).toBeHidden();await expect(page.locator('#area-loading')).toBeHidden();expect((await state(page)).zone).toBe('town');expect((await state(page)).panel).toBeNull();
});
test('eight-frame walking preserves its heading at rest and common gear needs no identification',async({page})=>{
 const p=createPlayer();p.campaign=createCampaign();p.inventory=[{id:'plain',name:'Plain Falchion',slot:'weapon',rarity:'normal',damage:12,identified:false}];
 await page.addInitScript(save=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save)),{version:1,player:p,zone:'town',depth:1,seed:42710});await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();
 const frames=new Set();await page.keyboard.down('ArrowLeft');for(let i=0;i<14;i++){await page.waitForTimeout(45);const s=await state(page);if(s.moving)frames.add(s.animation.column);}await page.keyboard.up('ArrowLeft');expect(frames.size).toBeGreaterThan(4);await page.waitForTimeout(80);const idle=await state(page);expect(idle.animation.action).toBe('idle');const row=idle.animation.row;await page.mouse.move(20,70);await page.waitForTimeout(100);expect((await state(page)).animation.row).toBe(row);
 await page.keyboard.press('i');await expect(page.locator('.inventory-sheet')).toHaveCSS('transform','none');await page.locator('[data-pack-id="plain"]').click();await expect(page.locator('[data-town-action="identify"]')).toHaveCount(0);await page.locator('[data-pack-id="plain"]').click({button:'right'});await expect(page.locator('[data-equip-slot="weapon"]')).toHaveAttribute('aria-label',/Plain Falchion/);
});
