import {test,expect} from '@playwright/test';
import {createLanServer} from '../../server/lan-server.mjs';
import {createPlayer} from '../../src/game.js';
import {createCampaign} from '../../src/campaign.js';
import {speak} from './helpers.js';
const snapshot=p=>p.evaluate(()=>window.__reliquary.snapshot());
test('a town player receives company objective progress and claims their own NPC reward',async({browser})=>{
 test.setTimeout(90000);const app=await createLanServer({port:0,host:'127.0.0.1',file:null}),contexts=[];
 try{
 const open=async name=>{const context=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(context);const p=createPlayer({name});p.campaign=createCampaign();await context.addInitScript(p=>{localStorage.setItem('ashen-reliquary-options-v1',JSON.stringify({cursorCapture:false}));localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,seed:42710,depth:1,zone:'town'}));},p);const page=await context.newPage();await page.goto(`http://127.0.0.1:${app.port}`);await page.locator('[data-front=lan]').click();return page;};
 const a=await open('Quest Host'),b=await open('Quest Friend');await a.locator('[data-lan=host]').click();await expect.poll(()=>snapshot(a).then(s=>s.lan?.connected)).toBe(true);const room=(await snapshot(a)).lan.room;await b.locator('[data-lan=refresh]').click();await b.locator(`[data-lan=join][data-room="${room.id}"]`).click();await expect.poll(()=>snapshot(b).then(s=>s.lan?.connected)).toBe(true);await expect(b.locator('#area-loading')).toBeHidden();
 await speak(b,'guide','leave');await expect.poll(()=>snapshot(b).then(s=>s.questFlow.accepted)).toBe('last-herd');const before=await snapshot(b);
 const host=app.world.session([...app.world.sessions.keys()].find(k=>app.world.sessions.get(k).player.name==='Quest Host')),world=app.world.area(host.room,'wilderness:0');
 // Drive the authoritative host kill boundary; the spectator stays in town,
 // receives actual SSE snapshots and completes the normal NPC turn-in flow.
 for(const e of world.d.enemies.filter(e=>e.questId==='last-herd')){host.pos={x:e.x,y:e.y};e.hp=1;app.world.hit(host,{enemyId:e.id,damage:10,element:'fire',direct:false,skill:'test'});}
 await expect.poll(()=>snapshot(b).then(s=>s.campaign.actOneKills?.['last-herd']?.length)).toBe(6);await expect(b.locator('#objective')).toContainText('Return to Sister Maelin');expect((await snapshot(b)).gold).toBe(before.gold);expect((await snapshot(b)).xp).toBe(before.xp);
 await speak(b,'guide','leave');await expect.poll(()=>snapshot(b).then(s=>s.questFlow.claimed)).toContain('last-herd');expect((await snapshot(b)).gold).toBe(before.gold+65);expect((await snapshot(a)).questFlow.claimed).not.toContain('last-herd');
 }finally{for(const c of contexts)await c.close();await app.close();}
});
