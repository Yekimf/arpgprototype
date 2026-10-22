import {GuardSprites} from './guard-sprites.js';
import {createPlayer} from './game.js';
import {WORLD_ART,ITEM_ART} from './assets.js';
export class CharacterStage{
 constructor(canvas){this.canvas=canvas;this.guard=new GuardSprites();this.world=new Image();this.world.src=WORLD_ART;this.floor=new Image();this.floor.src=ITEM_ART;this.player=createPlayer();this.stopped=false;this.observer=new ResizeObserver(()=>this.background=null);this.observer.observe(canvas);this.start();}
 async start(){await Promise.all([this.guard.art,this.guard.items,this.guard.original,this.world,this.floor].map(i=>i.decode()));if(this.stopped)return;this.draw(0);}
 sprite(c,index,x,y,w,h){const s=this.world.naturalWidth/4;c.drawImage(this.world,index%4*s,Math.floor(index/4)*s,s,s,x-w/2,y-h,w,h);}
 draw(now){if(this.stopped)return;const c=this.canvas.getContext('2d'),w=Math.max(1,Math.round(this.canvas.clientWidth)),h=Math.max(1,Math.round(this.canvas.clientHeight));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.background=null;}const x=w*.51,y=h*.68;
  if(!this.background){const bg=document.createElement('canvas');bg.width=w;bg.height=h;const b=bg.getContext('2d');b.fillStyle='#0d0d09';b.fillRect(0,0,w,h);const s=this.floor.naturalWidth/4;
   b.save();b.translate(x,y-40);for(let yy=-10;yy<12;yy++)for(let xx=-12;xx<12;xx++){const px=(xx-yy)*34,py=(xx+yy)*17;b.save();b.translate(px,py);b.transform(1,.5,-1,.5,0,0);b.drawImage(this.floor,s,0,s,s,0,0,68,68);b.fillStyle='#100d0b77';b.fillRect(0,0,68,68);b.restore();}b.restore();
   this.sprite(b,7,x-220,y-95,240,280);this.sprite(b,9,x+160,y-80,230,220);this.sprite(b,13,x+220,y+20,115,100);this.sprite(b,7,x+310,y-150,210,280);
   b.save();b.translate(x,y-40);b.scale(1,.55);const radius=Math.max(w,h)*.6,shade=b.createRadialGradient(0,0,30,0,0,radius);shade.addColorStop(0,'#08070500');shade.addColorStop(.5,'#08070566');shade.addColorStop(.85,'#080705ee');shade.addColorStop(1,'#080705');b.fillStyle=shade;b.fillRect(-w*2,-h*2,w*4,h*4);b.restore();this.background=bg;
  }
  c.drawImage(this.background,0,0);c.fillStyle='#050403a0';c.beginPath();c.ellipse(x,y+3,42,15,0,0,Math.PI*2);c.fill();const frame=this.guard.frame(this.player,false,0);if(frame)c.drawImage(frame,x-80,y-160,160,180);
  const fx=x-110,fy=y+32;c.fillStyle='#21160d';c.fillRect(fx-18,fy,36,5);for(let i=0;i<5;i++){const t=now/180+i,flame=19+Math.sin(t)*6;c.fillStyle=i%2?'#af7138b0':'#cca460a0';c.beginPath();c.moveTo(fx-13+i*6,fy);c.quadraticCurveTo(fx-8+i*5,fy-flame*.4,fx-9+i*5+Math.sin(t)*3,fy-flame);c.quadraticCurveTo(fx-5+i*5,fy-9,fx-7+i*6,fy);c.fill();}
  this.raf=requestAnimationFrame(time=>this.draw(time));
 }
 stop(){this.stopped=true;cancelAnimationFrame(this.raf);this.observer.disconnect();}
}
