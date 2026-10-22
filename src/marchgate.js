import {random,makeEnemy} from './game.js';
// Marchgate is a border fortress: a long barbican, successive courts and a keep.
// Side barracks and stores branch from the main route rather than shortcutting it.
export function generateMarchgate(seed,depth){
 const rng=random(seed),size=144,tiles=Array.from({length:size},()=>Array(size).fill(0)),props=[],enemies=[],rooms=[];
 const carve=(x,y,w,h)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>1&&yy>1&&xx<size-2&&yy<size-2)tiles[yy][xx]=1;};
 const room=(x,y,w,h,name,court=false)=>{const r={x,y,w,h,name,court};rooms.push(r);carve(x,y,w,h);return r;};
 const spine=[room(64,116,18,18,'The Barbican',true),room(64,92,18,17,'Gatehouse Hall'),room(48,69,44,18,'Outer Muster Court',true),room(62,48,20,15,'Murder-Gate Passage'),room(48,25,44,18,'The Inner Ward',true),room(59,5,26,15,'Hadrin’s Command Keep')];
 const sides=[room(18,113,25,16,'West Guard Barracks'),room(101,113,24,16,'East Guard Barracks'),room(18,89,25,16,'The Old Armoury'),room(101,90,24,15,'Sappers’ Quarters'),room(14,66,23,18,'Confiscated Stores'),room(106,66,24,18,'Garrison Chapel'),room(20,43,25,16,'West Watch'),room(101,43,25,16,'East Watch'),room(16,22,21,16,'The Scribes’ Vault'),room(107,22,21,16,'The Holding Cells')];
 const line=(a,b,width=5)=>{const x=Math.floor(a.x),y=Math.floor(a.y),tx=Math.floor(b.x),ty=Math.floor(b.y),half=Math.floor(width/2);carve(Math.min(x,tx)-half,y-half,Math.abs(tx-x)+width,width);carve(tx-half,Math.min(y,ty)-half,width,Math.abs(ty-y)+width);};
 const centre=r=>({x:r.x+Math.floor(r.w/2)+.5,y:r.y+Math.floor(r.h/2)+.5});
 for(let i=1;i<spine.length;i++)line(centre(spine[i-1]),centre(spine[i]),6);
 sides.forEach((r,i)=>line(centre(r),centre(spine[i<2?0:i<4?1:i<6?2:i<8?3:4])));
 const start={x:72.5,y:137.5},portal={x:72.5,y:12.5};line(start,centre(spine[0]),7);
 let id=1;for(const r of rooms){const at=centre(r),count=r.court?8:5;for(let i=0;i<count;i++){const x=r.x+2+rng()*(r.w-4),y=r.y+2+rng()*(r.h-4);if(Math.hypot(x-start.x,y-start.y)>9&&Math.hypot(x-portal.x,y-portal.y)>4)enemies.push(makeEnemy(id++,x,y,rng()<.2?'wraith':rng()<.35?'crawler':'skeleton',depth,rng()<.08));}
  for(const [x,y]of [[r.x+1,r.y+1],[r.x+r.w-2,r.y+1],[r.x+1,r.y+r.h-2],[r.x+r.w-2,r.y+r.h-2]])props.push({x,y,type:r.court?'brazier':'pillar',variant:0});
  for(let i=0;i<8;i++)props.push({x:r.x+1+rng()*(r.w-2),y:r.y+1+rng()*(r.h-2),type:rng()<.6?'rubble':'bones',variant:i%4});
  if(!r.court)props.push({x:at.x-3,y:at.y-3,type:'tomb',variant:1});
 }
 enemies.push(makeEnemy(id++,portal.x,portal.y,'warden',depth,true));
 return {seed,size,tiles,rooms,start,portal,enemies,props,depth,seen:new Set(),bossDead:false,fortress:true,courts:rooms.filter(r=>r.court),landmarks:spine.map(r=>({...centre(r),name:r.name}))};
}
