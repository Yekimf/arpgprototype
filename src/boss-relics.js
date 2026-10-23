import {BASES} from './itemization.js';
export const BOSS_ARMS={
 harvest:{name:'The Tithe Reaper',base:'battleaxe',stat:'bleed',value:18,verb:'Reaper’s crescent'},
 thorns:{name:'Briarbound Oathblade',base:'greatsword',stat:'physicalDamage',value:14,verb:'Thornblade execution'},
 flood:{name:'The Drowned Headsman',base:'axe',stat:'coldDamage',value:18,verb:'Tidal axe'},
 fire:{name:'Coalheart',base:'warhammer',stat:'fireDamage',value:18,verb:'Furnace hammer'},
 frost:{name:'The Choir’s Last Note',base:'spear',stat:'coldDamage',value:18,verb:'Spear of silence'},
 oath:{name:'The Gatekeeper’s Regret',base:'greatsword',stat:'critDamage',value:18,verb:'Oathbreaker’s cleave'},
 king:{name:'The Usurper’s Due',base:'sword',stat:'fireDamage',value:18,verb:'Crownblade judgment'},
 wanderer:{name:'The Unkept Promise',base:'iron-staff',stat:'spellDamage',value:16,verb:'Blackglass requiem'}
};
// First-victory trophies are magic equipment, not guaranteed legendaries.
export function bossRelic(enemy,depth){const theme=enemy.phaseType||'oath',arm=BOSS_ARMS[theme]||BOSS_ARMS.oath,base=BASES.find(b=>b.id===arm.base),power=1+Math.max(0,depth-1)*.23,item={...base,id:`trophy-${enemy.bossId}`,base:base.id,baseName:base.name,name:arm.name,rarity:'magic',level:depth,requiredLevel:Math.max(1,Math.floor(depth)),identified:false,durability:100,quality:0,reforges:0,bossOrigin:enemy.name||'The Hollow Warden',lore:'Taken from the hand that held the road.'};
 for(const [key,value]of Object.entries(base))if(Array.isArray(value))item[key]=Math.round((value[0]+value[1])/2*power);
 const recovery=['staff','wand'].includes(base.look)?'manaRegenPercent':'attackRate',values=[[arm.stat,arm.value],[recovery,recovery==='attackRate'?5:15]];item.affixes=values.map(([stat,value],i)=>{item[stat]=(item[stat]||0)+value;return {id:`boss-${theme}-${i}`,stat,value,tier:1,kind:i?'suffix':'prefix',min:Math.round(value*.8),max:Math.round(value*1.2)};});return item;}
