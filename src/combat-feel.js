export const INPUT_BUFFER=.22;
export function remainingRecovery(game,id){return Math.max(game.actionRecovery||0,game.dodgeTime||0,id==='basic'?game.attackCooldown||0:0);}
export function bufferCombatAction(game,id,target,quiet=false){
  const recovery=remainingRecovery(game,id);
  if(quiet||!(recovery>0)||recovery>INPUT_BUFFER)return false;
  game.queuedSkill={id,target:target&&Number.isFinite(target.x)&&Number.isFinite(target.y)?{x:target.x,y:target.y}:null,remaining:INPUT_BUFFER+.06};
  return true;
}
export function takeBufferedAction(game,dt){
  const action=game.queuedSkill;if(!action)return null;
  action.remaining-=dt;if(action.remaining<=0){game.queuedSkill=null;return null;}
  if(remainingRecovery(game,action.id)>0)return null;
  game.queuedSkill=null;return action;
}
export function hitReaction(enemy,damage,{from,critical=false,element='physical'}={}){
  const dx=enemy.x-(from?.x??enemy.x-1),dy=enemy.y-(from?.y??enemy.y),length=Math.hypot(dx,dy)||1;
  const strength=Math.max(.15,Math.min(1,damage/Math.max(1,enemy.maxHp)*3+(critical?.25:0))),duration=.18+strength*.04;
  return{remaining:duration,duration,dx:dx/length,dy:dy/length,strength,critical,element};
}
export function skillContactTiming(profile,weaponTiming,melee=false){
  const duration=melee?weaponTiming.duration:Math.max(.24,Math.min(.55,profile.cadence*.85));
  return{duration,impact:duration*(melee?.44:.36),recovery:Math.max(duration,profile.cadence)};
}
