import {test,expect} from '@playwright/test';
import {createEquippedPlayer} from '../fixtures.js';
import {continueFixture} from './helpers.js';

const state=page=>page.evaluate(()=>window.__reliquary.snapshot());
async function load(page){
  const player=createEquippedPlayer();Object.assign(player,{level:12,skills:{cleave:1,bolt:2,nova:2,lance:1},slots:['cleave','bolt','nova','lance'],primarySkill:'basic',mouseSkill:'bolt',hp:10000,mana:5000});
  player.equipment.armor.armor=5000;
  player.equipment.charm={id:'combat-reservoir',name:'Testing reservoir',slot:'charm',rarity:'normal',life:10000,spirit:5000};
  await page.addInitScript(player=>localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player,zone:'dungeon',seed:42710,depth:1})),player);
  page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);
  await expect.poll(()=>state(page).then(s=>s.artLoaded)).toBe(true);
  const s=await state(page);await page.mouse.move(s.heroScreen.x-180,s.heroScreen.y+20);
}
async function tapAndSnapshot(page,key,code){
  return page.evaluate(({key,code})=>{
    const before=window.__reliquary.snapshot();
    // Both events and the snapshot run in one task: a windup cannot accidentally
    // finish between an automation key press and the observation that follows.
    for(const type of ['keydown','keyup'])document.body.dispatchEvent(new KeyboardEvent(type,{key,code,bubbles:true}));
    return{before,after:window.__reliquary.snapshot()};
  },{key,code});
}

test('nova and projectile skills spend mana on windup and release only at animation contact',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page);
  const nova=await tapAndSnapshot(page,'e','KeyE');
  expect(nova.after.combatFeedback.pending).toBe('nova');expect(nova.after.castCounts.nova).toBe((nova.before.castCounts.nova||0)+1);
  expect(nova.after.mana).toBeLessThan(nova.before.mana);expect(nova.after.enemyHealth).toBe(nova.before.enemyHealth);
  expect(nova.after.visualEffects.some(e=>e.type==='nova')).toBe(false);
  await expect.poll(()=>state(page).then(s=>s.visualEffects.some(e=>e.type==='nova')),{intervals:[20],timeout:2000}).toBe(true);
  await expect.poll(()=>state(page).then(s=>s.actionRecovery),{intervals:[20]}).toBe(0);
  const lance=await tapAndSnapshot(page,'r','KeyR');
  expect(lance.after.combatFeedback.pending).toBe('lance');expect(lance.after.castCounts.lance).toBe((lance.before.castCounts.lance||0)+1);
  expect(lance.after.projectiles).toHaveLength(lance.before.projectiles.length);
  await expect.poll(()=>state(page).then(s=>s.combatFeedback.pending!=='lance'&&s.projectiles.some(b=>b.kind==='aether')),{intervals:[20],timeout:2000}).toBe(true);
  expect(errors).toEqual([]);
});

test('a late explicit ability buffers once and takes priority over a held attack',async({page})=>{
  await load(page);
  const queued=await page.evaluate(async()=>{
    const key=(type,value,code)=>document.body.dispatchEvent(new KeyboardEvent(type,{key:value,code,bubbles:true}));
    key('keydown','w','KeyW');const began=performance.now();
    while(performance.now()-began<1800){
      const s=window.__reliquary.snapshot();
      if(s.actionRecovery>.08&&s.actionRecovery<.20){key('keydown','e','KeyE');key('keyup','e','KeyE');return window.__reliquary.snapshot();}
      await new Promise(requestAnimationFrame);
    }
    key('keyup','w','KeyW');throw Error('The first cast never entered its late input window.');
  });
  expect(queued.combatFeedback.buffered).toBe('nova');expect(queued.castCounts.nova||0).toBe(0);
  await expect.poll(()=>state(page).then(s=>s.castCounts.nova||0),{intervals:[20],timeout:2000}).toBe(1);
  await page.keyboard.up('w');
  await expect.poll(()=>state(page).then(s=>s.actionRecovery),{intervals:[20]}).toBe(0);
  const finished=await state(page);expect(finished.castCounts.nova).toBe(1);expect(finished.combatFeedback.buffered).toBeNull();expect(finished.combatFeedback.pending).toBeNull();
});

