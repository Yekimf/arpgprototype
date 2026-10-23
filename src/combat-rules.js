export const sandboxDefaults=()=>({god:false,infiniteMana:false,damageMultiplier:1,freeBuild:false});
export function outgoingMultiplier(sandbox){const n=Number(sandbox?.damageMultiplier);return Number.isFinite(n)?Math.max(.1,Math.min(10,n)):1;}
export function manaCapacity(stats,auras={}){return Math.max(1,Math.floor(stats.maxMana*(1-(auras.bulwark ? .25 : 0)-(auras.focus ? .30 : 0))));}
export function restoreLeech(game,dt){
 const s=game.stats,p=game.player,life=Math.min(game.leechLife||0,s.maxHp*.08*dt),mana=Math.min(game.leechMana||0,s.maxMana*.10*dt);
 p.hp=Math.min(s.maxHp,p.hp+life);p.mana=Math.min(manaCapacity(s,game.auras),p.mana+mana);game.leechLife=Math.max(0,(game.leechLife||0)-life);game.leechMana=Math.max(0,(game.leechMana||0)-mana);
}
export function queueLeech(game,damage,element,{leech=0,manaOnHit=0}={}){
 const s=game.stats;game.leechLife=Math.min(s.maxHp*.25,(game.leechLife||0)+(element==='physical'?damage*((s.lifeLeech||0)+leech)/100:0));game.leechMana=Math.min(s.maxMana*.25,(game.leechMana||0)+damage*(s.manaLeech||0)/100);game.player.mana=Math.min(manaCapacity(s,game.auras),game.player.mana+(s.manaOnHit||0)+manaOnHit);
}
export function dungeonSeed(seed,act,chapter,generation=0){return (Math.floor(seed)+act*211+chapter*7919+Math.floor(generation)*104729)>>>0;}
// Marked attacks and damaging fields are simulation state as well as visuals.
// Only discard decoration when crowded; never cancel an attack to save particles.
export function queueEffect(game,entry,budget=180){
 const protectedEffect=e=>e.pending||Number(e.damage)>0;
 if(game.effects.length>=budget){const at=game.effects.findIndex(e=>!protectedEffect(e));if(at>=0)game.effects.splice(at,1);else if(!protectedEffect(entry))return false;}
 game.effects.push(entry);return true;
}
