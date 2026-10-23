import {random,makeEnemy} from './game.js';
// A ruined chapel above a sprawling burial complex. Six offset wings force a
// journey through the nave and crypts; short branches contain optional veterans.
export function generateRedoubt(seed,depth){
 const rng=random(seed+301),size=152,tiles=Array.from({length:size},()=>Array(size).fill(0)),rooms=[],props=[],enemies=[];
 const carve=(x,y,w,h)=>{for(let yy=Math.floor(y);yy<y+h;yy++)for(let xx=Math.floor(x);xx<x+w;xx++)if(xx>2&&yy>2&&xx<size-3&&yy<size-3)tiles[yy][xx]=1;};
 const room=(x,y,w,h,name,kind='crypt')=>{const r={x:x+Math.floor(rng()*5)-2,y:y+Math.floor(rng()*5)-2,w:w+Math.floor(rng()*4),h:h+Math.floor(rng()*3),name,kind};carve(r.x,r.y,r.w,r.h);rooms.push(r);return {x:r.x+Math.floor(r.w/2)+.5,y:r.y+Math.floor(r.h/2)+.5};};
 const link=(a,b)=>{carve(Math.min(a.x,b.x)-2,a.y-2,Math.abs(b.x-a.x)+5,5);carve(b.x-2,Math.min(a.y,b.y)-2,5,Math.abs(b.y-a.y)+5);};
 const spine=[room(62,124,22,15,'The Fallen Chapel','nave'),room(95,101,24,15,'The Rootbound Cloister'),room(52,80,28,18,'The Burial Nave','nave'),room(17,58,25,16,'The Unquiet Reliquary'),room(65,35,25,18,'The Chain Hall','nave'),room(61,7,30,20,'The Thornbound Seat','sanctum')];
 spine.slice(1).forEach((at,i)=>link(spine[i],at));
 const wings=[[22,123,0],[113,123,0],[112,79,1],[17,93,2],[103,59,2],[12,33,3],[35,9,4],[113,28,4]];
 wings.forEach(([x,y,tier],i)=>{const at=room(x,y,16,13,['The Nameless Vault','The Penitents’ Rest','The Broken Vestry','The Sepulchre Watch'][i%4]);link(spine[tier],at);});
 const start=spine[0],portal=spine.at(-1);let id=1;
 for(const r of rooms){
  for(let i=0;i<(r.kind==='sanctum'?5:8);i++){const at={x:r.x+2+rng()*(r.w-4),y:r.y+2+rng()*(r.h-4)};if(Math.hypot(at.x-start.x,at.y-start.y)>7&&Math.hypot(at.x-portal.x,at.y-portal.y)>4)enemies.push(makeEnemy(id++,at.x,at.y,i%4===0?'wraith':i%3===0?'crawler':'skeleton',depth,rng()<.07));}
  for(const x of [r.x+1,r.x+r.w-2])for(const y of [r.y+1,r.y+r.h-2])props.push({x,y,type:r.kind==='nave'?'pillar':'tomb',variant:2});
  for(let i=0;i<9;i++)props.push({x:r.x+1+rng()*(r.w-2),y:r.y+1+rng()*(r.h-2),type:i%3?'bones':'rubble',variant:i%4});
  props.push({x:r.x+2,y:r.y+r.h/2,type:'brazier',variant:1});
 }
 enemies.push(makeEnemy(id++,portal.x,portal.y,'warden',depth,true));
 const entryGate={x:start.x,y:start.y+4};
 return {seed,size,tiles,rooms,start,portal,enemies,props,depth,seen:new Set(),bossDead:false,biome:'thornbound-redoubt',tileset:'redoubt',entryGate,entryFacing:{x:0,y:-1},landmarks:spine.map((p,i)=>({...p,name:rooms[i].name}))};
}
