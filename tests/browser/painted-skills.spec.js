import {test,expect} from '@playwright/test';
import {createEquippedPlayer} from '../fixtures.js';
import {continueFixture} from './helpers.js';
const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
const cases=[['nova','frostburst'],['quake','earth'],['bolt','firebolt'],['rime','icebolt'],['lance','aetherbolt'],['tempest','aetherbolt'],['chain','arc'],['rend','rend'],['cleave','cut'],['whirl','cut'],['vortex','vortex'],['procession','sword'],['meteor','flame'],['cataclysm','fireburst'],['judgment','thunder'],['focus','trance'],['bulwark','guard'],['inferno','flame']];
async function load(page){
 const p=createEquippedPlayer();p.level=24;p.skills=Object.fromEntries(cases.map(([id])=>[id,2]));p.slots=['nova','bolt','quake','lance'];p.equipment.charm={id:'visual-reservoir',name:'Study reservoir',slot:'charm',rarity:'normal',life:10000,spirit:5000};p.hp=10000;p.mana=5000;
 await page.addInitScript(p=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,seed:42710,depth:1,zone:'dungeon'})),p);page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);
 await expect.poll(()=>state(page).then(s=>s.skillArt.ready)).toBe(true);await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();await page.locator('[data-test-option=god]').check();await page.locator('[data-test-option=infiniteMana]').check();await page.keyboard.press('Escape');
}
async function bind(page,id){await expect.poll(()=>state(page).then(s=>s.actionRecovery)).toBe(0);await page.locator('[data-slot="0"]').click();await page.locator(`[data-choose-skill="${id}"]`).click();const hero=(await state(page)).heroScreen;await page.mouse.move(hero.x-145,hero.y+15);}
test('all active skills use animated painted art while keeping their actual casts and contact timing',async({page})=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page);
 for(const [id,style]of cases){await bind(page,id);await page.keyboard.press('q');
  await expect.poll(()=>state(page).then(s=>s.skillArt.styles[style]||0),{intervals:[30],timeout:5000,message:`${id} should paint ${style}`}).toBeGreaterThan(0);
  if(['nova','quake','cataclysm','procession','inferno','vortex','judgment'].includes(id)){await page.waitForTimeout(id==='nova'||id==='quake'?170:60);await page.screenshot({path:`/tmp/v490-${id}.png`});}
 }
 expect(errors).toEqual([]);
});
test('reduced motion and performance quality keep bounded painted effects without changing skill damage events',async({page})=>{
 await load(page);await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();await page.locator('[data-option=quality]').selectOption('performance');await page.locator('[data-option=reducedMotion]').check();await page.keyboard.press('Escape');
 await bind(page,'inferno');await page.keyboard.press('q');await bind(page,'nova');const before=(await state(page)).castCounts.nova||0;await page.keyboard.press('q');
 await expect.poll(()=>state(page).then(s=>s.castCounts.nova||0)).toBe(before+1);await expect.poll(()=>state(page).then(s=>s.skillArt.styles.frostburst||0),{intervals:[30]}).toBeGreaterThan(0);
 const sample=await page.evaluate(async()=>{let max=0,seen=false;for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);const s=window.__reliquary.snapshot();max=Math.max(max,s.skillArt.draws);seen||=!!s.skillArt.styles.flame;}return{max,seen,budget:window.__reliquary.snapshot().skillArt.budget};});expect(sample.seen).toBe(true);expect(sample.max).toBeLessThanOrEqual(sample.budget);expect(sample.budget).toBe(100);
});
