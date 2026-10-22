import {speak,closeConversationOrPanel} from './helpers.js';
import {test,expect} from '@playwright/test';
import {createEquippedPlayer} from '../fixtures.js';

const snapshot=page=>page.evaluate(()=>window.__reliquary.snapshot());
const save=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('ashen-reliquary-save-v1')).player);
async function seedTown(page,extra={}){
  const player=Object.assign(createEquippedPlayer(),{level:8,skills:{cleave:1,bolt:1,nova:1},slots:['cleave','bolt','nova',null],mouseSkill:'bolt'},extra);
  await page.addInitScript(data=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(data)),{version:1,player,depth:1,seed:42710,zone:'town'});
}
async function talk(page,id,title){await speak(page,id,['merchant','smith'].includes(id)?id:null);if(['guide','scholar'].includes(id))await expect(page.locator('#npc-dialogue header')).toHaveText(id==='guide'?'Sister Maelin':'Edrin');else await expect(page.locator('#modal-title')).toHaveText(title);}
const close=closeConversationOrPanel;

test('town guide, identification scroll, merchant, buyback, repairs, and reforging work',async({page},info)=>{
  const equipment=createEquippedPlayer().equipment;equipment.armor.durability=45;
  await seedTown(page,{gold:200,equipment});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();
  await expect.poll(()=>snapshot(page).then(s=>s.artLoaded)).toBe(true);
  expect((await snapshot(page)).zone).toBe('town');expect((await snapshot(page)).enemies).toBe(0);
  await expect(page.locator('[data-npc="scholar"]')).toBeDisabled();
  await talk(page,'guide','Sister Maelin');await page.locator('[data-talk="accept"]').click();
  expect((await snapshot(page)).gold).toBe(250);await close(page);
  await page.locator('[data-panel="inventory"]').click();await page.locator('[data-pack-id="maelin-talisman"]').click();
  await expect(page.locator('#item-detail')).toContainText('Its true nature is concealed');
  await page.locator('[data-town-action="identify"]').click();await expect(page.locator('#item-detail')).toContainText('Hearthbound Talisman');
  await page.locator('[data-town-action="equip"]').click();await expect(page.locator('[data-equip-slot="charm"]')).toHaveAttribute('aria-label',/Hearthbound/);await close(page);
  await talk(page,'merchant','Orrin’s wares');
  const visible=await page.locator('[data-stock-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.stockId));
  const stock=(await save(page)).shopStock.filter(i=>visible.includes(i.id)).sort((a,b)=>a.price-b.price)[0];
  await page.locator(`[data-stock-id="${stock.id}"]`).click();await page.locator('[data-town-action="buy"]').click();
  const afterBuy=(await snapshot(page)).gold;
  await page.locator(`[data-pack-id="${stock.id}"]`).click();await page.locator('[data-town-action="sell"]').click();
  expect((await snapshot(page)).gold).toBeGreaterThan(afterBuy);
  await page.locator('[data-town-action="shop-buyback"]').click();await page.locator(`[data-stock-id="${stock.id}"]`).click();await page.locator('[data-town-action="buyback"]').click();
  expect((await snapshot(page)).gold).toBe(afterBuy);
  await page.locator('[data-town-action="buy-scroll"]').click();await close(page);
  await talk(page,'smith','Garran’s forge');
  await page.locator('[data-smith-equipped="charm"]').click();
  await expect(page.locator('[data-forge-affix]')).toHaveValue('life');
  await page.locator('[data-town-action="reforge"]').click();
  const forged=(await save(page)).equipment.charm;expect(forged.reforges).toBe(1);expect(forged.life).not.toBe(6);expect(forged.spirit).toBe(8);expect((await snapshot(page)).shards).toBe(1);
  await page.locator('[data-town-action="repair"]').click();expect((await save(page)).equipment.armor.durability).toBe(100);
  await page.screenshot({path:`test-results/${info.project.name}-forge.png`});await close(page);
  await page.locator('[data-panel="inventory"]').click();await page.locator(`[data-pack-id="${stock.id}"]`).click();
  if(info.project.name==='desktop'){
    const bag=await page.locator('[data-bag-grid="pack"]').boundingBox();
    await page.locator(`[data-pack-id="${stock.id}"]`).dragTo(page.locator('[data-bag-grid="pack"]'),{targetPosition:{x:bag.width*.75,y:bag.height*.08}});
    expect((await save(page)).inventory.find(i=>i.id===stock.id).bagX).toBe(7);
  }
  await page.locator(`[data-pack-id="${stock.id}"]`).click();await page.locator('[data-town-action="store"]').click();
  expect((await save(page)).stash).toHaveLength(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

test('rescued archivist offers free identification and guide reward is saved once',async({page})=>{
  const quests={guideMet:true,scholarRescued:true,wardenDefeated:true,guideRewarded:false};
  const inventory=[{id:'hidden-ring',name:'Gilded Signet',slot:'ring',rarity:'rare',level:2,life:24,crit:4,identified:false,durability:100}];
  await seedTown(page,{quests,inventory,identifyScrolls:0});await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();
  await talk(page,'scholar','Edrin’s study');await page.locator('[data-talk="identify"]').click();
  expect((await save(page)).inventory[0].identified).toBe(true);expect((await snapshot(page)).gold).toBe(0);
  await close(page);await talk(page,'guide','Sister Maelin');await page.locator('[data-talk="reward"]').click();
  expect((await snapshot(page)).gold).toBe(120);expect((await snapshot(page)).shards).toBe(3);
  await expect(page.locator('[data-talk="reward"]')).toHaveCount(0);
});

test('safe starting town, dungeon departure, town portal, and return preserve the expedition',async({page})=>{
  const equipment=createEquippedPlayer().equipment;equipment.weapon.damage=2000;equipment.armor.armor=10000;
  await seedTown(page,{equipment});await page.goto('/');await page.locator('[data-front="continue"]').click();await expect(page.locator('#area-loading')).toBeHidden();
  await page.keyboard.press('t');await page.locator('[data-town-action="depart"]').click();
  expect((await snapshot(page)).zone).toBe('dungeon');const initial=(await snapshot(page)).enemies;
  await page.waitForTimeout(2200);await page.locator('[data-slot="2"]').dispatchEvent('pointerdown');await page.waitForTimeout(1800);
  const defeated=(await snapshot(page)).enemies;expect(defeated).toBeLessThan(initial);
  await page.keyboard.press('t');await expect.poll(()=>snapshot(page).then(s=>s.zone),{timeout:6500}).toBe('town');
  await page.keyboard.press('t');await page.locator('[data-town-action="depart"]').click();
  const returned=await snapshot(page);expect(returned.zone).toBe('dungeon');expect(returned.enemies).toBe(defeated);expect(returned.seed).toBe(42710);
});
