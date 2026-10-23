import {random,isWalkable} from './game.js';

// A private deterministic stream prevents ambient animals from affecting loot rolls.
function next(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function createFlock(seed,pen,count=22){
 const rng=random(seed^0x73686565),margin=2;
 return Array.from({length:count},(_,i)=>({id:'sheep-'+i,type:'livestock',seed:(rng()*4294967296)>>>0,x:pen.x1+margin+rng()*(pen.x2-pen.x1-margin*2),y:pen.y1+margin+rng()*(pen.y2-pen.y1-margin*2),heading:rng()*Math.PI*2,gait:0,wait:rng()*6,target:null,moving:false,coat:i%4}));
}
export function updateFlock(d,dt){
 if(!d.pasture||!d.livestock)return;
 const b=d.pasture,loX=b.x1+1.6,hiX=b.x2-1.6,loY=b.y1+1.6,hiY=b.y2-1.6;
 for(const s of d.livestock){
  s.moving=false;
  if(s.wait>0){s.wait-=dt;continue;}
  if(!s.target){const angle=next(s)*Math.PI*2,r=1.5+next(s)*4;s.target={x:Math.max(loX,Math.min(hiX,s.x+Math.cos(angle)*r)),y:Math.max(loY,Math.min(hiY,s.y+Math.sin(angle)*r))};}
  const dx=s.target.x-s.x,dy=s.target.y-s.y,length=Math.hypot(dx,dy),step=Math.min(length,dt*.46);
  if(length<.08){s.target=null;s.wait=2+next(s)*8;continue;}
  s.heading=Math.atan2(dy,dx);s.x=Math.max(loX,Math.min(hiX,s.x+dx/length*step));s.y=Math.max(loY,Math.min(hiY,s.y+dy/length*step));s.gait+=step;s.moving=true;
 }
}
export function dressForestFloor(d){
 const rng=random(d.seed^0x67726173),grass=[];
 // Seed the entire region during area creation. Clumps are painter-sorted with
 // actors, so the blades in front naturally cover boots instead of the torso.
 for(let y=19;y<d.size-4;y+=1.25)for(let x=5;x<d.size-4;x+=1.25){
  const at={x:x+rng()*.9,y:y+rng()*.9},b=d.townBounds;
  if(at.x>177&&at.x<213&&at.y<42||!isWalkable(d,at.x,at.y)||d.roads.has(Math.floor(at.y)*d.size+Math.floor(at.x))||b&&at.x>b.x1-1&&at.x<b.x2+1&&at.y>b.y1-1&&at.y<b.y2+1||Math.hypot(at.x-d.portal.x,at.y-d.portal.y)<17||rng()>.66)continue;
  grass.push({...at,type:'forest-grass',variant:Math.floor(rng()*6)});
 }
 return grass;
}
// Projected world direction is used by both arrows and lantern brackets.
export function roadFacing(dx,dy){const length=Math.hypot(dx,dy)||1;return {dx:dx/length,dy:dy/length,angle:Math.atan2((dx+dy)*17,(dx-dy)*34)};}
