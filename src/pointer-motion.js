// Pointer Lock movement can be reported in physical, logical or CSS pixels.
// Learn the browser's conversion while the normal pointer is still visible.
export class PointerMotion{
 constructor(){this.scale=1;this.samples=[];this.last=null;}
 observe(x,y,mx,my){if(this.last){for(const [delta,movement]of [[x-this.last.x,mx],[y-this.last.y,my]]){const ratio=delta/movement;if(Math.abs(delta)>=2&&Math.abs(delta)<200&&Math.abs(movement)>=2&&ratio>=.25&&ratio<=4){this.samples.push(ratio);if(this.samples.length>16)this.samples.shift();}}if(this.samples.length>=3){const sorted=[...this.samples].sort((a,b)=>a-b);this.scale=sorted[Math.floor(sorted.length/2)];}}this.last={x,y};}
 move(x,y,dx,dy,width,height){return{x:Math.max(1,Math.min(width-2,x+(Number.isFinite(dx)?dx:0)*this.scale)),y:Math.max(1,Math.min(height-2,y+(Number.isFinite(dy)?dy:0)*this.scale))};}
}
