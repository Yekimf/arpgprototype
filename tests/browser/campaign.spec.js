import {speak,closeConversationOrPanel} from './helpers.js';
import {test,expect} from '@playwright/test';
import {createPlayer,xpNeeded,findPath} from '../../src/game.js';
import {createCampaign,generateWilderness,generateStronghold,PROLOGUE} from '../../src/campaign.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function fixture(page,{zone='town',act=1,level=1,nearLevel=false,veteran=false,chapter=0}={}){
 const p=createPlayer({name:'Galen'});p.level=level;p.campaign=createCampaign();p.campaign.act=act;if(chapter===3){for(let a=1;a<=5;a++){p.campaign.chapters[a]=3;for(let ch=0;ch<4;ch++)p.campaign.records.push(`field-${a}-${ch}`);}}p.campaign.guidance=[1,2,3,4,5];p.equipment.weapon.damage=chapter===3?20000:2000;p.equipment.armor.armor=10000;p.equipment.armor.life=10000;p.hp=99999;
 if(nearLevel)p.xp=xpNeeded(level)-10;
 if(veteran){p.equipment.boots={id:'journey-boots',name:'Test outrider greaves',slot:'boots',rarity:'rare',speed:5,level:1};p.skills={nova:1};p.slots=[null,null,'nova',null];p.equipment.charm={id:'test-spirit',name:'Test spirit reservoir',slot:'charm',rarity:'rare',spirit:1000};p.mana=1000;}
 await page.addInitScript(save=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save)),{version:1,player:p,zone,act,chapter,seed:42710,depth:act});await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();await expect.poll(()=>state(page).then(s=>s.artLoaded)).toBe(true);
}
async function navigate(page,dungeon,target=dungeon.portal){
 await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);
 const from=(await state(page)).position,path=findPath(dungeon,from,target);
 return page.evaluate(async path=>{
  const press=(key,down)=>document.body.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));let active=[];
  const set=next=>{for(const k of active)if(!next.includes(k))press(k,false);for(const k of next)if(!active.includes(k))press(k,true);active=next;};
  let i=0,last=0;const began=performance.now();
  while(i<path.length&&performance.now()-began<30000){await new Promise(requestAnimationFrame);const s=window.__reliquary.snapshot(),t=path[i],dx=t.x-s.position.x,dy=t.y-s.position.y;if(Math.hypot(dx,dy)<.19){i++;continue;}if(s.paused){set([]);break;}if(Math.abs(dx)>Math.abs(dy))set(dx>0?['ArrowDown','ArrowRight']:['ArrowUp','ArrowLeft']);else set(dy>0?['ArrowDown','ArrowLeft']:['ArrowUp','ArrowRight']);if(performance.now()-last>900){press('e',true);press('e',false);last=performance.now();}}
  set([]);return {i,length:path.length};
 },path);
}

