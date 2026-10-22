import {speak} from './helpers.js';
import {test,expect} from '@playwright/test';
import {createPlayer} from '../../src/game.js';
const snapshot=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function load(page,zone='town'){
  const player=Object.assign(createPlayer(),{level:8,skills:{cleave:1,bolt:1,nova:1,lance:1},slots:['cleave','bolt','nova','lance'],mouseSkill:'bolt'});player.gold=2000;player.shards=12;player.quests={guideMet:true,scholarRescued:true,wardenDefeated:true,guideRewarded:true};
  player.equipment.armor.armor=10000;player.equipment.charm={id:'reservoir',name:'Runic Reservoir',slot:'charm',rarity:'rare',level:2,spirit:1000,life:25};player.mana=1000;
  player.inventory=[{id:'hover-sword',name:'Moonlit Falchion',slot:'weapon',rarity:'rare',level:2,damage:24,life:20,crit:5,identified:true,bagX:8,bagY:2},{id:'hover-ring',name:'Gilded Signet',slot:'ring',rarity:'magic',level:2,spirit:10,identified:true,bagX:9,bagY:5}];
  await page.addInitScript(data=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(data)),{version:1,player,seed:42710,depth:1,zone});
  await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();await expect.poll(()=>snapshot(page).then(s=>s.artLoaded)).toBe(true);
}
async function bounds(page){
  return page.locator('#modal').evaluate(e=>{const r=e.getBoundingClientRect();return {fits:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,noScroll:e.scrollHeight<=e.clientHeight+1,sections:[...e.querySelectorAll('.hud-bag-section')].filter(s=>s.offsetHeight).every(s=>s.scrollHeight<=s.clientHeight+1),actions:e.querySelector('#hud-item-actions').getBoundingClientRect().bottom<=r.bottom};});
}
test('inventory fits the viewport and shows hover comparisons without selection',async({page},info)=>{
  await load(page);
  const sizes=info.project.name==='desktop'?[[1280,720],[1024,768],[1920,1080]]:[[412,839],[360,640]];
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.locator('[data-panel="inventory"]').click();await page.waitForTimeout(150);
    expect(await bounds(page)).toEqual({fits:true,noScroll:true,sections:true,actions:true});
    const item=page.locator('[data-pack-id="hover-sword"]'),beforeClass=await item.getAttribute('class');
    if(info.project.name==='desktop')await item.hover();else await item.tap();
    await expect(page.locator('#item-tooltip')).toBeVisible();await expect(page.locator('#item-detail')).toContainText('+24 Weapon damage');await expect(page.locator('#item-detail')).toContainText('CURRENTLY EQUIPPED');
    expect(await page.locator('#item-tooltip').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})).toBe(true);
    if(info.project.name==='desktop')await expect(item).toHaveAttribute('class',beforeClass);
    await item.click();await expect(page.locator('[data-town-action="equip"]')).toBeInViewport();expect(await bounds(page)).toEqual({fits:true,noScroll:true,sections:true,actions:true});
    await page.locator('[data-action="close"]').click();await expect(page.locator('#modal-backdrop')).toBeHidden();await expect(page.locator('#item-tooltip')).toBeHidden();
  }
});
test('shop and forge keep selected actions and all pack cells onscreen',async({page},info)=>{
  await load(page);await page.setViewportSize(info.project.name==='desktop'?{width:1280,height:720}:{width:360,height:640});
  for(const [npc,title,selector,action] of [['merchant','Orrin’s wares','[data-stock-id]','buy'],['smith','Garran’s forge','[data-smith-equipped="charm"]','reforge']]){
    await speak(page,npc,npc);await expect(page.locator('#modal-title')).toHaveText(title,{timeout:12000});await page.locator(selector).first().click();await expect(page.locator(`[data-town-action="${action}"]`)).toBeInViewport();expect(await bounds(page)).toEqual({fits:true,noScroll:true,sections:true,actions:true});await page.locator('[data-action="close"]').click();
  }
});
test('ground click moves without swinging and walk frames animate',async({page},info)=>{
  await load(page);const before=await snapshot(page),goal=await page.evaluate(p=>window.__reliquary.project(p.x+1.8,p.y+1.8),before.position);
  // Ground below the hero avoids the guide and buildings at the town entrance.
  if(info.project.name==='mobile')await page.touchscreen.tap(goal.x,goal.y);else await page.mouse.click(goal.x,goal.y);
  const frames=new Set();for(let i=0;i<10;i++){await page.waitForTimeout(60);const s=await snapshot(page);expect(s.attackAnim).toBe(0);if(s.animation.action==='walk')frames.add(s.animation.column);}
  const after=await snapshot(page);expect(Math.hypot(after.position.x-before.position.x,after.position.y-before.position.y)).toBeGreaterThan(.8);expect(frames.size).toBeGreaterThan(1);
  const cursor=await page.locator('#world').evaluate(e=>getComputedStyle(e).cursor);expect(cursor).toContain('data:image/svg+xml');expect(cursor).not.toContain('crosshair');
});
test('QWER, right mouse, and forced melee aim at the pointer',async({page},info)=>{
  test.skip(info.project.name==='mobile','Keyboard and mouse bindings are desktop controls.');
  await load(page,'dungeon');
  const s=await snapshot(page),cursor={x:s.heroScreen.x-180,y:s.heroScreen.y+20};await page.mouse.move(cursor.x,cursor.y);
  await page.keyboard.press('r');let cast=await snapshot(page);expect(cast.cooldowns.lance).toBeGreaterThan(0);expect(cast.projectiles[0].kind).toBe('aether');
  const ray={x:cursor.x-s.heroScreen.x,y:cursor.y-s.heroScreen.y},shot=cast.projectiles[0];expect((ray.x*shot.dx+ray.y*shot.dy)/(Math.hypot(ray.x,ray.y)*Math.hypot(shot.dx,shot.dy))).toBeGreaterThan(.999);
  await page.mouse.click(cursor.x,cursor.y,{button:'right'});expect((await snapshot(page)).cooldowns.bolt).toBeGreaterThan(0);
  await page.keyboard.press('q');await page.keyboard.press('e');expect((await snapshot(page)).cooldowns.cleave).toBeGreaterThan(0);expect((await snapshot(page)).cooldowns.nova).toBeGreaterThan(0);
  await page.waitForTimeout(400);await page.keyboard.down('Shift');await page.mouse.click(cursor.x,cursor.y);await page.keyboard.up('Shift');expect((await snapshot(page)).attackAnim).toBeGreaterThan(0);
  await expect.poll(()=>snapshot(page).then(s=>s.animation.action)).toBe('attack');
  await page.locator('#mouse-slot').click();await page.locator('[data-choose-skill="lance"]').click();expect((await snapshot(page)).mouseSkill).toBe('lance');
  await page.locator('[data-slot="0"]').click({button:'right'});await page.locator('[data-choose-skill="nova"]').click();expect((await snapshot(page)).slots[0]).toBe('nova');
  await page.keyboard.press('i');expect((await snapshot(page)).paused).toBe(false);await page.keyboard.press('i');await expect(page.locator('#modal-backdrop')).toBeHidden();
});
test('left clicking an enemy approaches and damages it',async({page},info)=>{
  test.skip(info.project.name==='mobile','Touch uses its dedicated attack button and automatic aim.');
  await load(page,'dungeon');let s=await snapshot(page);
  const target=s.visibleEnemies.filter(e=>Math.hypot(e.x-s.position.x,e.y-s.position.y)<6).sort((a,b)=>Math.hypot(a.x-s.position.x,a.y-s.position.y)-Math.hypot(b.x-s.position.x,b.y-s.position.y))[0];expect(target).toBeTruthy();
  const beforeHealth=s.enemyHealth;await page.mouse.click(target.screen.x,target.screen.y);
  await expect.poll(()=>snapshot(page).then(s=>s.enemyHealth),{timeout:6000}).toBeLessThan(beforeHealth);
  s=await snapshot(page);expect(Math.hypot(s.position.x-target.x,s.position.y-target.y)).toBeLessThan(4);
});
