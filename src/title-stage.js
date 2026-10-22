// A small transparent effects layer: the painted scenery never needs redrawing.
export class TitleStage{
 constructor(canvas){this.canvas=canvas;this.stopped=false;this.last=0;this.time=0;this.particles=Array.from({length:28},(_,i)=>({x:(i*97%281)/281,y:(i*53%137)/137,s:1+i%3,speed:.018+i%5*.006}));this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);}
 tick(now){if(this.stopped)return;this.raf=requestAnimationFrame(this.tick);if(now-this.last<50||document.hidden)return;const dt=Math.min(.08,(now-this.last)/1000);this.last=now;const still=this.motion.matches||document.documentElement.classList.contains('reduced-motion');if(still&&this.drawnStill)return;this.drawnStill=still;this.time+=still?0:dt;const c=this.canvas.getContext('2d'),w=Math.min(960,this.canvas.clientWidth),h=Math.round(w*this.canvas.clientHeight/this.canvas.clientWidth);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
 c.clearRect(0,0,w,h);for(const p of this.particles){const phase=(p.y+this.time*p.speed)%1,x=(.66+(p.x-.5)*.18+Math.sin(phase*5+p.s)*.015)*w,y=(.91-phase*.3)*h;c.globalAlpha=Math.sin(phase*Math.PI)*.45;c.fillStyle=p.s===1?'#e3bd75':'#a95e36';c.fillRect(x,y,p.s*.6,p.s*.8);}c.globalAlpha=1;
 }
 stop(){this.stopped=true;cancelAnimationFrame(this.raf);}
}
