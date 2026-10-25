import {random,isWalkable} from './game.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function seedChickens(d){
 if(d.chickens)return d.chickens;d.chickens=[];
 if(!d.outdoor&&!d.town)return d.chickens;
 const rng=random((d.seed||791)^0x68656e73),count=Math.min(9,Math.max(1,Math.floor(d.size*d.size/6000)));
 for(let attempt=0;attempt<900&&d.chickens.length<count;attempt++){
  const x=5+rng()*(d.size-10),y=5+rng()*(d.size-10),p={x,y},pen=d.pasture;
  if(pen&&x>pen.x1-2&&x<pen.x2+2&&y>pen.y1-2&&y<pen.y2+2||(d.props||[]).some(o=>['building','farm-prop','kingdom-gate'].includes(o.type)&&dist(o,p)<3)||d.chickens.some(c=>dist(c,p)<20)||![[-1,-1],[-1,1],[1,-1],[1,1],[0,0]].every(([dx,dy])=>isWalkable(d,x+dx,y+dy,.2)))continue;
  d.chickens.push({id:'hen-'+d.chickens.length,type:'chicken',x,y,home:{x,y},seed:(rng()*4294967296)>>>0,coat:rng()<.5?0:1,heading:rng()*Math.PI*2,gait:0,wait:rng()*4,moving:false,target:null});
 }
 if(d.townBounds||d.town){const at=d.start;if(at&&isWalkable(d,at.x+3,at.y+2,.2))d.chickens.push({id:'camp-hen',type:'chicken',x:at.x+3,y:at.y+2,home:{x:at.x+3,y:at.y+2},seed:791,coat:0,heading:0,gait:0,wait:3,moving:false,target:null});}
 d.critters=d.critters?.filter(c=>c.species!=='hen');return d.chickens;
}
function next(c){c.seed=(Math.imul(c.seed,1664525)+1013904223)>>>0;return c.seed/4294967296;}
export function updateChickens(d,dt){for(const c of d.chickens||[]){c.moving=false;if(c.capturing)continue;if(c.wait>0){c.wait-=dt;continue;}
 if(!c.target){const a=next(c)*Math.PI*2,r=1.5+next(c)*4,p={x:c.home.x+Math.cos(a)*r,y:c.home.y+Math.sin(a)*r};if(!isWalkable(d,p.x,p.y,.2)){c.wait=.4;continue;}c.target=p;}
 const dx=c.target.x-c.x,dy=c.target.y-c.y,len=Math.hypot(dx,dy),step=Math.min(len,dt*1.8);
 if(len<.08){c.target=null;c.wait=1+next(c)*5;continue;}
 const x=c.x+dx/len*step,y=c.y+dy/len*step;if(!isWalkable(d,x,y,.2)){c.target=null;c.wait=.6;continue;}c.x=x;c.y=y;c.heading=Math.atan2(dy,dx);c.gait+=step*7;c.moving=true;
}}
export const nearChicken=(d,p)=>(d.chickens||[]).some(c=>!c.capturing&&!p.pets?.captured?.includes(String(d.seed||0)+':'+c.id)&&dist(c,p)<=6);
export const chickenDamage=(active,damage)=>damage*(active?1.25:1);
export const chickenRegen=(active,regen)=>active?regen*1.5+1:regen;
