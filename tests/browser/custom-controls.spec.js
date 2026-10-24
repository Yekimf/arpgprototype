import {test,expect} from '@playwright/test';
import {createEquippedPlayer} from '../fixtures.js';
import {continueFixture,continueJourney} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
async function load(page,zone='town'){
  const player=createEquippedPlayer();Object.assign(player,{level:12,skills:{cleave:1,bolt:2,nova:2,lance:1},slots:['cleave','bolt','nova','lance'],primarySkill:'basic',mouseSkill:'bolt',hp:10000,mana:5000});
  player.equipment.charm={id:'control-reservoir',name:'Reservoir',slot:'charm',rarity:'normal',life:10000,spirit:5000};
  await page.addInitScript(p=>{if(!localStorage.getItem('ashen-reliquary-save-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},player);
  page.fixtureZone=zone;await page.goto('/');await continueFixture(page);await expect.poll(()=>state(page).then(s=>s.artLoaded)).toBe(true);
}
async function controls(page){await page.keyboard.press('Escape');await page.locator('[data-action="options"]').click();await page.locator('[data-action="controls"]').click();await expect(page.locator('[data-movement-mode]')).toBeVisible();}
async function bind(page,action,key){await page.locator(`[data-bind-action="${action}"]`).click();await page.keyboard.press(key);await expect(page.locator('.binding-status')).toContainText('Binding saved');}
async function resume(page){await page.locator('#modal [data-action="close"]').first().click();await expect(page.locator('#modal-backdrop')).toBeHidden();}

test('WASD option keeps independent bindings, rejects conflicts and fits laptop screens',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page);await controls(page);
  await expect(page.locator('[data-bind-action="skill1"]')).toHaveText('W');await bind(page,'skill0','z');
  await page.locator('[data-movement-mode]').selectOption('wasd');await expect(page.locator('[data-bind-action="skill0"]')).toHaveText('Q');await expect(page.locator('[data-bind-action="skill1"]')).toHaveText('E');await expect(page.locator('[data-bind-action="skill3"]')).toHaveText('F');
  await page.locator('[data-bind-action="skill0"]').click();await page.keyboard.press('w');await expect(page.locator('.binding-status')).toContainText('reserved for movement');
  await page.keyboard.press('e');await expect(page.locator('.binding-status')).toContainText('already assigned');
  await page.keyboard.press('i');await expect(page.locator('.binding-status')).toContainText('reserved');expect((await state(page)).panel).toBe('controls');
  await page.keyboard.press('Escape');await expect(page.locator('[data-bind-action="skill0"]')).toHaveText('Q');
  await bind(page,'skill0','z');await bind(page,'primary','v');await bind(page,'secondary','b');
  for(const [width,height] of [[1440,1000],[1280,720],[1024,720]]){
    await page.setViewportSize({width,height});expect(await page.locator('#modal').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&e.scrollHeight<=e.clientHeight+1;})).toBe(true);
    await expect(page.locator('[data-bind-action="portal"]')).toBeInViewport();await expect(page.locator('[data-action="reset-bindings"]')).toBeInViewport();
  }
  await page.screenshot({path:'/tmp/v444-custom-controls.png'});
  await page.locator('[data-movement-mode]').selectOption('click');await expect(page.locator('[data-bind-action="skill0"]')).toHaveText('Z');await expect(page.locator('[data-bind-action="secondary"]')).toHaveText('Unbound');
  await page.locator('[data-movement-mode]').selectOption('wasd');await expect(page.locator('[data-bind-action="secondary"]')).toHaveText('B');
  await resume(page);await expect(page.locator('[data-slot="0"] kbd')).toHaveText('Z');await expect(page.locator('#mouse-slot kbd')).toHaveText('RMB / B');
  await page.keyboard.press('k');await expect(page.locator('[data-bind-target="0"] kbd')).toHaveText('Z');await expect(page.locator('[data-bind-target="1"] kbd')).toHaveText('E');await page.keyboard.press('k');
  await page.reload();await continueJourney(page);expect((await state(page)).settings.controls.movement).toBe('wasd');await expect(page.locator('[data-slot="0"] kbd')).toHaveText('Z');expect(errors).toEqual([]);
});

