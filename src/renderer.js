import {clamp, distance} from './game.js';
import {WORLD_ART,ITEM_ART,CAMPAIGN_ART,SOLDIER_ART} from './assets.js';
import {itemName} from './settlement.js';

export class Renderer {
  constructor(canvas, minimap) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.map=minimap; this.mc=minimap.getContext('2d');
    this.w=0;this.h=0;this.camera={x:0,y:0};this.time=0;this.zoom=1;
    this.worldArt=new Image();this.worldArt.src=WORLD_ART;this.itemArt=new Image();this.itemArt.src=ITEM_ART;
    this.campaignArt=new Image();this.campaignArt.src=CAMPAIGN_ART;this.heroFrame={row:0,column:0,action:'idle'};
    this.soldierArt=new Image();this.soldierArt.src=SOLDIER_ART;this.groundCache=new Map();this.glowCache=new Map();this.wallCache=new Map();this.spriteCache=new Map();this.palisadeCache=new Map();this.tileCache=new Map();this.artLoaded=false;
    for(const art of [this.worldArt,this.itemArt,this.campaignArt,this.soldierArt])art.addEventListener('load',()=>{this.artLoaded=[this.worldArt,this.itemArt,this.campaignArt,this.soldierArt].every(i=>i.complete&&i.naturalWidth>0);this.needsDraw=true;});
    this.resize();window.addEventListener('resize',()=>this.resize());
  }
  resize(){this.w=window.innerWidth;this.h=window.innerHeight;const dpr=Math.min(devicePixelRatio||1,1,1280/this.w,800/this.h);this.canvas.width=this.w*dpr;this.canvas.height=this.h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.zoom=this.w<650?.85:this.h<540?.85:1.12;this.needsDraw=true;}
  iso(x,y){return {x:(x-y)*34,y:(x+y)*17};}
  screen(x,y,z=0){const p=this.iso(x,y);return{x:(p.x-this.camera.x)*this.zoom+(this.originX??this.w/2),y:(p.y-this.camera.y+17-z)*this.zoom+this.h*.53};}
  unproject(x,y,z=0){const a=(x-(this.originX??this.w/2))/this.zoom+this.camera.x,b=(y-this.h*.53)/this.zoom+this.camera.y-17+z;return{x:(a/34+b/17)/2,y:(b/17-a/34)/2};}
  poly(points,fill,stroke=null,width=1){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  ellipse(x,y,rx,ry,fill){const c=this.ctx;c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  line(points,color,width=1){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  light(x,y,r,color){let glow=this.glowCache.get(color);if(!glow){glow=document.createElement('canvas');glow.width=glow.height=128;const ctx=glow.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);this.glowCache.set(color,glow);}this.ctx.drawImage(glow,x-r,y-r,r*2,r*2);}
  cachedSprite(art,index,w,h,offsetY=0){
    if(!art.complete||!art.naturalWidth)return false;const key=art.src+'-'+index+'-'+Math.round(w)+'-'+Math.round(h);let cached=this.spriteCache.get(key);
    if(!cached){cached=document.createElement('canvas');cached.width=Math.ceil(w);cached.height=Math.ceil(h);const size=art.naturalWidth/4;cached.getContext('2d').drawImage(art,index%4*size+.8,Math.floor(index/4)*size+.8,size-1.6,size-1.6,0,0,cached.width,cached.height);this.spriteCache.set(key,cached);if(this.spriteCache.size>220)this.spriteCache.delete(this.spriteCache.keys().next().value);}
    this.ctx.drawImage(cached,-w/2,-h+offsetY,w,h);return true;
  }
  sprite(index,w,h,offsetY=0){return this.cachedSprite(this.worldArt,index,w,h,offsetY);}
  campaignSprite(index,w,h){return this.cachedSprite(this.campaignArt,index,w,h);}
  terrain(index,variant=0,tone=1){
    const key=`${index}-${variant}-${tone}`;if(this.tileCache.has(key))return this.tileCache.get(key);
    if(!this.itemArt.complete||!this.itemArt.naturalWidth)return null;
    const canvas=document.createElement('canvas');canvas.width=136;canvas.height=68;const c=canvas.getContext('2d'),s=this.itemArt.naturalWidth/4;
    c.translate(68,0);c.transform(1,.5,-1,.5,0,0);
    const crop=s*.62,ox=variant%2*(s-crop),oy=Math.floor(variant/2)*(s-crop);
    c.drawImage(this.itemArt,index*s+ox,oy,crop,crop,0,0,68,68);
    c.globalCompositeOperation='source-atop';c.fillStyle=index===0?'#291a1422':index===2?'#10101622':'#22170d16';c.fillRect(0,0,68,68);
    if(tone>1){c.fillStyle=({2:'#23474c55',3:'#572b1e66',4:'#becedb38',5:'#382c4255'})[tone]||'transparent';c.fillRect(0,0,68,68);}
    this.tileCache.set(key,canvas);return canvas;
  }
  stoneFace(points,shade){
    const c=this.ctx;
    if(!this.itemArt.complete||!this.itemArt.naturalWidth)return this.poly(points,shade);
    c.save();c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,s=this.itemArt.naturalWidth/4;
    c.drawImage(this.itemArt,3*s,0,s,s,x,y,w,h);c.fillStyle=shade;c.fillRect(x,y,w,h);c.restore();
  }
  groundChunk(d,cx,cy){
    const key=`${cx},${cy}`;let cached=this.groundCache.get(key);
    const x0=cx*8,y0=cy*8,base=this.iso(x0,y0),ox=306;
    if(!cached){
      const canvas=document.createElement('canvas');canvas.width=612;canvas.height=352;
      const c=canvas.getContext('2d'),old=this.ctx;this.ctx=c;c.translate(ox,0);
      for(let y=y0;y<Math.min(y0+8,d.size);y++)for(let x=x0;x<Math.min(x0+8,d.size);x++){
        const camp=d.townBounds&&x>=d.townBounds.x1&&x<=d.townBounds.x2&&y>=d.townBounds.y1&&y<=d.townBounds.y2;if(!d.tiles[y][x]&&!camp&&!d.water?.has(y*d.size+x)&&!(d.town&&Math.hypot(x-32.5,y-32.5)<22))continue;
        const point=this.iso(x,y),v={x:point.x-base.x,y:point.y-base.y};
      const n=((x*73856093^y*19349663)>>>0)%100;if(d.water?.has(y*d.size+x)){this.poly([[v.x,v.y],[v.x+34,v.y+17],[v.x,v.y+34],[v.x-34,v.y+17]],n<50?'#202d28':'#283731','#334036',.5);this.line([[v.x-15,v.y+16],[v.x+11,v.y+16]],'#72837425');continue;}
      const color=n<15?'#293d30':n<45?'#344238':n<70?'#3a483d':'#414c40';
      const road=d.roads?.has(y*d.size+x)||d.town&&(Math.abs(x-32.5)<1.7||Math.abs(y-32.5)<1.7);
      const tile=this.terrain(d.town||d.outdoor?(road?1:0):2,n%4,d.act||1);
      if(tile){c.drawImage(tile,v.x-34,v.y,68,34);this.line([[v.x,v.y],[v.x+34,v.y+17],[v.x,v.y+34],[v.x-34,v.y+17],[v.x,v.y]],'#0b07053a',.5);}
      else this.poly([[v.x,v.y],[v.x+34,v.y+17],[v.x,v.y+34],[v.x-34,v.y+17]],color,'#121f18',1.5);
      this.line([[v.x,v.y+2],[v.x+31,v.y+17]],'#66705a44');
      if(!d.town&&n%4===0)this.line([[v.x-24,v.y+16],[v.x-5,v.y+23],[v.x+1,v.y+20],[v.x+10,v.y+23]],'#14131166');
      if(n%7===0){this.ellipse(v.x+6,v.y+16,15,6,'#33483266');this.ellipse(v.x+12,v.y+18,7,3,'#60764435');}
      if(n%19===0){this.poly([[v.x-6,v.y+8],[v.x+6,v.y+13],[v.x+2,v.y+17],[v.x-9,v.y+12]],'#69736144');}
      if(n%13===0)this.line([[v.x+8,v.y+9],[v.x+3,v.y+13],[v.x+11,v.y+18],[v.x+7,v.y+22]],'#16271c');
      // Exposed edges reveal the depth of the ancient foundations.
      if(!d.town&&!d.outdoor&&!d.tiles[y+1]?.[x]){this.poly([[v.x-34,v.y+17],[v.x,v.y+34],[v.x,v.y+62],[v.x-34,v.y+45]],'#211e19','#100d0b');this.line([[v.x-33,v.y+31],[v.x-1,v.y+47]],'#393329');}
      if(!d.town&&!d.outdoor&&!d.tiles[y]?.[x+1]){this.poly([[v.x+34,v.y+17],[v.x,v.y+34],[v.x,v.y+62],[v.x+34,v.y+45]],'#2b261f','#100d0b');this.line([[v.x+33,v.y+31],[v.x+1,v.y+47]],'#42392c');}

      }
      this.ctx=old;const fog=document.createElement('canvas');fog.width=612;fog.height=352;
      cached={canvas,fog,x:base.x-ox,y:base.y,count:-1};this.groundCache.set(key,cached);
      if(this.groundCache.size>(this.chunkBudget||48))this.groundCache.delete(this.groundCache.keys().next().value);
    }
    let count=0;for(let y=y0;y<Math.min(y0+8,d.size);y++)for(let x=x0;x<Math.min(x0+8,d.size);x++)if(d.seen.has(y*d.size+x))count++;
    if(count!==cached.count){const c=cached.fog.getContext('2d');c.clearRect(0,0,612,352);c.fillStyle='#000d';
      for(let y=y0;y<Math.min(y0+8,d.size);y++)for(let x=x0;x<Math.min(x0+8,d.size);x++)if(!d.seen.has(y*d.size+x)&&(d.tiles[y][x]||d.water?.has(y*d.size+x))){const point=this.iso(x,y),px=point.x-base.x+ox,py=point.y-base.y;c.beginPath();c.moveTo(px,py);c.lineTo(px+34,py+17);c.lineTo(px,py+34);c.lineTo(px-34,py+17);c.closePath();c.fill();}cached.count=count;}
    return cached;
  }
  drawGround(d,viewW,viewH){
    if(this.cachedDungeon!==d){this.cachedDungeon=d;this.groundCache.clear();this.staticObjects=[...d.props,...(d.npcs||[]).map(n=>({...n,type:'npc'}))];
      if(!d.town&&!d.outdoor)for(let y=1;y<d.size-1;y++)for(let x=1;x<d.size-1;x++)if(!d.tiles[y][x]&&(d.tiles[y+1]?.[x]||d.tiles[y]?.[x+1]))this.staticObjects.push({x:x+.5,y:y+.5,type:'wall',variant:(x*7+y*11)%5});
    }
    const width=Math.ceil(viewW*2+192),height=Math.ceil(viewH*2+192),oldView=this.groundView;
    const refresh=!oldView||oldView.d!==d||oldView.canvas.width!==width||oldView.canvas.height!==height||Math.abs(this.camera.x-oldView.cx)>80||Math.abs(this.camera.y-oldView.cy)>80||d.seen.size!==oldView.seen&&this.time-oldView.time>.2;
    if(refresh){
      const canvas=oldView?.canvas||document.createElement('canvas');canvas.width=width;canvas.height=height;
      const x=Math.floor(this.camera.x-width/2),y=Math.floor(this.camera.y-height/2),ctx=canvas.getContext('2d'),old=this.ctx;ctx.translate(-x,-y);this.ctx=ctx;
      this.chunkBudget=Math.max(48,Math.ceil(4*(viewW+396)*(viewH+246)/73984)+12);
      for(let cy=0;cy<Math.ceil(d.size/8);cy++)for(let cx=0;cx<Math.ceil(d.size/8);cx++){const center=this.iso(cx*8+4,cy*8+4);if(Math.abs(center.x-this.camera.x)>viewW+396||Math.abs(center.y-this.camera.y)>viewH+246)continue;const cached=this.groundChunk(d,cx,cy);ctx.drawImage(cached.canvas,cached.x,cached.y);ctx.drawImage(cached.fog,cached.x,cached.y);}
      this.ctx=old;this.groundView={canvas,x,y,cx:this.camera.x,cy:this.camera.y,seen:d.seen.size,time:this.time,d};
    }
    const view=this.groundView;this.ctx.drawImage(view.canvas,view.x,view.y);
  }

  draw(game,dt){
    const c=this.ctx,{dungeon:d,player:p}=game;this.time+=dt;
    this.artLoaded=this.soldierArt.complete&&this.soldierArt.naturalWidth>0&&this.worldArt.complete&&this.worldArt.naturalWidth>0&&this.itemArt.complete&&this.itemArt.naturalWidth>0&&this.campaignArt.complete&&this.campaignArt.naturalWidth>0;
    this.originX??=this.w/2;this.originX+=((this.w-(game.hudWidth||0))/2-this.originX)*Math.min(1,dt*12);
    const target=this.iso(p.x,p.y);this.camera.x+=(target.x-this.camera.x)*Math.min(1,dt*7);this.camera.y+=(target.y-this.camera.y)*Math.min(1,dt*7);
    c.fillStyle=d.town?'#171512':'#0d0c0b';c.fillRect(0,0,this.w,this.h);
    c.save();c.translate(this.originX,this.h*.53);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
    const viewW=this.w/this.zoom/2+120,viewH=this.h/this.zoom/2+140;
    this.drawGround(d,viewW,viewH);
    c.globalAlpha=1;
    // Back walls, crenellated masonry, and scattered objects share painter ordering.
    const visible=o=>{const v=this.iso(o.x,o.y);return Math.abs(v.x-this.camera.x)<viewW&&Math.abs(v.y-this.camera.y)<viewH;};
    const objects=this.staticObjects.filter(o=>visible(o)&&d.seen.has(Math.floor(o.y)*d.size+Math.floor(o.x)));
    for(const loot of game.loot)objects.push({...loot,type:'loot',loot});
    if(d.returnGate)objects.push({...d.returnGate,type:'entrance'});
    if(d.waypoint)objects.push({...d.waypoint,type:'waypoint'});if(d.townWaypoint)objects.push({...d.townWaypoint,type:'waypoint'});
    if(d.spirit)objects.push({...d.spirit,type:'spirit'});
    if(d.shrine)objects.push({...d.shrine,type:'shrine'});
    if(d.bossDead)objects.push({...d.portal,type:'portal'});
    for(const enemy of d.enemies)if(!enemy.dead&&d.seen.has(Math.floor(enemy.y)*d.size+Math.floor(enemy.x)))objects.push({...enemy,type:'enemy',enemy});
    objects.push({...p,type:'hero'});
    objects.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
    for(const o of objects){const v=this.iso(o.x,o.y);if(Math.abs(v.x-this.camera.x)>viewW||Math.abs(v.y-this.camera.y)>viewH)continue;
      const near=distance(o,p);c.globalAlpha=d.town||o.type==='hero'?1:clamp(1-(near-6)*.07,.25,1);
      c.save();c.translate(v.x,v.y+17);
      if(o.type==='hero')this.hero(game);
      else if(o.type==='enemy')this.enemy(o.enemy,game);
      else if(o.type==='waypoint')this.waypoint(o,game);
      else if(o.type==='spirit')this.spirit(o,game);
      else if(o.type==='shrine')this.shrine(o,game);
      else if(o.type==='wall')this.wall(o);
      else if(o.type==='palisade')this.palisade(o);
      else if(o.type==='brazier')this.brazier(o);
      else if(o.type==='pillar')this.pillar(o);
      else if(o.type==='tomb')this.tomb(o);
      else if(o.type==='loot')this.loot(o.loot,game);
      else if(o.type==='portal')this.portal();
      else if(o.type==='building'){this.ellipse(0,1,o.width*.4,o.width*.19,'#07040377');this.sprite(o.sprite,o.width,o.height);if(o.exit)this.worldLabel(game.player.campaign?(d.outdoor?'KINGDOM GATE':'THE KING’S ROAD'):'THE HOLLOW CRYPT','ENTER · F',-o.height-10);if(o.stash)this.worldLabel('PERSONAL STASH','',-o.height-7);}
      else if(o.type==='entrance'){this.sprite(15,125,135);this.worldLabel('THE KING’S ROAD','F · LEAVE STRONGHOLD',-132);}
      else if(o.type==='npc')this.npc(o,game);
      else this.debris(o);
      c.restore();
    }
    c.globalAlpha=1;
    this.effects(game);
    c.restore();
    // Cold, low ground fog and drifting ash.
    for(let i=0;i<26;i++){const x=((i*193.13+Math.sin(this.time*.13+i)*60)%this.w+this.w)%this.w,y=((i*137.77-this.time*(3+i%3))%this.h+this.h)%this.h;this.ellipse(x,y,i%4===0?1.4:.7,i%4===0?1.4:.7,i%4===0?'#b2bf8b4a':'#8aa89325');}
    const hero=this.screen(p.x,p.y);this.light(hero.x,hero.y-10,170*this.zoom,d.town?'#e4a66312':'#cab98b0c');
    if(game.hurtFlash>0){c.fillStyle=`rgba(130,22,15,${game.hurtFlash*.18})`;c.fillRect(0,0,this.w,this.h);}
    if(p.hp/game.stats.maxHp<.28){const g=c.createRadialGradient(this.w/2,this.h/2,this.h*.3,this.w/2,this.h/2,this.w*.65);g.addColorStop(0,'transparent');g.addColorStop(1,'#741b2355');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);}
    this.drawMap(game);
  }
  palisade(o){let canvas=this.palisadeCache.get(o.axis);if(!canvas){canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;const old=this.ctx;this.ctx=canvas.getContext('2d');this.ctx.translate(48,70);this.paintPalisade(o);this.ctx=old;this.palisadeCache.set(o.axis,canvas);}this.ctx.drawImage(canvas,-48,-70);}
  paintPalisade(o){
    const dir=o.axis==='x'?{x:34,y:17}:{x:-34,y:17};
    this.line([[-dir.x*.5,-19-dir.y*.5],[dir.x*.5,-19+dir.y*.5]],'#292017',5);
    for(let i=-1;i<=1;i++){const x=dir.x*i*.35,y=dir.y*i*.35;this.poly([[x-3,y],[x-3,y-38],[x,y-46],[x+4,y-37],[x+4,y]],'#443b29','#17120d',1);this.line([[x,y-5],[x,y-36]],'#7a6b4355');}
  }
  wall(o){
    if(this.itemArt.complete&&this.itemArt.naturalWidth){let tile=this.wallCache.get(o.variant);if(!tile){tile=document.createElement('canvas');tile.width=80;tile.height=140;const old=this.ctx;this.ctx=tile.getContext('2d');this.ctx.translate(40,118);this.paintWall(o);this.ctx=old;this.wallCache.set(o.variant,tile);}this.ctx.drawImage(tile,-40,-118);return;}this.paintWall(o);
  }
  paintWall(o){
    const h=37+o.variant*3;
    this.ellipse(0,4,32,14,'#030d0980');
    this.stoneFace([[-33,-17],[0,0],[0,-h],[ -33,-h-17]],'#18120a88');
    this.stoneFace([[33,-17],[0,0],[0,-h],[33,-h-17]],'#1e170955');
    this.stoneFace([[-33,-h-17],[0,-h-34],[33,-h-17],[0,-h]],'#a59d7c11');
    this.line([[-31,-h/2-16],[0,-h/2],[31,-h/2-16]],'#142619',2);
    this.line([[16,-h/2-8],[16,-8]],'#19281d');this.line([[-17,-h-8],[-17,-h/2-8]],'#1d2b20');
    if(o.variant%2===0)this.poly([[-22,-h-15],[-9,-h-23],[4,-h-16],[-8,-h-9]],'#5d6b4666');
    if(o.variant===2){this.line([[22,-h-6],[19,-h+9],[23,-h+13],[17,-3]],'#1a291a',2);}
  }
  pillar(o){
    const h=o.variant===0?33:73;
    this.ellipse(0,3,23,11,'#020a0877');
    this.poly([[-17,-3],[0,6],[17,-3],[0,-12]],'#697057','#233121');
    this.poly([[-11,-7],[0,-1],[0,-h],[-11,-h-6]],'#394b37','#243722');
    this.poly([[11,-7],[0,-1],[0,-h],[11,-h-6]],'#526047','#263925');
    this.line([[-6,-h+1],[-6,-10]],'#77806055');this.line([[6,-h+1],[6,-10]],'#253822');
    this.poly([[-16,-h-8],[0,-h+1],[16,-h-8],[16,-h-14],[0,-h-23],[-16,-h-14]],'#4b5b41','#273923');
    this.poly([[-16,-h-14],[0,-h-23],[16,-h-14],[0,-h-5]],'#78805d','#83916a55');
    if(h>40)this.line([[-4,-h+13],[3,-h+20],[-1,-h+28],[6,-h+40]],'#1c2b1d',1.4);
  }
  brazier(o){
    const c=this.ctx,flicker=Math.sin(this.time*8+o.x)*2;
    if(this.artLoaded){
      this.light(0,-25,105+flicker*2,'#df88381b');this.light(0,-25,40,'#ffb35f24');this.ellipse(0,2,14,6,'#07040199');
      const iron=c.createLinearGradient(-11,0,11,0);iron.addColorStop(0,'#1d1916');iron.addColorStop(.4,'#7c6b50');iron.addColorStop(.65,'#423a2d');iron.addColorStop(1,'#161311');
      this.poly([[-10,0],[-7,-5],[7,-5],[10,0],[6,3],[-7,3]],iron);
      c.fillStyle=iron;c.fillRect(-3,-24,6,22);
      c.beginPath();c.moveTo(-13,-27);c.bezierCurveTo(-11,-14,11,-14,13,-27);c.closePath();c.fillStyle=iron;c.fill();this.ellipse(0,-27,13,4,'#a6783e');this.ellipse(0,-28,11,3,'#ee9a3e');
      const fire=c.createLinearGradient(0,-49,0,-24);fire.addColorStop(0,'#ffe5a5');fire.addColorStop(.4,'#f9ba59');fire.addColorStop(1,'#ba4825');c.fillStyle=fire;c.shadowColor='#ec8b3d';c.shadowBlur=12;
      c.beginPath();c.moveTo(-7,-27);c.bezierCurveTo(-11,-35,0,-35,-1,-48-flicker);c.bezierCurveTo(9,-39,1,-36,8,-32);c.bezierCurveTo(11,-24,3,-22,-7,-27);c.fill();
      c.shadowBlur=0;this.ellipse(1,-29,3,6,'#ffe6a5bb');return;
    }
    this.light(0,-20,110+flicker*2,'#df8c3d20');this.light(0,-20,50,'#ffbb5f2a');
    this.ellipse(0,1,15,7,'#010a0799');
    this.poly([[-8,-1],[8,-1],[5,-22],[-5,-22]],'#394632','#182c1d');
    this.poly([[-13,-27],[-9,-16],[9,-16],[13,-27]],'#6e7050','#a29b6266');
    this.ellipse(0,-27,13,6,'#4a5838');
    c.shadowColor='#eea34f';c.shadowBlur=15;
    this.poly([[-8,-28],[-6,-37],[-2,-35],[2,-49-flicker],[5,-37],[8,-40],[7,-27],[0,-24]],'#e9b55d');
    this.poly([[-3,-27],[0,-39-flicker],[4,-29],[1,-25]],'#faf0c1');c.shadowBlur=0;
  }
  tomb(o){
    if(this.sprite(14,100,77))return;
    this.ellipse(0,4,35,16,'#030c0977');
    this.poly([[-28,-7],[2,9],[28,-4],[28,-20],[0,-34],[-28,-21]],'#3c4a35','#1b2e1e');
    this.poly([[-30,-23],[-2,-39],[31,-23],[3,-7]],'#72775a','#9a987166');
    this.poly([[-23,-23],[-2,-34],[23,-23],[2,-12]],'#4c5c40','#2a3e2a');
    this.ellipse(-3,-26,5,3,'#959276');
    this.poly([[-5,-24],[2,-25],[13,-20],[9,-17]],'#7b8262');
    this.line([[-9,-19],[12,-29]],'#263c29');
  }
  debris(o){
    const v=o.variant;
    if(o.type==='bones'){
      this.ellipse(0,0,9,4,'#0e1c1488');this.line([[-7,-1],[6,-6]],'#a3a18388',2);this.line([[-4,-6],[5,0]],'#a3a18366',2);
      this.ellipse(6,-5,3.5,3,'#b0ac8e99');this.ellipse(5,-6,.8,.8,'#263b2a');this.ellipse(7,-5,.8,.8,'#263b2a');
    }else{
      this.poly([[-8,1],[-3,-5],[4,-4],[8,0],[3,4]],'#69725980','#253b2466');
      if(v>1)this.poly([[6,2],[10,-2],[15,1],[11,4]],'#4e634677');
    }
  }
  hero(game){
    const c=this.ctx,{player:p}=game,t=this.time,bob=game.moving?Math.sin(t*12)*1.6:Math.sin(t*2)*.5;
    this.ellipse(0,2,15,7,'#020a07a0');
    if(this.soldierArt.complete&&this.soldierArt.naturalWidth){
      const attacking=game.attackAnim>0,direction=(attacking?game.actionFacing:game.facing)||game.lastMove;
      const row=(Math.round(Math.atan2(direction.x-direction.y,direction.x+direction.y)/(Math.PI/4))+8)%8;
      const progress=clamp(1-game.attackAnim/.38,0,.999),column=attacking?9+Math.min(6,Math.floor(progress*7)):game.moving?1+Math.floor(game.walkPhase)%8:0;
      this.heroFrame={row,column,action:game.dodgeTime>0?'evade':attacking?'attack':game.moving?'walk':'idle'};
      if(p.appearance==='iron')c.filter='grayscale(.85)';
      if(game.dodgeTime>0)c.globalAlpha=.7;
      c.drawImage(this.soldierArt,column*96,row*128,96,128,-48,-110,96,128);
      if(attacking&&game.castColor)this.light(0,-43,25,game.castColor+'44');return;
    }
    if(game.dodgeTime>0){this.light(0,-10,45,'#d4dbab33');c.globalAlpha=.6;}
    if(game.attackAnim>0){c.save();c.globalAlpha=game.attackAnim*2;this.ellipse(5,-10,35,15,'#d9c79522');c.restore();}
    c.translate(0,bob);
    this.poly([[-6,-15],[-7,0],[-2,0],[1,-13]],'#2a2d25','#111b14');
    this.poly([[2,-14],[3,0],[8,-1],[7,-16]],'#3e3c2e','#111b14');
    this.poly([[-8,-29],[-14,-5],[-4,-8],[0,-4],[9,-7],[8,-29]],'#617567','#273e32');
    this.poly([[-7,-29],[-11,-9],[-6,-11],[-2,-27]],'#82948155');
    this.poly([[-8,-31],[7,-31],[10,-19],[4,-13],[-6,-14],[-11,-21]],'#727869','#263b2e');
    this.poly([[-10,-30],[-3,-33],[-1,-27],[-9,-24]],'#aaa184','#404a38');
    this.poly([[4,-32],[11,-28],[12,-23],[4,-24]],'#9c967c','#394834');
    this.line([[-7,-18],[7,-20]],'#bea56b',2);
    this.poly([[-5,-40],[3,-43],[8,-37],[6,-30],[-3,-29],[-7,-34]],'#3b5041','#223429');
    this.poly([[-4,-38],[4,-39],[5,-33],[-2,-33]],'#c4b296');
    this.poly([[-6,-40],[2,-44],[7,-39],[-2,-37],[-5,-31]],'#798372','#394e3c');
    this.line([[-1,-35],[3,-35]],'#29372a');
    this.poly([[-12,-26],[-19,-21],[-17,-11],[-11,-8],[-7,-14],[-7,-23]],'#566a54','#a59d6a');
    this.line([[-13,-23],[-12,-13]],'#c6b77b',1.4);
    c.save();c.translate(10,-22);c.rotate(game.attackAnim>0?-1.3+game.attackAnim*6:.35);
    this.line([[0,4],[14,-23]],'#9da89b',3);this.line([[1,3],[15,-24]],'#e1ddbb',1);this.line([[-4,0],[6,5]],'#b6a16a',2.8);this.line([[-1,3],[-4,9]],'#735c3c',3);c.restore();
    if(p.hp<=0)this.light(0,-20,50,'#b02d2522');
  }
  enemy(e,game){
    const c=this.ctx,t=this.time,bob=Math.sin(t*6+e.phase)*(e.aggro?2:.6),boss=e.type==='warden';
    this.ellipse(0,2,boss?28:13,boss?13:6,'#02090799');
    if(e.windup>0){this.ellipse(0,0,boss?65:22,boss?32:11,'#ae51303d');this.ellipse(0,0,boss?63:20,boss?30:10,'#d56e1b19');}
    if(e.elite&&!boss){this.ellipse(0,0,16,8,'#a7ac5144');}
    if(this.artLoaded&&e.type!=='crawler'){
      c.save();if(e.hit>0)c.filter='brightness(1.7)';else if(e.slow>0)c.filter='sepia(.4) hue-rotate(135deg)';c.translate(0,bob*.5);
      if(e.attackAnim>0){const v=this.iso(game.player.x-e.x,game.player.y-e.y),len=Math.hypot(v.x,v.y)||1,lunge=Math.sin((1-e.attackAnim/.3)*Math.PI)*9;c.translate(v.x/len*lunge,v.y/len*lunge);c.rotate(v.x/len*lunge*.006);}
      if(e.bossId){const id=e.bossId==='king'?5:e.bossId==='wanderer'?6:Number(e.bossId.split('-')[1])-1;this.campaignSprite(id+(e.attackAnim>0?8:0),boss?114:80,boss?144:100);}else this.sprite(boss?6:e.type==='wraith'?5:4,boss?114:e.type==='wraith'?75:64,boss?144:e.type==='wraith'?89:80);c.restore();
      if(e.hp<e.maxHp&&!boss){c.fillStyle='#120906';c.fillRect(-20,-88,40,3);c.fillStyle=e.elite?'#bd9b58':'#a35f41';c.fillRect(-20,-88,40*e.hp/e.maxHp,3);}
      if(e.burn>0)this.light(0,-30,35,'#ea8c4233');return;
    }
    c.translate(0,bob);if(e.hit>0){c.shadowBlur=10;c.shadowColor='#eee3af';}
    if(e.type==='skeleton'){
      const bone=e.hit>0?'#e4dabe':e.slow>0?'#96c6c9':'#aaa98e';
      this.line([[-3,-16],[-7,-7],[-8,0]],bone,3);this.line([[3,-16],[5,-7],[10,-1]],bone,3);
      this.line([[0,-29],[0,-14]],bone,3);
      for(let i=0;i<3;i++)this.line([[-6+i,-26+i*4],[6-i,-26+i*4]],bone,2);
      this.line([[-5,-28],[-11,-21],[-10,-13]],bone,3);this.line([[5,-28],[12,-23],[13,-15]],bone,3);
      this.ellipse(0,-34,6.2,7,bone);this.ellipse(-2,-35,1.7,2,'#344131');this.ellipse(2.5,-35,1.7,2,'#344131');
      this.line([[-2,-30],[3,-30]],'#36452f',1);this.line([[13,-18],[22,-38]],'#8f9d87',2);this.line([[10,-20],[17,-17]],'#7e8057',2);
      this.poly([[-5,-17],[5,-17],[7,-10],[-6,-9]],'#635c47','#344530');
    }else if(e.type==='wraith'){
      this.light(0,-23,35,'#71c0ac18');
      this.poly([[0,-46],[-8,-35],[-12,-19],[-16,2],[-5,-4],[0,1],[5,-5],[13,-1],[9,-25],[7,-38]],e.hit>0?'#bdcfb2':'#426c5f','#6e958033');
      this.poly([[0,-39],[-4,-32],[-3,-24],[4,-26],[4,-34]],'#172e27');this.line([[-2,-31],[3,-31]],'#d3db95',2);
      this.line([[-9,-26],[-18,-19],[-21,-23]],'#7ba08b',2);this.line([[9,-26],[19,-20],[21,-25]],'#7ba08b',2);
    }else if(e.type==='crawler'){
      const color=e.hit>0?'#d5c7a0':'#69704b';
      for(let i=0;i<3;i++){this.line([[-5,-4-i*3],[-15,-5-i*4],[-18,1-i*2]],'#7e8053',2);this.line([[5,-4-i*3],[15,-5-i*4],[18,1-i*2]],'#7e8053',2);}
      this.ellipse(0,-8,9,12,color);this.poly([[0,-20],[-6,-8],[0,-3],[6,-8]],'#8b8b50','#344c30');this.ellipse(0,-1,5,4,'#3e4930');this.ellipse(-3,-2,1.2,1.2,'#d5ba77');this.ellipse(3,-2,1.2,1.2,'#d5ba77');
    }else{
      this.light(0,-35,90,'#c7bc5f12');
      this.poly([[-15,-50],[-27,-6],[-11,-10],[0,0],[18,-4],[23,-51]],'#3a4939','#1a2b1e');
      this.poly([[-17,-52],[13,-56],[24,-31],[11,-20],[-14,-23],[-24,-35]],e.hit>0?'#b7ad87':'#747453','#b4a56b77');
      this.line([[-11,-47],[-5,-28],[13,-33]],'#ab9b65',3);
      this.poly([[-22,-56],[-7,-62],[-2,-52],[-19,-43],[-27,-47]],'#868467','#b6a57255');
      this.poly([[8,-59],[24,-55],[30,-43],[16,-40],[6,-50]],'#868467','#b6a57255');
      this.poly([[-7,-76],[6,-79],[12,-65],[5,-55],[-6,-57],[-12,-68]],'#b1ac7c','#48533a');
      this.poly([[-11,-74],[-16,-90],[-5,-80],[1,-86],[6,-80],[17,-91],[12,-73]],'#a29a68','#d1b97866');
      this.line([[-6,-68],[-1,-66]],'#c8d69b',2);this.line([[4,-67],[9,-70]],'#c8d69b',2);
      this.line([[22,-43],[38,-18],[52,-8]],'#9f9c72',5);this.line([[49,-35],[49,5]],'#a2a082',6);this.poly([[46,-35],[66,-26],[67,-16],[47,-20]],'#adb198','#536947');
    }
    c.shadowBlur=0;
    if(e.hp<e.maxHp&&e.type!=='warden'){c.fillStyle='#0a150e';c.fillRect(-17,-53,34,3);c.fillStyle=e.elite?'#c0a76b':'#9b674a';c.fillRect(-17,-53,34*e.hp/e.maxHp,3);}
    if(e.slow>0){c.strokeStyle='#84c9cf66';c.lineWidth=1;c.beginPath();c.ellipse(0,0,16,7,0,0,Math.PI*2);c.stroke();}
    if(e.burn>0){this.light(0,-12,25,'#d9742522');this.poly([[-4,-9],[-3,-20],[1,-15],[4,-25],[5,-8]],'#f0aa5a77');}
  }
  loot(loot,game){
    const c=this.ctx,color=loot.item?{normal:'#b3c3a0',magic:'#81b5d3',rare:'#d6bb68',legendary:'#ea9a56'}[loot.item.rarity]:'#c3ac68';
    this.ellipse(0,2,8,4,'#020a0877');this.light(0,-9,25,color+'19');
    if(loot.item){this.line([[0,0],[0,-33]],color+'44',2);this.poly([[-4,-3],[0,-9],[5,-5],[1,1]],color);}
    else {this.ellipse(-2,-2,3,1.6,'#bda45f');this.ellipse(3,0,3,1.6,'#d5ba6d');}
    if(distance(loot,game.player)<2.5||game.showLoot){c.font='9px Inter, sans-serif';c.textAlign='center';const name=loot.item?itemName(loot.item):`${loot.gold} gold`,width=c.measureText(name).width;c.fillStyle='#07120ee8';c.fillRect(-width/2-6,-48,width+12,16);c.strokeStyle=color+'66';c.strokeRect(-width/2-6,-48,width+12,16);c.fillStyle=color;c.fillText(name,0,-37);}
  }
  worldLabel(name,role,y){const c=this.ctx;c.textAlign='center';c.shadowColor='#000';c.shadowBlur=5;c.font='10px Georgia';c.fillStyle='#d5c295';c.fillText(name,0,y);if(role){c.font='6px Inter,sans-serif';c.fillStyle='#a18d6b';c.fillText(role,0,y+12);}c.shadowBlur=0;}
  npc(n,game){
    this.ellipse(0,2,17,7,'#08050388');this.sprite(n.sprite,n.id==='smith'?65:64,n.id==='smith'?88:91);
    const nearby=distance(n,game.player)<3;if(nearby){this.ctx.strokeStyle='#c7ac6a55';this.ctx.lineWidth=1;this.ctx.beginPath();this.ctx.ellipse(0,0,20,9,0,0,Math.PI*2);this.ctx.stroke();}
    this.worldLabel(n.name,n.role,-103);
    if(n.id==='guide'&&(!game.player.quests.guideMet||game.player.quests.wardenDefeated&&!game.player.quests.guideRewarded)){this.ctx.font='bold 20px Georgia';this.ctx.fillStyle='#e3c476';this.ctx.textAlign='center';this.ctx.fillText('!',0,-123+Math.sin(this.time*2)*3);}
  }
  portal(){
    const c=this.ctx,t=this.time;this.light(0,-25,100,'#a1d3bb22');
    for(let i=0;i<4;i++){c.strokeStyle=i%2?'#9ac6a7aa':'#ddcb8b77';c.lineWidth=2;c.beginPath();c.ellipse(0,-30,21+i*3,35+i*2,Math.sin(t*.5+i)*.1,0,Math.PI*2);c.stroke();}
    this.ellipse(0,-30,18,31,'#80c0aa1a');c.font='9px Inter';c.fillStyle='#d3d4ac';c.textAlign='center';c.fillText('DESCEND · F',0,-81);
  }
  effects(game){
    const c=this.ctx;
    for(const e of game.effects){const p=this.iso(e.x,e.y),progress=1-e.life/e.maxLife;c.save();c.translate(p.x,p.y+17);c.globalAlpha=Math.min(1,e.life*3);
      if(e.type==='ring'||e.type==='nova'||e.type==='quake'||e.type==='inferno'){
        const radius=e.radius*34*(.2+progress*.8),col=e.color||'#b9cc91';
        c.strokeStyle=col;c.lineWidth=(1-progress)*7+1;c.beginPath();c.ellipse(0,-3,radius,radius*.5,0,0,Math.PI*2);c.stroke();
        this.light(0,-3,radius,col+'15');
        if(e.type==='nova')for(let i=0;i<14;i++){const a=i*Math.PI/7;const x=Math.cos(a)*radius,y=Math.sin(a)*radius*.5;this.poly([[x-3,y],[x,y-15*(1-progress)],[x+3,y+1]],'#a2d9da99');}
      }else if(e.type==='slash'){
        const angle=Math.atan2(e.dy,e.dx),radius=e.radius||1.85,points=[];for(let i=0;i<=24;i++){const a=angle-1.05+i/24*2.1,v=this.iso(Math.cos(a)*radius,Math.sin(a)*radius);points.push([v.x,v.y-24]);}c.globalAlpha=1-progress;this.line(points,'#e8d5a3',4*(1-progress)+1);const tip=points[Math.min(24,Math.floor(progress*24))];this.light(tip[0],tip[1],14,'#f0d8a433');
      }else if(e.type==='dust'){
        this.ellipse(0,0,5+progress*9,2+progress*3,'#b6a18c22');
      }else if(e.type==='destination'){
        c.strokeStyle='#bca77c';c.lineWidth=1.4;c.beginPath();c.ellipse(0,0,9+progress*8,4+progress*4,0,0,Math.PI*2);c.stroke();
      }else if(e.type==='impact'){
        for(let i=0;i<7;i++){const a=i*2.4;this.line([[Math.cos(a)*progress*18,-15+Math.sin(a)*progress*18],[Math.cos(a)*progress*28,-15+Math.sin(a)*progress*28]],e.color||'#c8b77e',2);}
      }else if(e.type==='meteor-warning'){
        c.strokeStyle='#e29c5966';c.lineWidth=2;c.beginPath();c.ellipse(0,0,e.radius*34,e.radius*17,0,0,Math.PI*2);c.stroke();this.light(0,0,e.radius*34,'#db77331a');
        if(progress>.5){this.line([[70*(1-progress),-200*(1-progress)],[0,-4]],'#ffc78e99',8);this.light(0,-25,50,'#d99e541f');}
      }else if(e.type==='vortex'){
        for(let i=0;i<4;i++){c.strokeStyle='#b0a1d288';c.lineWidth=2;c.beginPath();c.ellipse(0,-5,20+i*17,8+i*8,this.time+i,0,Math.PI*1.5);c.stroke();}this.light(0,-5,80,'#9c8cda1a');
      }else if(e.type==='lightning'){
        const to=this.iso(e.tx,e.ty),from=this.iso(e.x,e.y),dx=to.x-from.x,dy=to.y-from.y;
        this.line([[0,-20],[dx*.25+8,dy*.25-35],[dx*.5-7,dy*.5-15],[dx*.75+6,dy*.75-28],[dx,dy-20]],'#a2d9df',2.5);
      }else if(e.type==='heal'){this.light(0,-20,55,'#bfe5a433');for(let i=0;i<5;i++)this.ellipse(Math.cos(i*2.2)*15,-progress*60+i*4,2,2,'#bdd89c');}
      c.restore();
    }
    for(const b of game.projectiles){const p=this.iso(b.x,b.y),v=this.iso(b.dx,b.dy),len=Math.hypot(v.x,v.y)||1,color=b.kind==='blade'?'#d6c89e':b.kind==='aether'?'#9bcef1':'#ffb15c';c.save();c.translate(p.x,p.y-7);this.light(0,0,b.kind==='blade'?15:27,color+'33');this.ellipse(0,0,b.kind==='blade'?8:6,3,color);this.line([[0,0],[-v.x/len*22,-v.y/len*22]],color+'99',4);c.restore();}
    for(const f of game.floaters){const p=this.iso(f.x,f.y);c.save();c.globalAlpha=Math.min(1,f.life);c.font=`${f.crit?'bold 19':'12'}px ${f.crit?'Georgia':'Inter'},serif`;c.textAlign='center';c.fillStyle=f.color||'#d9d7b6';c.shadowColor='#06120c';c.shadowBlur=4;c.fillText(f.text,p.x,p.y-42-(1.4-f.life)*27);c.restore();}
  }
  waypoint(o,game){
    const c=this.ctx,t=this.time,lit=game.player.campaign?.waypoints.includes(game.zone==='town'?'emberfall':`act-${game.act}-${game.dungeon.kind}`);
    this.ellipse(0,2,31,15,'#070a0be0');this.poly([[-29,-3],[0,-18],[29,-3],[29,7],[0,22],[-29,7]],'#343630','#8e90766b');this.poly([[-27,-5],[0,-19],[27,-5],[0,9]],'#4c5044','#9d9c7766');
    c.strokeStyle=lit?'#90d8dfaa':'#7e8d8788';c.lineWidth=1.5;c.beginPath();c.ellipse(0,-5,20,9,0,0,Math.PI*2);c.stroke();
    for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;this.line([[Math.cos(a)*12,-5+Math.sin(a)*6],[Math.cos(a)*20,-5+Math.sin(a)*10]],lit?'#a3e5e4aa':'#888d7777',1.5);}
    this.poly([[0,-13],[8,-5],[0,3],[-8,-5]],lit?'#95e2eb88':'#96a09b33');if(lit){this.light(0,-13,65,'#75d4e324');for(let i=0;i<5;i++)this.ellipse(Math.sin(i*3+t)*11,-12-(t*15+i*12)%55,1,1,'#a8e6ec88');}
    this.worldLabel(lit?'ATTUNED WAYPOINT':'ANCIENT WAYPOINT','F · TRAVEL',-60);
  }
  spirit(o,game){
    const c=this.ctx;c.save();this.light(0,-45,90,'#9dc8e52b');c.globalAlpha=.68+Math.sin(this.time*1.8)*.09;c.translate(0,Math.sin(this.time*1.8)*3-7);this.campaignSprite(distance(o,game.player)<3?15:7,78,110);c.restore();this.worldLabel('KING ALARIC','THE UNFORGOTTEN · F',-127);
  }
  shrine(o,game){this.light(0,-38,85,'#ead6a126');this.pillar({variant:2});this.ellipse(0,-65,10,4,'#dbc37a66');this.ctx.font='29px Georgia';this.ctx.textAlign='center';this.ctx.fillStyle='#dcc489';this.ctx.fillText('☼',0,-69+Math.sin(this.time)*2);this.worldLabel('SHRINE OF THE OLD GODS','F · RECEIVE BLESSING',-111);}
  drawMap(game){
    if(this.time<(this.nextMap||0))return;this.nextMap=this.time+.1;
    const render=(c,w,h,overlay)=>{
      const {dungeon:d,player:p}=game;c.clearRect(0,0,w,h);const scale=overlay?9:2.35,project=(x,y)=>({x:(x-y)*scale+w/2-(overlay?(p.x-p.y)*scale:0),y:(x+y)*scale*.5+h/2-(overlay?(p.x+p.y)*scale*.5:d.size*scale*.5)});
      c.lineWidth=overlay?1.2:.7;c.strokeStyle=overlay?'#d7c59c99':'#c5b68c9c';c.beginPath();
      for(let y=0;y<d.size;y++)for(let x=0;x<d.size;x++){
        if(!d.tiles[y][x]||!d.seen.has(y*d.size+x))continue;const at=project(x,y),a=scale,b=scale*.5;
        if(!d.tiles[y-1]?.[x]){c.moveTo(at.x,at.y);c.lineTo(at.x+a,at.y+b);}if(!d.tiles[y]?.[x+1]){c.moveTo(at.x+a,at.y+b);c.lineTo(at.x,at.y+2*b);}if(!d.tiles[y+1]?.[x]){c.moveTo(at.x,at.y+2*b);c.lineTo(at.x-a,at.y+b);}if(!d.tiles[y]?.[x-1]){c.moveTo(at.x-a,at.y+b);c.lineTo(at.x,at.y);}
      }c.stroke();
      if(d.roads){c.fillStyle=overlay?'#b19e7055':'#b19e7033';for(const key of d.roads)if(d.seen.has(key)){const at=project(key%d.size,Math.floor(key/d.size));c.fillRect(at.x-.6,at.y-.4,1.2,.8);}}
      const marker=(o,color,r=3)=>{if(!o||!d.seen.has(Math.floor(o.y)*d.size+Math.floor(o.x)))return;const at=project(o.x,o.y);c.strokeStyle=color;c.lineWidth=1.4;c.beginPath();c.moveTo(at.x,at.y-r);c.lineTo(at.x+r,at.y);c.lineTo(at.x,at.y+r);c.lineTo(at.x-r,at.y);c.closePath();c.stroke();};
      marker(d.townWaypoint,'#99dce2',overlay?7:4);marker(d.returnGate,'#d1b271',overlay?6:3);marker(d.waypoint,'#99dce2',overlay?7:4);marker(d.portal,'#d1b271',overlay?8:4);marker(d.spirit,'#b9e0ed',overlay?5:2);marker(d.shrine,'#e0d5a3',overlay?5:2);
      for(const n of d.npcs||[])marker(n,'#cbb47e',2);for(const e of d.enemies)if(!e.dead&&distance(e,p)<8)marker(e,e.type==='warden'?'#d6a55f':'#b76c52',e.type==='warden'?4:1.5);
      const v=project(p.x,p.y);c.fillStyle='#f1dfb0';c.beginPath();c.moveTo(v.x,v.y-5);c.lineTo(v.x+3,v.y+3);c.lineTo(v.x,v.y+1);c.lineTo(v.x-3,v.y+3);c.closePath();c.fill();
      if(overlay){c.textAlign='center';c.font='12px Georgia';c.fillStyle='#cbb98caa';c.fillText(document.getElementById('location').textContent,w/2,25);c.font='9px Georgia';c.fillStyle='#b8a68099';c.fillText('TAB · CLOSE     ◈ WAYPOINT     ◆ ROAD / GATE     G · WORLD MAP',w/2,h-20);}
    };
    render(this.mc,this.map.width,this.map.height,false);const overlay=document.getElementById('map-overlay');if(game.largeMap&&overlay)render(overlay.getContext('2d'),overlay.width,overlay.height,true);
  }
}
