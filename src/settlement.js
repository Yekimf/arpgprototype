import {recordFeat,ensureChronicle} from './achievements.js';
import {discoverSetItems} from './set-items.js';
import {isTwoHanded} from './itemization.js';
import {ensurePassives} from './passive-tree.js';
import {makeInsightScroll,migrateScrolls,isInsightScroll,scrollQuantity,SCROLL_STACK} from './scrolls.js';
import {appraisal,transferGold} from './economy.js';
import {ensureFlask,refillFlask} from './flasks.js';
import {getSkill,generateItem, random, requiresIdentification} from './game.js';

export const BAG={width:12,height:6}, STASH={width:10,height:8};
export const EQUIPMENT={helm:'Head',charm:'Amulet',weapon:'Main hand',armor:'Body armor',shield:'Off hand',gloves:'Hands',belt:'Belt',ring:'Left ring',ring2:'Right ring',boots:'Feet'};
export const AFFIXES={damage:'Weapon damage',armor:'Armour',life:'Life',crit:'Critical chance',bonus:'All damage',spirit:'Spirit',fireResist:'Fire resistance',coldResist:'Cold resistance',lightningResist:'Storm resistance',lifeRegen:'Life regeneration',fireDamage:'Fire damage',flaskGain:'Flask charge recovery',attackRate:'Attack speed',manaRegen:'Mana per second',manaRegenPercent:'Mana regeneration',lifeLeech:'Life leech',manaLeech:'Mana leech',manaOnHit:'Mana gained on hit',skillRanks:'Active skill ranks',spellPower:'Spell power',spellDamage:'Spell damage',coldDamage:'Cold damage',lightningDamage:'Lightning damage',manaCostReduction:'Reduced mana cost',critDamage:'Critical damage',physicalDamage:'Physical damage',block:'Block chance'};
// Shared camp footprint; the campaign places this layout at (+16, +18).
export const TOWN_BOUNDS={x1:16,y1:16,x2:50,y2:51};
export const NPCS=[
  {id:'guide',name:'Sister Maelin',role:'HEALER & GUIDE',x:28,y:27,sprite:1,description:'Keeper of the last light'},
  {id:'merchant',name:'Orrin',role:'PROVISIONS & TRADE',x:25,y:35,sprite:3,description:'A fair price for a hard road'},
  {id:'smith',name:'Garran',role:'BLACKSMITH & REFORGING',x:40,y:29,sprite:3,description:'What breaks can be made stronger'},
  {id:'scholar',name:'Edrin',role:'ARCHIVIST · IDENTIFICATION',x:36.5,y:41,sprite:2,description:'Every relic remembers'},
];
export const SLOT_ART={weapon:4,armor:6,helm:7,gloves:8,boots:9,belt:10,ring:11,charm:12,shield:13};
export function itemSize(item){
  if(item.width&&item.height)return {w:item.width,h:item.height};
  return ({weapon:{w:/axe|mace/i.test(item.name)?2:1,h:3},armor:{w:2,h:3},shield:{w:2,h:3},helm:{w:2,h:2},gloves:{w:2,h:2},boots:{w:2,h:2},belt:{w:2,h:1},charm:{w:1,h:1},ring:{w:1,h:1}})[item.slot]||{w:1,h:1};
}
export const itemName=item=>requiresIdentification(item)?`Unidentified ${EQUIPMENT[item.slot]||'relic'}`:item.name;
export const itemValue=appraisal;
export const buyPrice=item=>item.price??itemValue(item)*3;
export function cellsFree(items,item,x,y,dimensions=BAG,ignoreId=item.id){
  const {w,h}=itemSize(item);
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+w>dimensions.width||y+h>dimensions.height)return false;
  return !items.some(other=>{
    if(other.id===ignoreId||other.bagX<0||other.bagY<0||other.bagX===undefined)return false;
    const size=itemSize(other);return x<other.bagX+size.w&&x+w>other.bagX&&y<other.bagY+size.h&&y+h>other.bagY;
  });
}
export function findSpace(items,item,dimensions=BAG){
  for(let y=0;y<dimensions.height;y++)for(let x=0;x<dimensions.width;x++)if(cellsFree(items,item,x,y,dimensions))return {x,y};
  return null;
}
export function addToContainer(items,item,dimensions=BAG){
  if(isInsightScroll(item)){
    let left=scrollQuantity(item);const merges=[],trial=[...items],newStacks=[];
    for(const stack of items.filter(isInsightScroll)){const n=Math.min(left,SCROLL_STACK-scrollQuantity(stack));if(n>0){merges.push([stack,n]);left-=n;}}
    while(left){const n=Math.min(left,SCROLL_STACK),stack={...item,id:newStacks.length?makeInsightScroll().id:item.id,quantity:n},spot=findSpace(trial,stack,dimensions);if(!spot)return false;Object.assign(stack,{bagX:spot.x,bagY:spot.y});newStacks.push(stack);trial.push(stack);left-=n;}
    for(const [stack,n] of merges)stack.quantity=scrollQuantity(stack)+n;
    for(let i=0;i<newStacks.length;i++){const stack=newStacks[i];if(!i){Object.assign(item,stack);items.push(item);}else items.push(stack);}return true;
  }
  const spot=findSpace(items,item,dimensions);if(!spot)return false;
  item.bagX=spot.x;item.bagY=spot.y;items.push(item);return true;
}
export function arrange(items,dimensions=BAG,sort=false){
  if(sort)items.sort((a,b)=>{const sa=itemSize(a),sb=itemSize(b);return sb.w*sb.h-sa.w*sa.h||a.slot.localeCompare(b.slot);});
  const placed=[];
  for(const item of items){
    if(sort||!cellsFree(placed,item,item.bagX,item.bagY,dimensions)){
      const spot=findSpace(placed,item,dimensions);item.bagX=spot?.x??-1;item.bagY=spot?.y??-1;
    }
    placed.push(item);
  }
  return items.filter(i=>i.bagX<0).length;
}
export function migratePlayer(player){
  ensureChronicle(player);discoverSetItems(player);ensurePassives(player);player.skillMods??={};player.dungeonGeneration??=0;
  player.sex='male';
  const legacy=player.progressionVersion!==2;
  player.slots=Array.from({length:4},(_,i)=>player.slots?.[i]??null);
  if(legacy&&player.slots.includes('lance'))player.skills.lance??=1;
  player.mouseSkill??=legacy?'bolt':'basic';
  player.primarySkill??='basic';
  if(player.primarySkill!=='basic'&&(!getSkill(player.primarySkill)?.active||!player.skills[player.primarySkill]))player.primarySkill='basic';
  player.attributes??={might:0,vitality:0,will:0,dexterity:0};player.attributePoints??=Math.max(0,(player.level-1)*5);player.name??='The Loyalist';
  player.bankGold=Math.max(0,Math.floor(player.bankGold||0));player.goldEarned??=0;player.stash??=[];player.shards??=0;migrateScrolls(player);player.buyback??=[];
  player.quests={guideMet:false,scholarRescued:false,wardenDefeated:false,guideRewarded:false,...player.quests};
  for(const slot of Object.keys(EQUIPMENT))player.equipment[slot]??=null;
  for(const item of [...player.inventory,...player.stash,...Object.values(player.equipment).filter(Boolean)]){
    item.id??=`legacy-${Math.random().toString(36).slice(2)}`;
    item.durability??=100;if(!['magic','rare','legendary','set'].includes(item.rarity))item.identified=true;item.identified??=true;item.reforges??=0;
  }
  ensureFlask(player);arrange(player.inventory);arrange(player.stash,STASH);return player;
}
function result(ok,message,extra={}){return {ok,message,...extra};}
export function equipItem(player,id,targetSlot=null){
  const index=player.inventory.findIndex(i=>i.id===id),item=player.inventory[index];
  if(!item)return result(false,'Choose an item first.');
  if(!Object.hasOwn(EQUIPMENT,item.slot))return result(false,item.slot==='scroll'?'Right click a scroll, then choose an unidentified item.':'This quest item cannot be equipped.');
  if(requiresIdentification(item))return result(false,'Identify this relic before equipping it.');
  if(item.requiredLevel>player.level)return result(false,`Requires level ${item.requiredLevel}.`);
  const slot=targetSlot||((item.slot==='ring'&&player.equipment.ring&&!player.equipment.ring2)?'ring2':item.slot);
  if(slot!==item.slot&&!(item.slot==='ring'&&slot==='ring2'))return result(false,'That item belongs in a different slot.');
  const conflicts=[];if(player.equipment[slot])conflicts.push({slot,item:player.equipment[slot]});
  if(slot==='weapon'&&isTwoHanded(item)&&player.equipment.shield)conflicts.push({slot:'shield',item:player.equipment.shield});
  if(slot==='shield'&&isTwoHanded(player.equipment.weapon))conflicts.push({slot:'weapon',item:player.equipment.weapon});
  const remaining=player.inventory.filter(i=>i.id!==id),placements=[];
  for(const conflict of conflicts){const spot=findSpace(remaining,conflict.item);if(!spot)return result(false,'Make space in your pack for equipment displaced by this item.');placements.push({...conflict,spot});remaining.push({...conflict.item,bagX:spot.x,bagY:spot.y});}
  player.inventory.splice(index,1);for(const {slot:oldSlot,item:old,spot}of placements){player.equipment[oldSlot]=null;old.bagX=spot.x;old.bagY=spot.y;player.inventory.push(old);}player.equipment[slot]=item;
  return result(true,`${item.name} equipped.`);
}
export function unequipItem(player,slot){
  const item=player.equipment[slot];if(!item)return result(false,'That equipment slot is empty.');
  if(!addToContainer(player.inventory,item))return result(false,'No room in your pack.');
  player.equipment[slot]=null;return result(true,`${item.name} moved to your pack.`);
}
export function moveItem(player,id,toStash){
  const source=toStash?player.inventory:player.stash,target=toStash?player.stash:player.inventory;
  const index=source.findIndex(i=>i.id===id),item=source[index];if(!item)return result(false,'Item not found.');
  if(!addToContainer(target,item,toStash?STASH:BAG))return result(false,toStash?'Your stash is full.':'Your pack is full.');
  source.splice(index,1);return result(true,toStash?'Item stored safely.':'Item returned to your pack.');
}
export function identifyItem(player,id,scholar=false,scrollId=null){
  migrateScrolls(player);arrange(player.inventory);
  const item=player.inventory.find(i=>i.id===id);if(!item||!requiresIdentification(item))return result(false,'Choose an unidentified item.');
  if(scholar&&!player.quests.scholarRescued)return result(false,'Edrin is still trapped beneath the monastery.');
  const scroll=player.inventory.find(i=>isInsightScroll(i)&&(!scrollId||i.id===scrollId));
  if(!scholar&&!scroll)return result(false,'You need a scroll of insight in your pack. Orrin sells them.');
  if(!scholar){if(scrollQuantity(scroll)>1)scroll.quantity=scrollQuantity(scroll)-1;else player.inventory.splice(player.inventory.indexOf(scroll),1);}item.identified=true;recordFeat(player,'identified');return result(true,`${item.name} revealed.`);
}
export function identifyAll(player){
  if(!player.quests.scholarRescued)return result(false,'Rescue the archivist to unlock identification.');
  const items=player.inventory.filter(i=>requiresIdentification(i));if(!items.length)return result(false,'No unidentified relics in your pack.');
  items.forEach(i=>i.identified=true);recordFeat(player,'identified',items.length);return result(true,`${items.length} relic${items.length===1?'':'s'} identified. No charge.`);
}
export function generateStock(level=1,seed=791){
  const rng=random(seed),stock=[];
  for(let i=0;i<9;i++){
    const item=generateItem(rng,Math.max(1,Math.ceil(level/2)),i===8);
    item.identified=true;item.durability=100;item.id=`shop-${seed}-${i}`;item.price=itemValue(item)*3;stock.push(item);
  }
  return stock;
}
export function buyItem(player,index){
  const item=player.shopStock?.[index];if(!item)return result(false,'That item is no longer available.');
  const price=buyPrice(item);if(player.gold<price)return result(false,`You need ${price} gold.`);
  if(!addToContainer(player.inventory,item))return result(false,'No room in your pack.');
  player.gold-=price;player.shopStock.splice(index,1);delete item.price;return result(true,`${item.name} purchased.`);
}
export function sellItem(player,id){
  const index=player.inventory.findIndex(i=>i.id===id),item=player.inventory[index];if(!item)return result(false,'Choose an item from your pack.');if(item.quest)return result(false,'Quest items cannot be sold or salvaged.');
  if(item.favorite)return result(false,'Unmark this keepsake before selling it.');
  const price=itemValue(item);player.gold+=price;player.inventory.splice(index,1);player.buyback.unshift({...item,price});player.buyback=player.buyback.slice(0,8);
  return result(true,`Sold for ${price} gold.`);
}
export function buyBack(player,index){
  const item=player.buyback[index];if(!item)return result(false,'Item is no longer available.');
  if(player.gold<item.price)return result(false,'Not enough gold.');
  if(!addToContainer(player.inventory,item))return result(false,'No room in your pack.');
  player.gold-=item.price;player.buyback.splice(index,1);delete item.price;return result(true,'Item bought back.');
}
export function buySupply(player,type){
  const cost=type==='flask'?8:12;if(player.gold<cost)return result(false,`You need ${cost} gold.`);
  if(type==='flask'&&ensureFlask(player).charges>=100)return result(false,'Your flask is already full.');
  if(type!=='flask'&&!addToContainer(player.inventory,makeInsightScroll()))return result(false,'Make one cell of room in your pack.');
  player.gold-=cost;if(type==='flask')refillFlask(player,20);
  return result(true,type==='flask'?'20 flask charges restored.':'Scroll of insight purchased.');
}
export function salvageItem(player,id){
  const index=player.inventory.findIndex(i=>i.id===id),item=player.inventory[index];if(!item)return result(false,'Choose an item from your pack.');if(item.quest)return result(false,'Quest items cannot be sold or salvaged.');if(item.consumable)return result(false,'Scrolls cannot be salvaged.');
  if(item.favorite)return result(false,'Unmark this keepsake before salvaging it.');
  const shards={normal:1,magic:1,rare:2,legendary:4}[item.rarity]||1;
  player.shards+=shards;player.inventory.splice(index,1);return result(true,`Salvaged into ${shards} ember shard${shards===1?'':'s'}.`);
}
export function reforgeCost(item){return {gold:25+(item.level||1)*10+(item.reforges||0)*20,shards:item.rarity==='legendary'?3:item.rarity==='rare'?2:1};}
export function reforgeAffixes(item){
  if(Array.isArray(item.affixes))return [...new Set(item.affixes.map(a=>a.stat))].filter(k=>AFFIXES[k]&&item[k]>0);
  return Object.keys(AFFIXES).filter(k=>!['damage','armor'].includes(k)&&item[k]>0&&!(k==='spirit'&&item.slot==='charm')&&!(k==='crit'&&item.slot==='ring'));
}
export function reforgeItem(player,id,affix,rng=Math.random){
  const item=[...player.inventory,...Object.values(player.equipment).filter(Boolean)].find(i=>i.id===id);
  if(!item)return result(false,'Choose an item first.');
  if(requiresIdentification(item))return result(false,'Identify this item before reforging it.');
  if(!reforgeAffixes(item).includes(affix))return result(false,'Choose a magical property to reroll.');
  const cost=reforgeCost(item);if(player.gold<cost.gold||player.shards<cost.shards)return result(false,`Reforging needs ${cost.gold} gold and ${cost.shards} ember shards.`);
  const old=item[affix],metadata=item.affixes?.find(a=>a.stat===affix),baseValue=metadata?old-metadata.value:0,scale=(1+(item.level||1)*.18)*({normal:1,magic:1.35,rare:1.8,legendary:2.5}[item.rarity]||1);
  const range=affix==='life'?[5,22]:affix==='crit'?[1,5]:affix==='bonus'?[2,9]:affix==='lifeRegen'?[.5,1.8]:affix==='attackRate'?[2,8]:[5,18];
  const precision=affix==='lifeRegen'?100:1,min=metadata?.min!==undefined?Math.round(metadata.min*precision):Math.max(1,Math.round(range[0]*scale*precision)),max=metadata?.max!==undefined?Math.round(metadata.max*precision):Math.round(range[1]*scale*precision);
  let next=Math.round(min+rng()*(max-min));if(next===Math.round((metadata?.value??old)*precision))next=next<max?next+1:Math.max(min,next-1);next/=precision;
  player.gold-=cost.gold;player.shards-=cost.shards;item[affix]=Math.round((baseValue+next)*100)/100;const roll=item.affixes?.find(a=>a.stat===affix);if(roll)roll.value=next;item.reforges=(item.reforges||0)+1;item.durability=100;recordFeat(player,'reforges');
  return result(true,`${AFFIXES[affix]} reforged: ${old} → ${item[affix]}.`,{old,value:item[affix]});
}
export function repairCost(player){return Object.values(player.equipment).filter(i=>i&&i.durability<100).reduce((sum,i)=>sum+Math.ceil((100-i.durability)*.55)+2,0);}
export function repairAll(player){
  const cost=repairCost(player);if(!cost)return result(false,'Your equipment is in perfect condition.');
  if(player.gold<cost)return result(false,`Repairs cost ${cost} gold.`);
  player.gold-=cost;Object.values(player.equipment).filter(Boolean).forEach(i=>i.durability=100);return result(true,'All equipped items repaired.');
}
export function acceptGuideQuest(player){
  if(player.quests.guideMet)return result(false,'Break the Kingsroad patrols, breach Marchgate, and follow the grain levy’s road into Blackthorn Hollow.');
  const gift={id:'maelin-talisman',name:'Hearthbound Talisman',slot:'charm',rarity:'magic',level:1,spirit:8,life:6,identified:false,durability:100,reforges:0,icon:'◈'};
  const trial=player.inventory.map(i=>({...i})),gifts=[gift,makeInsightScroll(2)];
  for(const item of gifts)if(!addToContainer(trial,item))return result(false,'Make room for the talisman and a stack of two scrolls.');
  player.inventory.splice(0,player.inventory.length,...trial);player.quests.guideMet=true;player.gold+=50;player.shards+=2;
  return result(true,'A promise made · +50 gold, 2 shards, 2 scrolls, and a mysterious talisman.');
}
export function claimGuideReward(player){
  if(!player.quests.wardenDefeated||player.quests.guideRewarded)return result(false,'Return after defeating Aldren at his redoubt.');
  player.quests.guideRewarded=true;player.gold+=120;player.shards+=3;return result(true,'The debt is paid · +120 gold and 3 ember shards. Edrin awaits you in town.');
}
export function generateTown(player){
  const size=64,tiles=Array.from({length:size},()=>Array(size).fill(0));
  for(let y=TOWN_BOUNDS.y1;y<=TOWN_BOUNDS.y2;y++)for(let x=TOWN_BOUNDS.x1;x<=TOWN_BOUNDS.x2;x++)tiles[y][x]=1;
  const props=[
    {type:'building',sprite:8,x:41,y:25.5,width:235,height:220},
    {type:'building',sprite:9,x:25,y:22.5,width:220,height:210},
    {type:'building',sprite:10,x:21,y:34,width:215,height:210},
    {type:'building',sprite:11,x:43,y:43,width:225,height:220},
    {type:'building',sprite:12,x:38,y:28,width:100,height:115},
    {type:'building',sprite:13,x:36.5,y:37.5,width:95,height:90,stash:true},
    {type:'building',sprite:15,x:32.5,y:16.5,width:170,height:160,exit:true},
  ];
  for(const [x,y]of[[17,23],[17,44],[25,50],[44,18],[49,30],[48,49],[19,18]])props.push({type:'building',sprite:7,x,y,width:160,height:190});
  for(const [x,y]of[[29,28],[39,30],[26,36],[33,19],[38,42],[32,40]])props.push({type:'brazier',x,y,variant:1});
  // Buildings occupy terrain; walk routes stay in front of entrances.
  for(const b of props.filter(p=>p.type==='building'&&!p.stash&&!p.exit&&p.sprite!==7)){
    const radius=b.sprite===12?.4:1.2;
    for(let y=Math.floor(b.y-radius);y<=b.y+radius;y++)for(let x=Math.floor(b.x-radius);x<=b.x+radius;x++)if(tiles[y]?.[x])tiles[y][x]=0;
  }
  const seen=new Set();for(let y=0;y<size;y++)for(let x=0;x<size;x++)seen.add(y*size+x);
  return {size,seed:7901,tiles,rooms:[],start:{x:32,y:32.5},portal:{x:32.5,y:17.5},enemies:[],props,depth:0,seen,bossDead:false,town:true,npcs:NPCS.filter(n=>n.id!=='scholar'||player.quests.scholarRescued).map(n=>({...n}))};
}

