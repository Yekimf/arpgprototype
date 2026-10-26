import {test,expect} from '@playwright/test';
import {createEquippedPlayer} from '../fixtures.js';
import {generateStock} from '../../src/settlement.js';
test('trade uses stacked spatial offers alongside a separate inventory at desktop sizes',async({page})=>{
 const p=createEquippedPlayer();p.gold=4500;p.inventory=generateStock(8,431).slice(0,9);
 await page.goto('/');await expect(page.locator('[data-front=create]')).toBeVisible();await expect(page.locator('#boot-screen')).toHaveCount(0);
 await page.evaluate(async p=>{
 const {LanClient}=await import('/src/lan-client.js');
 const ui=Object.create(LanClient.prototype),t={id:'trade-layout',revision:1,players:['self','other'],ready:['self','other'],names:{self:'Alden the Loyalist',other:'Bran the Wanderer'},confirmed:['other'],offers:{self:{items:p.inventory.slice(0,2),gold:125},other:{items:p.inventory.slice(3,6),gold:500}}};
 Object.assign(ui,{id:'self',game:{player:p},latest:{players:[],trade:t},root:document.querySelector('#lan-panel')});ui.root.classList.remove('hidden');ui.paintSocial();window.__tradeLayoutFixture=ui;
 },p);
 for(const [width,height]of [[1024,720],[1280,720],[1920,1080]]){
 await page.setViewportSize({width,height});await expect(page.locator('.trade-grid')).toHaveCount(3);
 expect(await page.locator('.trade-sheet').evaluateAll(nodes=>nodes.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollHeight<=e.clientHeight+2;}))).toBe(true);
 expect(await page.locator('.trade-grid-item').evaluateAll(nodes=>nodes.every(e=>{const p=e.parentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+1&&r.top>=p.top&&r.bottom<=p.bottom+1;}))).toBe(true);
 await expect(page.locator('[data-trade-seal=theirs]')).toHaveAttribute('aria-label','Offer confirmed');
 await page.screenshot({path:`/tmp/trade-layout-${width}.png`});
 }
 const item=page.locator('[data-trade-item]').first();await item.hover();await expect(page.locator('.trade-item-tip')).toBeVisible();
 await page.evaluate(()=>window.__tradeLayoutFixture.toggleTradeItem(window.__tradeLayoutFixture.player.inventory[0].id));
 await expect(page.locator('[data-lan=trade-confirm]')).toBeDisabled();await expect(page.locator('.trade-mine .trade-grid-item')).toHaveCount(1);
});
