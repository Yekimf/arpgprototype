import {projectilePainting} from './skill-animation.js';

const dir=(r,e)=>{const v=r.iso(e.dx??1,e.dy??0);return Math.atan2(v.y,v.x);};
const radius=e=>Math.max(.35,e.radius||2)*34*Math.SQRT2;
function ground(r,name,value,rad,options={}){return r.skillArt.draw(r.ctx,name,value,{width:rad*2.12,height:rad*1.4,anchorY:['fireburst','frostburst','earth','thunder'].includes(name)?.79:null,...options});}
function cut(r,e,p,{loop=false,blood=false}={}){
 const c=r.ctx,rad=radius(e),v=r.iso(e.dx??1,e.dy??0);
 if(!blood&&!loop&&e.skill!=='cleave'&&['spear','dagger'].includes(e.weapon)){const end=r.iso((e.dx??1)*(e.radius||2),(e.dy??0)*(e.radius||2));r.skillArt.draw(c,'steelhit',p,{x:end.x*.85,y:end.y*.85-27,width:47,height:38,alpha:1-p*.65});return;}
 c.save();c.translate(0,-25);c.scale(1,.5);c.rotate(loop?r.time*15:Math.atan2(v.y*2,v.x));
 if(blood){c.translate(rad*.45,0);c.rotate(Math.PI/5);}
 r.skillArt.draw(c,blood?'rend':'cut',loop?r.time*19:p,{width:rad*(blood?1.25:2.1),height:rad*(blood?1.25:2.1),loop,alpha:(1-p*.75)*(e.combo===1?.9:1)});c.restore();
}
export function paintedEffect(r,e,p,game){
 if(!r.skillArt?.ready)return false;const c=r.ctx,art=r.skillArt,rad=radius(e),t=r.time;
 if(['melee-trail','slash','rend','whirl'].includes(e.type)){cut(r,e,p,{loop:e.type==='whirl',blood:e.type==='rend'});return true;}
 if(e.type==='nova'||e.type==='quake'){ground(r,e.type==='nova'?'frostburst':'earth',p,rad,{alpha:.88});return true;}
 if(e.type==='fire-eruption'){ground(r,'fireburst',p,rad,{height:rad*1.9});return true;}
 if(e.type==='vortex'){ground(r,'vortex',t*11,rad,{height:rad*1.03,y:-5,alpha:.78});return true;}
 if(e.type==='blade-procession'){
  for(let i=0;i<4;i++){const a=t*3+i*Math.PI/2;c.save();c.translate(Math.cos(a)*rad,Math.sin(a)*rad*.5-18);c.rotate(a+Math.PI/2);art.draw(c,'sword',t*12+i,{width:38,height:102,alpha:.87});c.restore();}return true;
 }
 if(e.type==='lightning'){
  const from=r.iso(e.x,e.y),to=r.iso(e.tx,e.ty),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(length<1)return true;
  c.save();c.translate(dx/2,dy/2-27);c.rotate(Math.atan2(dy,dx));art.draw(c,'arc',p,{width:length+15,height:Math.min(65,20+length*.16),loop:false});c.restore();return true;
 }
 if(e.type==='ruin-impact'){ground(r,e.element==='fire'?'fireburst':'thunder',p,rad,{height:e.element==='fire'?rad*2:Math.max(230,rad*3.5)});return true;}
 if(e.type==='frost-shatter'){ground(r,e.element==='lightning'?'thunder':'frostburst',p,rad,{height:rad*1.65,alpha:.9});return true;}
 if(e.type==='hit-impact'||e.type==='weapon-hit'){
  const name=e.element==='fire'?'fireburst':e.element==='cold'?'frostburst':e.element==='lightning'?'thunder':e.element==='aether'?'arc':e.material==='flesh'?'rend':'steelhit';
  art.draw(c,name,p,{x:0,y:-26,width:e.critical?84:55,height:e.critical?90:60,loop:false,alpha:.9});return true;
 }
 if(e.type==='sigil'){
  if(e.skill==='focus'||e.element==='fire')art.draw(c,'trance',t*10,{width:rad*1.9,height:rad,alpha:.72});
  else{for(let i=0;i<3;i++){const a=i*2.094+t*.28;art.draw(c,'guard',t*9+i,{x:Math.cos(a)*rad*.55,y:Math.sin(a)*rad*.25-32,width:61,height:88,alpha:.28});}}
  return true;
 }
 if(e.type==='heal'){art.draw(c,'heal',p*5,{width:74,height:108,alpha:(1-p)*.85});return true;}
 if(e.type==='cast-motes'){
  const name=['cleave','quake','whirl','rend','procession'].includes(e.skill)?'steelhit':e.element==='fire'?'firebolt':e.element==='cold'?'icebolt':'aetherbolt';
  c.save();c.translate(Math.cos(dir(r,e))*18,Math.sin(dir(r,e))*18-33);c.rotate(dir(r,e));art.draw(c,name,p*5,{width:38,height:30,alpha:(1-p)*.75});c.restore();return true;
 }
 if(e.type==='boss-cast'||e.type==='boss-impact'){
  ground(r,['fire','king'].includes(e.theme)?'fireburst':e.theme==='frost'?'frostburst':['oath','wanderer'].includes(e.theme)?'thunder':'earth',p,rad,{alpha:e.type==='boss-cast'?.48:.88});return true;
 }
 // Paint under the explicit outlines. Telegraphs remain accurate and legible.
 if(e.type==='ruin-mark'||e.type==='meteor-warning'&&e.playerGround){art.draw(c,e.element==='lightning'?'vortex':'trance',t*10,{width:rad*1.7,height:rad*.85,alpha:.2});return false;}
 return false;
}
export function paintedProjectile(r,b){
 if(!r.skillArt?.ready)return false;const c=r.ctx,point=r.iso(b.x,b.y),v=r.iso(b.dx,b.dy),name=projectilePainting(b),angle=Math.atan2(v.y,v.x),t=r.time*13;
 c.save();c.translate(point.x,point.y-25);c.rotate(angle);
 const painted=r.skillArt.draw(c,name,t,{priority:!!b.hostile,x:8,width:name==='arrow'?57:name==='icebolt'?88:86,height:name==='arrow'?32:52});
 if(!painted){c.restore();return false;}
 if(b.element==='lightning')r.skillArt.draw(c,'arc',t,{x:-24,width:78,height:41,alpha:.7});c.restore();return true;
}
export function paintedFireField(r,x,y,range,seed=0){
 if(!r.skillArt?.ready)return false;const c=r.ctx,rad=range*34*Math.SQRT2,count=r.settings?.quality==='performance'?8:r.settings?.quality==='high'?16:12,phase=r.time*11;
 c.save();c.translate(x,y);r.skillArt.draw(c,'trance',phase,{width:rad*2.05,height:rad,alpha:.42});
 for(let i=0;i<count;i++){const a=i*2.399+seed,d=rad*(.22+(i%4)*.18),px=Math.cos(a)*d,py=Math.sin(a)*d*.5;r.skillArt.draw(c,'flame',phase+i*.83,{x:px,y:py,width:46+i%3*5,height:48+i%4*5,alpha:.76});}
 c.restore();return true;
}