export function temperItem(player,id){const item=[...player.inventory,...Object.values(player.equipment).filter(Boolean)].find(i=>i.id===id);if(!item||requiresIdentification(item))return result(false,'Choose identified equipment.');const stat=item.damage?'damage':item.armor?'armor':null;if(!stat)return result(false,'Only weapons and armour can be tempered.');const quality=item.quality||0;if(quality>=20)return result(false,'This item is already masterfully tempered.');const gold=18+Math.ceil(item.level||1)*8;if(player.gold<gold||player.shards<1)return result(false,`Tempering needs ${gold} gold and 1 ember.`);const bonus=(item.affixes||[]).filter(a=>a.stat===stat).reduce((n,a)=>n+a.value,0),base=(item[stat]-bonus)/(1+quality/100),next=Math.min(20,quality+5);item[stat]=Math.round(base*(1+next/100))+bonus;item.quality=next;item.durability=100;player.gold-=gold;player.shards--;return result(true,`Tempered to ${next}% quality. Durability restored.`);}
export function bankTransfer(player,direction,amount){return transferGold(player,direction,amount);}

export function restockCost(player){return 30+player.level*5;}
export function restockShop(player,seed=Math.floor(Math.random()*1e9)){const cost=restockCost(player);if(player.gold<cost)return result(false,`Restocking needs ${cost} gold.`);const stock=generateStock(player.level,seed);player.gold-=cost;player.shopStock=stock;return result(true,'Fresh equipment, selected for your level.');}
