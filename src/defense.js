// Diablo II's attack-rating/defense and level factors. The result is a probability.
export function chanceToHit(attackRating,defense,attackerLevel=1,defenderLevel=1){
 const ar=Math.max(0,Number(attackRating)||0),def=Math.max(0,Number(defense)||0),a=Math.max(1,Number(attackerLevel)||1),d=Math.max(1,Number(defenderLevel)||1);
 return Math.max(.05,Math.min(.95,(ar/(ar+def||1))*(2*a/(a+d))));
}
export const weaponAttack=(element,source,direct=true)=>direct&&(source==='basic'||element==='physical'&&(!source||['cleave','rend','whirl','procession'].includes(source)));
export function enemyCombatStats(enemy,level=1){const l=Math.max(1,enemy?.level||level),boss=enemy?.type==='warden';return {level:l,attackRating:enemy?.attackRating??(12+l*4+(boss?18:0)),defense:enemy?.defense??(12+l*6+(boss?20:enemy?.elite?10:0))};}
export const rollWeaponHit=(attacker,defender,rng=Math.random)=>rng()<chanceToHit(attacker.attackRating,defender.defense,attacker.level,defender.level);
