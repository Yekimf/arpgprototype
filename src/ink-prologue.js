import {STORY_SCENES} from './assets.js';
// A single clean drawing per scene, painted once and faded in as a whole.
export class InkDrawing{
 constructor(canvas,index,{paused,onProgress}){Object.assign(this,{canvas,paused,onProgress});this.elapsed=0;this.previous=performance.now();this.stopped=false;this.art=new Image();this.art.onload=()=>{if(this.stopped)return;canvas.width=this.art.naturalWidth;canvas.height=this.art.naturalHeight;const c=canvas.getContext('2d');c.fillStyle='#dfd8c6';c.fillRect(0,0,canvas.width,canvas.height);c.globalCompositeOperation='multiply';c.drawImage(this.art,0,0);c.globalCompositeOperation='source-over';this.previous=performance.now();this.frame=requestAnimationFrame(t=>this.tick(t));};canvas.style.opacity='0';this.art.src=STORY_SCENES[index];}
 tick(now){if(this.stopped)return;const dt=Math.min(.1,(now-this.previous)/1000);this.previous=now;if(!this.paused()){this.elapsed+=dt;const progress=Math.min(1,this.elapsed/1.8);this.canvas.style.opacity=String(progress);this.canvas.dataset.reveal=String(Math.round(progress*100));this.onProgress?.(this.elapsed);}this.frame=requestAnimationFrame(t=>this.tick(t));}
 stop(){this.stopped=true;cancelAnimationFrame(this.frame);this.art.onload=null;}
}
