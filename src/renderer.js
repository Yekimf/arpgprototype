import {BossArt} from './boss-art.js';
import {doorAnimation} from './exit-doors.js';
import {chickenFacesRight} from './network/chicken-companions.js';
import {CHICKEN_BREEDS_ART} from './assets.js';
import {breedOf,wildIdentity,HATS} from './chicken-pets.js';
import {PaintedSkills} from './skill-sprites.js';
import {paintedFireField} from './painted-skills.js';
import {visibleTownPortals,drawTownPortal} from './town-portals.js';
import {DeathSprites} from './death-sprites.js';
import {advanceRemains,paintStain,drawRemainsParticles} from './death-remains.js';
import {dressDungeon} from './dungeon-architecture.js';
import {paintDungeonWall,drawDungeonDressing,drawWallFixture} from './dungeon-wall-art.js';
import {floorMaterial,makeFloorMaterial} from './act-one-materials.js';
import {makeStructureShadow} from './structure-shadows.js';
import {EnemySprites} from './enemy-sprites.js';
import {enemyHitPose,enemyHealthTrail} from './enemy-feedback.js';
import {enemyFamily} from './enemy-appearance.js';
import {FARM_BASELINES,SCENE_BASELINES} from './scene-anchors.js';
import {placeLootLabels} from './loot-labels.js';
import {fountainActive,fountainKey} from './waypoint-fountains.js';
import {combatEffect,combatProjectile} from './combat-vfx.js';
import forestSizes from './art/forest-life-sizes.json';
import {passivePosition} from './farmland.js';
import {WORLD_FOOT_OFFSETS} from './world-bounds.js';
import {GuardSprites} from './guard-sprites.js';
import {pyreStats} from './devotion.js';
import {clamp, distance} from './game.js';
import {STONE_COLUMN_ART,CHICKEN_ART,STASH_CHEST_ART,WAYPOINT_FOUNTAIN_ART,WORLD_ART,ITEM_ART,CAMPAIGN_ART,MARCHGATE_ART,MARCHGATE_INNER_ART,FARM_ART,FOREST_LIFE_ART,FOREST_GROUND_ART} from './assets.js';
import {itemName} from './settlement.js';
const PAINTED_GROUND_EFFECTS=new Set(['nova','quake','vortex','ground-fire']);
const COMBAT_TRANSIENTS=new Set(['melee-trail','hit-impact','weapon-hit','evade-dust']);

