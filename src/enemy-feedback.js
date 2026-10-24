const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// Recoil belongs to the painted body, never to its world position or shadow.
// Its quick shoulder compression settles once, without bouncing or ragdolling.
export function enemyHitPose(enemy,reducedMotion=false){
  const hit=enemy.hitReaction,duration=Number(hit?.duration),remaining=Number(hit?.remaining);
  if(reducedMotion||enemy.dead||!Number.isFinite(duration)||!Number.isFinite(remaining)||!(duration>0)||!(remaining>0))return{x:0,y:0,tilt:0,active:false};
  const dx=Number.isFinite(hit.dx)?hit.dx:0,dy=Number.isFinite(hit.dy)?hit.dy:0,sx=dx-dy,sy=(dx+dy)*.5,length=Math.hypot(sx,sy)||1;
  const progress=1-clamp(remaining/duration,0,1),settle=progress<.22?.45+.55*progress/.22:(1-(progress-.22)/.78)**2;
  const strength=clamp(Number(hit.strength)||0,0,1),size=enemy.type==='warden'?2.5:6;
  const distance=size*(.6+.4*strength)*(hit.critical?1.12:1)*settle;
  return{x:sx/length*distance,y:sy/length*distance*.55,tilt:sx/length*distance*.005,active:true};
}

// A short copper after-image makes a landed hit legible when damage numbers
// are disabled. Repeated hits extend the hold, but never accumulate past 100%.
export function enemyHealthTrail(previous,health,time){
  const hp=clamp(Number(health)||0,0,1),now=Number(time)||0;
  if(!previous||now<previous.time)return{hp,trail:hp,holdUntil:now,time:now};
  const lost=hp<previous.hp,holdUntil=lost?now+.12:previous.holdUntil;
  let trail=Math.max(hp,previous.trail);
  if(now>holdUntil)trail=hp+(trail-hp)*Math.exp(-Math.min(.1,now-previous.time)*15);
  return{hp,trail:clamp(trail,hp,1),holdUntil,time:now};
}
