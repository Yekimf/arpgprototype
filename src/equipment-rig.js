import {point,joint,fitGrips} from './animation-rig.js';
import {WEAPON_SUPPORTS,BOW_STRING,BOW_TIPS,weaponPointOffset,weaponRenderHeight} from './weapon-rig.js';

// A supporting hand close to its shoulder is common when carrying a staff,
// crossbow or axe. A fixed-length two-bone solve folds the elbow above the
// shoulder in that pose, even though the painted sleeve bends below it. Let
// the forearm shorten for the carry while keeping the hand on the handle.
function supportElbow(root,center,solved,source){
 const reach=Math.hypot(center.x-root.x,center.y-root.y);
 const blend=Math.max(0,Math.min(1,(85-reach)/50));
 let x=solved.x+(source.x-solved.x)*blend,y=solved.y+(source.y-solved.y)*blend;
 const dx=x-center.x,dy=y-center.y,d=Math.hypot(dx,dy);
 if(d<24){const length=d||1;x=center.x+dx/length*24;y=center.y+dy/length*24;}
 return {x,y};
}

export function solveEquipmentRig(face,look,pose,bounds){
 const roots=[point(face.arm),point(face.offArm)],elbows=[point(face.elbow),point(face.offElbow)],sourceHands=[point(face.hand),point(face.offHand)];
 const lengths=roots.map((root,i)=>[Math.hypot(elbows[i].x-root.x,elbows[i].y-root.y),Math.hypot(sourceHands[i].x-elbows[i].x,sourceHands[i].y-elbows[i].y)]);
 const icon=look.weaponIcon??0,b=bounds[icon]||bounds[0],height=weaponRenderHeight(icon,face.back),width=height*b[2]/b[3];
 let primary={...pose.primary},support={...pose.support},supportOffset=null,weaponHand=0;
 if(look.twoHanded&&look.weapon==='bow'){
  weaponHand=1;
  if(!pose.relaxedBow){const string=weaponPointOffset(icon,width,height,pose.angle,BOW_STRING),draw=pose.draw||0;
   primary={x:support.x+string.x-pose.aim.x*draw,y:support.y+string.y-pose.aim.y*draw};supportOffset={x:support.x-primary.x,y:support.y-primary.y};}
 }else if(look.twoHanded&&!pose.singleCrossbow&&WEAPON_SUPPORTS[icon])supportOffset=weaponPointOffset(icon,width,height,pose.angle,WEAPON_SUPPORTS[icon]);
 if(supportOffset){const fitted=fitGrips(roots,lengths.map(l=>l[0]+l[1]),primary,supportOffset,lengths.map(l=>Math.abs(l[0]-l[1])+.05));primary=fitted.primary;support=fitted.support;}
 const hands=[primary,support].map((goal,i)=>{
  if(i===0&&pose.gripWrap){
   // A forearm ends at the wrist, not at the middle of the weapon handle. The
   // source measurement includes the palm, so subtract that length first.
   const dx=roots[0].x-goal.x,dy=roots[0].y-goal.y,d=Math.hypot(dx,dy)||1,heel={x:dx/d*10,y:dy/d*10},target={x:goal.x+heel.x,y:goal.y+heel.y};
   const chain=joint(roots[0],target,lengths[0][0],Math.max(8,lengths[0][1]-9),1),wrist=chain.end,center={x:wrist.x-heel.x,y:wrist.y-heel.y},ux=Math.cos(pose.angle),uy=Math.sin(pose.angle),vx=-uy,vy=ux,side=heel.x*vx+heel.y*vy>=0?1:-1;
   return {center,wrist,angle:Math.atan2(-heel.y,-heel.x)-Math.PI/2,shoulder:roots[0],elbow:chain.knee,grip:{angle:pose.angle,side,wristX:heel.x*ux+heel.y*uy,wristY:(heel.x*vx+heel.y*vy)*side}};
  }
  const chain=joint(roots[i],goal,...lengths[i],i?(face.back?1:-1):(face.back?-1:1)),center=chain.end;
  const elbow=i&&look.twoHanded?supportElbow(roots[i],center,chain.knee,elbows[i]):chain.knee;
  const dx=center.x-elbow.x,dy=center.y-elbow.y,len=Math.hypot(dx,dy)||1;
  const wrist={x:center.x-dx/len*9,y:center.y-dy/len*9};
  // Both hands close around a two-handed handle. The overlay uses a palm behind
  // the weapon and fingers above it, while the wrist remains at the handle.
  const wraps=look.twoHanded&&(look.weapon!=='bow'||i===1)&&!(pose.singleCrossbow&&i===1),ux=Math.cos(pose.angle),uy=Math.sin(pose.angle),vx=-uy,vy=ux;
  const heel={x:wrist.x-center.x,y:wrist.y-center.y},side=heel.x*vx+heel.y*vy>=0?1:-1;
  const wrap=wraps?{angle:pose.angle,side,wristX:heel.x*ux+heel.y*uy,wristY:(heel.x*vx+heel.y*vy)*side}:null;
  return {center,wrist,angle:Math.atan2(dy,dx)-Math.PI/2,shoulder:roots[i],elbow,...(wrap?{wrap}:{})};
 });
 const anchor=hands[weaponHand].center;
 const string=look.weapon==='bow'?BOW_TIPS.map(p=>{const d=weaponPointOffset(icon,width,height,pose.angle,p);return {x:anchor.x+d.x,y:anchor.y+d.y};}):null;
 return {hands,string,grip:!!pose.gripWrap,weapon:{icon,width,height,angle:pose.angle,anchor,hand:weaponHand},supportOffset,pose};
}
