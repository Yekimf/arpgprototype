import {point,joint,fitGrips} from './animation-rig.js';
import {WEAPON_GRIPS,WEAPON_SUPPORTS,BOW_STRING,BOW_TIPS,weaponPointOffset} from './weapon-rig.js';

export function solveEquipmentRig(face,look,pose,bounds){
 const roots=[point(face.arm),point(face.offArm)],elbows=[point(face.elbow),point(face.offElbow)],sourceHands=[point(face.hand),point(face.offHand)];
 const lengths=roots.map((root,i)=>[Math.hypot(elbows[i].x-root.x,elbows[i].y-root.y),Math.hypot(sourceHands[i].x-elbows[i].x,sourceHands[i].y-elbows[i].y)]);
 const icon=look.weaponIcon??0,b=bounds[icon]||bounds[0],height=(WEAPON_GRIPS[icon]||WEAPON_GRIPS[0])[4],width=height*b[2]/b[3];
 let primary={...pose.primary},support={...pose.support},supportOffset=null,weaponHand=0;
 if(look.twoHanded&&look.weapon==='bow'){
  weaponHand=1;const string=weaponPointOffset(icon,width,height,pose.angle,BOW_STRING),draw=pose.draw||0;
  primary={x:support.x+string.x-pose.aim.x*draw,y:support.y+string.y-pose.aim.y*draw};supportOffset={x:support.x-primary.x,y:support.y-primary.y};
 }else if(look.twoHanded&&WEAPON_SUPPORTS[icon])supportOffset=weaponPointOffset(icon,width,height,pose.angle,WEAPON_SUPPORTS[icon]);
 if(supportOffset){const fitted=fitGrips(roots,lengths.map(l=>l[0]+l[1]),primary,supportOffset,lengths.map(l=>Math.abs(l[0]-l[1])+.05));primary=fitted.primary;support=fitted.support;}
 const chains=[primary,support].map((goal,i)=>joint(roots[i],goal,...lengths[i],i?(face.back?1:-1):(face.back?-1:1)));
 const hands=chains.map((chain,i)=>{const center=chain.end,dx=center.x-chain.knee.x,dy=center.y-chain.knee.y,len=Math.hypot(dx,dy)||1;return {center,wrist:{x:center.x-dx/len*9,y:center.y-dy/len*9},angle:Math.atan2(dy,dx)-Math.PI/2,shoulder:roots[i],elbow:chain.knee};});
 const anchor=hands[weaponHand].center;
 const string=look.weapon==='bow'?BOW_TIPS.map(p=>{const d=weaponPointOffset(icon,width,height,pose.angle,p);return {x:anchor.x+d.x,y:anchor.y+d.y};}):null;
 return {hands,string,weapon:{icon,width,height,angle:pose.angle,anchor,hand:weaponHand},supportOffset,pose};
}
