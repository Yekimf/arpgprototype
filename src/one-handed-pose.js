// Low hip grip, bent elbow and an outward/upward weapon, following the supplied
// knight-and-shield reference. Ranged and two-handed weapons use their own poses.
export const oneHandedMelee=look=>!look.twoHanded&&['sword','axe','mace','flail','dagger','spear','staff'].includes(look.weapon);
const smooth=t=>t*t*(3-2*t);
const swing=[[0,0,0,0,0],[.23,-10,-25,0,.4],[.48,34,-8,1,0],[.70,21,5,1,.45],[1,0,0,0,0]];
const thrust=[[0,0,0,0,0],[.25,-9,-10,0,.12],[.48,38,-6,1,0],[.7,20,-3,1,0],[1,0,0,0,0]];
function sample(track,t){const at=track.findIndex(k=>k[0]>=t);if(at<=0)return track[0].slice(1);const a=track[at-1],b=track[at],u=smooth((t-a[0])/(b[0]-a[0]));return a.slice(1).map((n,i)=>n+(b[i+1]-n)*u);}
const turn=(from,to,amount)=>{const delta=Math.atan2(Math.sin(to-from),Math.cos(to-from));return from+delta*amount;};
export function oneHandedPose(face,look,state,heading){
 const back=!!face.back,dx=heading.x,dy=heading.y*.5,length=Math.hypot(dx,dy)||1,aim={x:dx/length,y:dy/length},long=['spear','staff'].includes(look.weapon);
 const readyAngle=(back?(long?-.94:.035):(long?-2.20:-2.45))+aim.x*(back?.025:.045);
 const primary={x:face.hand[0]*320-2,y:face.hand[1]*320+(back?3:-3)},support={x:face.offHand[0]*320,y:face.offHand[1]*320};
 if(look.shield&&look.shield!=='none'){support.x+=back?12:-12;support.y=160;}
 let angle=readyAngle;
 if(state.action==='attack'){
  const t=Math.max(0,Math.min(1,state.frame/Math.max(1,state.count-1))),[reach,lift,weight,sweep]=sample(state.mode==='thrust'?thrust:swing,t);
  primary.x+=aim.x*reach;primary.y+=aim.y*reach*.45+lift;
  angle=turn(readyAngle,Math.atan2(aim.y,aim.x),weight)+sweep*(back?-1:1);
 }else if(state.action==='walk'){
  const step=Math.sin(state.frame/16*Math.PI*2);primary.y+=step*1.4;support.y-=step*.8;angle+=step*.025;
 }
 return {primary,support,angle,aim,draw:0,gripWrap:true,weaponHand:'primary'};
}
