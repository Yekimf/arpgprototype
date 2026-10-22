export const WALK_FRAMES=16;
export const STRIDE_DISTANCE=1.4;
// Sixteen screen-facing sectors, clockwise from north. Movement itself stays
// continuous; only the painted pose is quantized and retained when stopping.
export function facingPose(direction){
 const sx=(direction.x-direction.y)*34,sy=(direction.x+direction.y)*17;
 const index=(Math.round(Math.atan2(sx,-sy)/(Math.PI*2)*16)+16)%16,a=index*Math.PI/8;
 const screen={x:Math.sin(a),y:-Math.cos(a)},flatLength=Math.hypot(screen.x,screen.y/.5),forward={x:screen.x/flatLength,y:screen.y/.5/flatLength};
 return {index,screen,forward,back:screen.y<-.01,mirror:screen.x<-.01,profile:.72+.28*Math.abs(screen.y),turn:screen.x*screen.y*.11};
}
// Keep each painted leg intact. Only translate it vertically through alternating
// lifted/planted poses, with fixed narrow tracks and no knee or boot warping.
export function walkingLeg(phase,leg,face){
 const part=face.legs[leg],center=(face.legs[0].ankle[0]+face.legs[1].ankle[0])*160;
 const floor=(face.legs[0].ankle[1]+face.legs[1].ankle[1])*160;
 const lift=Math.max(0,Math.sin(phase+leg*Math.PI))*14;
 const heel={x:center+(leg===0?-22:22),y:floor-lift};
 return {x:heel.x-part.ankle[0]*320,y:heel.y-part.ankle[1]*320,heel,lift};
}
