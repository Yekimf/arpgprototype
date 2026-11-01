// Low hip grip, bent elbow and an outward/upward weapon, following the supplied
// knight-and-shield reference. Ranged and two-handed weapons use their own poses.
export const oneHandedMelee=look=>!look.twoHanded&&['sword','axe','mace','flail','dagger','spear','staff','wand'].includes(look.weapon);
// Screen-space direction from the hand to the weapon's head or point. Front
// and rear carries have different silhouettes, as in the approved model sheet.
// These angles are shared by both bodies; the grip remains on the measured hilt.
export const CARRY_ANGLES={
 0:[-2.45,.36],2:[2.43,.55],3:[-2.55,.35],5:[2.72,.30],
 6:[-2.42,.25],7:[-2.06,-1.03],10:[2.43,.52],11:[2.39,.50],15:[-1.46,-1.28],
};
// Each weapon's grip rests at a different point relative to the painted hip.
// Values are front-x, front-y, rear-x, rear-y offsets in the 320px source
// canvas. Keeping the original hand measurement as the origin also lets the
// same poses work with both guard bodies and all sixteen projected facings.
export const CARRY_GRIPS={
 0:[-4,0,0,3],     // Falchion rests beside the sword arm.
 2:[-2,3,3,2],     // Short dagger stays close to the hip.
 3:[-8,-8,7,-3],   // Axe haft is lifted and held farther out.
 5:[-7,-3,7,4],    // Mace hangs outward at the waist.
 6:[-4,3,5,3],     // Flail handle stays clear of the thigh.
 7:[-2,-10,5,-6], // Spear shaft rises past the shoulder.
 10:[-7,0,7,6],   // Wands hang below a relaxed wrist.
 11:[-7,0,7,6],
 15:[-8,-9,9,-6], // Sceptre is presented higher and farther out.
};
const smooth=t=>t*t*(3-2*t);
const swing=[[0,0,0,0,0],[.23,-10,-25,0,.4],[.48,34,-8,1,0],[.70,21,5,1,.45],[1,0,0,0,0]];
const thrust=[[0,0,0,0,0],[.25,-9,-10,0,.12],[.48,38,-6,1,0],[.7,20,-3,1,0],[1,0,0,0,0]];
function sample(track,t){const at=track.findIndex(k=>k[0]>=t);if(at<=0)return track[0].slice(1);const a=track[at-1],b=track[at],u=smooth((t-a[0])/(b[0]-a[0]));return a.slice(1).map((n,i)=>n+(b[i+1]-n)*u);}
const turn=(from,to,amount)=>{const delta=Math.atan2(Math.sin(to-from),Math.cos(to-from));return from+delta*amount;};
export function oneHandedPose(face,look,state,heading){
 const back=!!face.back,dx=heading.x,dy=heading.y*.5,length=Math.hypot(dx,dy)||1,aim={x:dx/length,y:dy/length},long=['spear','staff'].includes(look.weapon);
 const pair=CARRY_ANGLES[look.weaponIcon],readyAngle=(pair?pair[back?1:0]:back?(long?-1.03:.36):(long?-2.06:-2.45))+aim.x*(back?.018:.025);
 const grip=CARRY_GRIPS[look.weaponIcon]||[0,0,0,0],offset=back?2:0;
 const primary={x:face.hand[0]*320-2+grip[offset],y:face.hand[1]*320+(back?3:-3)+grip[offset+1]},support={x:face.offHand[0]*320,y:face.offHand[1]*320};
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
