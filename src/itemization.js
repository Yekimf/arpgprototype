import {ITEM_SETS} from './set-items.js';
// Item families drive both combat statistics and visible equipment layers.
export const BASES=[
 {id:'sword',name:'Falchion',slot:'weapon',look:'sword',art:4,damage:[5,9],reach:1.85,attackSpeed:1},
 {id:'axe',name:'War Axe',slot:'weapon',look:'axe',art:5,damage:[7,12],reach:1.7,attackSpeed:.88},
 {id:'mace',name:'Flanged Mace',slot:'weapon',look:'mace',art:15,damage:[8,13],reach:1.65,attackSpeed:.82},
 {id:'spear',name:'Boar Spear',slot:'weapon',look:'spear',art:4,damage:[5,10],reach:2.65,attackSpeed:.92},
 {id:'dagger',name:'Rondel Dagger',slot:'weapon',look:'dagger',weaponIcon:2,art:4,damage:[3,6],reach:1.3,attackSpeed:1.4},
 {id:'greatsword',name:'Greatsword',slot:'weapon',look:'greatsword',twoHanded:true,weaponIcon:1,art:4,damage:[11,17],reach:2.4,attackSpeed:.72,width:2,height:4},
 {id:'warhammer',name:'Maul',slot:'weapon',look:'warhammer',twoHanded:true,weaponIcon:4,art:15,damage:[12,18],reach:1.85,attackSpeed:.68,width:2,height:3},
 {id:'flail',name:'Iron Flail',slot:'weapon',look:'flail',weaponIcon:6,art:15,damage:[6,13],reach:2.1,attackSpeed:.95,width:2,height:3},
 {id:'staff',name:'Ashwood Staff',slot:'weapon',look:'staff',twoHanded:true,weaponIcon:8,art:4,damage:[4,7],spellPower:[8,14],spirit:[9,16],reach:2.4,attackSpeed:.9,width:1,height:4},
 {id:'wand',name:'Bone Wand',slot:'weapon',look:'wand',weaponIcon:10,art:4,damage:[3,6],spellPower:[7,12],spirit:[6,12],reach:7,attackSpeed:1.1,ranged:'aether'},
 {id:'crystal-wand',name:'Crystal Wand',slot:'weapon',look:'wand',weaponIcon:11,art:4,damage:[4,7],spellPower:[8,13],spirit:[7,13],reach:7,attackSpeed:1,ranged:'cold'},
 {id:'bow',name:'Yew Longbow',slot:'weapon',look:'bow',twoHanded:true,weaponIcon:12,art:4,damage:[5,9],reach:8,attackSpeed:1.05,ranged:'physical',width:2,height:4},
 {id:'crossbow',name:'Hunting Crossbow',slot:'weapon',look:'crossbow',twoHanded:true,weaponIcon:13,art:4,damage:[9,14],reach:8,attackSpeed:.72,ranged:'physical',width:2,height:3},
 {id:'iron-staff',name:'Iron-shod Staff',slot:'weapon',look:'staff',twoHanded:true,weaponIcon:9,art:4,damage:[5,9],spellPower:[10,15],spirit:[8,14],reach:2.4,attackSpeed:.85,width:1,height:4},
 {id:'battleaxe',name:'Battle Axe',slot:'weapon',look:'axe',twoHanded:true,weaponIcon:14,art:5,damage:[10,15],reach:2.1,attackSpeed:.78,width:2,height:3},
 {id:'ritual-scepter',name:'Ritual Sceptre',slot:'weapon',look:'wand',weaponIcon:15,art:4,damage:[3,6],spellPower:[9,14],spirit:[6,11],reach:7,attackSpeed:.9,ranged:'aether'},
 {id:'leather',name:'Hardened Jerkin',slot:'armor',look:'leather',art:6,armor:[3,6],evasion:[3,7]},
 {id:'chain',name:'Mail Hauberk',slot:'armor',look:'chain',art:6,armor:[6,10]},
 {id:'plate',name:'Iron Cuirass',slot:'armor',look:'plate',art:6,armor:[9,14],speed:[-.12,-.04]},
 {id:'vestment',name:'Ashen Vestment',slot:'armor',look:'robe',art:6,armor:[2,4],spirit:[8,15]},
 {id:'sallet',name:'Sallet',slot:'helm',look:'sallet',art:7,armor:[2,4]},
 {id:'greathelm',name:'Great Helm',slot:'helm',look:'greathelm',art:7,armor:[4,7]},
 {id:'hood',name:'Pilgrim Hood',slot:'helm',look:'hood',art:7,armor:[1,3],spirit:[4,7]},
 {id:'gloves',name:'Leather Grips',slot:'gloves',look:'leather',art:8,armor:[1,3],attackRate:[2,5]},
 {id:'gauntlets',name:'Steel Gauntlets',slot:'gloves',look:'steel',art:8,armor:[3,5]},
 {id:'boots',name:'Wayfarer Boots',slot:'boots',look:'leather',art:9,speed:[.12,.28]},
 {id:'greaves',name:'Iron Greaves',slot:'boots',look:'steel',art:9,armor:[2,4],speed:[.05,.16]},
 {id:'belt',name:'Soldier’s Girdle',slot:'belt',look:'leather',art:10,life:[6,12]},
 {id:'ring',name:'Iron Signet',slot:'ring',look:'iron',art:11,crit:[1,3]},
 {id:'charm',name:'Sunstone Pendant',slot:'charm',look:'amber',art:12,spirit:[7,13]},
 {id:'buckler',name:'Round Buckler',slot:'shield',look:'round',art:13,armor:[3,6],block:[6,10]},
 {id:'kite',name:'Kite Shield',slot:'shield',look:'kite',art:13,armor:[5,9],block:[10,16]},
];
export const AFFIX_POOL=[
 {id:'stalwart',name:'Stalwart',stat:'life',range:[8,16]},
 {id:'keen',name:'Keen',stat:'crit',range:[1,3]},
 {id:'ferocious',name:'Merciless',stat:'bonus',range:[4,8]},
 {id:'warded',name:'Emberward',stat:'fireResist',range:[8,16]},
 {id:'winter',name:'Winterbound',stat:'coldResist',range:[8,16]},
 {id:'storm',name:'Stormward',stat:'lightningResist',range:[8,16]},
 {id:'renewal',name:'Mending',stat:'lifeRegen',range:[.6,1.4],weight:1.1},
 {id:'devout',name:'Devout',stat:'fireDamage',range:[7,14]},
 {id:'brimming',name:'Brimming',stat:'flaskGain',range:[10,20]},
 {id:'sharp',name:'Honed',stat:'damage',range:[2,5],slots:['weapon']},
 {id:'stout',name:'Reinforced',stat:'armor',range:[2,5],slots:['armor','helm','shield','gloves','boots']},
 {id:'scholar',name:'Insightful',stat:'spirit',range:[6,13]},
 {id:'lucid',name:'Lucid',stat:'manaRegen',range:[.35,.8],weight:1.3},
 {id:'meditative',name:'Contemplative',stat:'manaRegenPercent',range:[12,24],weight:1.5},
 {id:'vampiric',name:'Sanguine',stat:'lifeLeech',range:[.5,1.2],weight:.45,minLevel:3,slots:['weapon','ring','gloves','charm']},
 {id:'siphoning',name:'Siphoning',stat:'manaLeech',range:[.4,.9],weight:.55,minLevel:3,slots:['weapon','ring','charm']},
 {id:'channelled',name:'Channelled',stat:'manaOnHit',range:[.3,.7],weight:.7,slots:['weapon','ring','gloves']},
 {id:'erudite',name:'Erudite',stat:'skillRanks',range:[1,1],weight:.2,minLevel:12,slots:['weapon','helm','charm']},
 {id:'economist',name:'Measured',stat:'manaCostReduction',range:[3,6],weight:.6,minLevel:8},
 {id:'potent',name:'Potent',stat:'spellPower',range:[3,6],weight:2,slots:['weapon','charm']},
 {id:'invoking',name:'Invoker’s',stat:'spellDamage',range:[6,12],weight:2},
 {id:'rime',name:'Rimed',stat:'coldDamage',range:[7,14],weight:2},
 {id:'charged',name:'Stormwrought',stat:'lightningDamage',range:[7,14],weight:2},
 {id:'cruel',name:'Cruel',stat:'critDamage',range:[8,16],weight:1.2,minLevel:5},
 {id:'quick',name:'Deft',stat:'attackRate',range:[3,7]},
];
const precision=stat=>['speed','lifeRegen','manaRegen','lifeLeech','manaLeech','manaOnHit'].includes(stat)?100:1;
const scaled=(n,rng,power,step=1)=>Math.round((n[0]+rng()*(n[1]-n[0]))*power*step)/step;
function weighted(rng,entries){let roll=rng()*entries.reduce((sum,e)=>sum+e[1],0);for(const [value,weight]of entries){roll-=weight;if(roll<0)return value;}return entries.at(-1)[0];}
export function rollItemBase(rng,depth){
 const slot=weighted(rng,depth<=2?[['weapon',24],['armor',32],['helm',11],['shield',10],['gloves',9],['boots',10],['belt',3],['ring',.4],['charm',.25]]:[['weapon',24],['armor',28],['helm',11],['shield',10],['gloves',9],['boots',10],['belt',5],['ring',1.8],['charm',1.2]]);
 let choices=BASES.filter(b=>b.slot===slot);
 if(slot==='armor'){const id=weighted(rng,depth<=2?[['leather',82],['vestment',16],['chain',2]]:depth<=4?[['leather',45],['chain',35],['plate',10],['vestment',10]]:[['leather',20],['chain',30],['plate',35],['vestment',15]]);return BASES.find(b=>b.id===id);}
 if(depth<=2&&['helm','boots','gloves'].includes(slot)){const soft=slot==='helm'?'hood':slot==='boots'?'boots':'gloves';return rng()<.9?BASES.find(b=>b.id===soft):choices[Math.floor(rng()*choices.length)];}
 return choices[Math.floor(rng()*choices.length)];
}
export function lootProbabilities(depth,boss=false){
 const legendary=(depth<12?.0002:depth<20?.0005:.0008)*(boss?2:1),rare=(depth<12?.008:depth<14?.035:depth<20?.08:.11)*(boss?2.5:1),magic=depth<12?.26:.30;
 return {legendary,rare,magic,normal:1-legendary-rare-magic};
}
export function createRelic(rng,depth,guaranteedRare=false){
 const roll=rng(),odds=lootProbabilities(depth,guaranteedRare);let rarity=roll<odds.legendary?'legendary':roll<odds.legendary+odds.rare?'rare':roll<odds.legendary+odds.rare+odds.magic?'magic':'normal';
 if(guaranteedRare&&rarity==='normal')rarity='magic';
 // Select a slot before its base so accessories do not crowd out equipment drops.
 const base=rollItemBase(rng,depth),slot=base.slot,power=1+Math.max(0,depth-1)*.27;
 const item={id:`${Date.now()}-${Math.floor(rng()*1e8)}`,name:base.name,base:base.id,slot,look:base.look,art:base.art,rarity,level:depth,requiredLevel:Math.max(1,Math.floor(depth)),identified:rarity==='normal',durability:100,reforges:0,affixes:[]};
 for(const [key,value] of Object.entries(base))if(Array.isArray(value))item[key]=scaled(value,rng,power,precision(key));
 for(const key of ['weaponIcon','ranged','width','height','twoHanded'])if(base[key]!==undefined)item[key]=base[key];
 if(base.reach)item.reach=base.reach;if(base.attackSpeed)item.attackSpeed=base.attackSpeed;
 item.quality=(item.damage||item.armor)?Math.floor(rng()*(depth<=2?3:6))*2:0;item.baseTier=depth>=5?'elite':depth>=3?'exceptional':'standard';item.baseName=base.name;item.name=(item.baseTier==='elite'?'Royal ':item.baseTier==='exceptional'?'Tempered ':'')+base.name;for(const stat of ['damage','armor'])if(item[stat])item[stat]=Math.round(item[stat]*(1+item.quality/100));
 const pool=AFFIX_POOL.filter(a=>(!a.slots||a.slots.includes(slot))&&depth>=(a.minLevel||1)),count=rarity==='normal'?0:rarity==='magic'?2:rarity==='rare'?4:5;
 for(let i=0;i<count;i++){const selected=weighted(rng,pool.map(a=>[a,a.weight??6])),at=pool.indexOf(selected),affix=pool.splice(at,1)[0],tier=1+Math.floor(rng()*Math.min(5,1+Math.floor(depth/2))),factor=1+(tier-1)*.3,value=scaled(affix.range,rng,factor,precision(affix.stat));item[affix.stat]=(item[affix.stat]||0)+value;item.affixes.push({id:affix.id,stat:affix.stat,value,tier,min:Math.round(affix.range[0]*factor*precision(affix.stat))/precision(affix.stat),max:Math.round(affix.range[1]*factor*precision(affix.stat))/precision(affix.stat),kind:i%2?'suffix':'prefix'});}
 if(rarity==='rare'||rarity==='legendary')item.life=(item.life||0)+Math.round(10*power);
 if(count)item.name=`${AFFIX_POOL.find(a=>a.id===item.affixes[0].id).name} ${item.name}`;
 if(rarity==='legendary'){
  if(slot==='weapon'&&['staff','wand'].includes(base.look)){item.unique='whispering-well';item.name='The Whispering Well';item.manaRegen=(item.manaRegen||0)+2;item.skillRanks=(item.skillRanks||0)+1;item.manaCostReduction=(item.manaCostReduction||0)+10;}
  else if(slot==='weapon'&&['bow','crossbow'].includes(base.id)){item.unique='last-hunt';item.name='The Last Hunt';item.critDamage=(item.critDamage||0)+30;item.manaOnHit=(item.manaOnHit||0)+1;}
  else if(slot==='weapon'&&['greatsword','warhammer','battleaxe'].includes(base.id)){item.unique='kingbreaker';item.name='Kingbreaker';item.physicalDamage=(item.physicalDamage||0)+25;item.bleed=(item.bleed||0)+30;}
  else if(slot==='weapon'){item.unique='royal-blood';item.name='The Royal Blood';item.lifeLeech=(item.lifeLeech||0)+3;item.manaLeech=(item.manaLeech||0)+1;}
  else if(slot==='shield'){item.unique='hollow-aegis';item.name='The Hollow Aegis';item.block=(item.block||0)+12;item.lifeRegen=(item.lifeRegen||0)+2;}
  else if(['ring','charm'].includes(slot)){item.unique='ash-scripture';item.name='Scripture of Ash';item.skillRanks=(item.skillRanks||0)+1;item.manaRegenPercent=(item.manaRegenPercent||0)+35;item.fireDamage=(item.fireDamage||0)+20;}
  else{item.unique=slot==='armor'||slot==='helm'?'ember-vow':'pilgrim-vow';if(item.unique==='ember-vow'){item.name='The Cinderbound Oath';item.fireResist=(item.fireResist||0)+20;item.lifeRegen=(item.lifeRegen||0)+1.5;}else{item.name='The Long Vigil';item.flaskGain=(item.flaskGain||0)+25;item.life=(item.life||0)+20;}}
 }

 return item;
}
export function itemLook(item,slot=item?.slot){if(!item)return 'none';if(item.look)return item.look;if(slot==='armor'&&(item.id==='starter-armor'||item.name==='Weathered Hauberk'))return 'original';const name=item.name?.toLowerCase()||'';return slot==='weapon'?/axe/.test(name)?'axe':/mace|hammer/.test(name)?'mace':/spear|pike/.test(name)?'spear':'sword':slot==='armor'?/vest|robe/.test(name)?'robe':/cuirass|plate|brigand/.test(name)?'plate':/leather|jerkin/.test(name)?'leather':'chain':slot==='helm'?/hood|cowl/.test(name)?'hood':/great|crown/.test(name)?'greathelm':'sallet':slot==='shield'?/kite|tower/.test(name)?'kite':'round':slot==='boots'||slot==='gloves'?/iron|steel|sabat|greave|gaunt/.test(name)?'steel':'leather':'leather';}
export function appearanceOf(p){const out={sex:'male',surcoat:p.appearance||'crimson',twoHanded:isTwoHanded(p.equipment.weapon),setParts:Object.fromEntries(Object.entries(p.equipment).filter(([,i])=>i?.setId&&i.identified!==false).map(([slot,i])=>[slot,ITEM_SETS.findIndex(s=>s.id===i.setId)]))};for(const slot of ['armor','helm','weapon','shield','boots','gloves','belt','charm','ring','ring2']){const item=p.equipment[slot];out[slot]=itemLook(item,slot);if(slot==='weapon'&&item)out.weaponIcon=weaponIconIndex(item);out[slot+'Rarity']=item?.rarity||'none';}return out;}

export function weaponIconIndex(item){return item.weaponIcon??({sword:0,greatsword:1,dagger:2,axe:3,warhammer:4,mace:5,flail:6,spear:7,staff:8,wand:10,bow:12,crossbow:13})[itemLook(item)]??0;}

export const isTwoHanded=item=>!!item&&(item.twoHanded||['greatsword','warhammer','staff','bow','crossbow'].includes(item.look));
