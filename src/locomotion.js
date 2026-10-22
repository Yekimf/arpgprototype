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
// Hip and heel lanes are parallel in the ground plane. They never swap sides.
// Forward travel is separate from stance width, so side-on strides remain long
// without opening the legs laterally when approaching or leaving the camera.
export function walkingLeg(phase,leg,face,forward){
 const sign=leg===0?-1:1,u=((phase/(2*Math.PI)+leg*.5)%1+1)%1,stance=u<.5,t=stance?u*2:(u-.5)*2;
 const travel=stance?.5-t:-.5+(1-Math.cos(t*Math.PI))/2,lift=stance?0:Math.sin(t*Math.PI)*15,side={x:-forward.y,y:forward.x*.5};
 const hipCenter={x:(face.legs[0].hip[0]+face.legs[1].hip[0])*160,y:(face.legs[0].hip[1]+face.legs[1].hip[1])*160+22};
 const floor=(face.legs[0].ankle[1]+face.legs[1].ankle[1])*160;
 return {hip:{x:hipCenter.x+side.x*sign*19,y:hipCenter.y+side.y*sign*19},heel:{x:hipCenter.x+side.x*sign*17+forward.x*112*travel,y:floor+side.y*sign*17+forward.y*36*travel-lift},stance,lift,lane:sign*17};
}

// Re-aim the painted boot on the ground without rotating its upright cuff.
// Both toes share one projected heading; the ankle stays attached to the shin.
export function walkingFoot(forward,toe){
 const width=.68,heading=forward.x*.95;
 return {width,shear:heading-width*toe.x/toe.y};
}
