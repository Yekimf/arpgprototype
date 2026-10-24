import {test,expect} from '@playwright/test';
import {createPlayer,playerStats} from '../../src/game.js';
import {createCampaign,generateWilderness} from '../../src/campaign.js';
import {followPath} from './helpers.js';
const url=process.env.LAN_TEST_URL;
test.skip(!url,'Run with LAN_TEST_URL pointing to the local host server.');
const state=p=>p.evaluate(()=>window.__reliquary.snapshot());
async function client(browser,name,seed,item){
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),p=createPlayer({name});p.campaign=createCampaign();p.level=5;p.gold=500;p.equipment.weapon.damage=1000;p.equipment.armor={id:'practice-coat',name:'Practice leather',slot:'armor',look:'leather',rarity:'normal',level:1,armor:1000,life:10000,spirit:1000};p.equipment.boots={id:'practice-boots',name:'Practice boots',slot:'boots',look:'leather',rarity:'normal',level:1,speed:6};p.hp=playerStats(p).maxHp;p.mana=playerStats(p).maxMana;p.inventory=[item];
 await page.addInitScript(({p,seed})=>{localStorage.setItem('ashen-reliquary-options-v1',JSON.stringify({cursorCapture:false}));localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed,depth:1}));Object.defineProperty(crypto,'randomUUID',{value:undefined});},{p,seed});
 await page.goto(url);await page.locator('[data-front=lan]').click();await expect(page.locator('[data-lan=host]')).toBeEnabled();return {page,context,p};
}
async function hostAndJoin(browser){
 const a=await client(browser,'Alden LAN',42710,{id:'alpha-blade',name:'Alden’s Falchion',slot:'weapon',look:'sword',rarity:'normal',damage:8}),b=await client(browser,'Bran LAN',45678,{id:'beta-ring',name:'Bran’s Signet',slot:'ring',rarity:'normal',crit:2});
 await a.page.locator('#lan-name').fill('Browser company '+Date.now());await a.page.locator('[data-lan=host]').click();await expect.poll(()=>state(a.page).then(s=>s.lan?.connected)).toBe(true);await expect(a.page.locator('#area-loading')).toBeHidden();const room=(await state(a.page)).lan.room;
 await b.page.locator('[data-lan=refresh]').click();await b.page.locator(`[data-lan=join][data-room="${room.id}"]`).click();await expect.poll(()=>state(b.page).then(s=>s.lan?.connected)).toBe(true);await expect(b.page.locator('#area-loading')).toBeHidden();await expect.poll(()=>state(a.page).then(s=>s.lan.peers.length)).toBe(1);return {a,b};
}
async function party(a,b){await a.keyboard.press('p');await a.locator('[data-lan=party-invite]').click();await b.keyboard.press('p');await expect(b.locator('[data-lan=party-accept]')).toBeVisible();await b.locator('[data-lan=party-accept]').click();await expect.poll(()=>state(a).then(s=>!!s.lan.peers[0]?.party)).toBe(true);}

test('two single-player characters share a LAN world, party chat and an atomic trade, then return to solo',async({browser})=>{
 test.setTimeout(120000);const {a,b}=await hostAndJoin(browser),errors=[];for(const p of [a.page,b.page])p.on('pageerror',e=>errors.push(e.message));try{
  expect((await state(a.page)).seed).toBe((await state(b.page)).seed);expect((await state(a.page)).layoutSignature).toBe((await state(b.page)).layoutSignature);await party(a.page,b.page);
  await a.page.keyboard.press('Escape');await b.page.keyboard.press('Escape');await a.page.keyboard.press('Enter');await a.page.locator('#lan-chat input').fill('The old oath holds.');await a.page.locator('#lan-chat input').press('Enter');await expect(b.page.locator('.lan-chat-lines')).toContainText('The old oath holds.');
  await b.page.keyboard.press('Enter');await b.page.locator('#lan-chat select').selectOption('party');await b.page.locator('#lan-chat input').fill('Together to Marchgate.');await b.page.locator('#lan-chat input').press('Enter');await expect(a.page.locator('.lan-chat-lines')).toContainText('[Party] Together to Marchgate.');
  await a.page.keyboard.press('p');await a.page.locator('[data-lan=trade-request]').click();await expect(b.page.locator('[data-lan=trade-accept]')).toBeVisible();await b.page.locator('[data-lan=trade-accept]').click();await expect(a.page.locator('#trade-gold')).toBeVisible();
  await a.page.locator('[data-trade-item=alpha-blade]').check();await a.page.locator('#trade-gold').fill('100');await expect(a.page.locator('[data-lan=trade-confirm]')).toBeDisabled();await a.page.locator('[data-lan=trade-offer]').click();await expect.poll(()=>state(a.page).then(s=>s.lan.trade?.offers[s.lan.id]?.gold)).toBe(100);
  await b.page.locator('[data-trade-item=beta-ring]').check();await b.page.locator('#trade-gold').fill('20');await b.page.locator('[data-lan=trade-offer]').click();await expect.poll(()=>state(a.page).then(s=>s.lan.trade?.revision)).toBe(2);
  await a.page.locator('[data-lan=trade-confirm]').click();await expect(a.page.locator('[data-lan=trade-confirm]')).toBeDisabled();await b.page.locator('#trade-gold').fill('21');await b.page.locator('[data-lan=trade-offer]').click();await expect(a.page.locator('[data-lan=trade-confirm]')).toBeEnabled();
  await a.page.screenshot({path:'/tmp/v400-trade.png'});await a.page.locator('[data-lan=trade-confirm]').click();await b.page.locator('[data-lan=trade-confirm]').click();await expect.poll(()=>state(a.page).then(s=>s.gold)).toBe(421);await expect.poll(()=>state(b.page).then(s=>s.gold)).toBe(579);
  await a.page.keyboard.press('i');await expect(a.page.locator('[data-pack-id=beta-ring]')).toBeVisible();await expect(a.page.locator('[data-pack-id=alpha-blade]')).toHaveCount(0);await a.page.keyboard.press('Escape');
  await a.page.keyboard.press('p');await a.page.locator('[data-lan=leave]').click();await expect.poll(()=>state(a.page).then(s=>s.lan)).toBe(null);expect((await state(a.page)).seed).toBe(42710);expect((await state(a.page)).paused).toBe(false);expect((await state(a.page)).gold).toBe(421);expect(errors).toEqual([]);
 }finally{await a.context.close();await b.context.close();}
});