test('WASD moves in screen directions, cancels click paths and stops on keyup, pause and text focus',async({page})=>{
  await load(page);await controls(page);await page.locator('[data-movement-mode]').selectOption('wasd');await resume(page);
  for(const key of ['w','s','a','d']){
    const before=await state(page);await page.keyboard.down(key);await page.waitForTimeout(180);await page.keyboard.up(key);const after=await state(page);
    expect(gap(before.position,after.position)).toBeGreaterThan(.2);const x=(after.position.x-before.position.x)-(after.position.y-before.position.y),y=(after.position.x-before.position.x)+(after.position.y-before.position.y);
    if(key==='w')expect(y).toBeLessThan(0);if(key==='s')expect(y).toBeGreaterThan(0);if(key==='a')expect(x).toBeLessThan(0);if(key==='d')expect(x).toBeGreaterThan(0);
  }
  const start=await state(page),point=await page.evaluate(p=>window.__reliquary.project(p.x+2.5,p.y+2.5),start.position);await page.mouse.click(point.x,point.y);await page.waitForTimeout(100);
  await page.keyboard.down('a');await page.waitForTimeout(100);await page.keyboard.up('a');await page.waitForTimeout(100);const stopped=(await state(page)).position;await page.waitForTimeout(200);expect(gap(stopped,(await state(page)).position)).toBeLessThan(.01);
  await page.keyboard.down('s');await page.waitForTimeout(100);await page.keyboard.press('Escape');const paused=(await state(page)).position;await page.waitForTimeout(200);expect(gap(paused,(await state(page)).position)).toBeLessThan(.01);await page.keyboard.up('s');await resume(page);await page.waitForTimeout(150);expect(gap(paused,(await state(page)).position)).toBeLessThan(.01);
  // Same focus behavior used by the real LAN chat input: no movement or skill
  // cast can leak through while entering text, even if a direction was held.
  await page.keyboard.down('s');await page.waitForTimeout(100);await page.evaluate(()=>{const input=document.createElement('input');input.id='control-text-probe';document.getElementById('app').append(input);input.focus();});
  const typing=await state(page);await page.keyboard.type('wasdqerf');await page.keyboard.up('s');await page.waitForTimeout(200);expect(gap(typing.position,(await state(page)).position)).toBeLessThan(.01);expect((await state(page)).castCounts).toEqual(typing.castCounts);
  await page.evaluate(()=>document.getElementById('control-text-probe').remove());
});

test('custom skills and keyboard alternatives cast the selected abilities; old keys and shifted release do not stick',async({page})=>{
  await load(page,'dungeon');await controls(page);await page.locator('[data-movement-mode]').selectOption('wasd');
  await bind(page,'skill0','z');await bind(page,'primary','v');await bind(page,'secondary','b');await bind(page,'mana','3');await resume(page);
  const start=await state(page);await page.mouse.move(start.heroScreen.x-140,start.heroScreen.y+15);await page.keyboard.press('q');await page.waitForTimeout(150);expect((await state(page)).castCounts.cleave||0).toBe(0);
  await page.keyboard.press('Shift+z');await expect.poll(()=>state(page).then(s=>s.castCounts.cleave||0)).toBeGreaterThan(0);await expect.poll(()=>state(page).then(s=>s.actionRecovery)).toBe(0);
  const released=(await state(page)).castCounts.cleave;await page.waitForTimeout(250);expect((await state(page)).castCounts.cleave).toBe(released);
  await page.keyboard.press('e');await expect.poll(()=>state(page).then(s=>s.castCounts.bolt||0)).toBeGreaterThan(0);await expect.poll(()=>state(page).then(s=>s.actionRecovery)).toBe(0);
  const before=(await state(page)).castCounts.bolt;await page.keyboard.down('b');await expect.poll(()=>state(page).then(s=>s.castCounts.bolt||0)).toBeGreaterThan(before+1);await page.keyboard.up('b');await expect.poll(()=>state(page).then(s=>s.actionRecovery)).toBe(0);
  await page.keyboard.press('v');await expect.poll(()=>state(page).then(s=>s.attackAnim)).toBeGreaterThan(0);
  const charges=(await state(page)).manaFlask.charges;await page.keyboard.press('2');expect((await state(page)).manaFlask.charges).toBeGreaterThanOrEqual(charges);await page.keyboard.press('3');await expect.poll(()=>state(page).then(s=>s.manaFlask.charges)).toBeLessThan(charges-15);await expect(page.locator('#mana-potion-slot kbd')).toHaveText('3');
  await controls(page);await page.locator('[data-bind-action="skill0"]').click();await page.keyboard.press('Backspace');await expect(page.locator('[data-bind-action="skill0"]')).toHaveText('Unbound');await page.locator('[data-action="reset-bindings"]').click();await expect(page.locator('[data-bind-action="skill0"]')).toHaveText('Q');await expect(page.locator('[data-bind-action="skill1"]')).toHaveText('E');
});
