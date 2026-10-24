import {test,expect} from '@playwright/test';
import {createPlayer,generateDungeon,distance} from '../../src/game.js';
import {continueJourney,continueFixture,followPath} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());

for(const viewport of [{width:1440,height:1000},{width:1280,height:720}])test(`requirements govern equipping and regen suffixes work at ${viewport.width}×${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.attributePoints=2;p.inventory=[{id:'regen-belt',name:'Girdle of Meditation',slot:'belt',look:'leather',rarity:'magic',identified:true,level:1,requiredLevel:1,requiredStats:{vitality:14},manaRegen:1.25,lifeRegen:.75,affixes:[{id:'lucid',name:'of Meditation',stat:'manaRegen',value:1.25,tier:1,kind:'suffix',min:1,max:1.5}]},{id:'late-plate',name:'Royal Cuirass',slot:'armor',look:'plate',rarity:'normal',level:8,armor:30}];
 await page.addInitScript(p=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},p);
 await page.goto('/');await continueJourney(page);await expect(page.locator('#area-loading')).toBeHidden();const before=await state(page);await page.keyboard.press('i');
 await page.locator('[data-pack-id=late-plate]').hover();await expect(page.locator('#item-tooltip .gear-requirements')).toContainText('Requires Level 8');await expect(page.locator('#item-tooltip .unmet')).toHaveCount(3);await page.screenshot({path:`/tmp/v370-requirements-${viewport.width}.png`});
 await page.locator('[data-pack-id=regen-belt]').click({button:'right'});await expect(page.locator('#toast')).toContainText('Requires Vitality 14');await expect(page.locator('[data-pack-id=regen-belt]')).toBeVisible();
 await page.keyboard.press('Escape');await page.keyboard.press('c');await page.locator('[data-attribute=vitality]').click();await page.locator('[data-attribute=vitality]').click();await expect(page.locator('.character-stat-ledger')).toContainText('Attack rating');await expect(page.locator('.defense-note')).toContainText('5–95%');await page.screenshot({path:`/tmp/v370-character-${viewport.width}.png`});
 await page.keyboard.press('Escape');await page.keyboard.press('i');await page.locator('[data-pack-id=regen-belt]').click({button:'right'});await expect(page.locator('[data-pack-id=regen-belt]')).toHaveCount(0);const after=await state(page);expect(after.combatStats.regen).toBeCloseTo(before.combatStats.regen+1.25);expect(after.combatStats.lifeRegen).toBeCloseTo(before.combatStats.lifeRegen+.75);expect(errors).toEqual([]);
});

test('physical weapon attacks can miss while a spell bypasses defense',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.level=2;p.skills={nova:1};p.slots=['nova',null,null,null];p.equipment.armor={id:'practice',slot:'armor',name:'Practice coat',rarity:'normal',armor:10000,life:10000,spirit:10000};p.hp=10000;p.mana=10000;
 await page.addInitScript(p=>{Math.random=()=>.99;localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'dungeon',seed:42710,depth:1}));},p);
 page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);let s=await state(page);const d=generateDungeon(s.seed,s.depth),near=d.enemies.filter(e=>e.type!=='warden').sort((a,b)=>distance(a,s.position)-distance(b,s.position))[0];await followPath(page,d,near);
 s=await state(page);const target=s.visibleEnemies.find(e=>distance(e,s.position)<2&&e.screen.y<820);expect(target).toBeTruthy();const health=s.enemyHealth;
 await page.mouse.move(target.screen.x,target.screen.y);await page.mouse.down();await page.waitForTimeout(900);await page.mouse.up();expect((await state(page)).enemyHealth).toBe(health);
 await expect.poll(()=>state(page).then(s=>s.actionRecovery)).toBe(0);await page.keyboard.press('q');await expect.poll(()=>state(page).then(s=>s.enemyHealth),{timeout:5000}).toBeLessThan(health);expect(errors).toEqual([]);
});
