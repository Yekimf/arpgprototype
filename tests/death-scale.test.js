import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ENEMY_FAMILIES} from '../src/enemy-appearance.js';
import {DEATH_SPRITE_METRICS as metrics} from '../src/death-sprite-metrics.js';
import {deathSpriteLayout} from '../src/death-scale.js';
import {deathSpriteMetrics} from '../scripts/death-sprite-metrics.mjs';

const roles=['guard','lunge','archer','brute','hexer','bomber'];

test('death scale calibration matches the actual shipped living and death paintings',async()=>{
 assert.deepEqual(metrics,await deathSpriteMetrics(),'Regenerate death sprite metrics after replacing or repacking the atlases');
});

test('each enemy family retains its visible standing height and foot anchor at death, including elites and rear views',()=>{
 for(const [row,family] of ENEMY_FAMILIES.entries())for(const back of [false,true])for(const elite of [false,true]){
  const body={type:'skeleton',role:roles[row],elite,visual:{back}},layout=deathSpriteLayout(body);
  const liveHeight=metrics.live[back?'back':'front'][row]*family.size/128*(elite?1.1:1);
  const deathHeight=metrics.dead[row]*layout.size/160;
  assert.ok(Math.abs(deathHeight-liveHeight)<.000001,`${family.id}/${back}/${elite} enlarged at death`);
  assert.ok(Math.abs(layout.top+138*layout.size/160)<.000001,'Corpse detached from its ground anchor');
 }
});

test('painted collapse frames keep a fixed scale as they settle into a corpse',async()=>{
 const {data,info}=await sharp('src/art/runtime/enemy-deaths.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const [row,family] of ENEMY_FAMILIES.entries()){
  const body={type:'skeleton',role:roles[row]},layout=deathSpriteLayout(body);let firstHeight;
  for(let frame=0;frame<6;frame++){
   let top=160,bottom=-1;
   for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(data[((row*160+y)*info.width+frame*160+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   const height=(bottom-top+1)*layout.size/160;
   firstHeight??=height;
   assert.ok(height<=firstHeight+.01,`${family.id} grows during frame ${frame}`);
   assert.ok(Math.abs(layout.top+(bottom+1)*layout.size/160)<1,`${family.id} floats during frame ${frame}`);
  }
 }
});

test('boss deaths use the living boss silhouette rather than a fixed oversized canvas',()=>{
 for(const bossId of ['captain-1-0','captain-1-1','knight-1','king','wanderer',undefined]){
  const layout=deathSpriteLayout({type:'warden',bossId});
  const index=bossId==='king'?5:bossId==='wanderer'?6:0,live=bossId?metrics.campaign[index]:metrics.warden;
  assert.ok(Math.abs(metrics.boss*layout.size/160-144*live.height)<.000001);
  assert.equal(layout.boss,true);
  assert.ok(Math.abs(layout.top+146*layout.size/160)<2);
 }
 assert.equal(deathSpriteLayout({type:'skeleton',bossId:'unknown'}),null);
});
