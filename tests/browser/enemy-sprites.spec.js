import {test,expect} from '@playwright/test';
import {createPlayer,generateDungeon,distance} from '../../src/game.js';
import {continueFixture,followPath} from './helpers.js';
const snapshot=page=>page.evaluate(()=>window.__reliquary.snapshot());
test('all six families render 48 distinct grounded directional and action frames',async({page})=>{
 await page.route('**/enemy-art-preview',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><body style="margin:0;background:#161510"><canvas id="sheet" width="768" height="1024"></canvas></body>'}));
 await page.goto('http://127.0.0.1:5173/enemy-art-preview');
 const result=await page.evaluate(async()=>{
  const {EnemySprites}=await import('/src/enemy-sprites.js'),{ENEMY_FAMILIES}=await import('/src/enemy-appearance.js'),sprites=new EnemySprites();await Promise.all(sprites.images.map(i=>i.decode()));
  const canvas=document.getElementById('sheet'),c=canvas.getContext('2d'),roles=['guard','lunge','archer','brute','hexer','bomber'],poses=[];
  c.fillStyle='#201d17';c.fillRect(0,0,768,1024);
  for(let side=0;side<2;side++)for(let frame=0;frame<4;frame++)for(let family=0;family<6;family++){
   const e={x:1,y:1,type:'skeleton',role:roles[family]},moving=frame===1||frame===2,face=side?{x:0,y:-1}:{x:1,y:0},gait=frame===1?1.1:3.1;
   if(frame===3)e.attackAnim=.2;
   sprites.tracks.set(e,{x:e.x-(moving?face.x*.2:0),y:e.y-(moving?face.y*.2:0),time:9.98,gait:gait-(moving?.2*4/1.3:0),facing:face});
   c.save();c.translate(family*128+64,(side*4+frame)*128+112);sprites.draw(c,e,{x:1+face.x,y:1+face.y},10);c.restore();c.fillStyle='#b6a583';c.font='9px Georgia';c.textAlign='center';c.fillText(ENEMY_FAMILIES[family].id,family*128+64,(side*4+frame)*128+126);poses.push(e.visual);
  }
  const hashes=[],bounds=[];for(const tile of sprites.cache.values()){const data=tile.getContext('2d').getImageData(0,0,128,128).data;let hash=2166136261,minX=128,minY=128,maxX=0,maxY=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(data[i+3]>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}for(let k=0;k<4;k++)hash=Math.imul(hash^data[i+k],16777619);}hashes.push(hash>>>0);bounds.push({minX,maxX,minY,maxY});}
  return {poses,hashes,bounds,cache:sprites.cache.size};
 });
 expect(result.cache).toBe(48);expect(new Set(result.hashes).size).toBe(48);expect(new Set(result.poses.map(p=>p.family)).size).toBe(6);expect(result.bounds.every(b=>b.minX>=4&&b.maxX<=124&&b.minY>=4&&b.maxY<=121)).toBe(true);await page.locator('#sheet').screenshot({path:'test-results/v33-enemy-families.png'});
});
test('live enemies animate their new bodies, attack, and remain clickable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const p=createPlayer();p.equipment.armor={id:'test-armor',name:'Test armour',slot:'armor',rarity:'normal',armor:10000,life:10000};p.hp=10000;p.equipment.weapon.damage=5000;
 await page.addInitScript(p=>{if(!localStorage.getItem('ashen-reliquary-save-v1'))localStorage.setItem('ashen-reliquary-save-v1',JSON.stringify({version:1,player:p,zone:'town',seed:42710,depth:1}));},p);page.fixtureZone='dungeon';await page.goto('/');await continueFixture(page);await expect.poll(()=>snapshot(page).then(s=>s.enemyArtLoaded)).toBe(true);
 let s=await snapshot(page);const d=generateDungeon(s.seed,s.depth),nearest=d.enemies.filter(e=>e.type!=='warden').sort((a,b)=>distance(a,s.position)-distance(b,s.position))[0];await followPath(page,d,nearest);
 const families=new Set(),actions=new Set();for(let i=0;i<30;i++){s=await snapshot(page);for(const e of s.visibleEnemies)if(e.visual){families.add(e.visual.family);actions.add(e.visual.action);}if(actions.has('attack')&&actions.has('walk'))break;await page.waitForTimeout(100);}
 expect(families.size).toBeGreaterThan(0);expect(actions.has('attack')).toBe(true);expect(actions.has('walk')).toBe(true);expect(s.enemySpriteCache).toBeLessThanOrEqual(48);await page.screenshot({path:'test-results/v33-enemy-combat.png'});
 const target=s.visibleEnemies.find(e=>e.visual&&e.screen.x>30&&e.screen.x<1400&&e.screen.y>80&&e.screen.y<820);expect(target).toBeTruthy();await page.mouse.click(target.screen.x,target.screen.y);await expect.poll(()=>snapshot(page).then(s=>s.visibleEnemies.find(e=>e.id===target.id)?.hp||0)).toBeLessThan(target.hp);expect(errors).toEqual([]);
});