test('party members fight shared enemies and obtain separate loot and kill credit',async({browser})=>{
 test.setTimeout(150000);const {a,b}=await hostAndJoin(browser),errors=[];for(const p of [a.page,b.page])p.on('pageerror',e=>errors.push(e.message));try{
  await party(a.page,b.page);await a.page.keyboard.press('Escape');await b.page.keyboard.press('Escape');const initial=await state(a.page),d=generateWilderness(initial.areaSeed,1,a.p,0),target={x:d.townExit.x+9,y:d.townExit.y};
  await Promise.all([followPath(a.page,d,target),followPath(b.page,d,target)]);await expect.poll(()=>state(a.page).then(s=>s.visibleEnemies.length),{timeout:10000}).toBeGreaterThan(0);let s=await state(a.page);const enemy=s.visibleEnemies.sort((x,y)=>Math.hypot(x.x-s.position.x,x.y-s.position.y)-Math.hypot(y.x-s.position.x,y.y-s.position.y))[0];
  await a.page.mouse.move(enemy.screen.x,enemy.screen.y);await a.page.mouse.down();try{await expect.poll(()=>state(a.page).then(s=>s.remains.corpses.length),{timeout:15000}).toBeGreaterThan(0);}finally{await a.page.mouse.up();}
  await expect.poll(()=>state(b.page).then(s=>s.remains.corpses.length),{timeout:5000}).toBeGreaterThan(0);await expect.poll(()=>state(b.page).then(s=>s.xp),{timeout:5000}).toBeGreaterThan(0);await expect.poll(()=>state(b.page).then(s=>s.loot+s.gold),{timeout:5000}).toBeGreaterThan(500);
  await a.page.screenshot({path:'/tmp/v400-company-combat.png'});expect(errors).toEqual([]);
 }finally{await a.context.close();await b.context.close();}
});

test('character exports transfer between independent browser stores and update the matching character',async({browser})=>{
 test.setTimeout(90000);const source=await client(browser,'Traveller LAN',61317,{id:'heirloom',name:'Family sword',slot:'weapon',rarity:'normal',damage:9}),target=await browser.newContext({viewport:{width:1280,height:720}}),page=await target.newPage();try{
  const downloadPromise=source.page.waitForEvent('download');await source.page.locator('[data-lan=export]').click();const download=await downloadPromise;await download.saveAs('/tmp/v400-character-export.json');
  await page.goto(url);await page.locator('[data-front=lan]').click();await page.locator('#lan-import').setInputFiles('/tmp/v400-character-export.json');await expect(page.locator('.lan-import-confirm')).toContainText('Traveller LAN');await page.locator('[data-lan=import-confirm]').click();await expect(page.locator('#lan-character')).toContainText('Traveller LAN');
  const archive=await page.evaluate(()=>JSON.parse(localStorage.getItem('forgotten-kingdom-characters-v1')));expect(archive.characters).toHaveLength(1);expect(archive.characters[0].save.seed).toBe(61317);expect(archive.characters[0].save.player.inventory[0].id).toBe('heirloom');
  await page.locator('#lan-import').setInputFiles('/tmp/v400-character-export.json');await expect(page.locator('[data-lan=import-confirm]')).toHaveText('Update matching character');await page.locator('[data-lan=import-confirm]').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('forgotten-kingdom-characters-v1')).characters.length)).toBe(1);await page.screenshot({path:'/tmp/v400-lobby-1280.png'});
 }finally{await source.context.close();await target.close();}
});
