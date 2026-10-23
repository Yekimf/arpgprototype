import {continueJourney} from './helpers.js';
import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
import {createCampaign,generateWilderness} from '../../src/campaign.js';
import {followPath,speak} from './helpers.js';
const snapshot=page=>page.evaluate(()=>window.__reliquary.snapshot());
test('road signs open text-only readings, discovered paths are visible and a larger flock stays in its pen',async({page})=>{
 test.setTimeout(150000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const p=createPlayer();p.campaign=createCampaign();p.hp=10000;p.equipment.shield={...p.equipment.shield,armor:10000,life:10000,speed:6};p.quests.herdKills=Array.from({length:6},(_,i)=>'herd-'+i);
 await page.addInitScript(save=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save)),{version:1,player:p,zone:'town',seed:42710,depth:1});await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();
 let s=await snapshot(page);const d=generateWilderness(s.areaSeed,1,p);expect(s.grassClumps).toBeGreaterThan(5000);expect(s.livestock).toHaveLength(22);
 const sign=d.signs[0];let route=await followPath(page,d,d.townExit);expect(route.i).toBe(route.length);await page.waitForTimeout(350);let at=await page.evaluate(({x,y})=>window.__reliquary.project(x,y),sign);await page.mouse.click(at.x,at.y-50);
 await expect(page.locator('#npc-dialogue')).toBeVisible();await expect(page.locator('#npc-dialogue')).toHaveText(sign.text);await expect(page.locator('#npc-dialogue button')).toHaveCount(0);expect((await snapshot(page)).dialogue).toBe('sign:'+sign.id);await page.screenshot({path:'test-results/forest-sign-reading.png'});
 await page.keyboard.press('Escape');await expect(page.locator('#npc-dialogue')).toBeHidden();
 // A real NPC conversation after reading a sign must restore its service buttons.
 await speak(page,'guide');await expect(page.locator('[data-talk=heal]')).toBeVisible();await page.keyboard.press('Escape');
 route=await followPath(page,d,d.signs[1]);expect(route.i).toBe(route.length);await page.keyboard.press('Tab');await page.waitForTimeout(250);await page.screenshot({path:'test-results/forest-path-automap.png'});
 const roadPixels=await page.locator('#map-overlay').evaluate(canvas=>{const c=canvas.getContext('2d'),data=c.getImageData(0,0,canvas.width,canvas.height).data;let count=0;for(let i=0;i<data.length;i+=4)if(data[i]>130&&data[i]>data[i+1]&&data[i+1]>data[i+2]&&data[i+3]>45&&data[i+3]<180)count++;return count;});expect(roadPixels).toBeGreaterThan(250);await page.keyboard.press('Tab');
 route=await followPath(page,d,d.herd);expect(route.i).toBe(route.length);const before=(await snapshot(page)).livestock;await page.waitForTimeout(2500);s=await snapshot(page);expect(s.livestock.some((a,i)=>Math.hypot(a.x-before[i].x,a.y-before[i].y)>.15)).toBe(true);const b=s.pasture;expect(s.livestock.every(a=>a.x>b.x1+1&&a.x<b.x2-1&&a.y>b.y1+1&&a.y<b.y2-1)).toBe(true);route=await followPath(page,d,{x:d.herd.x+3,y:d.herd.y+3});expect(route.i).toBe(route.length);await page.screenshot({path:'test-results/forest-painted-flock.png'});expect(errors).toEqual([]);
});
