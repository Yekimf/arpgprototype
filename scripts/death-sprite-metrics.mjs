import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';

// Match meaningful, visible pixels rather than nominal atlas cell dimensions.
// Reuse this when packing death art so a differently sized painting cannot make
// the enemy grow at the transition from its living animation.
export async function deathSpriteMetrics(){
 const read=async file=>sharp(`src/art/runtime/${file}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const bounds=(image,left,top,width,height)=>{
  const {data,info}=image;let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;
  for(let y=Math.ceil(top);y<Math.min(info.height,top+height);y++)for(let x=Math.ceil(left);x<Math.min(info.width,left+width);x++)if(data[(y*info.width+x)*4+3]>100){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}
  if(!Number.isFinite(y1))throw Error('Empty death or living sprite');
  return {height:y2-y1+1,bottom:y2+1-top,width:x2-x1+1};
 };
 const [front,back,deaths,boss,campaign,world]=await Promise.all(['enemies-front.webp','enemies-back.webp','enemy-deaths.webp','boss-death.webp','campaign-atlas.webp','world-atlas.webp'].map(read));
 const live=Object.fromEntries([['front',front],['back',back]].map(([side,image])=>[side,Array.from({length:6},(_,row)=>bounds(image,0,row*128,128,128).height)]));
 const dead=Array.from({length:6},(_,row)=>bounds(deaths,0,row*160,160,160).height);
 const campaignCell=campaign.info.width/4,campaignCrop=campaignCell-1.6;
 const bosses=Array.from({length:8},(_,index)=>{const b=bounds(campaign,index%4*campaignCell+.8,Math.floor(index/4)*campaignCell+.8,campaignCrop,campaignCrop);return {height:b.height/campaignCrop,foot:b.bottom/campaignCrop-1};});
 const worldCell=world.info.width/4,worldCrop=worldCell-1.6,b=bounds(world,2*worldCell+.8,worldCell+.8,worldCrop,worldCrop);
 return {live,dead,boss:bounds(boss,0,0,160,160).height,campaign:bosses,warden:{height:b.height/worldCrop,foot:b.bottom/worldCrop-1}};
}
export async function writeDeathSpriteMetrics(){
 const metrics=await deathSpriteMetrics();
 await writeFile('src/death-sprite-metrics.js','// Generated from visible atlas pixels by scripts/death-sprite-metrics.mjs.\nexport const DEATH_SPRITE_METRICS='+JSON.stringify(metrics)+';\n');
}
if(process.argv[1]?.endsWith('/death-sprite-metrics.mjs'))await writeDeathSpriteMetrics();
