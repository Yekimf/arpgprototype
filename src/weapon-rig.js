// Grip and tip measurements refer to the tightly cropped weapon paintings.
// Artwork rotates around the grip, never around an arbitrary item rectangle.
export const WEAPON_GRIPS=[
 [.78,.19,.05,.97,125],[.78,.19,.03,.99,166],[.74,.26,.03,.99,80],[24/185,.86,.79,.16,125],
 [32/192,.84,.66,.14,146],[29/172,.85,.73,.12,118],[30/220,.83,.55,.12,132],[34/190,.83,.98,.02,185],
 [33/167,.83,.70,.12,180],[28/159,.82,.65,.15,180],[33/154,.78,.78,.18,95],[25/135,.80,.70,.12,100],
 [31/128,124/240,.95,.01,165],[80/240,125/222,.62,.30,128],[32/171,.81,.67,.14,150],[18/149,.85,.67,.15,120]
];
// Second grips are measured on the painted handle/stock, not a fixed distance
// toward the weapon tip. The greatsword's second hand belongs behind the hilt.
export const WEAPON_SUPPORTS={1:[139/154,20/240],4:[72/192,145/240],7:[.39,.59],8:[70/167,142/240],9:[60/159,140/240],13:[127/240,65/222],14:[60/171,140/240]};
export const BOW_STRING=[.52,.52];
export const BOW_TIPS=[[.94,.02],[.05,.99]];
export function weaponPointOffset(icon,width,height,angle,point){
 const [gx,gy]=WEAPON_GRIPS[icon]||WEAPON_GRIPS[0],rotation=weaponPlacement(icon,width,height,angle).rotation,dx=(point[0]-gx)*width,dy=(point[1]-gy)*height;
 return {x:dx*Math.cos(rotation)-dy*Math.sin(rotation),y:dx*Math.sin(rotation)+dy*Math.cos(rotation)};
}
export const ATTACK_FRAMES=8;
export function attackTiming(weapon,speed=1){const look=weapon?.look||'sword',heavy=weapon?.twoHanded||['greatsword','warhammer'].includes(look),ranged=!!weapon?.ranged;const duration=Math.max(.22,Math.min(.64,(weapon?heavy?.56:look==='dagger'?.3:ranged?.4:.42:.32)/Math.max(.65,speed)));return {duration,impact:duration*(look==='spear'?.48:ranged?.40:.44),recovery:Math.max(duration,(weapon?heavy?.60:look==='dagger'?.33:ranged?.43:.46:.36)/Math.max(.65,speed))};}
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
