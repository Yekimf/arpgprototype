import {BASES,createRelic} from './itemization.js';
import {ITEM_SETS,SET_SLOTS,makeSetItem} from './set-items.js';
import {goldReward} from './economy.js';
import {actOneLootLevel} from './act-one-balance.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
export const BASE_TREASURE_LEVELS={sword:1,axe:2,mace:2,spear:2,dagger:1,greatsword:5,warhammer:6,flail:4,staff:1,wand:1,'crystal-wand':7,bow:2,crossbow:4,'iron-staff':6,battleaxe:5,'ritual-scepter':5,leather:1,chain:5,plate:9,vestment:1,sallet:3,greathelm:7,hood:1,gloves:1,gauntlets:6,boots:1,greaves:6,belt:1,ring:1,charm:1,buckler:1,kite:7};
export const baseTreasureLevel=base=>BASE_TREASURE_LEVELS[typeof base==='string'?base:base?.id]||1;
export function noDropChance({players=1,nearbyParty=0,boss=false,elite=false}={}){
 if(boss)return 0;const count=Math.floor(clamp(players,1,8)),near=Math.floor(clamp(nearbyParty,0,count-1)),exponent=1+Math.floor(near+(count-1-near)/2);
 return (elite?.2:.625)**exponent;
}
const slotWeights={weapon:24,armor:32,helm:11,shield:10,gloves:9,boots:10,belt:3,ring:.4,charm:.25};
const tierSpecs=[['standard',0,70],['exceptional',11,25],['elite',23,5]];
export function treasureClass(level=1){level=Math.max(1,Math.floor(level));const entries=[];for(const base of BASES)for(const [tier,offset,weight]of tierSpecs){const requiredLevel=baseTreasureLevel(base)+offset;if(requiredLevel<=level)entries.push({base,tier,requiredLevel,weight});}return {id:'TC'+Math.ceil(level/3)*3,level,entries};}
function weighted(rng,list){let n=rng()*list.reduce((s,i)=>s+i.weight,0);for(const entry of list){n-=entry.weight;if(n<0)return entry;}return list.at(-1);}
export function chooseTreasureBase(rng,tc){const slots=[...new Set(tc.entries.map(e=>e.base.slot))],slot=weighted(rng,slots.map(id=>({id,weight:slotWeights[id]||1}))).id,eligible=tc.entries.filter(e=>e.base.slot===slot);return weighted(rng,eligible.map(e=>({...e,weight:e.weight*(e.base.id==='leather'&&tc.level<5?5:1)})));}
export function effectiveMagicFind(mf,quality){mf=clamp(mf,0,10000);const cap={legendary:250,set:500,rare:600}[quality];return cap?mf*cap/(mf+cap):mf;}
export function matchingSets(entry,level){return ITEM_SETS.filter(s=>level>=s.minDepth*2&&SET_SLOTS.includes(entry.base.slot)&&({armor:s.look,helm:s.helm,weapon:s.weapon,shield:'kite',gloves:s.look==='plate'?'steel':'leather',boots:s.look==='plate'?'steel':'leather'})[entry.base.slot]===entry.base.look);}
export function rollTreasureQuality(rng,{level=1,magicFind=0,boss=false,elite=false,canSet=false,category='equipment'}={}){
 // Currency/runes and charm-family drop chances are decided upstream, never by MF.
 const mf=category==='equipment'?magicFind:0,boost=boss?2:elite?1.25:1;
 const chances=[['legendary',level>=12?.0005*boost:0],['set',canSet?.008*boost:0],['rare',(level<12?.008:level<20?.08:.11)*boost],['magic',.26]];
 for(const [quality,chance]of chances)if(rng()<Math.min(.95,chance*(1+effectiveMagicFind(mf,quality)/100)))return quality;return 'normal';
}
export function rollTreasureItem(rng,{monsterLevel=1,magicFind=0,boss=false,elite=false}={}){
 const level=Math.max(1,Math.floor(monsterLevel)),tc=treasureClass(level),entry=chooseTreasureBase(rng,tc),sets=matchingSets(entry,level),rarity=rollTreasureQuality(rng,{level,magicFind,boss,elite,canSet:sets.length>0});
 const power=level<=11?actOneLootLevel(level):level;let item;
 if(rarity==='set'){const set=sets[Math.floor(rng()*sets.length)];item=makeSetItem(set.id,SET_SLOTS.indexOf(entry.base.slot),power);item.base=entry.base.id;item.baseName=entry.base.name;item.baseTier=entry.tier;}
 else item=createRelic(rng,power,false,{base:entry.base,rarity,baseTier:entry.tier});
 item.treasureClass=tc.id;item.monsterLevel=level;item.baseTreasureLevel=entry.requiredLevel;return item;
}
export function rollMonsterLoot(rng,enemy,{players=1,nearbyParty=0,magicFind=0}={}){
 const boss=enemy.type==='warden',elite=!!enemy.elite,level=Math.max(1,enemy.level||1),options={players,nearbyParty,boss,elite};if(rng()<noDropChance(options))return [];
 // Regular monsters make one category pick; champions/bosses have a richer bundle.
 const loot=[];if(boss||elite||rng()<.35)loot.push({x:enemy.x+.2,y:enemy.y,gold:goldReward(level,{boss,elite},rng)});
 if(boss||elite||!loot.length)loot.push({x:enemy.x-.3,y:enemy.y+.3,item:rollTreasureItem(rng,{monsterLevel:level,magicFind,boss,elite})});return loot;
}
export function nearbyLootPopulation(players,killer,enemy){const local=[...players].filter(p=>p.area===killer.area&&p.player.hp>0);return {players:Math.max(1,local.length),nearbyParty:local.filter(p=>p!==killer&&killer.party&&p.party===killer.party&&Math.hypot(p.pos.x-enemy.x,p.pos.y-enemy.y)<30).length};}
