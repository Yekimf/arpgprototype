import {STORY_SCENES} from './assets.js';
// Each scene has its own panoramic illustration. Reveal passes follow the ink:
// dark contours first, then hatching, then the lighter paper marks.
export class InkDrawing{
 constructor(canvas,index,{paused,onProgress}){
  Object.assign(this,{canvas,index,paused,onProgress});this.elapsed=0;this.previous=performance.now();this.stopped=false;
  this.art=new Image();this.art.onload=()=>this.prepare();this.art.src=STORY_SCENES[index];
 }
 prepare(){
  if(this.stopped)return;
  const width=1280,height=Math.round(width*this.art.naturalHeight/this.art.naturalWidth),source=document.createElement('canvas');
  Object.assign(this,{width,height});source.width=width;source.height=height;
  const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(this.art,0,0,width,height);
  const pixels=sc.getImageData(0,0,width,height),ink=sc.createImageData(width,height),runs=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*4,lum=pixels.data[i]*.3+pixels.data[i+1]*.59+pixels.data[i+2]*.11;
   ink.data[i]=30;ink.data[i+1]=23;ink.data[i+2]=14;ink.data[i+3]=Math.max(0,Math.min(255,(215-lum)*1.6));
  }
  sc.putImageData(ink,0,0);this.source=source;
  for(const key of ['mask','layer']){this[key]=document.createElement('canvas');this[key].width=width;this[key].height=height;}
  const hash=(x,y,pass)=>{let h=(Math.imul(x+37,374761393)^Math.imul(y+19,668265263)^Math.imul(pass+1,1274126177))>>>0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
  for(let pass=0;pass<3;pass++){
   const threshold=[190,90,12][pass];
   for(let y=pass%2;y<height;y+=pass===0?2:1){let x=0;while(x<width){
    if(ink.data[(y*width+x)*4+3]<threshold){x++;continue;}
    const start=x,max=8+Math.floor(hash(x,y,pass)*18);
    while(x<width&&x-start<max&&ink.data[(y*width+x)*4+3]>=threshold)x++;
    runs.push({x:start,y,w:x-start,h:pass===0?.9:1.2,order:pass+hash(start,y,pass)*.96});
   }}
  }
  runs.sort((a,b)=>a.order-b.order);this.runs=runs;this.drawn=0;this.canvas.width=width;this.canvas.height=height;
  this.previous=performance.now();this.paint();this.frame=requestAnimationFrame(now=>this.tick(now));
 }
 paint(){
  const c=this.canvas.getContext('2d'),{width:w,height:h}=this;c.fillStyle='#b3a17b';c.fillRect(0,0,w,h);
  const paper=c.createRadialGradient(w*.5,h*.45,h*.15,w*.5,h*.5,w*.7);paper.addColorStop(0,'#e0cda150');paper.addColorStop(.7,'#45321c22');paper.addColorStop(1,'#251a1050');c.fillStyle=paper;c.fillRect(0,0,w,h);
  const lc=this.layer.getContext('2d');lc.clearRect(0,0,w,h);lc.drawImage(this.source,0,0);lc.globalCompositeOperation='destination-in';lc.drawImage(this.mask,0,0);lc.globalCompositeOperation='source-over';c.drawImage(this.layer,0,0);
 }
 tick(now){
  if(this.stopped)return;const dt=Math.min(.1,(now-this.previous)/1000);this.previous=now;
  if(!this.paused()){
   this.elapsed+=dt;const progress=Math.min(1,this.elapsed/10),end=Math.floor(progress*this.runs.length);
   if(end>this.drawn){
    const c=this.mask.getContext('2d');c.strokeStyle='#fff';c.lineCap='round';
    for(;this.drawn<end;this.drawn++){const r=this.runs[this.drawn];c.lineWidth=r.h;c.beginPath();c.moveTo(r.x,r.y);c.lineTo(r.x+r.w,r.y+.2);c.stroke();}
    if(progress===1){c.fillStyle='#fff';c.fillRect(0,0,this.width,this.height);}this.paint();
   }
   this.canvas.dataset.reveal=String(Math.round(progress*100));this.onProgress?.(this.elapsed);
  }
  this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 stop(){this.stopped=true;cancelAnimationFrame(this.frame);this.art.onload=null;}
}
