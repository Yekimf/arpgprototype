import {test,expect} from '@playwright/test';
import {createPlayer,generateDungeon,distance} from '../../src/game.js';
import {continueFixture,followPath} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());

test('kills collapse into persistent corpses, retain loot, and pause their animation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.equipment.weapon.damage=5000;p.equipment.armor={id:'test-armor',name:'Test armour',slot:'armor',rarity:'normal',armor:10000,life:10000};p.hp=10000;
 await page.addInitScript(p=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'dungeon',seed:42710,depth:1}));},p);
 page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);await expect.poll(()=>state(page).then(s=>s.enemyArtLoaded)).toBe(true);
 await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();await page.locator('[data-test-option=god]').check();await page.keyboard.press('Escape');
 let s=await state(page);const dungeon=generateDungeon(s.seed,s.depth),nearest=dungeon.enemies.filter(e=>e.type!=='warden').sort((a,b)=>distance(a,s.position)-distance(b,s.position))[0];await followPath(page,dungeon,nearest);
 s=await state(page);const target=s.visibleEnemies.find(e=>distance(e,s.position)<2&&e.screen.y>80&&e.screen.y<820);expect(target).toBeTruthy();const before=s.enemies;
 await page.mouse.move(target.screen.x,target.screen.y);await page.mouse.down();
 try{await expect.poll(()=>state(page).then(s=>s.remains.corpses.length)).toBeGreaterThan(0);}finally{await page.mouse.up();}
 s=await state(page);expect(s.enemies).toBeLessThan(before);expect(s.visibleEnemies.some(e=>e.id===target.id)).toBe(false);expect(s.remains.stains).toBeGreaterThan(0);
 await page.keyboard.press('Escape');const paused=await state(page);await page.waitForTimeout(300);expect((await state(page)).remains.corpses).toEqual(paused.remains.corpses);await page.keyboard.press('Escape');
 await expect.poll(()=>state(page).then(s=>s.remains.corpses.every(c=>c.age>=c.duration))).toBe(true);await page.screenshot({path:'test-results/v351-corpses.png'});
 const corpses=(await state(page)).remains.corpses;await page.keyboard.press('t');await page.waitForTimeout(3200);await expect.poll(()=>state(page).then(s=>s.zone)).toBe('town');expect((await state(page)).remains.corpses).toEqual([]);
 await page.keyboard.press('t');await page.locator('[data-town-action=depart]').click();await expect(page.locator('#area-loading')).toBeHidden();expect((await state(page)).remains.corpses.length).toBe(corpses.length);expect(errors).toEqual([]);
});

test('the player collapses even while the death menu pauses combat and can revive',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.hp=1;p.equipment.shield=null;
 await page.addInitScript(p=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'dungeon',seed:42710,depth:1}));},p);
 page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);const s=await state(page),dungeon=generateDungeon(s.seed,s.depth),nearest=dungeon.enemies.filter(e=>e.type!=='warden').sort((a,b)=>distance(a,s.position)-distance(b,s.position))[0];await followPath(page,dungeon,nearest);
 await expect(page.locator('[data-action=revive]')).toBeVisible({timeout:20000});
 await expect.poll(()=>state(page).then(s=>s.remains.corpses.some(c=>c.player&&c.age>=c.duration))).toBe(true);
 expect((await state(page)).animation.action).toBe('death');await page.screenshot({path:'test-results/v351-player-death.png'});
 await page.locator('[data-action=revive]').click();await expect.poll(()=>state(page).then(s=>s.zone)).toBe('town');expect((await state(page)).hp).toBeGreaterThan(0);expect(errors).toEqual([]);
});
