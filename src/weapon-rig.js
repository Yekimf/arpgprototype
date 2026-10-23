// Grip and tip measurements refer to the tightly cropped weapon paintings.
// Artwork rotates around the grip, never around an arbitrary item rectangle.
export const WEAPON_GRIPS=[
 [.78,.19,.05,.97,125],[.78,.19,.03,.99,166],[.74,.26,.03,.99,80],[.22,.86,.79,.16,125],
 [.28,.84,.66,.14,146],[.25,.85,.73,.12,118],[.21,.83,.55,.12,132],[.24,.83,.98,.02,185],
 [.25,.83,.70,.12,180],[.27,.82,.65,.15,180],[.30,.78,.78,.18,95],[.28,.80,.70,.12,100],
 [.55,.52,.75,.04,165],[.42,.76,.62,.30,128],[.27,.81,.67,.14,150],[.27,.85,.67,.15,120]
];
export const ATTACK_FRAMES=8;
export function attackTiming(weapon,speed=1){const look=weapon?.look||'sword',heavy=weapon?.twoHanded||['greatsword','warhammer'].includes(look),ranged=!!weapon?.ranged;const duration=Math.max(.22,Math.min(.64,(weapon?heavy?.56:look==='dagger'?.3:ranged?.4:.42:.32)/Math.max(.65,speed)));return {duration,impact:duration*(look==='spear'?.48:ranged?.40:.44),recovery:Math.max(duration,.48/Math.max(.3,speed))};}
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export function armedPose(face,{twoHanded=false,weapon='sword'}={},progress=0,attack=false,heading={x:0,y:1}){
 const hand={x:face.hand[0]*320,y:face.hand[1]*320},shoulder={x:face.arm[0]*320,y:face.arm[1]*320},back=face.hand[0]>.5;
 let primary=twoHanded?{x:166,y:145}:hand,angle=twoHanded?-.9:back?1.0:2.12;
 if(attack){const t=Math.max(0,Math.min(1,progress)),dx=heading.x,dy=heading.y*.5,len=Math.hypot(dx,dy)||1,wind={x:shoulder.x-24,y:shoulder.y+16},strike={x:shoulder.x+dx/len*68,y:shoulder.y+dy/len*54+15};
  const u=t<.25?t/.25:t<.5?(t-.25)/.25:(t-.5)/.5;
  primary=t<.25?mix(primary,wind,u*u):t<.5?mix(wind,strike,1-(1-u)**2):mix(strike,primary,u*u*(3-2*u));
  const aimed=Math.atan2(dy,dx),sweep=weapon==='spear'||weapon==='dagger'?0:weapon==='bow'||weapon==='crossbow'?0:(t-.44)*2.4;
  angle=aimed+sweep;
 }
 const support={x:primary.x+Math.cos(angle)*36,y:primary.y+Math.sin(angle)*36};
 return {primary,support:twoHanded?support:{x:face.offHand[0]*320,y:face.offHand[1]*320},angle};
}
export function weaponPlacement(icon,width,height,angle){const [gx,gy,tx,ty]=WEAPON_GRIPS[icon]||WEAPON_GRIPS[0],sourceAngle=Math.atan2((ty-gy)*height,(tx-gx)*width);return {x:-gx*width,y:-gy*height,rotation:angle-sourceAngle};}
