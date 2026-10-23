const COLORS={physical:['#b3a48b','#6c5b43'],fire:['#dab07b','#b06439'],cold:['#c3dcda','#728e92'],lightning:['#ded1a6','#a79ac2'],aether:['#c4becf','#817d99']};
const THEMES={harvest:'physical',thorns:'physical',flood:'cold',fire:'fire',frost:'cold',oath:'physical',king:'fire',wanderer:'aether'};
export function combatEffect(r,e,progress,game){
 const c=r.ctx,element=e.element||THEMES[e.theme]||'physical',[light,dark]=COLORS[element]||COLORS.physical,budget=game.settings?.quality==='performance'?8:game.settings?.reducedMotion?10:18,t=r.time,rad=(e.radius||2)*34;
 if(e.type==='cast-motes'){
  const v=r.iso(e.dx||1,e.dy||0),angle=Math.atan2(v.y,v.x);c.save();c.translate(0,-35);c.rotate(angle);
  for(let i=0;i<budget;i++){const a=i*2.399,d=6+progress*(14+i%5*4),x=Math.cos(a)*d,y=Math.sin(a)*d*.6;c.globalAlpha=(1-progress)*(.4+i%3*.2);r.line([[x,y],[x-6*(1-progress),y+2]],i%3?dark:light,1+i%2);}
  c.restore();return true;
 }
 if(e.type==='sigil'){
  c.strokeStyle=light;c.lineWidth=1;for(let ring=0;ring<2;ring++){c.beginPath();c.ellipse(0,0,rad*(.5+ring*.15),rad*(.25+ring*.075),0,0,Math.PI*2);c.stroke();}for(let i=0;i<6;i++){const a=i*Math.PI/3;r.line([[Math.cos(a)*rad*.3,Math.sin(a)*rad*.15],[Math.cos(a)*rad*.7,Math.sin(a)*rad*.35]],dark,2);}return true;
 }
 if(e.type==='rend'){
  const v=r.iso(e.dx,e.dy),angle=Math.atan2(v.y,v.x);c.save();c.rotate(angle);for(let i=0;i<3;i++)r.line([[8,-35+i*8],[rad*(.3+progress*.7),-38+i*10]],i===1?'#bda88c':'#894b38',(1-progress)*3);c.restore();return true;
 }
 if(e.type==='frost-shatter'){
  for(let i=0;i<budget;i++){const a=i*2.399,d=progress*rad*(.5+i%4*.15),x=Math.cos(a)*d,y=Math.sin(a)*d*.5,h=(1-progress)*(8+i%4*3);r.poly([[x-2,y],[x,y-h],[x+3,y-2]],i%2?light:dark);}return true;
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
  c.globalAlpha=1;c.fillStyle=dark+'20';c.strokeStyle=light+'bb';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,rad,rad*.5,0,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle=light;c.lineWidth=2.2;c.beginPath();c.ellipse(0,0,rad*.88,rad*.44,0,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*rad*.7,y=Math.sin(a)*rad*.35;r.line([[x-3,y-2],[x,y+3],[x+3,y-2]],light+'99',1);}
  if(e.theme==='frost'||e.theme==='thorns')for(let i=0;i<8;i++){const a=i*Math.PI/4;r.line([[0,0],[Math.cos(a)*rad*.75*progress,Math.sin(a)*rad*.375*progress]],dark+'bb',1);}
  return true;
 }
 return false;
}
export function combatProjectile(r,b){
 const c=r.ctx,p=r.iso(b.x,b.y),v=r.iso(b.dx,b.dy),element=b.element||(b.kind==='blade'?'physical':b.kind),[light,dark]=COLORS[element]||COLORS.aether,angle=Math.atan2(v.y,v.x);c.save();c.translate(p.x,p.y-24);c.rotate(angle);r.light(0,0,b.hostile?19:14,dark+'44');
 if(element==='physical'){r.line([[-19,0],[7,0]],light,1.6);r.poly([[11,0],[2,-3],[4,0],[2,3]],light);}
 else if(element==='cold'){r.poly([[14,0],[-4,-4],[-10,0],[-4,4]],light,dark,1);for(let i=0;i<4;i++)r.line([[-12-i*5,(i%2?1:-1)*3],[-17-i*5,(i%2?1:-1)*4]],dark+'99',1);}
 else if(element==='lightning'){r.line([[-35,0],[-23,-3],[-18,2],[-8,-4],[11,0]],dark,3);r.line([[-35,0],[-23,-3],[-18,2],[-8,-4],[11,0]],light,1);r.line([[-17,1],[-25,7],[-29,6]],light+'99',1);}
 else if(element==='fire'){for(let i=5;i>=0;i--){r.ellipse(-i*4,Math.sin(r.time*22+i)*i*.3,Math.max(1,5-i*.6),Math.max(1,3-i*.3),i<2?light:dark+(i<4?'bb':'55'));}}
 else{r.line([[-25,0],[10,0]],dark+'88',3);r.poly([[11,0],[-1,-4],[-8,0],[-1,4]],light);for(let i=0;i<3;i++){const a=r.time*7+i*2.1;r.ellipse(-9-i*5,Math.sin(a)*5,1,1,dark);}}
 c.restore();
}