test('new character creation presents the complete prologue and starts with only a strike',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));expect(await page.evaluate(()=>localStorage.getItem('ashen-reliquary-save-v1'))).toBeNull();await expect(page.locator('.title-copy h1')).toContainText('ASHEN');await page.locator('[data-front="create"]').click();await page.locator('#character-name').fill('Ser Rowan');await page.locator('input[name="origin"][value="templar"]').check();await page.locator('input[name="appearance"][value="iron"]').check();await page.locator('#creation-form button[type="submit"]').click();
 for(let i=0;i<PROLOGUE.length;i++){await expect(page.locator('.cinematic-subtitles h2')).toHaveText(PROLOGUE[i].title);await expect(page.locator('.sketch-page')).toHaveAttribute('data-scene',String(i));await expect.poll(()=>page.locator('.sketch-page').evaluate(c=>c.width/c.height)).toBeGreaterThan(1.7);const canvasBounds=await page.locator('.sketch-page').evaluate(c=>{const r=c.getBoundingClientRect();return{covers:r.left<=1&&r.top<=1&&r.right>=innerWidth-1&&r.bottom>=innerHeight-1};});expect(canvasBounds.covers).toBe(true);await expect(page.locator('.cinematic-subtitles p')).toContainText(PROLOGUE[i].text.split('.')[0]);if(i===0){await page.locator('[data-front="hold"]').click();await expect(page.locator('#front-end')).toHaveClass(/scene-paused/);await page.locator('[data-front="hold"]').click();}await page.locator('[data-front="next"]').click();}
 await expect(page.locator('#front-end')).toBeHidden();let s=await state(page);expect(s.zone).toBe('town');expect(s.level).toBe(1);expect(s.points).toBe(0);expect(s.skills).toEqual({});expect(s.slots).toEqual([null,null,null,null]);expect(s.mouseSkill).toBe('basic');expect(s.campaign.act).toBe(1);
 await page.locator('[data-panel="skills"]').click();await expect(page.locator('[data-learn="cleave"]')).toBeDisabled();await page.locator('[data-action="close"]').last().click();await page.locator('[data-panel="inventory"]').click();await page.screenshot({path:`/tmp/arpg-v05/${info.project.name}-final-inventory.png`});await page.locator('[data-action="close"]').last().click();
 await page.reload();await expect(page.locator('[data-front="continue"]')).toContainText('Ser Rowan');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();s=await state(page);expect(s.attributes.will).toBe(3);expect(errors).toEqual([]);
});
test('a real kill earns a level, a first learned skill, and allocatable attributes',async({page},info)=>{
 await fixture(page,{zone:'dungeon',nearLevel:true});const before=await state(page);let cdp;
 if(info.project.name==='desktop'){const target=before.visibleEnemies.sort((a,b)=>Math.hypot(a.x-before.position.x,a.y-before.position.y)-Math.hypot(b.x-before.position.x,b.y-before.position.y))[0];await page.mouse.click(target.screen.x,target.screen.y);}else{await page.waitForTimeout(2500);const box=await page.locator('#touch-attack').boundingBox();cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});}
 await expect.poll(()=>state(page).then(s=>s.level),{timeout:10000}).toBeGreaterThan(1);if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const levelled=await state(page);expect(levelled.points).toBeGreaterThanOrEqual(2);expect(levelled.attributePoints).toBeGreaterThanOrEqual(5);
 await page.locator('[data-panel="skills"]').click();await page.locator('[data-learn="cleave"]').click();expect((await state(page)).slots[0]).toBe('cleave');expect((await state(page)).mouseSkill).toBe('cleave');await page.locator('[data-action="close"]').last().click();
 await page.locator('[data-panel="character"]').click();await page.locator('[data-attribute="vitality"]').click();expect((await state(page)).attributes.vitality).toBe(before.attributes.vitality+1);await page.locator('[data-action="close"]').last().click();
});
test('town leads to wilderness, discovered waypoints travel, and the automap is an overlay',async({page},info)=>{
 await fixture(page);const before=await state(page);await speak(page,'guide');const atGuide=(await state(page)).position;await page.locator('[data-talk="accept"]').click();expect((await state(page)).areaSeed).toBe(before.areaSeed);expect((await state(page)).position).toEqual(atGuide);await closeConversationOrPanel(page);
 const d=generateWilderness(42710+107,1);expect((await navigate(page,d,d.waypoint)).i).toBeGreaterThan(0);expect((await state(page)).zone).toBe('wilderness');expect((await state(page)).areaSeed).toBe(before.areaSeed);
 await expect.poll(()=>state(page).then(s=>s.campaign.waypoints.includes('act-1-wilderness')),{timeout:12000}).toBe(true);
 if((await state(page)).panel!=='worldmap')await page.locator('[data-panel="worldmap"]').click();await expect(page.locator('[data-waypoint="act-1-stronghold"]')).toBeDisabled();await expect(page.locator('[data-map-act="2"]')).toBeDisabled();await page.locator('[data-waypoint="emberfall"]').click();await expect.poll(()=>state(page).then(s=>s.zone)).toBe('town');
 await page.locator('[data-panel="worldmap"]').click();await page.locator('[data-waypoint="act-1-wilderness"]').click();expect((await state(page)).zone).toBe('wilderness');
 await page.keyboard.press('Tab');await expect(page.locator('#map-overlay')).toBeVisible();expect((await state(page)).paused).toBe(false);await page.keyboard.press('Tab');await expect(page.locator('#map-overlay')).toBeHidden();
});
test('five acts release the knights and end with the king and Wanderer',async({page},info)=>{
 test.skip(info.project.name==='mobile','Full campaign routing is covered on desktop; mobile creation, combat and waypoint input run separately.');test.setTimeout(240000);
 await fixture(page,{zone:'wilderness',level:50,veteran:true,chapter:3});
 for(let act=1;act<=5;act++){
  expect((await state(page)).act).toBe(act);const wild=generateWilderness(42710+act*107+3*7919,act,undefined,3),walk=await navigate(page,wild);expect(walk.i,JSON.stringify({act,walk})).toBe(walk.length);await page.keyboard.press('f');await expect.poll(()=>state(page).then(s=>s.zone)).toBe('dungeon');
  const keep=generateStronghold(42710+act*211+3*7919,act,3),route=await navigate(page,keep);expect(route.i,JSON.stringify({act,route})).toBe(route.length);
  for(let phase=0;phase<(act===5?3:1);phase++){
   await expect.poll(async()=>{const s=await state(page);if((s.cooldowns.nova||0)<=0&&!s.paused)await page.keyboard.press('e');return s.campaign.defeated.includes(act===5?['knight-5','king','wanderer'][phase]:`knight-${act}`);},{timeout:12000}).toBe(true);await page.waitForTimeout(1600);
  }
  if(act<5){await page.keyboard.press('f');await expect(page.locator('[data-campaign-action="advance"]')).toBeVisible();await page.locator('[data-campaign-action="advance"]').click();}
 }
 await expect.poll(()=>state(page).then(s=>s.campaign.completed)).toBe(true);await expect(page.locator('#modal-title')).toHaveText('A dawn for Aureth',{timeout:4000});expect((await state(page)).campaign.defeated).toHaveLength(7);
});
