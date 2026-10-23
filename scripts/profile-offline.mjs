import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {createPlayer,findPath} from '../src/game.js';
import {createCampaign,generateWilderness} from '../src/campaign.js';
const html=await readFile('dist/forgotten-kingdom.html','utf8'),browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const zone of ['town','dungeon','pasture']){
 const context=await browser.newContext({viewport:{width:1440,height:900},offline:true}),page=await context.newPage(),p=createPlayer();p.campaign=createCampaign();p.equipment.shield={...p.equipment.shield,life:10000,armor:10000};p.hp=10000;if(zone==='pasture'){p.equipment.shield.speed=6;p.quests.herdKills=Array.from({length:6},(_,i)=>'herd-'+i);}
 await page.route('http://offline.test/',route=>route.fulfill({contentType:'text/html',body:html}));await page.addInitScript(save=>{localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save));localStorage.setItem('ashen-reliquary-options-v1',JSON.stringify({cursorCapture:false}));},{version:1,player:p,zone,seed:42710,depth:1,act:1});
 const started=Date.now();await page.goto('http://offline.test/');await page.locator('[data-front=continue]').click();await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);if(zone==='dungeon'){await page.keyboard.press('t');await page.locator('[data-town-action=depart]').click();await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);}if(zone==='pasture'){
  const s=await page.evaluate(()=>window.__reliquary.snapshot()),d=generateWilderness(s.areaSeed,1,p);
  for(const target of [d.townExit,d.herd]){
   const from=await page.evaluate(()=>window.__reliquary.snapshot().position),path=findPath(d,from,target,{smooth:false});
   const reached=await page.evaluate(async path=>{let active=[],i=0;const start=performance.now(),set=next=>{for(const key of active)if(!next.includes(key))document.body.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));for(const key of next)if(!active.includes(key))document.body.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));active=next;};
    while(i<path.length&&performance.now()-start<80000){await new Promise(requestAnimationFrame);const p=window.__reliquary.snapshot().position,t=path[i],dx=t.x-p.x,dy=t.y-p.y;if(Math.hypot(dx,dy)<.28){i++;continue;}set(Math.abs(dx)>Math.abs(dy)?dx>0?['ArrowDown','ArrowRight']:['ArrowUp','ArrowLeft']:dy>0?['ArrowDown','ArrowLeft']:['ArrowUp','ArrowRight']);}set([]);return i===path.length;},path);
   if(!reached)throw new Error('Offline pasture profile could not reach its sample location.');
  }
 }const startupMs=Date.now()-started;
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const sample=await page.evaluate(async()=>{const times=[];let at=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-at);at=now;}const sorted=[...times].sort((a,b)=>a-b),s=window.__reliquary.snapshot();return{medianMs:sorted[60],p95Ms:sorted[114],fps:1000/(times.reduce((a,b)=>a+b,0)/times.length),heapMB:(performance.memory?.usedJSHeapSize||0)/1048576,chunks:s.groundChunks,size:s.areaSize,renderWidth:document.querySelector('#world').width,terrainMiB:s.terrainBytes/1048576};});const {profile}=await cdp.send('Profiler.stop');const hot=profile.nodes.filter(n=>n.hitCount&&n.callFrame.functionName).sort((a,b)=>b.hitCount-a.hitCount).slice(0,8).map(n=>({function:n.callFrame.functionName,samples:n.hitCount}));console.log(JSON.stringify({zone,startupMs,...sample,hot}));await context.close();
}}finally{await browser.close();}
