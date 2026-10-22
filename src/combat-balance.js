// Keep pressure in attack timing and pursuit rather than inflating health pools.
export const MELEE={reach:1.45,hitReach:1.7,windup:.28,recovery:.9};
export const BOSS_MELEE={reach:2.45,hitReach:2.8,windup:.48,recovery:1.15};
export function hostileAim(enemy,target,velocity={x:0,y:0},speed=7){const lead=Math.min(.55,Math.hypot(target.x-enemy.x,target.y-enemy.y)/speed)*.7,dx=target.x+velocity.x*lead-enemy.x,dy=target.y+velocity.y*lead-enemy.y,length=Math.hypot(dx,dy)||1;return {dx:dx/length,dy:dy/length};}
export function bossCadence(boss){return boss.hp/boss.maxHp<.5?2.1:2.9;}
