import {enemyFamily} from './enemy-appearance.js';

// Area-owned decoration: never participates in targeting, collision or rewards.
export const REMAINS_LIMITS={corpses:120,stains:180,bursts:28};
const nextSplatter=new WeakMap();
const cap=(list,n)=>{if(list.length>n)list.splice(0,list.length-n);};
export function remainsOf(area){return area.remains??={corpses:[],stains:[],bursts:[],serial:0};}
export function remainsKind(enemy){
 const family=enemyFamily(enemy)?.id;
 if(enemy.type==='wraith'&&family==='chanter')return 'ash';
 return family==='spearman'?'bone':'blood';
}
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function direction(victim,source){
 const dx=victim.x-(source?.x??victim.x-1),dy=victim.y-(source?.y??victim.y),x=(dx-dy)*34,y=(dx+dy)*17,length=Math.hypot(x,y)||1;
 return {x:x/length,y:y/length};
}
export function scatterRemains(area,victim,source,{fatal=false,kind=remainsKind(victim),time=0}={}){
 const r=remainsOf(area);
 // Channelling and damage-over-time must not create a new particle system each tick.
 if(!fatal&&time<(nextSplatter.get(victim)??0))return;
 nextSplatter.set(victim,time+.28);
 const seed=(Math.floor(victim.x*8191+victim.y*131071)+ ++r.serial*7919)>>>0,rng=seeded(seed),aim=direction(victim,source),boss=victim.type==='warden',scale=boss?1.6:1;
 const particles=Array.from({length:fatal?kind==='bone'?15:22:6},()=>{
  const angle=Math.atan2(aim.y,aim.x)+(rng()-.5)*(fatal?3.9:2.1),speed=(fatal?24:14)+rng()*(fatal?63:36);
  return {vx:Math.cos(angle)*speed*scale,vy:Math.sin(angle)*speed*.5*scale,lift:35+rng()*65,size:(kind==='bone'?1.1: .6)+rng()*(fatal?2.2:1.2),spin:rng()*Math.PI,tone:rng()};
 });
 r.bursts.push({x:victim.x,y:victim.y,kind,age:0,duration:.72,particles,height:fatal?38:47,seed});cap(r.bursts,REMAINS_LIMITS.bursts);
 if(kind!=='ash'){
  r.stains.push({x:victim.x,y:victim.y,kind,age:0,seed,aim,scale:scale*(fatal?1:.46),fatal});cap(r.stains,REMAINS_LIMITS.stains);
 }
 return {seed,aim,kind,scale};
}
export function leaveCorpse(area,victim,source,{player=false,time=0}={}){
 // A duplicate kill callback cannot leave a second corpse or spray.
 const r=remainsOf(area);if(!player&&r.corpses.some(c=>c.victim===victim))return null;
 const hit=scatterRemains(area,victim,source,{fatal:true,kind:player?'blood':remainsKind(victim),time});
 const corpse={...hit,x:victim.x,y:victim.y,age:0,duration:victim.type==='warden'?1.2:.96,player,victim,
  body:{...victim,visual:victim.visual?{...victim.visual}:null,hit:0,slow:0,burn:0,pyreGlow:0,attackAnim:0,windup:0,rangedWindup:null,charge:null}};
 r.corpses.push(corpse);cap(r.corpses,REMAINS_LIMITS.corpses);return corpse;
}
export function advanceRemains(area,dt){
 const r=area.remains;if(!r)return;dt=Math.max(0,Math.min(dt,.1));
 for(const c of r.corpses)c.age=Math.min(c.duration+1,c.age+dt);
 for(const s of r.stains)s.age=Math.min(30,s.age+dt);
 for(const b of r.bursts)b.age+=dt;
 r.bursts=r.bursts.filter(b=>b.age<b.duration);
}

// Each stain is painted once, then composited over cached terrain. No floor rebuilds.
export function paintStain(ctx,stain){
 const rng=seeded(stain.seed);ctx.translate(80,48);ctx.scale(stain.scale,stain.scale);
 if(stain.kind==='bone'){
  for(let i=0;i<(stain.fatal?13:4);i++){
   ctx.save();ctx.translate((rng()-.4)*70,(rng()-.5)*29);ctx.rotate(rng()*Math.PI);ctx.fillStyle=['#8c8166','#b1a184','#514c3d'][i%3];ctx.fillRect(-2,-1,3+rng()*5,1+rng()*2);ctx.restore();
  }return;
 }
 ctx.rotate(Math.atan2(stain.aim.y,stain.aim.x));ctx.scale(1,.56);
 for(let i=0;i<42;i++){
  const a=rng()*Math.PI*2,spread=i<16?15:38,rad=rng()*spread,x=Math.cos(a)*rad+9,y=Math.sin(a)*rad;
  ctx.fillStyle=['#320d0cc9','#4d1512b8','#5e1d17ab','#711f1980'][i%4];ctx.beginPath();ctx.ellipse(x,y,i<16?4+rng()*9:.6+rng()*2.3,i<16?3+rng()*7:.5+rng()*1.6,rng()*Math.PI,0,Math.PI*2);ctx.fill();
 }
 // Broken highlights, never a glossy red disc.
 ctx.fillStyle='#a34d302c';for(let i=0;i<18;i++)ctx.fillRect((rng()-.3)*32,(rng()-.5)*23,.6+rng()*2,.5);
}

export function drawRemainsParticles(ctx,burst,reducedMotion=false){
 if(reducedMotion)return;const t=burst.age,fade=Math.min(1,(burst.duration-t)*5);
 ctx.save();ctx.globalAlpha*=fade;
 for(const p of burst.particles){
  const airborne=Math.max(0,burst.height+p.lift*t-230*t*t),x=p.vx*t,y=p.vy*t-airborne;
  ctx.save();ctx.translate(x,y);ctx.rotate(p.spin+t*5);
  ctx.fillStyle=burst.kind==='bone'?(p.tone>.5?'#b6a68b':'#756c56'):burst.kind==='ash'?(p.tone>.5?'#a2a18a':'#4b5148'):(p.tone>.6?'#973b27':'#5c1813');
  ctx.fillRect(-p.size/2,-p.size/2,p.size,burst.kind==='blood'?p.size*1.8:p.size*.65);ctx.restore();
 }ctx.restore();
}
