const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
// Stable geometry keeps a particle on the same trajectory for its lifetime.
// Draw budgets change detail only; they never affect an attack's simulation.
export function effectSeed(effect={}){
  if(Number.isFinite(effect.seed))return effect.seed>>>0;
  let seed=2166136261;
  const key=[effect.type,effect.skill,effect.material,Math.round((effect.x||0)*97),Math.round((effect.y||0)*97)].join(':');
  for(let i=0;i<key.length;i++)seed=Math.imul(seed^key.charCodeAt(i),16777619);
  return seed>>>0;
}
export function particleNoise(seed,index){
  let value=(seed+Math.imul(index+1,374761393))>>>0;
  value=Math.imul(value^(value>>>13),1274126177);value^=value>>>16;
  return (value>>>0)/4294967296;
}
export function effectBudget(settings={},normal=18){
  const cap=settings.reducedMotion?7:settings.quality==='performance'?9:settings.quality==='high'?24:18;
  return Math.max(1,Math.min(cap,normal));
}
export function debrisPoint(seed,index,progress,{radius=28,height=23,gravity=36,direction=0,spread=Math.PI*1.7}={}){
  const t=clamp(progress,0,1),angle=direction+(particleNoise(seed,index*4)-.5)*spread,speed=radius*(.4+particleNoise(seed,index*4+1)*.8),lift=height*(.4+particleNoise(seed,index*4+2)*.8);
  return{x:Math.cos(angle)*speed*t,y:Math.sin(angle)*speed*t*.5-lift*t+gravity*t*t,size:.7+particleNoise(seed,index*4+3)*1.7};
}
export function meleeTrail(effect,progress,project){
  const radius=clamp(Number(effect.radius)||1.9,.35,8),t=clamp(progress,0,1),direction=Math.atan2(effect.dy??0,effect.dx??1),reverse=effect.combo===1?-1:1;
  const thrust=['spear','dagger'].includes(effect.weapon),head=direction+reverse*(-.94+Math.min(1,t*2.8)*1.88),length=thrust?0:.76*(1-t*.6),points=[];
  for(let i=0;i<=12;i++){
    const angle=head-reverse*length*(1-i/12),p=project(Math.cos(angle)*radius,Math.sin(angle)*radius),inner=project(Math.cos(angle)*radius*(effect.heavy?.72:.84),Math.sin(angle)*radius*(effect.heavy?.72:.84));
    points.push({outer:[p.x,p.y-27],inner:[inner.x,inner.y-27]});
  }
  return{points,head,direction,thrust,radius,fade:(1-t)**1.3};
}
