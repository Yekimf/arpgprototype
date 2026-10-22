// Positions are in the painted sheet's 320 px coordinate space.
export const point=([x,y])=>({x:x*320,y:y*320});
export function joint(root,end,upper,lower,bend=1){
 const dx=end.x-root.x,dy=end.y-root.y,length=Math.hypot(dx,dy)||1,d=Math.max(.001,Math.min(upper+lower-.01,length)),ux=dx/length,uy=dy/length,a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));
 return {knee:{x:root.x+ux*a-uy*h*bend,y:root.y+uy*a+ux*h*bend},end:{x:root.x+ux*d,y:root.y+uy*d}};
}
export function punchPose(progress,side=1){
 const t=Math.max(0,Math.min(1,progress)),extension=t<.2?t/.2*.15:t<.5?.15+(t-.2)/.3*.85:Math.max(0,1-(t-.5)/.5),reach=Math.sin(extension*Math.PI/2);
 return {x:-side*reach*49,y:-reach*43,extension:reach};
}
