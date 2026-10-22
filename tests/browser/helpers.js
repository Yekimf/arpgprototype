import {expect} from '@playwright/test';
export async function speak(page,id,service=null){
 // Let the visible playfield finish recentering after closing an equipment panel.
 await page.evaluate(async()=>{let previous=null,stable=0;const start=performance.now();while(performance.now()-start<1800){await new Promise(requestAnimationFrame);const p=window.__reliquary.snapshot().position,at=window.__reliquary.project(p.x,p.y);if(previous&&Math.hypot(at.x-previous.x,at.y-previous.y)<.25)stable++;else stable=0;previous=at;if(stable>=4)break;}});
 let npc=await page.evaluate(id=>window.__reliquary.snapshot().npcs.find(n=>n.id===id),id);expect(npc,`NPC ${id} is present`).toBeTruthy();
 const viewport=page.viewportSize();if(npc.x<12||npc.x>viewport.width-12||npc.y-35<40||npc.y>viewport.height-130){const s=await page.evaluate(()=>window.__reliquary.snapshot());const {generateTown}=await import('../../src/settlement.js');const {generateWilderness}=await import('../../src/campaign.js');const d=s.campaign?generateWilderness(s.areaSeed,s.act,{quests:s.quests}):generateTown({quests:s.quests});const result=await followPath(page,d,{x:npc.worldX,y:npc.worldY});expect(result.i).toBe(result.length);await page.waitForTimeout(250);npc=await page.evaluate(id=>window.__reliquary.snapshot().npcs.find(n=>n.id===id),id);}
 await page.mouse.click(npc.x,npc.y-35);await expect.poll(()=>page.evaluate(()=>window.__reliquary.snapshot().dialogue),{timeout:12000}).toBe(id);
 if(service)await page.locator(`[data-talk="${service}"]`).click();
}
export async function closeConversationOrPanel(page){if(await page.locator('#npc-dialogue').isVisible())await page.locator('[data-talk="leave"]').click();else await page.locator('[data-action="close"]').last().click();}
export async function followPath(page,dungeon,target=dungeon.portal){
 await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);
 const {findPath}=await import('../../src/game.js');const from=await page.evaluate(()=>window.__reliquary.snapshot().position),path=findPath(dungeon,from,target,{smooth:false});expect(path.length).toBeGreaterThan(0);
 return page.evaluate(async path=>{
  const press=(key,down)=>document.body.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));let active=[];
  const set=next=>{for(const k of active)if(!next.includes(k))press(k,false);for(const k of next)if(!active.includes(k))press(k,true);active=next;};
  let i=0,last=0;const began=performance.now();while(i<path.length&&performance.now()-began<45000){await new Promise(requestAnimationFrame);const s=window.__reliquary.snapshot(),t=path[i],dx=t.x-s.position.x,dy=t.y-s.position.y;if(Math.hypot(dx,dy)<.28){i++;continue;}if(s.paused){set([]);break;}if(Math.abs(dx)>Math.abs(dy))set(dx>0?['ArrowDown','ArrowRight']:['ArrowUp','ArrowLeft']);else set(dy>0?['ArrowDown','ArrowLeft']:['ArrowUp','ArrowRight']);if(performance.now()-last>900){press('e',true);press('e',false);last=performance.now();}}set([]);return{i,length:path.length};
 },path);
}

// Combat fixtures leave town through the same departure UI used by players.
export async function continueFixture(page){
 await page.locator('[data-front="continue"]').click();
 await expect(page.locator('#area-loading')).toBeHidden();
 if(page.fixtureZone&&page.fixtureZone!=='town'){
  await page.keyboard.press('t');
  await page.locator('[data-town-action="depart"]').click();
  await expect(page.locator('#area-loading')).toBeHidden();
 }
}
