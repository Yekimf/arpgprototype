import {STORY_ART} from './assets.js';
// Reveal actual ink runs in a stable, scattered order. The drawing is built once;
// playback only adds a few short strokes per frame and stops with its scene.
export class InkDrawing{
 constructor(canvas,index,{paused,onProgress}){Object.assign(this,{canvas,index,paused,onProgress});this.elapsed=0;this.previous=performance.now();this.stopped=false;this.art=new Image();this.art.onload=()=>this.prepare();this.art.src=STORY_ART;}
 prepare(){
  if(this.stopped)return;const size=512,source=document.createElement('canvas');source.width=source.height=size;const sc=source.getContext('2d',{willReadFrequently:true}),sw=this.art.naturalWidth/2,sh=this.art.naturalHeight/3;
  sc.drawImage(this.art,(this.index%2)*sw,Math.floor(this.index/2)*sh,sw,sh,0,0,size,size);
  const pixels=sc.getImageData(0,0,size,size),ink=sc.createImageData(size,size),runs=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,lum=pixels.data[i]*.3+pixels.data[i+1]*.59+pixels.data[i+2]*.11;ink.data[i]=30;ink.data[i+1]=23;ink.data[i+2]=14;ink.data[i+3]=Math.max(0,Math.min(255,(205-lum)*1.65));}
  sc.putImageData(ink,0,0);this.source=source;this.mask=document.createElement('canvas');this.mask.width=this.mask.height=size;this.layer=document.createElement('canvas');this.layer.width=this.layer.height=size;
  const hash=(x,y,pass)=>{let h=(Math.imul(x+37,374761393)^Math.imul(y+19,668265263)^Math.imul(pass+1,1274126177))>>>0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
  for(let pass=0;pass<3;pass++){const threshold=[190,90,12][pass];for(let y=pass%2;y<size;y+=pass===0?2:1){let x=0;while(x<size){if(ink.data[(y*size+x)*4+3]<threshold){x++;continue;}const start=x,max=5+Math.floor(hash(x,y,pass)*13);while(x<size&&x-start<max&&ink.data[(y*size+x)*4+3]>=threshold)x++;runs.push({x:start,y,w:x-start,h:pass===0?.8:1.1,order:pass+hash(start,y,pass)*.96});}}}
  runs.sort((a,b)=>a.order-b.order);this.runs=runs;this.drawn=0;this.canvas.width=this.canvas.height=720;this.paint();this.frame=requestAnimationFrame(now=>this.tick(now));
 }
 paint(){const c=this.canvas.getContext('2d'),s=720;c.fillStyle='#b3a17b';c.fillRect(0,0,s,s);const paper=c.createRadialGradient(360,330,120,360,360,510);paper.addColorStop(0,'#e0cda150');paper.addColorStop(.7,'#45321c22');paper.addColorStop(1,'#251a10a0');c.fillStyle=paper;c.fillRect(0,0,s,s);const lc=this.layer.getContext('2d');lc.clearRect(0,0,512,512);lc.drawImage(this.source,0,0);lc.globalCompositeOperation='destination-in';lc.drawImage(this.mask,0,0);lc.globalCompositeOperation='source-over';c.drawImage(this.layer,0,0,s,s);}
 tick(now){if(this.stopped)return;const dt=Math.min(.1,(now-this.previous)/1000);this.previous=now;if(!this.paused()){this.elapsed+=dt;const progress=Math.min(1,this.elapsed/10),end=Math.floor(progress*this.runs.length);if(end>this.drawn){const c=this.mask.getContext('2d');c.strokeStyle='#fff';c.lineCap='round';for(;this.drawn<end;this.drawn++){const r=this.runs[this.drawn];c.lineWidth=r.h;c.beginPath();c.moveTo(r.x,r.y);c.lineTo(r.x+r.w,r.y+.2);c.stroke();}if(progress===1){c.fillStyle='#fff';c.fillRect(0,0,512,512);}this.paint();}this.canvas.dataset.reveal=String(Math.round(progress*100));this.onProgress?.(this.elapsed);}this.frame=requestAnimationFrame(t=>this.tick(t));}
 stop(){this.stopped=true;cancelAnimationFrame(this.frame);this.art.onload=null;}
}
