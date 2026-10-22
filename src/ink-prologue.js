import {STORY_SCENES} from './assets.js';
// Display complete illustrations. Fade the image without tracing or masking its lines.
export class InkDrawing{
 constructor(canvas,index,{duration,onReady,onProgress}){
  Object.assign(this,{canvas,duration,onProgress});this.stopped=false;this.art=new Image();canvas.style.opacity='0';
  this.art.onload=()=>{if(this.stopped)return;canvas.width=this.art.naturalWidth;canvas.height=this.art.naturalHeight;canvas.getContext('2d').drawImage(this.art,0,0);this.started=performance.now();canvas.dataset.ready='true';onReady?.();this.frame=requestAnimationFrame(t=>this.tick(t));};
  this.art.src=STORY_SCENES[index];
 }
 tick(now){if(this.stopped)return;const elapsed=(now-this.started)/1000,fade=Math.max(0,Math.min(1,elapsed/.9,(this.duration-elapsed)/.7));this.canvas.style.opacity=String(fade);this.canvas.dataset.reveal=String(Math.round(fade*100));this.onProgress?.(elapsed);this.frame=requestAnimationFrame(t=>this.tick(t));}
 stop(){this.stopped=true;cancelAnimationFrame(this.frame);this.art.onload=null;}
}