export class Renderer {
  constructor(canvas, minimap) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.map=minimap; this.mc=minimap.getContext('2d');
    this.w=0;this.h=0;this.camera={x:0,y:0};this.time=0;this.zoom=1;
    this.bossArt=new BossArt();this.skillArt=new PaintedSkills();this.deaths=new DeathSprites();this.enemySprites=new EnemySprites();this.columnArt=new Image();this.columnArt.src=STONE_COLUMN_ART;this.chickenArt=new Image();this.chickenArt.src=CHICKEN_BREEDS_ART;this.stashArt=new Image();this.stashArt.src=STASH_CHEST_ART;this.fountainArt=new Image();this.fountainArt.src=WAYPOINT_FOUNTAIN_ART;this.forestGroundArt=new Image();this.forestGroundArt.src=FOREST_GROUND_ART;this.forestArt=new Image();this.forestArt.src=FOREST_LIFE_ART;this.worldArt=new Image();this.worldArt.src=WORLD_ART;this.itemArt=new Image();this.itemArt.src=ITEM_ART;this.farmArt=new Image();this.farmArt.src=FARM_ART;
    this.innerGateArt=new Image();this.innerGateArt.src=MARCHGATE_INNER_ART;this.gateArt=new Image();this.gateArt.src=MARCHGATE_ART;this.campaignArt=new Image();this.campaignArt.src=CAMPAIGN_ART;this.heroFrame={row:0,column:0,action:'idle'};
    this.remainsArt=new WeakMap();this.corpseArt=new Map();this.stainArt=new Map();this.contactShadows=new Map();this.artKeys=new WeakMap();this.artSerial=0;this.guard=new GuardSprites();this.groundCache=new Map();this.glowCache=new Map();this.wallCache=new Map();this.spriteCache=new Map();this.tileCache=new Map();this.artLoaded=false;
    for(const art of [...this.bossArt.images,...this.skillArt.images,...this.deaths.images,...this.enemySprites.images,this.columnArt,this.chickenArt,this.stashArt,this.fountainArt,this.forestGroundArt,this.forestArt,this.worldArt,this.itemArt,this.farmArt,this.gateArt,this.innerGateArt,this.campaignArt,this.guard.setArt,this.guard.art,this.guard.items,this.guard.original,this.guard.weapons])art.addEventListener('load',()=>{this.artLoaded=[...this.bossArt.images,...this.skillArt.images,...this.deaths.images,...this.enemySprites.images,this.columnArt,this.chickenArt,this.stashArt,this.fountainArt,this.forestGroundArt,this.forestArt,this.worldArt,this.itemArt,this.farmArt,this.gateArt,this.innerGateArt,this.campaignArt,this.guard.setArt,this.guard.art,this.guard.items,this.guard.original,this.guard.weapons].every(i=>i.complete&&i.naturalWidth>0);this.needsDraw=true;});
    this.resize();window.addEventListener('resize',()=>this.resize());
  }
  configure(settings){this.settings=settings;this.adaptiveScale=1;this.frameSample=null;this.canvas.style.filter=settings.brightness===100?'none':`brightness(${settings.brightness/100})`;this.resize();}
  trackFrame(ms){
    if(this.settings?.quality!=='balanced'||this.settings.frameLimit<60)return;
    this.frameSample??={time:0,frames:0};this.frameSample.time+=Math.min(ms,150);this.frameSample.frames++;
    if(this.frameSample.time<2000)return;const mean=this.frameSample.time/this.frameSample.frames;this.frameSample={time:0,frames:0};const old=this.adaptiveScale||1;
    if(mean>28)this.adaptiveScale=Math.max(.75,old-.15);else if(mean<17.5)this.adaptiveScale=Math.min(1,old+.05);if(this.adaptiveScale!==old&&this.adaptiveScale)this.resize();
  }
  resize(){this.w=window.innerWidth;this.h=window.innerHeight;const cap=({performance:[960,600],balanced:[1280,800],high:[1920,1200]})[this.settings?.quality||'balanced'],dpr=Math.min(devicePixelRatio||1,1,cap[0]/this.w*(this.adaptiveScale||1),cap[1]/this.h*(this.adaptiveScale||1));this.canvas.width=this.w*dpr;this.canvas.height=this.h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.zoom=this.w<650?.85:this.h<540?.85:1.12;this.needsDraw=true;}
  iso(x,y){return {x:(x-y)*34,y:(x+y)*17};}
  screen(x,y,z=0){const p=this.iso(x,y);return{x:(p.x-this.camera.x)*this.zoom+(this.originX??this.w/2),y:(p.y-this.camera.y-z)*this.zoom+this.h*.53};}
  unproject(x,y,z=0){const a=(x-(this.originX??this.w/2))/this.zoom+this.camera.x,b=(y-this.h*.53)/this.zoom+this.camera.y+z;return{x:(a/34+b/17)/2,y:(b/17-a/34)/2};}
  poly(points,fill,stroke=null,width=1){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  ellipse(x,y,rx,ry,fill){const c=this.ctx;c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  line(points,color,width=1){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  light(x,y,r,color){let glow=this.glowCache.get(color);if(!glow){glow=document.createElement('canvas');glow.width=glow.height=128;const ctx=glow.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);this.glowCache.set(color,glow);}this.ctx.drawImage(glow,x-r,y-r,r*2,r*2);}
  cachedSprite(art,index,w,h,offsetY=0,tint=null){
    if(!art.complete||!art.naturalWidth)return false;let artKey=this.artKeys.get(art);if(!artKey){artKey=++this.artSerial;this.artKeys.set(art,artKey);}const key=artKey+'-'+index+'-'+Math.round(w)+'-'+Math.round(h)+'-'+(tint||'');let cached=this.spriteCache.get(key);
    if(!cached){cached=document.createElement('canvas');cached.width=Math.ceil(w);cached.height=Math.ceil(h);const size=art.naturalWidth/4;cached.getContext('2d').drawImage(art,index%4*size+.8,Math.floor(index/4)*size+.8,size-1.6,size-1.6,0,0,cached.width,cached.height);if(tint){const ctx=cached.getContext('2d');ctx.globalCompositeOperation='source-atop';ctx.fillStyle=tint+'26';ctx.fillRect(0,0,cached.width,cached.height);}this.spriteCache.set(key,cached);if(this.spriteCache.size>220)this.spriteCache.delete(this.spriteCache.keys().next().value);}
    this.ctx.drawImage(cached,-w/2,-h+offsetY,w,h);return true;
  }
  structureShadow(art,index,w,h,offsetY=0){
    if(!art.complete||!art.naturalWidth)return;
    let id=this.artKeys.get(art);if(!id){id=++this.artSerial;this.artKeys.set(art,id);}
    const key=`${id}:${index}:${w}:${h}`;let shadow=this.contactShadows.get(key);
    if(!shadow){shadow=makeStructureShadow(art,index,w,h);this.contactShadows.set(key,shadow);if(this.contactShadows.size>64)this.contactShadows.delete(this.contactShadows.keys().next().value);}
    const {canvas,scale,cut,pad}=shadow;this.ctx.drawImage(canvas,-w/2-pad/scale,-h+offsetY+(cut-pad)/scale,canvas.width/scale,canvas.height/scale);
  }
  sprite(index,w,h,offsetY=0,tint=null){return this.cachedSprite(this.worldArt,index,w,h,offsetY,tint);}
  campaignSprite(index,w,h){return this.cachedSprite(this.campaignArt,index,w,h);}
  locationTile(theme,variant){const key=theme+'-'+variant;if(!this.tileCache.has(key))this.tileCache.set(key,makeFloorMaterial(this.itemArt,theme,variant));return this.tileCache.get(key);}
  terrain(index,variant=0,tone=1,farm=false){
    const key=`${farm?'farm':'stone'}-${index}-${variant}-${tone}`;if(this.tileCache.has(key))return this.tileCache.get(key);
    if(!this.itemArt.complete||!this.itemArt.naturalWidth)return null;
    const art=farm?this.farmArt:this.itemArt,canvas=document.createElement('canvas');canvas.width=136;canvas.height=68;const c=canvas.getContext('2d'),s=art.naturalWidth/4;
    c.translate(68,0);c.transform(1,.5,-1,.5,0,0);
    const crop=s*.62,margin=farm?s*.06:0,ox=margin+variant%2*(s-crop-margin*2),oy=margin+Math.floor(variant/2)*(s-crop-margin*2);
    c.drawImage(art,index*s+ox,oy,crop,crop,0,0,68,68);
    c.globalCompositeOperation='source-atop';c.fillStyle=index===0?'#291a1422':index===2?'#10101622':'#22170d16';c.fillRect(0,0,68,68);
    if(tone>1){c.fillStyle=({2:'#23474c55',3:'#572b1e66',4:'#becedb38',5:'#382c4255'})[tone]||'transparent';c.fillRect(0,0,68,68);}
    this.tileCache.set(key,canvas);return canvas;
  }
  forestTerrain(index,variant=0){
    const key='forest-'+index+'-'+variant;if(this.tileCache.has(key))return this.tileCache.get(key);
    const art=this.forestGroundArt;if(!art.complete||!art.naturalWidth)return null;
    const canvas=document.createElement('canvas');canvas.width=136;canvas.height=68;const c=canvas.getContext('2d'),s=art.naturalWidth/2,crop=s*.7;
    const sample=(ctx,i)=>ctx.drawImage(art,i%2*s+(variant%2)*(s-crop),Math.floor(i/2)*s+Math.floor(variant/2)*(s-crop),crop,crop,0,0,68,68);
    const square=document.createElement('canvas');square.width=square.height=68;const sc=square.getContext('2d');sample(sc,index===1?1:0);
    if(index>=2){const patch=document.createElement('canvas');patch.width=patch.height=68;const pc=patch.getContext('2d');sample(pc,index);pc.globalCompositeOperation='destination-in';const mask=pc.createRadialGradient(34,34,8,34,34,34);mask.addColorStop(0,'#000c');mask.addColorStop(1,'#0000');pc.fillStyle=mask;pc.fillRect(0,0,68,68);sc.drawImage(patch,0,0);}
    c.translate(68,0);c.transform(1,.5,-1,.5,0,0);c.drawImage(square,0,0);
    this.tileCache.set(key,canvas);return canvas;
  }
  drawForestDetail(ctx,d,left,top,width,height){
    // Repaint already-generated tiles into the viewport cache at native detail.
    // This keeps fine earth/grass grain without retaining a full-resolution
    // 224-square terrain canvas. No simulation or generation happens here.
    const x1=Math.max(0,Math.floor((left/34+top/17)/2)-2),x2=Math.min(d.size,Math.ceil(((left+width)/34+(top+height)/17)/2)+2),y1=Math.max(0,Math.floor((top/17-(left+width)/34)/2)-2),y2=Math.min(d.size,Math.ceil(((top+height)/17-left/34)/2)+2),b=d.townBounds;
    for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++){
      const camp=b&&x>=b.x1&&x<=b.x2&&y>=b.y1&&y<=b.y2;
      if(d.water?.has(y*d.size+x)||!d.tiles[y][x]&&!camp)continue;
      const p=this.iso(x,y);if(p.x<left-34||p.x>left+width+34||p.y<top-34||p.y>top+height)continue;
      const n=((x*73856093^y*19349663)>>>0)%100,road=d.roads?.has(y*d.size+x)||d.town&&(Math.abs(x-32.5)<1.7||Math.abs(y-32.5)<1.7),tile=this.forestTerrain(road?1:n<25?2:n>87?3:0,n%4);
      const material=floorMaterial(d,x,y),surface=material?this.locationTile(material,n%4):tile;
      if(surface)ctx.drawImage(surface,p.x-34,p.y,68,34);
    }
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
      const canvas=document.createElement('canvas'),scale=d.size>=160?.25:.5;canvas.width=Math.ceil(612*scale);canvas.height=Math.ceil(352*scale);
      const c=canvas.getContext('2d'),old=this.ctx;c.scale(scale,scale);this.ctx=c;c.translate(ox,0);
      for(let y=y0;y<Math.min(y0+8,d.size);y++)for(let x=x0;x<Math.min(x0+8,d.size);x++){
        const camp=d.townBounds&&x>=d.townBounds.x1&&x<=d.townBounds.x2&&y>=d.townBounds.y1&&y<=d.townBounds.y2;if(!d.tiles[y][x]&&!camp&&!d.water?.has(y*d.size+x)&&!d.outdoor&&!(d.town&&Math.hypot(x-32.5,y-32.5)<22))continue;
        const point=this.iso(x,y),v={x:point.x-base.x,y:point.y-base.y};
      const n=((x*73856093^y*19349663)>>>0)%100;if(d.water?.has(y*d.size+x)){this.poly([[v.x,v.y],[v.x+34,v.y+17],[v.x,v.y+34],[v.x-34,v.y+17]],n<50?'#202d28':'#283731','#334036',.5);this.line([[v.x-15,v.y+16],[v.x+11,v.y+16]],'#72837425');continue;}
      const color=n<15?'#293d30':n<45?'#344238':n<70?'#3a483d':'#414c40';
      const outside=d.outdoor&&!d.tiles[y][x]&&!d.foundationTiles?.has(y*d.size+x);
      const road=d.foundationTiles?.has(y*d.size+x)||d.roads?.has(y*d.size+x)||d.town&&(Math.abs(x-32.5)<1.7||Math.abs(y-32.5)<1.7);
      const farmIndex=d.barnFloors?.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)?3:road?2:d.cropPlots?.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)?0:1;
      const material=floorMaterial(d,x,y),tile=material?this.locationTile(material,n%4):!d.farm&&(d.town||camp||d.outdoor&&d.act===1)?this.forestTerrain(road?1:n<25?2:n>87?3:0,n%4):this.terrain(d.farm?farmIndex:d.town||d.outdoor?(road?1:0):d.courts?.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)?1:2,n%4,d.act||1,!!d.farm);
      if(tile){c.drawImage(tile,v.x-34,v.y,68,34);if(!material&&!d.farm&&!d.outdoor&&!d.town)this.line([[v.x,v.y],[v.x+34,v.y+17],[v.x,v.y+34],[v.x-34,v.y+17],[v.x,v.y]],'#0b07053a',.5);}
      else this.poly([[v.x,v.y],[v.x+34,v.y+17],[v.x,v.y+34],[v.x-34,v.y+17]],color,'#121f18',1.5);

      if(outside)this.poly([[v.x,v.y],[v.x+34,v.y+17],[v.x,v.y+34],[v.x-34,v.y+17]],'#17180f99');
      if(!d.farm&&!material){if(!d.outdoor&&!d.town)this.line([[v.x,v.y+2],[v.x+31,v.y+17]],'#66705a44');
      if(!d.town&&n%4===0)this.line([[v.x-24,v.y+16],[v.x-5,v.y+23],[v.x+1,v.y+20],[v.x+10,v.y+23]],'#14131166');
      if(n%7===0){this.ellipse(v.x+6,v.y+16,15,6,'#33483266');this.ellipse(v.x+12,v.y+18,7,3,'#60764435');}
      if(n%19===0){this.poly([[v.x-6,v.y+8],[v.x+6,v.y+13],[v.x+2,v.y+17],[v.x-9,v.y+12]],'#69736144');}
      if(n%13===0)this.line([[v.x+8,v.y+9],[v.x+3,v.y+13],[v.x+11,v.y+18],[v.x+7,v.y+22]],'#16271c');
      }
      // Exposed edges reveal the depth of the ancient foundations.
      if(!d.wallSegments&&!d.town&&!d.outdoor&&!d.tiles[y+1]?.[x]){this.poly([[v.x-34,v.y+17],[v.x,v.y+34],[v.x,v.y+62],[v.x-34,v.y+45]],'#211e19','#100d0b');this.line([[v.x-33,v.y+31],[v.x-1,v.y+47]],'#393329');}
      if(!d.wallSegments&&!d.town&&!d.outdoor&&!d.tiles[y]?.[x+1]){this.poly([[v.x+34,v.y+17],[v.x,v.y+34],[v.x,v.y+62],[v.x+34,v.y+45]],'#2b261f','#100d0b');this.line([[v.x+33,v.y+31],[v.x+1,v.y+47]],'#42392c');}

      }
      this.ctx=old;
      cached={canvas,x:base.x-ox,y:base.y};this.groundCache.set(key,cached);
      if(this.groundCache.size>(this.chunkBudget||48))this.groundCache.delete(this.groundCache.keys().next().value);
    }
    return cached;
  }
  async prepareDungeon(d,progress){
    const token={};this.prepareToken=token;
    await Promise.all([...this.bossArt.images,...this.skillArt.images,...this.deaths.images,...this.enemySprites.images,this.columnArt,this.chickenArt,this.stashArt,this.fountainArt,this.forestGroundArt,this.forestArt,this.worldArt,this.itemArt,this.farmArt,this.gateArt,this.innerGateArt,this.campaignArt,this.guard.setArt,this.guard.art,this.guard.items,this.guard.original,this.guard.weapons].map(art=>art.decode()));
    if(this.prepareToken!==token)return;
    // Prepare every terrain chunk, indoors and outdoors, at half resolution.
    // A new region is never revealed or generated by player movement.
    d.foundationTiles=new Set();for(const p of d.props)if(p.type==='building'&&p.sprite!==7||p.type==='farm-prop'&&[12,13].includes(p.farmSprite)){const r=p.stash ? .75 : p.exit ? 3 : 2;for(let y=Math.max(0,Math.floor(p.y-r));y<Math.min(d.size,p.y+r+1);y++)for(let x=Math.max(0,Math.floor(p.x-r));x<Math.min(d.size,p.x+r+1);x++)if(Math.hypot(x+.5-p.x,y+.5-p.y)<r+.6)d.foundationTiles.add(y*d.size+x);}
    dressDungeon(d);this.cachedDungeon=null;this.drawGround(d,0,0);
    if(!d.outdoor&&!d.town&&!d.critters)d.critters=d.rooms.slice(1,5).map((r,i)=>({x:r.x+1.5,y:r.y+1.5,species:'rat',phase:i*1.7}));
    {const count=Math.ceil(d.size/8);this.chunkBudget=count*count;for(let cy=0;cy<count;cy++){if(this.prepareToken!==token)return;for(let cx=0;cx<count;cx++)this.groundChunk(d,cx,cy);progress((cy+1)/count);await new Promise(requestAnimationFrame);}}
    if(d.farm){const previous=this.ctx;this.ctx=document.createElement('canvas').getContext('2d');try{for(const p of d.props)if(p.type==='farm-prop')this.cachedSprite(this.farmArt,p.farmSprite,p.width,p.height);this.cachedSprite(this.farmArt,6,250,190);}finally{this.ctx=previous;}}
    this.artLoaded=true;this.preparedDungeon=d;this.groundView=null;progress(1);
  }
  drawGround(d,viewW,viewH){
    if(this.cachedDungeon!==d){this.cachedDungeon=d;this.groundView=null;this.groundCache.clear();this.staticObjects=[...d.props,...(d.npcs||[]).map(n=>({...n,type:'npc'}))];
      if(!d.town&&!d.outdoor){dressDungeon(d);this.staticObjects=[...d.props,...(d.npcs||[]).map(n=>({...n,type:'npc'})),...d.wallSegments];}
    }
    const width=Math.ceil(viewW*2+192),height=Math.ceil(viewH*2+192),oldView=this.groundView;
    const refresh=!oldView||oldView.d!==d||oldView.canvas.width!==width||oldView.canvas.height!==height||Math.abs(this.camera.x-oldView.cx)>80||Math.abs(this.camera.y-oldView.cy)>80;
    if(refresh){
      const canvas=oldView?.canvas||document.createElement('canvas');canvas.width=width;canvas.height=height;
      const x=Math.floor(this.camera.x-width/2),y=Math.floor(this.camera.y-height/2),ctx=canvas.getContext('2d'),old=this.ctx;ctx.translate(-x,-y);this.ctx=ctx;
      if(d.outdoor)this.forestFloor(ctx,d,x,y,width,height);
      this.chunkBudget=Math.ceil(d.size/8)**2;
      for(let cy=0;cy<Math.ceil(d.size/8);cy++)for(let cx=0;cx<Math.ceil(d.size/8);cx++){const center=this.iso(cx*8+4,cy*8+4);if(Math.abs(center.x-this.camera.x)>viewW+396||Math.abs(center.y-this.camera.y)>viewH+246)continue;const cached=this.groundChunk(d,cx,cy);ctx.drawImage(cached.canvas,cached.x,cached.y,612,352);}
      if(!d.farm&&(d.town||d.townBounds||d.outdoor&&d.act===1)&&this.settings?.quality!=='performance')this.drawForestDetail(ctx,d,x,y,width,height);
      this.ctx=old;this.groundView={canvas,x,y,cx:this.camera.x,cy:this.camera.y,seen:d.seen.size,time:this.time,d};
    }
    const view=this.groundView;this.ctx.drawImage(view.canvas,view.x,view.y);
  }

  draw(game,dt){
    this.skillArt.beginFrame(game.settings);
    const c=this.ctx,{dungeon:d,player:p}=game;this.time+=dt;
    this.artLoaded=this.guard.ready&&this.worldArt.complete&&this.worldArt.naturalWidth>0&&this.itemArt.complete&&this.itemArt.naturalWidth>0&&this.campaignArt.complete&&this.campaignArt.naturalWidth>0;
    this.originX??=this.w/2;this.originX+=((this.w-(game.hudWidth||0))/2-this.originX)*Math.min(1,dt*12);
    const target=this.iso(p.x,p.y);this.camera.x+=(target.x-this.camera.x)*Math.min(1,dt*7);this.camera.y+=(target.y-this.camera.y)*Math.min(1,dt*7);
    c.fillStyle=d.town?'#171512':'#0d0c0b';c.fillRect(0,0,this.w,this.h);
    c.save();c.translate(this.originX,this.h*.53);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
    const viewW=this.w/this.zoom/2+120,viewH=this.h/this.zoom/2+140;
    this.drawGround(d,viewW,viewH);
    if(!game.loading&&(!game.paused||game.panel==='death'||game.lanActive))advanceRemains(d,dt);
    this.drawRemainsGround(game,viewW,viewH);
    for(const [id,on]of Object.entries(game.auras||{}))if(on){const v=this.iso(p.x,p.y);c.save();c.translate(v.x,v.y);combatEffect(this,{type:'sigil',skill:id,radius:id==='focus'?1.6:1.2,element:id==='focus'?'fire':'aether'},.2,game);c.restore();}
    if(game.pyre){const v=this.iso(p.x,p.y);this.fireField(v.x,v.y,pyreStats(p,game.stats).radius,11);}
    c.globalAlpha=1;this.effects(game,true);
    // Back walls, crenellated masonry, and scattered objects share painter ordering.
    const visible=o=>{const v=this.iso(o.x,o.y);if(o.type.startsWith('kingdom-gate'))return Math.abs(v.x-this.camera.x)<viewW+o.width/2&&v.y-this.camera.y<viewH+o.height&&v.y-this.camera.y>-viewH;return Math.abs(v.x-this.camera.x)<viewW&&Math.abs(v.y-this.camera.y)<viewH;};
    if(this.indexedObjects!==this.staticObjects){this.indexedObjects=this.staticObjects;this.staticBins=new Map();this.largeObjects=[];for(const o of this.staticObjects){if(o.type.startsWith('kingdom-gate')){this.largeObjects.push(o);continue;}const key=Math.floor(o.x/8)+','+Math.floor(o.y/8);if(!this.staticBins.has(key))this.staticBins.set(key,[]);this.staticBins.get(key).push(o);}}
    const worldX=(this.camera.x/34+this.camera.y/17)/2,worldY=(this.camera.y/17-this.camera.x/34)/2,reach=(viewW/34+viewH/17)/2+8,objects=this.largeObjects.filter(visible);
    for(let by=Math.floor((worldY-reach)/8);by<=Math.floor((worldY+reach)/8);by++)for(let bx=Math.floor((worldX-reach)/8);bx<=Math.floor((worldX+reach)/8);bx++)for(const o of this.staticBins.get(bx+','+by)||[])if(visible(o))objects.push(o);
    for(const hen of d.chickens||[])if((!hen.capturing||game.chickenUI?.capture?.time<.65)&&!p.pets?.captured?.includes(wildIdentity(d,hen))&&visible(hen))objects.push({...hen,type:'chicken'});
    for(const hen of game.lanChickens||[])if(visible(hen))objects.push({...hen,type:'chicken'});
    if(game.chickenFollower)objects.push({...game.chickenFollower,type:'chicken'});
    if(game.chickenUI?.vendor)objects.push({...game.chickenUI.vendor,type:'npc'});
    for(const sheep of d.livestock||[])if(visible(sheep))objects.push(sheep);
    for(const animal of d.critters||[])objects.push({...animal,...passivePosition(animal,d,this.time),type:'critter'});
    for(const loot of game.loot)objects.push({...loot,type:'loot',loot});
    if(d.returnGate)objects.push({...d.returnGate,type:d.farm?'farm-entrance':d.fortress?'kingdom-gate-inside':d.entranceStyle==='crypt'?'crypt-entrance':'entrance',width:d.farm?250:d.fortress?1120:230,height:d.farm?190:d.fortress?747:245});
    if(d.waypoint)objects.push({...d.waypoint,type:'waypoint'});if(d.townWaypoint)objects.push({...d.townWaypoint,type:'waypoint'});

    if(d.provisions&&!game.player.quests.provisionsRecovered)objects.push({...d.provisions,type:'quest-object',kind:'provisions'});
    if(d.field)objects.push({...d.field,type:'quest-object',kind:d.field.kind||'orders'});
    if(d.supplies)objects.push({...d.supplies,type:'supplies'});
    if(d.exitDoor)objects.push({...d.exitDoor,type:'exit-door'});else if(d.bossDead)objects.push({...d.portal,type:'portal'});
    for(const portal of visibleTownPortals(game))objects.push({...portal,type:'town-portal'});
    for(const enemy of d.enemies)if(!enemy.dead&&(d.outdoor||distance(enemy,p)<14)&&d.seen.has(Math.floor(enemy.y)*d.size+Math.floor(enemy.x)))objects.push({...enemy,type:'enemy',enemy});
    for(const corpse of d.remains?.corpses||[])if(corpse.age<corpse.duration)objects.push({...corpse,type:'falling-body',corpse});
    for(const peer of game.lanPeers||[])if(visible({...peer,type:'ally'}))objects.push({...peer,type:'ally',peer});
    if(p.hp>0)objects.push({...p,type:'hero'});
    objects.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||(a.type==='dungeon-wall'?-1:b.type==='dungeon-wall'?1:0));
    for(const o of objects){const v=this.iso(o.x,o.y);if(!o.type.startsWith('kingdom-gate')&&(Math.abs(v.x-this.camera.x)>viewW||Math.abs(v.y-this.camera.y)>viewH))continue;
      const near=distance(o,p);c.globalAlpha=d.town||d.outdoor&&o.type!=='enemy'||o.type==='hero'?1:clamp(1-(near-6)*.07,.25,1);
      c.save();c.translate(v.x,v.y);
      if(o.type==='falling-body')this.drawCorpse(o.corpse,game);
      else if(o.type==='hero')this.hero(game);
      else if(o.type==='ally'){this.ellipse(0,2,15,7,'#020a07a0');this.guard.draw(c,{...game,player:o.peer,moving:o.moving,walkPhase:o.walkPhase,facing:o.facing,actionFacing:o.actionFacing||o.facing,animationMode:o.animationMode,lastMove:o.facing,attackAnim:o.attackAnim,attackDuration:o.attackDuration,dodgeTime:o.dodgeTime});if(o.pyre)this.fireField(0,0,2.7,9);c.fillStyle=o.party&&o.party===game.lanParty?'#b8cf9a':'#a7bfd4';c.font='12px Georgia';c.textAlign='center';c.fillText(o.name,0,-111);}
      else if(o.type==='enemy'){this.enemy(o.enemy,game);if(o.enemy.shock>0){this.line([[-8,-30],[-3,-37],[1,-28],[7,-33]],'#c3b897aa',1);}if(o.enemy.bleed>0)this.ellipse(3,1,7,3,'#622e2388');}
      else if(o.type==='waypoint')this.waypoint(o,game);
      else if(o.type==='chicken')this.chicken(o,game);
      else if(o.type==='livestock')this.sheep(o);
      else if(o.type==='forest-grass'){this.natureSprite([6,7,13,6,7,13][o.variant],34+(o.variant%3)*8,12+(o.variant%3)*4,2);}
      else if(o.type==='farm-prop'){if([5,7,11,12,13,14,15].includes(o.farmSprite))this.structureShadow(this.farmArt,o.farmSprite,o.width,o.height,o.height*(FARM_BASELINES[o.farmSprite]||0));this.cachedSprite(this.farmArt,o.farmSprite,o.width,o.height,o.height*(FARM_BASELINES[o.farmSprite]||0));}
      else if(o.type==='crypt-entrance'){const offset=o.height*(WORLD_FOOT_OFFSETS[15]||0);this.structureShadow(this.worldArt,15,o.width,o.height,offset);this.sprite(15,o.width,o.height,offset);c.save();c.translate(-100,-2);this.sprite(14,105,76,4);c.restore();this.worldLabel(d.kind==='wilderness'?'ALDREN’S REDOUBT':'BLACKTHORN HOLLOW',d.kind==='wilderness'?'THE RUINED CHAPEL · CLICK':'CLICK · RETURN TO THE HOLLOW',-o.height-8);}
      else if(o.type==='farm-entrance'){this.structureShadow(this.farmArt,6,o.width||230,o.height||175,(o.height||175)*.24);this.cachedSprite(this.farmArt,6,o.width||230,o.height||175,(o.height||175)*.24);this.worldLabel(d.kind==='wilderness'?'THE TITHE GRAIN FIELDS':'WIDOW’S FIELDS',d.kind==='wilderness'?'CLICK · ENTER THE FARM':'CLICK · RETURN TO THE FIELDS',-(o.height||175)-8);}
      else if(o.type==='critter'){this.critter(o);}
      else if(o.type==='field'||o.type==='quest-object'){this.questObject(o.kind||'orders');this.worldLabel(o.label,'CLICK · EXAMINE',-76);}
      else if(o.type==='supplies')this.supplies(o,game);
      else if(o.type==='dungeon-wall')this.dungeonWall(o,game);
      else if(o.type==='dungeon-dressing')drawDungeonDressing(this,o);
      else if(o.type==='wall-fixture')drawWallFixture(this,o);
      else if(o.type==='wall')this.wall(o);
      else if(o.type.startsWith('kingdom-gate')){
        const inside=o.type==='kingdom-gate-inside',art=inside?this.innerGateArt:this.gateArt;
        if(art.complete&&art.naturalWidth){
          // Foreground masonry fades where it would hide the arriving guard.
          const hero=this.iso(p.x,p.y),occludes=inside&&Math.abs(hero.x-v.x)<o.width*.48&&hero.y-v.y>-o.height+120&&hero.y<v.y+110;
          const offsetX=inside?40:0,paint=()=>c.drawImage(art,-o.width/2+offsetX,-o.height+128,o.width,o.height);
          c.save();c.translate(offsetX,0);this.structureShadow(art,null,o.width,o.height,128);c.restore();
          if(occludes){
            // Cut away only the masonry obscuring the guard, keeping the rest
            // of the fortress solid rather than fading the whole gate away.
            const hx=hero.x-v.x,hy=hero.y-v.y-28;
            c.save();c.beginPath();c.rect(-o.width/2+offsetX,-o.height+128,o.width,o.height);c.ellipse(hx,hy,64,82,0,0,Math.PI*2);c.clip('evenodd');paint();c.restore();
            c.save();c.beginPath();c.ellipse(hx,hy,64,82,0,0,Math.PI*2);c.clip();c.globalAlpha*=.3;paint();c.restore();
          }else paint();
          c.globalAlpha=1;if(!inside)this.worldLabel('MARCHGATE · THE KINGDOM’S OUTER WALL','APPROACH THE PORTCULLIS · CLICK',-o.height+15);
        }
      }
      else if(o.type==='road-gate')this.roadGate(o);
      else if(o.type==='frontier'||o.type==='livestock-fence')this.frontier(o);
      else if(o.type==='road-lantern')this.roadPost(o,true);
      else if(o.type==='signpost')this.roadPost(o,false);
      else if(o.type==='story-marker'){if(o.style==='arms')drawDungeonDressing(this,{...o,kind:'fallen-arms'});else this.roadPost(o,false);}
      else if(o.type==='palisade')this.palisade(o);
      else if(o.type==='brazier')this.brazier(o);
      else if(o.type==='pillar')this.pillar(o);
      else if(o.type==='tomb')this.tomb(o);
      else if(o.type==='loot')this.loot(o.loot,game);
      else if(o.type==='exit-door')this.exitDoor(o,game,dt);
      else if(o.type==='portal')this.portal(game);
      else if(o.type==='town-portal')drawTownPortal(this,o);
      else if(o.type==='building'){
        const offset=o.height*(o.stash?SCENE_BASELINES.stash:WORLD_FOOT_OFFSETS[o.sprite]||0);
        if(o.stash){this.structureShadow(this.stashArt,null,o.width,o.height,offset);if(this.stashArt.complete&&this.stashArt.naturalWidth)c.drawImage(this.stashArt,-o.width/2,-o.height+offset,o.width,o.height);}
        else{if(o.sprite!==7)this.structureShadow(this.worldArt,o.sprite,o.width,o.height,offset);this.sprite(o.sprite,o.width,o.height,offset);}
        if(o.exit)this.worldLabel(game.player.campaign?(d.outdoor?'KINGDOM GATE':'THE KING’S ROAD'):'THE HOLLOW CRYPT','ENTER · CLICK',-o.height-10);
        if(o.stash)this.worldLabel('PERSONAL STASH','',-o.height-7);
      }
      else if(o.type==='entrance'){const offset=135*(WORLD_FOOT_OFFSETS[15]||0);this.structureShadow(this.worldArt,15,125,135,offset);this.sprite(15,125,135,offset);this.worldLabel('THE KING’S ROAD','CLICK · LEAVE STRONGHOLD',-132);}
      else if(o.type==='npc')this.npc(o,game);
      else this.debris(o);
      c.restore();
    }
    c.globalAlpha=1;
    this.effects(game);
    for(const burst of d.remains?.bursts||[]){const at=this.iso(burst.x,burst.y);if(Math.abs(at.x-this.camera.x)>viewW||Math.abs(at.y-this.camera.y)>viewH)continue;c.save();c.translate(at.x,at.y);drawRemainsParticles(c,burst,this.settings?.reducedMotion);c.restore();}
    c.restore();
    // Cold, low ground fog and drifting ash.
    for(let i=0;i<26;i++){const x=((i*193.13+Math.sin(this.time*.13+i)*60)%this.w+this.w)%this.w,y=((i*137.77-this.time*(3+i%3))%this.h+this.h)%this.h;this.ellipse(x,y,i%4===0?1.4:.7,i%4===0?1.4:.7,i%4===0?'#b2bf8b4a':'#8aa89325');}
    const hero=this.screen(p.x,p.y);this.drawDarkness(game,hero);this.light(hero.x,hero.y-10,170*this.zoom,d.town?'#e4a66312':'#cab98b0c');
    if(game.hurtFlash>0){c.fillStyle=`rgba(130,22,15,${game.hurtFlash*.18})`;c.fillRect(0,0,this.w,this.h);}
    if(p.hp/game.stats.maxHp<.28){const g=c.createRadialGradient(this.w/2,this.h/2,this.h*.3,this.w/2,this.h/2,this.w*.65);g.addColorStop(0,'transparent');g.addColorStop(1,'#741b2355');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);}
    this.drawLootLabels(game);this.drawMap(game);
  }
  drawDarkness(game,hero){
    const d=game.dungeon;if(d.town||game.zone==='town')return;const indoor=!d.outdoor,c=this.ctx,rx=(indoor?430:510)*this.zoom,ry=rx*.72,x=hero.x-rx,y=hero.y-25*this.zoom-ry;
    this.lightMasks??=new Map();const key=indoor?'dungeon':'outdoor';let mask=this.lightMasks.get(key);
    if(!mask){mask=document.createElement('canvas');mask.width=mask.height=256;const ctx=mask.getContext('2d'),g=ctx.createRadialGradient(128,128,12,128,128,128);for(const [stop,alpha]of indoor?[[0,0],[.5,.08],[.8,.35],[1,.64]]:[[0,0],[.5,.02],[.8,.07],[1,.16]])g.addColorStop(stop,`rgba(0,0,0,${alpha})`);ctx.fillStyle=g;ctx.fillRect(0,0,256,256);this.lightMasks.set(key,mask);}
    c.fillStyle=indoor?'rgba(0,0,0,.64)':'rgba(0,0,0,.16)';c.beginPath();c.rect(0,0,this.w,Math.max(0,y));c.rect(0,y+ry*2,this.w,Math.max(0,this.h-y-ry*2));c.rect(0,Math.max(0,y),Math.max(0,x),Math.min(this.h,y+ry*2)-Math.max(0,y));c.rect(x+rx*2,Math.max(0,y),Math.max(0,this.w-x-rx*2),Math.min(this.h,y+ry*2)-Math.max(0,y));c.fill();c.drawImage(mask,x,y,rx*2,ry*2);
  }
  questObject(kind){
    const c=this.ctx;this.ellipse(0,0,26,10,'#100b0780');
    if(kind==='provisions'){this.poly([[-23,-6],[-20,-35],[17,-35],[25,-7],[9,4]],'#77633e','#2e261a',2);this.line([[-15,-25],[15,-25]],'#b49a64',3);this.line([[-12,-32],[12,-10]],'#392d1c',2);return;}
    if(kind==='brazier'){this.brazier({variant:1,x:0});return;}
    if(kind==='wheel'){c.strokeStyle='#6c5740';c.lineWidth=5;c.beginPath();c.ellipse(0,-23,23,21,0,0,Math.PI*2);c.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;this.line([[0,-23],[Math.cos(a)*22,-23+Math.sin(a)*20]],'#65503b',3);}return;}
    if(kind==='mould'){this.poly([[-29,-15],[-8,-32],[26,-15],[7,4]],'#665e51','#26231e',3);this.line([[-12,-13],[12,-12]],'#25221c',5);return;}
    if(kind==='key'){this.line([[-18,-4],[12,-34]],'#a58a52',5);c.strokeStyle='#a58a52';c.lineWidth=4;c.beginPath();c.arc(16,-38,9,0,Math.PI*2);c.stroke();this.line([[-15,-8],[-22,-15],[-18,-19]],'#a58a52',4);return;}
    if(['seal','signet','reliquary'].includes(kind)){c.strokeStyle='#9b8052';c.lineWidth=7;c.beginPath();c.ellipse(0,-18,15,12,-.3,0,Math.PI*1.75);c.stroke();this.poly([[-11,-31],[11,-32],[13,-18],[-8,-19]],'#7f5637','#3f2d1d',2);return;}
    if(kind==='bell'){this.poly([[-4,-40],[5,-40],[8,-12],[15,-8],[9,0],[-12,-2],[-14,-9],[-6,-14]],'#7b6e51','#342b21',2);return;}
    if(kind==='powder'){this.poly([[-22,-6],[-17,-39],[18,-39],[24,-7]],'#524433','#30251b',2);this.line([[-20,-28],[20,-28]],'#897b57',4);return;}
    const book=['ledger','book','register'].includes(kind);this.poly([[-24,-8],[-18,-38],[20,-34],[26,-5],[-2,5]],book?'#493024':'#b6a174','#30251b',2);this.poly([[-18,-12],[-14,-32],[16,-29],[20,-9],[0,0]],'#b7a179','#6b5537',1);for(let i=0;i<4;i++)this.line([[-9,-25+i*5],[11,-22+i*5]],'#6c553b',1);if(kind==='chart'||kind==='plans')this.line([[-12,-23],[0,-14],[10,-23]],'#795a39',2);else this.ellipse(8,-7,5,5,'#713b29');
  }
  critter(o){
    const c=this.ctx,step=Math.sin(this.time*6+o.phase);this.ellipse(0,2,7,3,'#07070466');
    if(o.species==='crow'){this.ellipse(0,-2,5,3,'#25241f');this.ellipse(4,-4,2,2,'#353329');this.line([[-2,-3],[-7,-6-step*2]],'#272720',2);this.line([[1,-2],[-4,-4+step]],'#171915',2);this.line([[6,-4],[8,-3]],'#928062',1);}
    else if(o.species==='hen'){this.ellipse(0,-3,6,5,'#80735a');this.ellipse(5,-7,3,3,'#9f8e69');this.line([[-2,0],[-2+step,5]],'#57432b',1);this.line([[3,0],[3-step,5]],'#57432b',1);this.line([[7,-7],[10,-6]],'#ae9061',1);}
    else{this.ellipse(0,-1,5,3,'#584d3a');this.ellipse(5,-1,2,2,'#706047');this.line([[-4,0],[-10,2],[-13,1]],'#6e5c44',1);}
  }
  roadGate(o){
    if(o.stone)return;const c=this.ctx;for(let i=0;i<o.span;i++){c.save();c.translate(i*34,i*17);this.frontier({axis:'x'});this.line([[8,-33],[8,0]],'#7c7560',2);this.line([[23,-26],[23,9]],'#746c57',2);c.restore();}

  }
  forestFloor(ctx,d,x,y,width,height){
    this.forestTiles??=new Map();let floor=this.forestTiles.get(d.act||1);
    if(!floor){const tile=this.terrain(0,0,d.act||1);if(!tile)return;floor=document.createElement('canvas');floor.width=136;floor.height=68;const c=floor.getContext('2d');for(const [tx,ty]of [[0,0],[-68,-34],[68,-34],[-68,34],[68,34]])c.drawImage(tile,tx,ty);c.globalCompositeOperation='source-atop';c.fillStyle='#10170db0';c.fillRect(0,0,136,68);this.forestTiles.set(d.act||1,floor);}
    ctx.fillStyle=ctx.createPattern(floor,'repeat');ctx.fillRect(x,y,width,height);
  }
  natureSprite(index,w,h=null,offset=0){const [sw,sh]=forestSizes[index];return this.cachedSprite(this.forestArt,index,w,h??w*sh/sw,offset);}
  sheep(o){
    const dx=Math.cos(o.heading||0),dy=Math.sin(o.heading||0),toward=dx+dy>0,side=dx-dy;
    const grazing=!o.moving,index=grazing?(toward?9:15):(Math.abs(side)<.35?(toward?14:11):10);
    this.ellipse(0,-1,18,6,'#090a0780');this.ctx.save();
    if(side<0)this.ctx.scale(-1,1);
    const width=index===14||index===11||index===15?31:47;
    this.natureSprite(index,width,index===9?37:index===15?40:index===11?44:40,1);this.ctx.restore();
  }
  roadPost(o,lantern){
    const angle=o.angle||0,right=Math.cos(angle)>=0;
    if(!lantern){
      this.natureSprite(16,16,59);this.ctx.save();this.ctx.translate(0,-65);this.ctx.rotate(angle);this.natureSprite(17,65,24,12);this.ctx.restore();return;
    }
    this.ctx.save();
    // The bracket follows the road in projection; its upright stays vertical.
    this.ctx.transform(Math.max(.4,Math.abs(Math.cos(angle))),Math.sin(angle)*(right?1:-1),0,1,0,0);
    this.natureSprite(right?4:5,43,88);const x=right?13:-13;this.light(x,-34,55,'#d58d3430');this.ctx.restore();
  }
  frontier(o){
    const right=o.axis==='x';this.ctx.save();this.ctx.translate(right?17:-17,8.5);
    this.natureSprite(right?0:1,44,48,3);this.ctx.restore();
  }
  palisade(o){this.frontier(o);}
  dungeonWall(o,game){
    const hero=this.iso(game.player.x,game.player.y),at=this.iso(o.x,o.y),overlaps=o.foreground&&Math.abs(hero.x-at.x)<55&&hero.y-at.y<5&&hero.y-at.y>-130;
    const h=overlaps?30:o.theme==='redoubt'?112:102,key=`edge:${o.axis}:${o.side}:${o.theme}:${o.variant}:${h}`;
    let tile=this.wallCache.get(key);if(!tile){tile=document.createElement('canvas');tile.width=92;tile.height=154;const old=this.ctx;this.ctx=tile.getContext('2d');this.ctx.translate(46,136);paintDungeonWall(this,o,h);this.ctx=old;this.wallCache.set(key,tile);}
    if(overlaps)this.ctx.globalAlpha*=.65;this.ctx.drawImage(tile,-46,-136);
  }
  wall(o){this.dungeonWall({...o,axis:'x',side:'north'},{player:{x:-999,y:-999}});}
  pillar(o){
    const h=o.variant===0?84:134,w=h*.34;
    this.ellipse(0,1,w*.52,w*.2,'#06050388');
    if(this.columnArt.complete&&this.columnArt.naturalWidth)this.ctx.drawImage(this.columnArt,-w/2,-h+2,w,h);
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
  drawRemainsGround(game,viewW,viewH){
    const c=this.ctx,d=game.dungeon,p=game.player,r=d.remains;if(!r)return;
    const visible=o=>{const at=this.iso(o.x,o.y);return Math.abs(at.x-this.camera.x)<viewW+100&&Math.abs(at.y-this.camera.y)<viewH+100&&d.seen.has(Math.floor(o.y)*d.size+Math.floor(o.x));};
    for(const stain of r.stains){if(!visible(stain))continue;const key=[stain.kind,stain.fatal,stain.scale,stain.seed%32,Math.round(Math.atan2(stain.aim.y,stain.aim.x)*8/Math.PI)].join(':');let art=this.stainArt.get(key);if(!art){art=document.createElement('canvas');art.width=160;art.height=96;paintStain(art.getContext('2d'),stain);this.stainArt.set(key,art);if(this.stainArt.size>128)this.stainArt.delete(this.stainArt.keys().next().value);}const at=this.iso(stain.x,stain.y);c.save();c.globalAlpha=(d.outdoor?1:clamp(1-(distance(stain,p)-6)*.07,.25,1))*(.68+Math.min(stain.age/.4,1)*.32);c.drawImage(art,at.x-80,at.y-48);c.restore();}
    for(const corpse of r.corpses){if(corpse.age<corpse.duration||!visible(corpse))continue;const at=this.iso(corpse.x,corpse.y);c.save();c.translate(at.x,at.y);c.globalAlpha=d.outdoor?1:clamp(1-(distance(corpse,p)-6)*.07,.25,1);this.drawCorpse(corpse,game);c.restore();}
  }
  drawCorpse(corpse,game){
    if(!corpse.player){if(!this.deaths.draw(this.ctx,corpse,this.settings?.reducedMotion))this.enemy(corpse.body,game,true);return;}
    const c=this.ctx;if(corpse.player&&game.player.hp<=0)this.heroFrame={...this.heroFrame,action:'death',column:0};const body=corpse.body,key=corpse.player?null:[enemyFamily(body)?.id,body.type,body.bossId,body.elite,body.visual?.frame,body.visual?.flip,body.visual?.back].join(':');let art=corpse.player?this.remainsArt.get(corpse):this.corpseArt.get(key);
    if(!art){
      art=document.createElement('canvas');art.width=320;art.height=224;const context=art.getContext('2d');context.translate(160,184);
      // Capture the actual painted body, including the player's equipped gear.
      const previous=this.ctx;try{this.ctx=context;if(corpse.player)this.guard.draw(context,{...game,player:corpse.body,moving:false,attackAnim:0,dodgeTime:0});else this.enemy(corpse.body,game,true);}finally{this.ctx=previous;}
      if(corpse.player)this.remainsArt.set(corpse,art);else{this.corpseArt.set(key,art);if(this.corpseArt.size>80)this.corpseArt.delete(this.corpseArt.keys().next().value);}
    }
    const t=this.settings?.reducedMotion?1:Math.min(1,corpse.age/corpse.duration),fall=Math.max(0,(t-.12)/.88),ease=fall*fall*(3-2*fall),side=corpse.aim.x>=0?1:-1;
    c.save();
    if(corpse.kind==='ash'){c.globalAlpha*=1-ease; c.translate(0,-ease*17);c.scale(1+ease*.2,1-ease*.3);}
    else{
      this.ellipse(side*ease*33,2,14+ease*30,5+ease*5,'#09080777');
      c.translate(side*ease*8,3*ease);c.scale(1,1-ease*.64);c.rotate(side*(ease*1.48-Math.sin(t*Math.PI)*.08));
      c.globalAlpha*=1-ease*.16;
    }
    c.drawImage(art,-160,-184);c.restore();
  }
  hero(game){
    const c=this.ctx,{player:p}=game,t=this.time,bob=game.moving?Math.sin(t*12)*1.6:Math.sin(t*2)*.5;
    this.ellipse(0,2,15,7,'#020a07a0');
    const painted=this.guard.draw(c,game);if(painted){this.heroFrame=painted;return;}
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
  enemy(e,game,bodyOnly=false){
    const c=this.ctx,t=this.time,bob=Math.sin(t*6+e.phase)*(e.aggro?2:.6),boss=e.type==='warden',family=enemyFamily(e),reaction=enemyHitPose(e,game.settings?.reducedMotion);
    if(!bodyOnly){this.enemyVitals??=new WeakMap();if(!this.enemyVitals.has(e))this.enemyVitals.set(e,enemyHealthTrail(null,e.hp/Math.max(1,e.maxHp),t));}
    if(!bodyOnly)this.ellipse(0,2,boss?28:family?.shadow||13,boss?13:(family?.shadow||13)*.43,'#02090799');
    const selected=!bodyOnly&&(game.combatTarget===e||e.id!=null&&game.combatTarget?.id===e.id),hovered=!bodyOnly&&e.id!=null&&game.hoverEnemyId===e.id;
    if(selected||hovered)this.enemyTargetCue(boss?31:(family?.shadow||13)+3,selected);
    if(e.windup>0){this.ellipse(0,0,boss?65:22,boss?32:11,'#ae51303d');this.ellipse(0,0,boss?63:20,boss?30:10,'#d56e1b19');}
    if(!bodyOnly&&e.elite&&!boss){this.ellipse(0,0,16,8,'#a7ac5144');}
    if(this.artLoaded){
      c.save();if(!bodyOnly&&reaction.active){c.translate(reaction.x,reaction.y);c.rotate(reaction.tilt);}c.translate(0,boss?bob*.5:0);
      if(e.attackAnim>0&&(boss||!['archer','hexer','bomber','venom'].includes(e.role))){const v=this.iso(game.player.x-e.x,game.player.y-e.y),len=Math.hypot(v.x,v.y)||1,lunge=Math.sin((1-e.attackAnim/(e.attackDuration||.3))*Math.PI)*9;c.translate(v.x/len*lunge,v.y/len*lunge);c.rotate(v.x/len*lunge*.006);}
      if(e.bossId){const id=e.bossId==='king'?5:e.bossId==='wanderer'?6:Number(e.bossId.split('-')[1])-1;this.campaignSprite(id+(e.attackAnim>0?8:0),boss?114:80,boss?144:100);}
      else if(boss)this.sprite(6,114,144);
      else this.enemySprites.draw(c,e,game.player,t,bodyOnly);
      c.restore();
      if(bodyOnly)return;
      if(e.miniBoss){c.font='11px Georgia';c.textAlign='center';c.fillStyle='#cfb782';c.fillText(e.name,0,-110);}
      if((e.hp<e.maxHp||selected||hovered)&&!boss)this.enemyHealthBar(e,-88);
      if(e.slow>0){c.strokeStyle='#87999a66';c.lineWidth=1;c.beginPath();c.ellipse(0,2,15,6,0,.3,Math.PI-.3);c.stroke();for(const x of [-8,3,10])this.line([[x,1],[x+2,-3],[x+3,0]],'#a3b9b777',1);}
      if(e.burn>0||e.pyreGlow>0)this.light(0,-30,35,'#ea8c4233');if(boss)this.factionDetails(e);return;
    }
    if(!bodyOnly&&reaction.active){c.translate(reaction.x,reaction.y);c.rotate(reaction.tilt);}c.translate(0,bob);
    if(e.type==='skeleton'){
      const bone=e.hit>0?'#bbae91':e.slow>0?'#96aca9':'#aaa98e';
      this.line([[-3,-16],[-7,-7],[-8,0]],bone,3);this.line([[3,-16],[5,-7],[10,-1]],bone,3);
      this.line([[0,-29],[0,-14]],bone,3);
      for(let i=0;i<3;i++)this.line([[-6+i,-26+i*4],[6-i,-26+i*4]],bone,2);
      this.line([[-5,-28],[-11,-21],[-10,-13]],bone,3);this.line([[5,-28],[12,-23],[13,-15]],bone,3);
      this.ellipse(0,-34,6.2,7,bone);this.ellipse(-2,-35,1.7,2,'#344131');this.ellipse(2.5,-35,1.7,2,'#344131');
      this.line([[-2,-30],[3,-30]],'#36452f',1);this.line([[13,-18],[22,-38]],'#8f9d87',2);this.line([[10,-20],[17,-17]],'#7e8057',2);
      this.poly([[-5,-17],[5,-17],[7,-10],[-6,-9]],'#635c47','#344530');
    }else if(e.type==='wraith'){
      this.light(0,-23,35,'#71c0ac18');
      this.poly([[0,-46],[-8,-35],[-12,-19],[-16,2],[-5,-4],[0,1],[5,-5],[13,-1],[9,-25],[7,-38]],e.hit>0?'#71857a':'#426c5f','#6e958033');
      this.poly([[0,-39],[-4,-32],[-3,-24],[4,-26],[4,-34]],'#172e27');this.line([[-2,-31],[3,-31]],'#d3db95',2);
      this.line([[-9,-26],[-18,-19],[-21,-23]],'#7ba08b',2);this.line([[9,-26],[19,-20],[21,-25]],'#7ba08b',2);
    }else{
      this.light(0,-35,90,'#c7bc5f12');
      this.poly([[-15,-50],[-27,-6],[-11,-10],[0,0],[18,-4],[23,-51]],'#3a4939','#1a2b1e');
      this.poly([[-17,-52],[13,-56],[24,-31],[11,-20],[-14,-23],[-24,-35]],e.hit>0?'#8e8366':'#747453','#b4a56b77');
      this.line([[-11,-47],[-5,-28],[13,-33]],'#ab9b65',3);
      this.poly([[-22,-56],[-7,-62],[-2,-52],[-19,-43],[-27,-47]],'#868467','#b6a57255');
      this.poly([[8,-59],[24,-55],[30,-43],[16,-40],[6,-50]],'#868467','#b6a57255');
      this.poly([[-7,-76],[6,-79],[12,-65],[5,-55],[-6,-57],[-12,-68]],'#b1ac7c','#48533a');
      this.poly([[-11,-74],[-16,-90],[-5,-80],[1,-86],[6,-80],[17,-91],[12,-73]],'#a29a68','#d1b97866');
      this.line([[-6,-68],[-1,-66]],'#c8d69b',2);this.line([[4,-67],[9,-70]],'#c8d69b',2);
      this.line([[22,-43],[38,-18],[52,-8]],'#9f9c72',5);this.line([[49,-35],[49,5]],'#a2a082',6);this.poly([[46,-35],[66,-26],[67,-16],[47,-20]],'#adb198','#536947');
    }
    c.shadowBlur=0;
    this.factionDetails(e);
    if((e.hp<e.maxHp||selected||hovered)&&!boss&&!bodyOnly)this.enemyHealthBar(e,-53);
    if(e.slow>0){c.strokeStyle='#84c9cf66';c.lineWidth=1;c.beginPath();c.ellipse(0,0,16,7,0,0,Math.PI*2);c.stroke();}
    if(e.burn>0){this.light(0,-12,25,'#d9742522');this.poly([[-4,-9],[-3,-20],[1,-15],[4,-25],[5,-8]],'#f0aa5a77');}
  }
  enemyTargetCue(radius,selected=false){
    const c=this.ctx;c.save();c.strokeStyle=selected?'#bd9765b3':'#9e94736e';c.lineWidth=selected?1.3:1;
    // Broken brass arcs stay below the feet. They do not flood-fill the floor
    // or compete with the red ground markings of an incoming enemy attack.
    for(let i=0;i<4;i++){const angle=i*Math.PI/2+.18;c.beginPath();c.ellipse(0,2,radius,radius*.43,0,angle,angle+.86);c.stroke();}
    if(selected)for(const sign of [-1,1])this.line([[sign*(radius+2),2],[sign*(radius+5),2]],'#b59a6c99',1);
    c.restore();
  }
  enemyHealthBar(enemy,y){
    const c=this.ctx;this.enemyVitals??=new WeakMap();
    const previous=this.enemyVitals.get(enemy),value=enemyHealthTrail(previous,enemy.hp/Math.max(1,enemy.maxHp),this.time);this.enemyVitals.set(enemy,value);
    const width=42;c.save();c.fillStyle='#100b08e8';c.fillRect(-width/2-1,y-1,width+2,5);
    c.fillStyle='#665135';c.fillRect(-width/2,y,width*value.trail,3);
    c.fillStyle=enemy.elite?'#ad8b50':'#8f4933';c.fillRect(-width/2,y,width*value.hp,3);
    c.fillStyle='#caa67888';c.fillRect(-width/2,y,Math.min(width*value.hp,width),.65);c.restore();
  }
  factionDetails(e){
    if(!e.faction)return;const c=this.ctx;c.save();c.globalAlpha=.8;
    // Small weathered fittings sit over the painted body; no flat armour masks.
    if(e.type==='skeleton'){
      this.line([[-7,-45],[5,-24]],'#4c3828',2);this.line([[-9,-26],[10,-26]],'#58432c',2);
      if(e.role==='guard'){this.line([[17,-15],[21,-65]],'#63533b',2);this.line([[20,-64],[22,-72],[24,-64]],'#999382',1);}
    }else if(e.type==='wraith'){
      if(e.role==='archer'){this.line([[-16,-42],[-23,-33],[-16,-22]],'#776044',1.8);this.line([[-16,-42],[-16,-22]],'#a294723d',.8);this.line([[-23,-33],[-5,-32]],'#908265',1);}
      else if(e.role==='bomber'){this.ellipse(14,-24,4,5,'#403328');this.line([[15,-29],[17,-33]],'#ab9863',1);}
      else{this.line([[18,-11],[18,-54]],'#6d6048',2);this.ellipse(18,-56,2,3,e.tint);}
    }else for(let i=0;i<3;i++)this.line([[i*5-6,-12],[i*5-5,-19]],'#8b8a68',1);
    c.restore();
  }
  loot(loot,game){
    const c=this.ctx,color=loot.item?{normal:'#b3c3a0',magic:'#81b5d3',rare:'#d6bb68',legendary:'#ea9a56',set:'#8fc57b'}[loot.item.rarity]:'#c3ac68';
    this.ellipse(0,2,8,4,'#020a0877');this.light(0,-9,25,color+'19');
    if(loot.item){this.line([[0,0],[0,-33]],color+'44',2);this.poly([[-4,-3],[0,-9],[5,-5],[1,1]],color);}
    else {const count=Math.min(9,3+Math.floor(loot.gold/12));for(let i=0;i<count;i++){const x=((i*7)%17)-8,y=((i*5)%9)-4;this.ellipse(x,y+1,3.7,2,'#564025');this.ellipse(x,y,3.3,1.7,i%2?'#cfb573':'#a58c4d');this.line([[x-1.5,y-.5],[x+1,y-.5]],'#e0c58b',.6);}}

  }
  drawLootLabels(game){
    const c=this.ctx;c.save();c.font='12px Georgia';c.textAlign='center';c.textBaseline='middle';
    const entries=game.loot.filter(l=>distance(l,game.player)<(l.item?2.5:10)||game.showLoot||game.lootTarget===l).map(loot=>({loot,name:loot.item?itemName(loot.item):`${loot.gold} gold`}));
    this.lootLabels=placeLootLabels(entries,n=>c.measureText(n).width,(x,y)=>this.screen(x,y),this.w,this.h);
    for(const b of this.lootLabels){const color=b.loot.item?{normal:'#d4c5aa',magic:'#8faed7',rare:'#d6bb68',legendary:'#e5a16c',set:'#8fc57b'}[b.loot.item.rarity]||'#d4c5aa':'#c3ac68';c.fillStyle='#0c0906ed';c.fillRect(b.x,b.y,b.w,b.h);c.strokeStyle=game.lootTarget===b.loot?'#ead1a0':color+'88';c.strokeRect(b.x,b.y,b.w,b.h);c.fillStyle=color;c.fillText(b.name,b.x+b.w/2,b.y+b.h/2);}
    c.restore();
  }
  chicken(o,game){const c=this.ctx,art=this.chickenArt;if(!art.complete||!art.naturalWidth)return;const i=breedOf(o).art,flip=chickenFacesRight(o.heading);this.ellipse(0,2,8,3,'#08060466');c.save();if(flip)c.scale(-1,1);c.translate(0,o.moving?Math.sin(o.gait)*1.5:0);c.drawImage(art,i%4*256,Math.floor(i/4)*256,256,256,-20,-31,40,40);if(o.pet){const hat=HATS.find(h=>h.id===o.hat),art=game?.chickenUI?.crateImage;if(hat&&art?.complete)c.drawImage(art,hat.art%4*256,Math.floor(hat.art/4)*256,256,256,-18,-35,16,16);}c.restore();}
  worldLabel(name,role,y){const c=this.ctx;c.textAlign='center';c.shadowColor='#000';c.shadowBlur=5;c.font='10px Georgia';c.fillStyle='#d5c295';c.fillText(name,0,y);if(role){c.font='6px Inter,sans-serif';c.fillStyle='#a18d6b';c.fillText(role,0,y+12);}c.shadowBlur=0;}
  npc(n,game){
    this.ellipse(0,2,17,7,'#08050388');this.sprite(n.sprite,n.id==='smith'?65:64,n.id==='smith'?88:91);
    const nearby=distance(n,game.player)<3;if(nearby){this.ctx.strokeStyle='#c7ac6a55';this.ctx.lineWidth=1;this.ctx.beginPath();this.ctx.ellipse(0,0,20,9,0,0,Math.PI*2);this.ctx.stroke();}
    this.worldLabel(n.name,n.role,-103);
    if(game.questCue?.npc===n.id){this.ctx.font='bold 20px Georgia';this.ctx.fillStyle='#e3c476';this.ctx.textAlign='center';this.ctx.fillText(game.questCue.mark,0,-123+Math.sin(this.time*2)*3);}
  }
  exitDoor(o,game,dt){
    const d=game.dungeon;if(this.doorDungeon!==d){this.doorDungeon=d;this.doorProgress=d.bossDead?1:0;}
    this.doorProgress=doorAnimation(this.doorProgress,!!d.bossDead,dt||.016,game.settings?.reducedMotion);const t=this.doorProgress,index=o.wood?10:8;
    this.ellipse(0,1,70,26,'#00000055');this.bossArt.draw(this.ctx,index,{width:190,height:190,alpha:1-t});this.bossArt.draw(this.ctx,index+1,{width:190,height:190,alpha:t});
    if(distance(o,game.player)<7)this.worldLabel(d.bossDead?o.label:'BARRED PASSAGE',d.bossDead?'WALK THROUGH':'Defeat the garrison commander',-183);
  }
  portal(game){
    const c=this.ctx,t=this.time;this.light(0,-25,100,'#a1d3bb22');
    for(let i=0;i<4;i++){c.strokeStyle=i%2?'#9ac6a7aa':'#ddcb8b77';c.lineWidth=2;c.beginPath();c.ellipse(0,-30,21+i*3,35+i*2,Math.sin(t*.5+i)*.1,0,Math.PI*2);c.stroke();}
    this.ellipse(0,-30,18,31,'#80c0aa1a');c.font='9px Inter';c.fillStyle='#d3d4ac';c.textAlign='center';c.fillText(game.player.campaign?'CONTINUE THE ROAD · CLICK':'DESCEND · CLICK',0,-81);
  }
  fireField(x,y,radius,seed=0){
    if(paintedFireField(this,x,y,radius,seed))return;
    if(!this.flameFrames){this.flameFrames=[];for(let frame=0;frame<6;frame++){const image=document.createElement('canvas');image.width=32;image.height=48;const f=image.getContext('2d'),g=f.createLinearGradient(0,4,0,46);g.addColorStop(0,'#ceb68c00');g.addColorStop(.35,'#e1ad63b0');g.addColorStop(.8,'#b56530cc');g.addColorStop(1,'#52251a44');f.fillStyle=g;f.beginPath();f.moveTo(8,45);f.bezierCurveTo(3,29,18,24,12+frame%3*2,3+frame*2);f.bezierCurveTo(27,24,18,25,25,34);f.bezierCurveTo(31,43,19,48,8,45);f.fill();f.fillStyle='#edcc8dcc';f.beginPath();f.moveTo(12,45);f.quadraticCurveTo(20,31,17,25);f.quadraticCurveTo(26,40,21,45);f.fill();this.flameFrames.push(image);}}
    const c=this.ctx;c.save();c.translate(x,y);this.light(0,-2,radius*38,'#ba6e2428');
    c.fillStyle='#140c0922';c.beginPath();for(let i=0;i<18;i++){const a=i*Math.PI/9,r=radius*30*(.82+Math.sin(i*4.7+seed)*.13),px=Math.cos(a)*r,py=Math.sin(a)*r*.5;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();
    for(let i=0;i<24;i++){const a=i*2.399+seed,ring=.25+(i%7)/8,px=Math.cos(a)*radius*31*ring,py=Math.sin(a)*radius*15*ring,h=16+(i*7%17),frame=(Math.floor(this.time*11)+i)%6;c.globalAlpha=.4+(Math.sin(this.time*7+i)+1)*.18;c.drawImage(this.flameFrames[frame],px-8,py-h,16,h);if(i%3===0){c.fillStyle='#c3955c88';c.fillRect(px+Math.sin(this.time*2+i)*4,py-(this.time*14+i*3)%34,1,1);}}
    c.restore();
  }
  effects(game,ground=false){
    const c=this.ctx;
    for(const e of game.effects){if(PAINTED_GROUND_EFFECTS.has(e.type)!==ground)continue;const p=this.iso(e.x,e.y),progress=1-e.life/e.maxLife;c.save();c.translate(p.x,p.y);c.globalAlpha=e.type.endsWith('-warning')?1:COMBAT_TRANSIENTS.has(e.type)?Math.min(1,(1-progress)*2.5):Math.min(1,e.life*3);
      if(combatEffect(this,e,progress,game)){}
      else if(e.type==='ground-fire'){this.fireField(0,0,e.radius,Math.floor(e.x));
      }else if(e.type==='whirl'){const a=this.time*18;for(let i=0;i<3;i++){c.strokeStyle=i?'#c7c2a655':'#d6d0b088';c.lineWidth=1.2;c.beginPath();c.ellipse(0,-19,45+i*5,22+i*2,a+i*.2,0,Math.PI*.9);c.stroke();}
      }else if(e.type==='nova'||e.type==='quake'){
        const r=e.radius*30*progress;for(let i=0;i<18;i++){const a=i*2.399,x=Math.cos(a)*r,y=Math.sin(a)*r*.5;if(e.type==='quake'){const h=(1-progress)*(6+i%5);this.poly([[x-4,y],[x-2,y-h],[x+3,y-h+2],[x+5,y+1]],i%2?'#77706088':'#4d4a4188');}else{c.strokeStyle='#b6cbcb88';c.lineWidth=1.2;this.line([[x*.8,y*.8],[x,y-7*(1-progress)],[x+3,y]],'#bacccc88',1);}}
        this.ellipse(0,0,r,r*.45,e.type==='quake'?'#746b4b0b':'#a8b5b60b');
      }else if(e.type==='ring'||e.type==='inferno'){
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
        c.strokeStyle=e.playerGround?'#b38b4f44':'#e29c5966';c.lineWidth=2;c.beginPath();c.ellipse(0,0,e.radius*34*Math.SQRT2,e.radius*17*Math.SQRT2,0,0,Math.PI*2);c.stroke();this.light(0,0,e.radius*34,'#db77331a');
        if(progress>.5&&!e.playerGround){this.line([[70*(1-progress),-200*(1-progress)],[0,-4]],'#ffc78e99',8);this.light(0,-25,50,'#d99e541f');}
      }else if(e.type==='vortex'){
        for(let i=0;i<4;i++){c.strokeStyle='#aaa48a44';c.lineWidth=1.2;c.beginPath();c.ellipse(0,-5,20+i*17,8+i*8,this.time+i,0,Math.PI*1.5);c.stroke();}this.light(0,-5,80,'#817b6911');
      }else if(e.type==='lightning'){
        const to=this.iso(e.tx,e.ty),from=this.iso(e.x,e.y),dx=to.x-from.x,dy=to.y-from.y;
        this.line([[0,-20],[dx*.25+8,dy*.25-35],[dx*.5-7,dy*.5-15],[dx*.75+6,dy*.75-28],[dx,dy-20]],'#d1d5c8',1.25);
      }else if(e.type==='heal'){this.light(0,-20,55,'#bfe5a433');for(let i=0;i<5;i++)this.ellipse(Math.cos(i*2.2)*15,-progress*60+i*4,2,2,'#bdd89c');}
      c.restore();
    }
    if(ground)return;
    for(const b of [...game.projectiles,...(game.lanProjectiles||[]),...(game.lanCastProjectiles||[])])combatProjectile(this,b);
    for(const f of game.floaters){const p=this.iso(f.x,f.y);c.save();c.globalAlpha=Math.min(1,f.life);c.font=`${f.crit?'bold 19':'12'}px ${'Georgia'},serif`;c.textAlign='center';c.fillStyle=f.color||'#d9d7b6';c.shadowColor='#06120c';c.shadowBlur=4;c.fillText(f.text,p.x,p.y-42-(1.4-f.life)*27);c.restore();}
  }
  waypoint(o,game){
    const c=this.ctx,d=game.dungeon,town=d.town||o===d.townWaypoint||d.townWaypoint&&Math.hypot(o.x-d.townWaypoint.x,o.y-d.townWaypoint.y)<.1,id=fountainKey(d,town),lit=fountainActive(game.player,d,town),w=106,h=144,top=-h+30;
    this.ellipse(0,8,43,16,'#06080577');
    if(this.fountainArt.complete&&this.fountainArt.naturalWidth)c.drawImage(this.fountainArt,-w/2,top,w,h);
    if(lit){
      const ramp=game.fountainWake?.id===id?clamp((game.time-game.fountainWake.started)/1.1,0,1):1,t=this.time;
      c.save();c.globalAlpha=ramp;this.light(0,-12,44,'#8baea918');
      const streams=[[-16,-45,-25,-9],[15,-44,24,-8],[-10,-62,-12,-31],[10,-62,12,-31]];
      for(let i=0;i<streams.length;i++){
        const [sx,sy,ex,ey]=streams[i],bow=sx<0?-4:4;
        c.strokeStyle='#48676266';c.lineWidth=2.2;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(sx+bow,sy+4,ex,ey);c.stroke();c.strokeStyle='#b9cbc28c';c.lineWidth=.75;c.stroke();
        const u=(t*1.1+i*.23)%1,x=sx+(ex-sx)*u,y=sy+(ey-sy)*u*u;this.ellipse(x,y,.7,1.4,'#c2d2c1aa');
        const pulse=(t*.8+i*.27)%1;c.strokeStyle='#9ebdb17a';c.lineWidth=.65;c.beginPath();c.ellipse(ex,ey,1+pulse*5,.5+pulse*2,0,0,Math.PI*2);c.stroke();
      }
      c.restore();
    }
    this.worldLabel(lit?'ATTUNED FOUNTAIN':'DORMANT FOUNTAIN',lit?'CLICK · TRAVEL':'CLICK · AWAKEN',-126);
  }
  supplies(o){this.sprite(13,72,65,65*(WORLD_FOOT_OFFSETS[13]||0));this.worldLabel('ROADSIDE PROVISIONS','CLICK · REST & RESUPPLY',-70);}
  drawMap(game){
    if(this.time<(this.nextMap||0))return;this.nextMap=this.time+.1;
    const render=(c,w,h,overlay)=>{
      const {dungeon:d,player:p}=game;c.clearRect(0,0,w,h);const scale=overlay?11:6,project=(x,y)=>({x:(x-y)*scale+w/2-(p.x-p.y)*scale,y:(x+y)*scale*.5+h/2-(p.x+p.y)*scale*.5});
      c.lineWidth=overlay?1.2:.7;c.strokeStyle=overlay?'#d7c59c99':'#c5b68c9c';c.beginPath();
      const reach=Math.ceil(w/(4*scale)+h/(2*scale))+2;
      for(let y=Math.max(0,Math.floor(p.y-reach));y<Math.min(d.size,p.y+reach);y++)for(let x=Math.max(0,Math.floor(p.x-reach));x<Math.min(d.size,p.x+reach);x++){
        if(!d.tiles[y][x]||!d.seen.has(y*d.size+x))continue;const at=project(x,y),a=scale,b=scale*.5;
        if(!d.tiles[y-1]?.[x]){c.moveTo(at.x,at.y);c.lineTo(at.x+a,at.y+b);}if(!d.tiles[y]?.[x+1]){c.moveTo(at.x+a,at.y+b);c.lineTo(at.x,at.y+2*b);}if(!d.tiles[y+1]?.[x]){c.moveTo(at.x,at.y+2*b);c.lineTo(at.x-a,at.y+b);}if(!d.tiles[y]?.[x-1]){c.moveTo(at.x-a,at.y+b);c.lineTo(at.x,at.y);}
      }c.stroke();
      if(d.roads){
        // Filled town streets, faint road shoulders, and a narrow continuous
        // centreline avoid turning the automap into a staircase of tile blocks.
        const b=d.townBounds;c.fillStyle=overlay?'#b9a17122':'#c6ad7a22';c.beginPath();
        for(const key of d.roads)if(d.seen.has(key)){const x=key%d.size,y=Math.floor(key/d.size);if(d.paths&&!(b&&x>=b.x1&&x<=b.x2&&y>=b.y1&&y<=b.y2))continue;const at=project(x,y);if(at.x< -scale||at.x>w+scale||at.y< -scale||at.y>h+scale)continue;c.moveTo(at.x,at.y);c.lineTo(at.x+scale,at.y+scale*.5);c.lineTo(at.x,at.y+scale);c.lineTo(at.x-scale,at.y+scale*.5);c.closePath();}c.fill();
        if(d.paths){c.strokeStyle=overlay?'#c5ae7caa':'#c5ae7caa';c.lineWidth=overlay?3:1.8;c.lineJoin='round';c.lineCap='round';c.beginPath();
          for(const path of d.paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.ceil(distance(a,b)*3);let joined=false;for(let j=0;j<=steps;j++){const x=a.x+(b.x-a.x)*j/steps,y=a.y+(b.y-a.y)*j/steps;if(!d.seen.has(Math.floor(y)*d.size+Math.floor(x))){joined=false;continue;}const at=project(x,y);if(joined)c.lineTo(at.x,at.y);else c.moveTo(at.x,at.y);joined=true;}}
          c.stroke();c.lineCap='butt';
        }
      }
      const marker=(o,color,r=3)=>{if(!o||!d.seen.has(Math.floor(o.y)*d.size+Math.floor(o.x)))return;const at=project(o.x,o.y);c.strokeStyle=color;c.lineWidth=1.4;c.beginPath();c.moveTo(at.x,at.y-r);c.lineTo(at.x+r,at.y);c.lineTo(at.x,at.y+r);c.lineTo(at.x-r,at.y);c.closePath();c.stroke();};
      marker(d.field,'#c2a66b',overlay?6:3);if(d.herd&&!game.player.quests.herdRewarded&&!game.player.campaign?.records?.includes('field-1-0'))marker(d.herd,'#c2a66b',overlay?7:4);if(d.provisions&&!game.player.quests.provisionsRecovered)marker(d.provisions,'#c2a66b',overlay?6:3);for(const peer of game.lanPeers||[])marker(peer,peer.party&&peer.party===game.lanParty?'#b8d798':'#9dbfda',overlay?7:4);marker(d.townWaypoint,'#99dce2',overlay?7:4);marker(d.returnGate,'#d1b271',overlay?6:3);marker(d.waypoint,'#99dce2',overlay?7:4);marker(d.portal,'#d1b271',overlay?8:4);marker(d.supplies,'#b9ab83',overlay?5:2);
      for(const n of d.npcs||[])marker(n,'#cbb47e',2);for(const e of d.enemies)if(!e.dead&&distance(e,p)<8)marker(e,e.type==='warden'?'#d6a55f':'#b76c52',e.type==='warden'?4:1.5);
      const v=project(p.x,p.y);c.fillStyle='#f1dfb0';c.beginPath();c.moveTo(v.x,v.y-5);c.lineTo(v.x+3,v.y+3);c.lineTo(v.x,v.y+1);c.lineTo(v.x-3,v.y+3);c.closePath();c.fill();
      if(overlay){c.textAlign='center';c.font='12px Georgia';c.fillStyle='#cbb98caa';c.fillText(document.getElementById('location').textContent,w/2,25);c.font='9px Georgia';c.fillStyle='#b8a68099';c.fillText('TAB · CLOSE     ◈ WAYPOINT     ◆ ROAD / GATE     G · WORLD MAP',w/2,h-20);}
    };
    render(this.mc,this.map.width,this.map.height,false);const overlay=document.getElementById('map-overlay');if(game.largeMap&&overlay)render(overlay.getContext('2d'),overlay.width,overlay.height,true);
  }
}
