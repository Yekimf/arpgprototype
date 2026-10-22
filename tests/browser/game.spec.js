import {test,expect} from '@playwright/test';
import {createPlayer,generateDungeon,ALL_SKILLS} from '../../src/game.js';

async function seedGame(page,extra={},zone='dungeon'){
  const player=createPlayer();Object.assign(player,{level:8,points:4,skills:{cleave:1,bolt:1,nova:1,lance:1},slots:['cleave','bolt','nova','lance'],mouseSkill:'bolt'},extra);
  await page.addInitScript(save=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save)),{version:1,player,seed:42710,depth:1,zone});
}
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());

test('movement, abilities, cooldowns, and mastery assignment work',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await seedGame(page);await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();
  await expect(page.locator('#world')).toBeVisible();await expect.poll(()=>state(page).then(s=>s.enemies)).toBeGreaterThan(20);
  const before=await state(page);
  if(info.project.name==='mobile'){
    await expect(page.locator('#touch-controls')).toBeVisible();
    const box=await page.locator('#joystick').boundingBox(),cdp=await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+50,y:box.y+50}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+80,y:box.y+50}]});await page.waitForTimeout(350);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');}
  const moved=await state(page);expect(Math.hypot(moved.position.x-before.position.x,moved.position.y-before.position.y)).toBeGreaterThan(.3);
  await page.locator('[data-slot="2"]').dispatchEvent('pointerdown');
  const cast=await state(page);expect(cast.mana).toBeLessThan(before.mana);expect(cast.cooldowns.nova).toBeGreaterThan(0);
  await page.locator('[data-panel="skills"]').click();await expect(page.locator('#modal-title')).toHaveText('Masteries');
  await page.locator('[data-learn="vigor"]').click();await page.locator('[data-learn="vigor"]').click();
  await expect(page.locator('[data-learn="quake"]')).toBeEnabled();await page.locator('[data-learn="quake"]').click();
  await page.locator('[data-bind="quake"]').selectOption('0');expect((await state(page)).slots[0]).toBe('quake');expect((await state(page)).points).toBe(1);
  await page.locator('[data-action="close"]').last().click();
  await page.locator('#pause').click();const paused=await state(page);await page.waitForTimeout(200);expect((await state(page)).hp).toBe(paused.hp);
  await page.locator('[data-action="close"]').last().click();
  expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/${info.project.name}-game.png`});
});

test('spatial inventory comparison, equipment, stash, and local save persist',async({page})=>{
  const inventory=[{id:'test-weapon',name:'Runic Falchion',slot:'weapon',rarity:'rare',level:2,damage:24,life:20,icon:'⚔'},{id:'test-charm',name:'Ashen Moonstone',slot:'charm',rarity:'magic',level:2,spirit:18,icon:'◈'}];
  await seedGame(page,{inventory},'town');await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();await page.locator('[data-panel="inventory"]').click();
  await page.locator('[data-pack-id="test-weapon"]').click();await expect(page.locator('#item-detail')).toContainText('+24 Weapon damage');
  await page.locator('[data-town-action="equip"]').click();await expect(page.locator('[data-equip-slot="weapon"]')).toHaveAttribute('aria-label',/Runic Falchion/);
  await page.locator('[data-pack-id="test-charm"]').click();await page.locator('[data-town-action="store"]').click();
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('ashen-reliquary-save-v1')));
  expect(persisted.player.equipment.weapon.damage).toBe(24);expect(persisted.player.inventory).toHaveLength(1);expect(persisted.player.stash).toHaveLength(1);
  const restored=await page.context().newPage();await restored.goto('/');await restored.locator('[data-front="continue"]').click();await restored.locator('[data-panel="inventory"]').click();
  await expect(restored.locator('[data-equip-slot="weapon"]')).toHaveAttribute('aria-label',/Runic Falchion/);
  await restored.locator('[data-town-action="stash"]').click();await restored.locator('[data-container="stash"]').click();await restored.locator('[data-town-action="withdraw"]').click();
  expect((await restored.evaluate(()=>JSON.parse(localStorage.getItem('ashen-reliquary-save-v1')))).player.stash).toHaveLength(0);
  await restored.close();
});

test('all advanced abilities execute and death recovery preserves the character',async({page,browser})=>{
  const p=createPlayer();p.equipment.charm={name:'Test reservoir',slot:'charm',rarity:'rare',spirit:1000,icon:'◈'};
  const skills=Object.fromEntries(ALL_SKILLS.map(s=>[s.id,1]));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await seedGame(page,{skills,slots:['quake','meteor','chain'],mana:900,equipment:p.equipment});await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();
  for(let slot=0;slot<3;slot++)await page.locator(`[data-slot="${slot}"]`).dispatchEvent('pointerdown');
  await page.waitForTimeout(1100);
  let s=await state(page);for(const id of ['quake','meteor','chain'])expect(s.cooldowns[id]).toBeGreaterThan(0);
  await page.locator('[data-panel="skills"]').click();await page.locator('[data-bind="whirl"]').selectOption('0');
  await page.locator('[data-mastery="ember"]').click();await page.locator('[data-bind="inferno"]').selectOption('1');
  await page.locator('[data-mastery="aether"]').click();await page.locator('[data-bind="vortex"]').selectOption('2');
  await page.locator('[data-action="close"]').last().click();
  for(let slot=0;slot<3;slot++)await page.locator(`[data-slot="${slot}"]`).dispatchEvent('pointerdown');
  await page.waitForTimeout(500);s=await state(page);for(const id of ['whirl','vortex'])expect(s.cooldowns[id]).toBeGreaterThan(0);expect(s.pyre).not.toBeNull();
  // A second page with a fragile fixture exercises actual enemy damage and recovery.
  const isolated=await browser.newContext({viewport:page.viewportSize(),hasTouch:await page.evaluate(()=>matchMedia('(pointer:coarse)').matches)}),fragile=await isolated.newPage(),f=createPlayer();fragile.on('pageerror',e=>errors.push(e.message));f.hp=1;f.gold=100;
  await seedGame(fragile,f);await fragile.goto('/');await fragile.locator('[data-front="continue"]').click();
  await expect(fragile.locator('#modal-title')).toHaveText('Not yet forgotten.',{timeout:15000});
  await fragile.locator('[data-action="revive"]').click();
  expect((await state(fragile)).hp).toBeGreaterThan(100);
  const recovered=await fragile.evaluate(()=>JSON.parse(localStorage.getItem('ashen-reliquary-save-v1')));
  expect(recovered.player.gold).toBe(90);expect(recovered.player.deaths).toBe(1);expect(errors).toEqual([]);await isolated.close();
});

test('a full expedition can defeat the Warden, earn loot, and descend',async({page},info)=>{
  test.skip(info.project.name==='mobile','Desktop navigation covers floor progression; mobile input is covered separately.');
  // Routing fixture survives physical and elemental damage; combat balance is separate.
  const p=createPlayer();p.equipment.weapon.damage=2000;p.equipment.armor.armor=10000;p.equipment.armor.life=10000;p.hp=20000;
  await seedGame(page,{equipment:p.equipment,hp:p.hp});await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();
  const d=generateDungeon(42710),start=[Math.floor(d.start.x),Math.floor(d.start.y)],end=[Math.floor(d.portal.x),Math.floor(d.portal.y)],queue=[start],parents=new Map([[start.join(','),null]]);
  for(let i=0;i<queue.length;i++){const[x,y]=queue[i];if(x===end[0]&&y===end[1])break;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(d.tiles[ny]?.[nx]&&!parents.has(k)){parents.set(k,[x,y]);queue.push([nx,ny]);}}}
  const path=[];let at=end;while(at){path.push({x:at[0]+.5,y:at[1]+.5});at=parents.get(at.join(','));}path.reverse();
  const result=await page.evaluate(async path=>{
    const press=(key,down)=>document.body.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));let active=[];
    const setKeys=next=>{for(const k of active)if(!next.includes(k))press(k,false);for(const k of next)if(!active.includes(k))press(k,true);active=next;};
    const began=performance.now();let idx=1,lastCast=0;
    while(idx<path.length&&performance.now()-began<45000){
      await new Promise(requestAnimationFrame);const s=window.__reliquary.snapshot(),target=path[idx],dx=target.x-s.position.x,dy=target.y-s.position.y;
      if(Math.hypot(dx,dy)<.17){idx++;continue;}
      if(Math.abs(dx)>Math.abs(dy))setKeys(dx>0?['ArrowDown','ArrowRight']:['ArrowUp','ArrowLeft']);else setKeys(dy>0?['ArrowDown','ArrowLeft']:['ArrowUp','ArrowRight']);
      if(performance.now()-lastCast>1000){press('e',true);press('e',false);lastCast=performance.now();}
    }
    setKeys([]);return {idx,length:path.length,state:window.__reliquary.snapshot()};
  },path);
  expect(result.idx,JSON.stringify(result)).toBe(result.length);
  // Nova can be on cooldown on arrival; wait for it and finish the boss.
  await page.waitForTimeout(6200);await page.keyboard.press('e');
  await expect.poll(()=>state(page).then(s=>s.bossDead)).toBe(true);
  expect((await state(page)).quests.scholarRescued).toBe(true);
  await page.keyboard.press('f');await expect.poll(()=>state(page).then(s=>s.depth)).toBe(2);
  expect((await state(page)).points).toBeGreaterThan(4);
});
