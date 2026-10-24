const validPoint=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y);
const EPSILON=1e-10;

// Earliest contact on the entire travelled segment, including its endpoints.
// This catches small targets even when a projectile crosses them between frames.
export function segmentCircleTime(from,to,center,radius=.65){
  if(!validPoint(from)||!validPoint(to)||!validPoint(center)||!Number.isFinite(radius)||radius<0)return null;
  const ox=from.x-center.x,oy=from.y-center.y,c=ox*ox+oy*oy-radius*radius;
  if(c<=EPSILON)return 0;
  const dx=to.x-from.x,dy=to.y-from.y,a=dx*dx+dy*dy;
  if(a<=EPSILON)return null;
  const b=ox*dx+oy*dy,discriminant=b*b-a*c;
  if(discriminant<-EPSILON)return null;
  const t=(-b-Math.sqrt(Math.max(0,discriminant)))/a;
  return t>=-EPSILON&&t<=1+EPSILON?Math.max(0,Math.min(1,t)):null;
}

// Only contacts strictly before the obstruction are returned. With no wall,
// leave before at Infinity so a target at the exact segment end still counts.
// A radius callback can supply a different footprint for large enemies.
export function projectileContacts(from,to,enemies,{hitIds=null,radius=.65,before=Infinity}={}){
  if(!validPoint(from)||!validPoint(to)||!Array.isArray(enemies)||!(before>0))return [];
  const contacts=[];
  for(const enemy of enemies){
    if(!enemy||enemy.dead||hitIds?.has(enemy.id))continue;
    const t=segmentCircleTime(from,to,enemy,typeof radius==='function'?radius(enemy):radius);
    if(t!==null&&t<before-EPSILON)contacts.push({enemy,t});
  }
  // Stable sort preserves the supplied order when two footprints overlap.
  contacts.sort((a,b)=>a.t-b.t);
  return contacts;
}

// Terrain is a tile grid, so a maximum 0.2-unit step cannot skip a closed tile.
// Refine the first closed sample back to its boundary for impact placement.
// The hard bound rejects implausibly huge jumps instead of doing unbounded work
// or taking wider samples that could tunnel through a wall.
export function firstWallTime(from,to,isOpen,{radius=.05,maxStep=.2}={}){
  if(!validPoint(from)||!validPoint(to)||typeof isOpen!=='function')return 0;
  const step=Number.isFinite(maxStep)?Math.max(.01,Math.min(.25,maxStep)):.2;
  const r=Number.isFinite(radius)?Math.max(0,radius):.05;
  if(!isOpen(from.x,from.y,r))return 0;
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),steps=Math.ceil(length/step);
  if(!Number.isFinite(length)||steps>1024)return 0;
  if(!steps)return null;
  for(let i=1;i<=steps;i++){
    const t=i/steps;
    if(isOpen(from.x+dx*t,from.y+dy*t,r))continue;
    let low=(i-1)/steps,high=t;
    for(let j=0;j<8;j++){
      const middle=(low+high)/2;
      if(isOpen(from.x+dx*middle,from.y+dy*middle,r))low=middle;else high=middle;
    }
    return high;
  }
  return null;
}
