import {clamp} from './game.js';
export const FLASK={capacity:100,cost:20,regen:.45,recovery:.48,duration:3,instant:.06};
export function ensureFlask(p){if(!p.flask)p.flask={charges:clamp((p.potions??3)*FLASK.cost,0,FLASK.capacity),healing:0,remaining:0};p.flask.charges=clamp(Number(p.flask.charges)||0,0,FLASK.capacity);p.flask.healing=Math.max(0,p.flask.healing||0);p.flask.remaining=Math.max(0,p.flask.remaining||0);p.potions=Math.floor(p.flask.charges/FLASK.cost);return p.flask;}
export function refillFlask(p,amount=FLASK.capacity){const f=ensureFlask(p);f.charges=clamp(f.charges+amount,0,FLASK.capacity);p.potions=Math.floor(f.charges/FLASK.cost);return f.charges;}
export function drinkFlask(p,stats){const f=ensureFlask(p);if(p.hp<=0||p.hp>=stats.maxHp||f.charges<FLASK.cost)return false;f.charges-=FLASK.cost;f.healing=Math.min(stats.maxHp*1.2,f.healing+stats.maxHp*FLASK.recovery*(1+(stats.flaskRecovery||0)/100));f.remaining=FLASK.duration;p.hp=Math.min(stats.maxHp,p.hp+stats.maxHp*FLASK.instant);p.potions=Math.floor(f.charges/FLASK.cost);return true;}
export function tickFlask(p,stats,dt,safe=false){const f=ensureFlask(p);refillFlask(p,dt*(safe?4:FLASK.regen)*(1+(stats.flaskGain||0)/100));if(f.remaining>0&&f.healing>0&&p.hp>0){const recovery=f.healing/Math.max(.001,f.remaining)*Math.min(dt,f.remaining);p.hp=Math.min(stats.maxHp,p.hp+recovery);f.healing=Math.max(0,f.healing-recovery);f.remaining=Math.max(0,f.remaining-dt);}return f;}
export function combatFlaskCharges(p,stats,{elite=false,boss=false}={}){const amount=(boss?45:elite?14:6)*(1+(stats.flaskGain||0)/100);refillManaFlask(p,amount);return refillFlask(p,amount);}

export function ensureManaFlask(p){
 p.manaFlask??={charges:60,recovery:0,remaining:0};const f=p.manaFlask;
 f.charges=clamp(Number(f.charges)||0,0,100);f.recovery=Math.max(0,Number(f.recovery)||0);f.remaining=Math.max(0,Number(f.remaining)||0);return f;
}
export function refillManaFlask(p,amount=100){const f=ensureManaFlask(p);f.charges=clamp(f.charges+amount,0,100);return f.charges;}
export function drinkManaFlask(p,stats,capacity=stats.maxMana){
 const f=ensureManaFlask(p);if(p.hp<=0||p.mana>=capacity||f.charges<20)return false;
 f.charges-=20;f.recovery=Math.min(stats.maxMana*1.2,f.recovery+stats.maxMana*.5);f.remaining=3;p.mana=Math.min(capacity,p.mana+stats.maxMana*.06);return true;
}
export function tickManaFlask(p,stats,dt,safe=false,capacity=stats.maxMana){
 const f=ensureManaFlask(p);refillManaFlask(p,dt*(safe?4:.45)*(1+(stats.flaskGain||0)/100));
 if(f.remaining>0&&f.recovery>0&&p.hp>0){const recovered=f.recovery/Math.max(.001,f.remaining)*Math.min(dt,f.remaining);p.mana=Math.min(capacity,p.mana+recovered);f.recovery=Math.max(0,f.recovery-recovered);f.remaining=Math.max(0,f.remaining-dt);}return f;
}
