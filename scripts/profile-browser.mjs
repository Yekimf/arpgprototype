// Reproducible CPU-throttled render sampling, intentionally separate from tests.
import {chromium} from '@playwright/test';
import {createPlayer} from '../src/game.js';
import {createCampaign} from '../src/campaign.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const zone of ['town','dungeon']){
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),p=createPlayer();p.campaign=createCampaign();p.equipment.shield={...p.equipment.shield,life:10000,armor:10000};p.hp=10000;
 await page.addInitScript(save=>{localStorage.setItem('ashen-reliquary-options-v1',JSON.stringify({cursorCapture:false}));localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify(save));},{version:1,player:p,zone,seed:42710,depth:1,act:1});const began=Date.now();
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173');await page.locator('[data-front="continue"]').click();await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);if(zone==='dungeon'){await page.keyboard.press('t');await page.locator('[data-town-action=depart]').click();await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);}const startupMs=Date.now()-began;
 await page.waitForTimeout(1000);const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const sample=await page.evaluate(async()=>{const times=[];let previous=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-previous);previous=now;}const sorted=[...times].sort((a,b)=>a-b);return{medianMs:+sorted[60].toFixed(1),p95Ms:+sorted[114].toFixed(1),fps:+(1000/(times.reduce((a,b)=>a+b)/times.length)).toFixed(1),heapMB:+((performance.memory?.usedJSHeapSize||0)/1048576).toFixed(1),sourceBytes:performance.getEntriesByType('resource').reduce((s,r)=>s+r.decodedBodySize,0),chunks:window.__reliquary.snapshot().groundChunks};});
 console.log(JSON.stringify({zone,viewport:'1440x900',cpuThrottle:4,startupMs,...sample}));await context.close();
}}finally{await browser.close();}
