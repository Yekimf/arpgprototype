import {effectSeed,particleNoise,effectBudget,debrisPoint,meleeTrail} from './combat-particles.js';
const COLORS={physical:['#c6bda8','#776b57'],fire:['#e4bc85','#a75a32'],cold:['#ccdfdd','#768e96'],lightning:['#ddd8c7','#8985aa'],aether:['#c4becf','#817d99']};
const THEMES={harvest:'physical',thorns:'physical',flood:'cold',fire:'fire',frost:'cold',oath:'physical',king:'fire',wanderer:'aether'};
function drawMelee(r,e,progress,settings){
 const c=r.ctx,alpha=c.globalAlpha,trail=meleeTrail(e,progress,(x,y)=>r.iso(x,y)),fade=trail.fade,seed=effectSeed(e);
 c.lineCap='round';c.lineJoin='round';
 if(trail.thrust){
  const reach=trail.radius*(.45+Math.min(1,progress*3)*.55),v=r.iso(Math.cos(trail.direction)*reach,Math.sin(trail.direction)*reach),len=Math.hypot(v.x,v.y)||1,n={x:-v.y/len,y:v.x/len};
  c.globalAlpha=alpha*fade*.6;r.poly([[v.x*.32+n.x*2,v.y*.32-27+n.y*2],[v.x,v.y-27],[v.x*.32-n.x*2,v.y*.32-27-n.y*2]],'#aa9e8580');
  r.line([[v.x*.45,v.y*.45-27],[v.x,v.y-27]],'#d8d0bb',1.2);return;
 }
 c.globalAlpha=alpha*fade*.65;
 r.poly([...trail.points.map(p=>p.outer),...trail.points.slice().reverse().map(p=>p.inner)],e.heavy?'#988a6a55':'#a69f8955');
 // A short moving edge follows the blade; no full luminous circle around a swing.
 c.globalAlpha=alpha*fade;r.line(trail.points.map(p=>p.outer),'#aa9d7e',e.heavy?2.5:1.7);
 r.line(trail.points.slice(-5).map(p=>p.outer),'#e0d9c1',e.heavy?1.4:.9);
 const count=effectBudget(settings,e.heavy?7:4),tip=trail.points.at(-1).outer;
 for(let i=0;i<count;i++){
  const at=trail.points[Math.min(12,3+i*2)],d=particleNoise(seed,i)*6*progress;
  c.globalAlpha=alpha*fade*(.25+particleNoise(seed,i+20)*.35);r.line([[at.outer[0]-d,at.outer[1]+d*.4],[at.outer[0]-d-3,at.outer[1]+d*.4+1]],'#b6a383',.7);
 }
 c.globalAlpha=alpha*fade*.55;r.light(tip[0],tip[1],e.heavy?17:12,'#d1bd8b22');
}
function drawImpact(r,e,progress,settings){
 const c=r.ctx,alpha=c.globalAlpha,seed=effectSeed(e),element=e.element||'physical',material=e.material||'metal',strength=Math.max(0,Math.min(1,e.strength??.5)),critical=!!e.critical,[light,dark]=COLORS[element]||COLORS.physical;
 const fade=(1-progress)**1.4,aim=r.iso(e.dx??1,e.dy??0),angle=Math.atan2(aim.y,aim.x),count=effectBudget(settings,critical?21:12),radius=(critical?35:22)*(1+strength*.35),height=element==='fire'?55:material==='bone'?30:24;
 c.lineCap='round';c.globalAlpha=alpha*fade;
 if(element!=='physical'||material==='metal'){
  r.light(0,-27,critical?38:25,light+'22');
  if(progress<.32){const flash=(1-progress/.32)*(.6+strength*.4);c.globalAlpha=alpha*flash;r.line([[-5,-27],[5,-27]],light,critical?2:1.2);r.line([[0,-31],[0,-23]],light,1);}
 }
 for(let i=0;i<count;i++){
  const p=debrisPoint(seed,i,progress,{radius,height,gravity:element==='fire'?0:43,direction:angle,spread:Math.PI*1.55}),tail=debrisPoint(seed,i,Math.max(0,progress-.09),{radius,height,gravity:element==='fire'?0:43,direction:angle,spread:Math.PI*1.55});
  c.globalAlpha=alpha*fade*(.5+particleNoise(seed,i+60)*.5);const x=p.x,y=p.y-27;
  if(element==='fire'){r.line([[tail.x,tail.y-27],[x,y]],i%4?dark:light,Math.max(.5,p.size*(1-progress)));if(i%4===0)r.ellipse(x,y,1.2,.8,'#e1b875');}
  else if(element==='cold'||element==='physical'&&material==='bone'){
   const col=element==='cold'?(i%3?dark:light):(i%3?'#9a927b':'#c2baa4');c.save();c.translate(x,y);c.rotate(particleNoise(seed,i+40)*Math.PI+progress*(i%2?1:-1));r.poly([[-p.size,0],[0,-p.size*2.5],[p.size*.8,0],[0,p.size*.65]],col);c.restore();
  }else if(element==='physical'&&material==='flesh'){
   r.ellipse(x,y,Math.max(.5,p.size*(1-progress*.5)),Math.max(.4,p.size*.58),i%3?'#76392d':'#a05d45');
  }else if(element==='lightning'){
   r.line([[tail.x,tail.y-27],[x-1,y-2],[x+2,y+1]],i%3?dark:light,.8);
  }else r.line([[tail.x,tail.y-27],[x,y]],i%4?dark:light,Math.max(.6,p.size*.6));
 }
 if(critical){c.globalAlpha=alpha*fade*.4;const d=10+progress*19;r.line([[-d,-27-d*.25],[d,-27+d*.25]],element==='physical'?'#c3ad82':light,1);}
}
function drawGroundBurst(r,e,progress,settings,frost){
 const c=r.ctx,alpha=c.globalAlpha,seed=effectSeed(e),radius=Math.max(.5,e.radius||2.7)*34*Math.SQRT2,travel=Math.sqrt(progress),fade=(1-progress)**1.2,count=effectBudget(settings,24);
 c.globalAlpha=alpha*fade;
 if(frost)r.light(0,-8,radius*.7,'#aac7c51c');
 for(let i=0;i<count;i++){
  const a=i*2.399+particleNoise(seed,i)*.26,d=radius*(.17+travel*.83)*( .7+particleNoise(seed,i+20)*.3),x=Math.cos(a)*d,y=Math.sin(a)*d*.5;
  if(frost){
   const h=(7+particleNoise(seed,i+50)*18)*(1-progress*.75),w=2+particleNoise(seed,i+70)*2;
   r.poly([[x-w,y],[x-w*.2,y-h],[x+w,y-h*.18],[x+w*.4,y+1]],i%3?'#829b9f99':'#c1d7d5cc');r.line([[x-w*.2,y-h],[x+w*.15,y-2]],'#e0e8db99',.7);
   if(i%3===0){c.globalAlpha=alpha*fade*.3;r.line([[x*.7,y*.7],[x,y]],'#b4cbca',.8);c.globalAlpha=alpha*fade;}
  }else{
   const bend=(particleNoise(seed,i+50)-.5)*12;
   r.line([[x*.12,y*.12],[x*.38+bend,y*.38-2],[x*.64-bend,y*.64+2],[x,y]],'#16130fc0',2.8);
   r.line([[x*.12,y*.12+1],[x*.38+bend,y*.38-1],[x*.64-bend,y*.64+3],[x,y+1]],'#9a8b6b88',.8);
   const h=(4+particleNoise(seed,i+80)*8)*(1-progress);r.poly([[x-3,y],[x-2,y-h],[x+3,y-h+1],[x+4,y+1]],i%2?'#8b7d6388':'#554e4088');
  }
 }
 c.globalAlpha=alpha*fade*.3;for(let i=0;i<3;i++){const d=radius*(travel*.7+i*.07);c.strokeStyle=frost?'#9eb9b577':'#9c8a6355';c.lineWidth=1;c.beginPath();c.ellipse(0,0,d,d*.5,0,i*.6,Math.PI*1.4+i*.6);c.stroke();}
}
function drawLightning(r,e,progress,settings){
 const c=r.ctx,alpha=c.globalAlpha,to=r.iso(e.tx,e.ty),from=r.iso(e.x,e.y),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,seed=effectSeed(e),count=settings?.quality==='performance'?6:9,points=[];
 for(let i=0;i<=count;i++){const t=i/count,jitter=i===0||i===count?0:(particleNoise(seed,i)-.5)*14;points.push([dx*t+nx*jitter,dy*t+ny*jitter-27]);}
 c.globalAlpha=alpha*(1-progress)**.5;r.line(points,'#7e7d9c55',6);r.line(points,'#a9afbcbb',2.2);r.line(points,'#e4e4d1',.8);
 if(!settings?.reducedMotion)for(let i=2;i<count-1;i+=3){const point=points[i],side=i%2?1:-1;r.line([point,[point[0]+dx/count*.25+nx*side*11,point[1]+dy/count*.25+ny*side*11],[point[0]+dx/count*.6+nx*side*15,point[1]+dy/count*.6+ny*side*15]],'#a5a7b888',.8);}
 c.globalAlpha=alpha*(1-progress)*.6;r.light(dx,dy-27,19,'#c6d0cd2c');
}
export function combatEffect(r,e,progress,game){
 const c=r.ctx,element=e.element||THEMES[e.theme]||'physical',[light,dark]=COLORS[element]||COLORS.physical,budget=effectBudget(game.settings),t=r.time,rad=(e.radius||2)*34*Math.SQRT2,alpha=c.globalAlpha;
 if(e.type==='melee-trail'||e.type==='slash'){drawMelee(r,e,progress,game.settings);return true;}
 if(e.type==='hit-impact'||e.type==='weapon-hit'){drawImpact(r,e,progress,game.settings);return true;}
 if(e.type==='nova'||e.type==='quake'){drawGroundBurst(r,e,progress,game.settings,e.type==='nova');return true;}
 if(e.type==='lightning'){drawLightning(r,e,progress,game.settings);return true;}
 if(e.type==='evade-dust'){
  const seed=effectSeed(e),v=r.iso(e.dx??1,e.dy??0),angle=Math.atan2(v.y,v.x)+Math.PI;
  for(let i=0;i<effectBudget(game.settings,9);i++){
   const p=debrisPoint(seed,i,progress,{radius:27,height:10,gravity:14,direction:angle,spread:1.2});c.globalAlpha=alpha*(1-progress)**1.5*.35;r.ellipse(p.x,p.y+1,p.size*(2+progress*4),p.size*(.8+progress),'#8b7b5c');
   if(i%3===0){c.globalAlpha=alpha*(1-progress)*.6;r.line([[p.x,p.y],[p.x-2,p.y+1]],'#b4a181',.7);}
  }return true;
 }
 if(e.type==='boss-sweep-warning'||e.type==='boss-sweep'){
  const aim=r.iso(e.dx,e.dy),a=Math.atan2(aim.y*2,aim.x),warning=e.type.endsWith('warning');if(warning)c.globalAlpha=alpha;c.save();c.scale(1,.5);c.beginPath();c.moveTo(0,0);c.arc(0,0,rad,a-e.arc/2,a+e.arc/2);c.closePath();c.fillStyle=dark+(warning?'28':'44');c.fill();c.strokeStyle=light;c.lineWidth=warning?1.5:3;c.setLineDash(warning?[7,5]:[]);c.stroke();c.setLineDash([]);if(warning){c.beginPath();c.arc(0,0,rad*progress,a-e.arc/2,a+e.arc/2);c.stroke();}else{const t=a-e.arc/2+e.arc*progress;r.line([[Math.cos(t)*rad*.15,Math.sin(t)*rad*.15],[Math.cos(t)*rad,Math.sin(t)*rad]],light,5*(1-progress)+1);}c.restore();return true;
 }
 if(e.type==='boss-wave-warning'||e.type==='boss-wave'){
  const warning=e.type.endsWith('warning'),radius=warning?rad:Math.max(1,rad*progress);if(warning)c.globalAlpha=alpha;else{c.fillStyle=dark+'25';c.beginPath();c.ellipse(0,0,radius+26,(radius+26)*.5,0,0,Math.PI*2);c.ellipse(0,0,Math.max(.1,radius-26),Math.max(.1,(radius-26)*.5),0,0,Math.PI*2);c.fill('evenodd');}c.strokeStyle=warning?dark:light;c.lineWidth=warning?1:4*(1-progress)+1;c.setLineDash(warning?[5,6]:[]);c.beginPath();c.ellipse(0,0,radius,radius*.5,0,0,Math.PI*2);c.stroke();c.setLineDash([]);if(warning){r.line([[-9,0],[9,0]],light,1);r.line([[0,-5],[0,5]],light,1);}else for(let i=0;i<budget;i++){const a=i*2.399,x=Math.cos(a)*radius,y=Math.sin(a)*radius*.5;r.line([[x,y],[x,y-(1-progress)*12]],dark,1.5);}return true;
 }
 if(e.type==='hostile-ground'){
  const radius=rad*.85;r.light(0,-3,rad,dark+'11');for(let i=0;i<budget/2;i++){const a=i*2.399+t*.25,x=Math.cos(a)*radius*(.4+i%3*.2),y=Math.sin(a)*radius*.5*(.4+i%3*.2);r.line([[x-5,y],[x,y-4-Math.sin(t*2+i)*2],[x+4,y]],dark+'bb',1.5);}c.strokeStyle=dark+'88';c.lineWidth=1;c.beginPath();c.ellipse(0,0,rad,rad*.5,0,0,Math.PI*2);c.stroke();return true;
 }
 if(e.type==='blade-procession'){
  for(let i=0;i<4;i++){const a=t*3+i*Math.PI/2,x=Math.cos(a)*rad,y=Math.sin(a)*rad*.5;c.save();c.translate(x,y-16);c.rotate(a+.8);r.line([[0,12],[0,-24]],light,3);r.line([[-1,-21],[-1,7]],'#e3dac5',1);r.line([[-7,6],[7,6]],dark,3);r.line([[0,12],[0,19]],dark,3);c.restore();}return true;
 }
 if(e.type==='ruin-mark'){
  c.strokeStyle=dark;c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,rad,rad*.5,0,0,Math.PI*2);c.stroke();c.strokeStyle=light;c.lineWidth=2;c.beginPath();c.ellipse(0,0,rad,rad*.5,0,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);c.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;r.line([[Math.cos(a)*rad*.8,Math.sin(a)*rad*.4],[Math.cos(a)*rad,Math.sin(a)*rad*.5]],dark,2);}return true;
 }
 if(e.type==='ruin-impact'){
  const fade=1-progress;r.light(0,-15,rad*(.6+progress),dark+'33');
  if(element==='fire'){const drop=Math.min(1,progress*5);r.line([[45*(1-drop),-260*(1-drop)-24],[0,-12]],light,12*fade);for(let i=0;i<budget;i++){const a=i*2.399,d=rad*Math.sqrt(progress);r.line([[Math.cos(a)*d*.6,Math.sin(a)*d*.3],[Math.cos(a)*d,Math.sin(a)*d*.5-45*fade]],i%3?dark:light,2*fade+1);}}
  else{r.line([[6,-240],[-9,-177],[11,-136],[-4,-84],[0,0]],dark,9*fade);r.line([[6,-240],[-9,-177],[11,-136],[-4,-84],[0,0]],light,3*fade);for(let i=0;i<6;i++){const a=i*Math.PI/3;r.line([[0,-4],[Math.cos(a)*rad*progress,Math.sin(a)*rad*.5*progress]],light,fade*2);}}
  c.strokeStyle=light;c.lineWidth=2*fade;c.beginPath();c.ellipse(0,0,rad*progress,rad*.5*progress,0,0,Math.PI*2);c.stroke();return true;
 }
 if(e.type==='cast-motes'){
  const v=r.iso(e.dx??1,e.dy??0),angle=Math.atan2(v.y,v.x),seed=effectSeed(e),fade=(1-progress)**1.4;c.save();c.translate(0,-34);c.rotate(angle);
  c.globalAlpha=alpha*fade*.4;r.light(7,0,21,dark+'33');
  for(let i=0;i<effectBudget(game.settings,12);i++){
   const speed=10+particleNoise(seed,i)*24,x=3+speed*progress,y=(particleNoise(seed,i+30)-.5)*(8+progress*12),width=.7+particleNoise(seed,i+60)*1.2;
   c.globalAlpha=alpha*fade*(.3+particleNoise(seed,i+80)*.5);
   if(element==='cold')r.poly([[x+2,y],[x-1,y-width*2],[x-4,y],[x-1,y+width]],i%3?dark:light);
   else if(element==='fire')r.line([[x-4,y+progress*3],[x,y-progress*4]],i%4?dark:light,width);
   else r.line([[x-4,y],[x-2,y-width],[x,y]],i%3?dark:light,width*.75);
  }
  c.restore();return true;
 }
 if(e.type==='sigil'){
  c.strokeStyle=light;c.lineWidth=1;for(let ring=0;ring<2;ring++){c.beginPath();c.ellipse(0,0,rad*(.5+ring*.15),rad*(.25+ring*.075),0,0,Math.PI*2);c.stroke();}for(let i=0;i<6;i++){const a=i*Math.PI/3;r.line([[Math.cos(a)*rad*.3,Math.sin(a)*rad*.15],[Math.cos(a)*rad*.7,Math.sin(a)*rad*.35]],dark,2);}return true;
 }
 if(e.type==='rend'){
  const v=r.iso(e.dx,e.dy),angle=Math.atan2(v.y,v.x);c.save();c.rotate(angle);for(let i=0;i<3;i++)r.line([[8,-35+i*8],[rad*(.3+progress*.7),-38+i*10]],i===1?'#bda88c':'#894b38',(1-progress)*3);c.restore();return true;
 }
 if(e.type==='frost-shatter'){
  if(element==='lightning'){
   // Thunder Spear reuses this area-impact event, but its shock burst must not
   // draw Rime Lance's frozen fragments or borrow the cold palette.
   drawImpact(r,{...e,material:'metal',strength:e.strength??.55},progress,game.settings);
   const seed=effectSeed(e),fade=(1-progress)**1.2;c.globalAlpha=alpha*fade;
   for(let i=0;i<effectBudget(game.settings,8);i++){
    const a=i*2.399+particleNoise(seed,i)*.2,d=rad*(.35+Math.sqrt(progress)*.65),x=Math.cos(a)*d,y=Math.sin(a)*d*.5,jitter=(particleNoise(seed,i+30)-.5)*9;
    r.line([[x*.15,y*.15-21],[x*.48+jitter,y*.48-18],[x*.68-jitter,y*.68-12],[x,y-8]],i%3?dark+'99':light+'bb',i%3?.8:1.1);
   }return true;
  }
  const seed=effectSeed(e),fade=(1-progress)**1.2;c.globalAlpha=alpha*fade;r.light(0,-16,rad*.6,'#9fbdbe22');
  for(let i=0;i<budget;i++){
   const p=debrisPoint(seed,i,progress,{radius:rad*.7,height:42,gravity:50,spread:Math.PI*2}),h=p.size*(3-progress),w=p.size*.8;
   c.save();c.translate(p.x,p.y-18);c.rotate((particleNoise(seed,i+40)-.5)*1.5+progress*(i%2?.8:-.8));r.poly([[-w,0],[0,-h],[w,h*.15],[0,h*.4]],i%3?'#819da2aa':'#d2e2ddcc');r.line([[0,-h],[0,h*.2]],'#e5e8dc88',.6);c.restore();
  }return true;
 }
 if(e.type==='boss-cast'||e.type==='boss-impact'){
  const impact=e.type==='boss-impact',radius=rad*(impact?progress:1-progress*.25);
  r.light(0,-8,radius,light+'14');
  for(let i=0;i<budget;i++){const a=i*2.399+e.x*.1,d=radius*(.45+(i%5)*.13),x=Math.cos(a)*d,y=Math.sin(a)*d*.5,h=(1-progress)*(8+i%6*3);
   if(e.theme==='thorns'||e.theme==='frost'||e.theme==='wanderer')r.poly([[x-3,y],[x+(i%2?5:-5),y-h],[x+3,y+1]],i%3?dark:light);
   else if(e.theme==='flood'){c.strokeStyle=i%2?dark:light;c.lineWidth=1;c.beginPath();c.ellipse(x,y,3+progress*9,1+progress*4,0,0,Math.PI*1.5);c.stroke();}
   else r.line([[x,y],[x+Math.cos(a)*5,y-h]],i%3?dark:light,1.5);
  }
  if(e.theme==='king'||e.theme==='oath'){for(let i=0;i<8;i++){const a=i*Math.PI/4;r.line([[Math.cos(a)*radius*.6,Math.sin(a)*radius*.3],[Math.cos(a)*radius,Math.sin(a)*radius*.5]],light,1.3);}}
  return true;
 }
 if(e.type==='meteor-warning'&&e.hostile){
  // The perimeter remains readable throughout windup, even with motion reduced.
  c.globalAlpha=alpha;c.fillStyle=dark+'20';c.strokeStyle=light+'bb';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,rad,rad*.5,0,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle=light;c.lineWidth=2.2;c.beginPath();c.ellipse(0,0,rad*.88,rad*.44,0,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*rad*.7,y=Math.sin(a)*rad*.35;r.line([[x-3,y-2],[x,y+3],[x+3,y-2]],light+'99',1);}
  if(e.theme==='frost'||e.theme==='thorns')for(let i=0;i<8;i++){const a=i*Math.PI/4;r.line([[0,0],[Math.cos(a)*rad*.75*progress,Math.sin(a)*rad*.375*progress]],dark+'bb',1);}
  return true;
 }
 return false;
}
export function combatProjectile(r,b){
 const c=r.ctx,p=r.iso(b.x,b.y),v=r.iso(b.dx,b.dy),element=b.element||(b.kind==='blade'?'physical':b.kind),[light,dark]=COLORS[element]||COLORS.aether,angle=Math.atan2(v.y,v.x),alpha=c.globalAlpha,settings=r.settings||{},count=effectBudget(settings,settings.reducedMotion?3:settings.quality==='performance'?4:7),seed=effectSeed({type:b.kind,seed:b.visualSeed??Math.round((b.dx+1)*76543+(b.dy+1)*12347)}),phase=settings.reducedMotion?0:r.time*5;
 c.save();c.translate(p.x,p.y-25);c.rotate(angle);c.lineCap='round';c.lineJoin='round';
 if(element==='physical'){
  // A wooden shaft and iron head stay legible without turning arrows into lasers.
  r.line([[-20,0],[7,0]],'#564b39',2.3);r.line([[-19,-.5],[7,-.5]],'#b6aa8e',.8);r.poly([[12,0],[4,-2.5],[6,0],[4,2.5]],'#d1c9b4','#6b675a',.6);r.line([[-20,0],[-24,-3]],'#8e816a',1.3);r.line([[-20,0],[-24,3]],'#8e816a',1.3);
 }else if(element==='cold'){
  r.light(0,0,20,'#b1cfce2c');r.poly([[16,0],[-2,-4],[-14,0],[-2,4]],'#8eaaaeb3');r.poly([[15,0],[-2,-2],[-7,0],[-2,2]],'#dfebe2');r.line([[-10,0],[11,0]],'#e4eade',.8);
  for(let i=0;i<Math.min(count,6);i++){const x=-15-i*5,y=(particleNoise(seed,i)-.5)*7,w=1+particleNoise(seed,i+20);c.globalAlpha=alpha*(1-i/7)*.6;r.poly([[x+2,y],[x,y-w],[x-4,y],[x,y+w*.6]],i%2?dark:light);}
 }else if(element==='lightning'){
  const points=[[-36,0],[-26,-2],[-20,2],[-13,-2.5],[-5,1],[12,0]];r.light(2,0,20,'#bcb5d52a');r.line(points,'#79779466',5);r.line(points,'#b6b8c3',2);r.line(points,'#ebe8d6',.75);
  if(!settings.reducedMotion)r.line([[-19,1],[-25,6],[-29,5]],'#c3becb99',.8);
 }else if(element==='fire'){
  r.light(-3,0,b.hostile?28:23,'#c978343b');
  r.poly([[12,0],[2,-4],[-12,-5],[-29,-2],[-20,1],[-33,4],[-10,5],[2,4]],'#8e4b2b99');
  r.poly([[12,0],[2,-3],[-8,-2],[-22,0],[-8,3],[3,3]],'#c58a4fc9');r.poly([[11,0],[2,-1.5],[-9,0],[2,1.8]],'#f0d39d');
  for(let i=0;i<count;i++){const x=-14-i*5,y=(particleNoise(seed,i)-.5)*(4+i)+Math.sin(phase+i*.8)*i*.2;c.globalAlpha=alpha*(1-i/9)*.65;r.line([[x,y],[x-2.5,y+.5]],i%3?dark:light,i%3?.8:1.2);}
 }else{
  r.light(0,0,20,'#a29eb92d');r.line([[-30,0],[10,0]],'#7d789655',4);r.poly([[14,0],[-1,-3.5],[-12,0],[-1,3.5]],'#b7b4c9');r.line([[-10,0],[12,0]],'#e2dddc',.8);
  for(let i=0;i<Math.min(5,count);i++){const x=-12-i*5,y=Math.sin(phase*.65+i*1.6)*(2+i*.4);c.globalAlpha=alpha*(1-i/6)*.6;r.line([[x,y],[x-3,y-1]],i%3?dark:light,.8);}
 }
 c.restore();
}