test('evading before contact cancels a pending projectile instead of firing from the dodge',async({page})=>{
  await load(page);
  const canceled=await page.evaluate(()=>{
    const tap=(key,code)=>{for(const type of ['keydown','keyup'])document.body.dispatchEvent(new KeyboardEvent(type,{key,code,bubbles:true}));};
    tap('w','KeyW');const winding=window.__reliquary.snapshot();tap(' ','Space');return{winding,after:window.__reliquary.snapshot()};
  });
  expect(canceled.winding.combatFeedback.pending).toBe('bolt');expect(canceled.after.combatFeedback.pending).toBeNull();expect(canceled.after.combatFeedback.buffered).toBeNull();
  expect(canceled.after.visualEffects.some(e=>e.type==='evade-dust')).toBe(true);
  expect(canceled.after.projectiles.some(b=>b.kind==='fire')).toBe(false);
  await expect.poll(()=>state(page).then(s=>s.actionRecovery),{intervals:[20]}).toBe(0);
  expect((await state(page)).projectiles.some(b=>b.kind==='fire')).toBe(false);
});

test('confirmed melee hits produce material impacts and recoil, while held LMB keeps attacking with WASD',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page);
  await page.keyboard.press('Escape');await page.locator('[data-action="options"]').click();await page.locator('[data-action="controls"]').click();await page.locator('[data-movement-mode]').selectOption('wasd');await page.locator('#modal [data-action="close"]').click();
  const initial=await state(page),target=initial.visibleEnemies.filter(e=>e.type==='skeleton').sort((a,b)=>Math.hypot(a.x-initial.position.x,a.y-initial.position.y)-Math.hypot(b.x-initial.position.x,b.y-initial.position.y))[0];
  expect(target).toBeTruthy();await page.mouse.move(target.screen.x,target.screen.y);await page.mouse.down();
  try{
    const contact=await page.evaluate(async()=>{
      const began=performance.now();while(performance.now()-began<7000){const s=window.__reliquary.snapshot();if(s.combatFeedback.reactions>0&&s.visualEffects.some(e=>e.type==='hit-impact'))return s;await new Promise(requestAnimationFrame);}throw Error('No confirmed melee hit reached its impact/recoil phase.');
    });
    expect(contact.enemyHealth).toBeLessThan(initial.enemyHealth);expect(contact.visualEffects.length).toBeLessThanOrEqual(180);
    const start=(await state(page)).position;await page.keyboard.down('d');
    try{
      const continued=await page.evaluate(async()=>{
        let previous=window.__reliquary.snapshot().combatFeedback.combo,swings=0,maxEffects=0,trail=false;const began=performance.now();
        while(performance.now()-began<2500){const s=window.__reliquary.snapshot();if(s.combatFeedback.combo!==previous){previous=s.combatFeedback.combo;swings++;}maxEffects=Math.max(maxEffects,s.visualEffects.length);trail ||= s.visualEffects.some(e=>e.type==='melee-trail');if(swings>=2)return{swings,maxEffects,trail,position:s.position};await new Promise(requestAnimationFrame);}throw Error('Holding LMB stopped repeating when WASD movement took over.');
      });
      expect(continued.swings).toBeGreaterThanOrEqual(2);expect(continued.trail).toBe(true);expect(continued.maxEffects).toBeLessThanOrEqual(180);expect(Math.hypot(continued.position.x-start.x,continued.position.y-start.y)).toBeGreaterThan(.15);
    }finally{await page.keyboard.up('d');}
  }finally{await page.mouse.up();}
  expect(errors).toEqual([]);
});
