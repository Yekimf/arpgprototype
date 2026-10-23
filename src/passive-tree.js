// Connected disciplines: travel nodes, notables and six mutually costly oaths.
// Independent of combat modules so migration and build inspection share the rules.
export const DISCIPLINES=[
 {id:'steel',name:'The Broken Blade',color:'#b6a17d',stats:[['physicalDamage',5,'Steel discipline'],['attackRate',2,'Measured blows'],['crit',1,'A keen eye']],notables:[['bleed',18,'Open the wound'],['critDamage',14,'The executioner’s hand'],['meleeArea',8,'Reach of the guard']],oath:['razor','Razor Oath','+45% critical damage and +20% physical damage; skills cost 15% more mana.']},
 {id:'cinder',name:'The Ashen Covenant',color:'#b88555',stats:[['fireDamage',5,'Banked embers'],['lifeRegen',.15,'Warmth in the ashes'],['duration',4,'A lingering flame']],notables:[['burnDamage',16,'Slow immolation'],['area',7,'The spreading pyre'],['fireResist',5,'Skin of cinders']],oath:['martyr','Martyr’s Covenant','Pyre self-burning is reduced by 25%; +1 life regeneration/sec, but non-fire damage is reduced by 15%.']},
 {id:'rime',name:'The Silent Choir',color:'#90aaa8',stats:[['coldDamage',5,'A winter’s breath'],['chillEffect',4,'Bitter ground'],['maxManaPercent',2,'Still waters']],notables:[['chilledDamage',10,'Brittle flesh'],['area',7,'The empty nave'],['coldResist',5,'Rimebound skin']],oath:['permafrost','Permafrost','Hits against chilled enemies deal 25% more damage; fire damage is reduced by 25%.']},
 {id:'storm',name:'The Fractured Spire',color:'#b2aa88',stats:[['lightningDamage',5,'Conductive scars'],['crit',1,'A storm’s eye'],['manaOnHit',.15,'A stolen spark']],notables:[['shockEffect',5,'Lingering thunder'],['chainDamage',9,'The broken circuit'],['lightningResist',5,'Storm-tempered']],oath:['circuit','Storm Circuit','Storm Thread gains 2 jumps and shock lasts twice as long; life regeneration is halved.']},
 {id:'blood',name:'The Long Vigil',color:'#ac7967',stats:[['maxHpPercent',3,'The stubborn heart'],['lifeRegen',.15,'Mended flesh'],['armorPercent',5,'The last shield']],notables:[['lifeLeech',.5,'Blood tithe'],['block',2,'The unbroken wall'],['lifeOnKill',2,'Another dawn']],oath:['covenant','Crimson Conduit','+3% attack life leech and +20% maximum life; mana regeneration is reduced by 30%.']},
 {id:'well',name:'The Hollow Well',color:'#8f9eae',stats:[['maxManaPercent',3,'A deeper vessel'],['manaRegenPercent',6,'Quiet contemplation'],['spellDamage',4,'The remembered word']],notables:[['manaCostReduction',3,'Careful incantation'],['skillRanks',1,'A forbidden lesson'],['manaLeech',.4,'Siphoned thought']],oath:['reservoir','Living Reservoir','+40% maximum mana and +20% spell damage; attack life leech no longer works.']}
];
export const PASSIVE_NODES=[{id:'root',name:'The Loyalist',x:0,y:0,links:[],kind:'root',description:'Your oath is the starting point. One passive point is earned each level.'}];
for(let arm=0;arm<DISCIPLINES.length;arm++){
 const d=DISCIPLINES[arm],angle=arm*Math.PI/3-Math.PI/2;
 for(let depth=1;depth<=10;depth++)for(let lane=-1;lane<=1;lane++){
  const notable=depth%3===0,entry=(notable?d.notables:d.stats)[lane+1],id=`${d.id}-${depth}-${lane+1}`,r=80+depth*55,side=lane*(25+depth*4),links=[depth===1?'root':`${d.id}-${depth-1}-${lane+1}`];
  if(lane>-1)links.push(`${d.id}-${depth}-${lane}`);
  PASSIVE_NODES.push({id,name:entry[2]+(notable?'':' '+depth),discipline:d.id,color:d.color,x:Math.cos(angle)*r-Math.sin(angle)*side,y:Math.sin(angle)*r+Math.cos(angle)*side,links,kind:notable?'notable':'minor',stats:{[entry[0]]:entry[1]},description:`+${entry[1]}${['lifeRegen','manaOnHit','lifeOnKill','skillRanks'].includes(entry[0])?'':'%'} ${statLabel(entry[0])}.`,depth});
 }
 const [flag,name,description]=d.oath;
 PASSIVE_NODES.push({id:d.id+'-oath',name,description,discipline:d.id,color:d.color,x:Math.cos(angle)*715,y:Math.sin(angle)*715,links:[`${d.id}-10-1`],kind:'keystone',flag,stats:{}});
}
// Outer constellations preserve every original node ID and saved allocation.
export const CONSTELLATIONS=[];
const CROWNS=[
 ['procession-lord','Lord of the Procession','Procession lasts 50% longer and deals 25% more damage; it costs 20% more mana.'],
 ['twin-suns','Twin Suns','The Falling Sun calls one additional sun; each deals 25% less damage and the cast costs 30% more mana.'],
 ['winter-heart','Heart of Winter','Frost Nova has 50% more area and Rime Lance fires two additional projectiles; both deal 20% less damage and cost 25% more mana.'],
 ['ruin-choir','Choirmaster of Ruin','Choir of Ruin calls four extra bolts at 20% less damage each; Storm Thread gains two jumps.'],
 ['undying','The Undying Watch','+20% maximum life and +1 life regeneration/sec; 15% less maximum mana.'],
 ['archivist','The Last Archivist','+1 rank to learned skills and 30% more spell damage; all skills cost 20% more mana.']
];
const THEMES=[
 [['Headsman’s Court',{physicalDamage:12,critDamage:12}],['The Red Harvest',{bleed:12,lifeLeech:.6}],['Sword Procession',{meleeArea:10,attackRate:4}]],
 [['The Funeral Pyre',{fireDamage:12,burnDamage:16}],['Ashen Sanctuary',{lifeRegen:.35,fireResist:4}],['The Falling Sun',{area:10,spellDamage:10}]],
 [['The Frozen Hour',{coldDamage:12,duration:6}],['Winter’s Teeth',{chilledDamage:12,critDamage:12}],['The Silent Lake',{maxManaPercent:5,manaRegenPercent:10}]],
 [['The Broken Firmament',{lightningDamage:12,shockEffect:6}],['The Storm Choir',{chainDamage:12,area:8}],['Borrowed Lightning',{manaOnHit:.3,attackRate:4}]],
 [['The Last Bastion',{maxHpPercent:5,armorPercent:12}],['The Blood Orchard',{lifeLeech:.6,lifeOnKill:3}],['The Vigil Unending',{lifeRegen:.35,block:2}]],
 [['The Endless Vessel',{maxManaPercent:6,manaRegenPercent:10}],['The Forbidden Word',{spellDamage:12,critDamage:12}],['The Measured Rite',{manaCostReduction:3,duration:8}]]
];
for(let arm=0;arm<6;arm++){
 const d=DISCIPLINES[arm],a=arm*Math.PI/3-Math.PI/2,cx=Math.cos(a)*1040,cy=Math.sin(a)*1040;
 for(let cluster=0;cluster<3;cluster++){
  const [title,rewards]=THEMES[arm][cluster],petal=a+cluster*Math.PI*2/3,px=cx+Math.cos(petal)*122,py=cy+Math.sin(petal)*122;
  CONSTELLATIONS.push({name:title,x:px,y:py,color:d.color});
  for(let step=0;step<15;step++){
   const notable=step%5===4,theta=a+Math.PI+step*Math.PI*2/15,entry=d.stats[step%3],stats=notable?rewards:{[entry[0]]:entry[1]},id=`${d.id}-constellation-${cluster}-${step}`;
   const links=step?[`${d.id}-constellation-${cluster}-${step-1}`]:[d.id+'-oath'];if(step===14)links.push(`${d.id}-constellation-${cluster}-0`);
   PASSIVE_NODES.push({id,name:notable?title+' · '+['I','II','III'][Math.floor(step/5)]:entry[2],discipline:d.id,color:d.color,x:px+Math.cos(theta)*73,y:py+Math.sin(theta)*73,links,kind:notable?'notable':'minor',stats,description:Object.entries(stats).map(([k,v])=>`+${v}${['lifeRegen','manaOnHit','lifeOnKill','skillRanks'].includes(k)?'':'%'} ${statLabel(k)}`).join('; ')+'.'});
  }
 }
 const [flag,crownName,crownDescription]=CROWNS[arm];
 PASSIVE_NODES.push({id:d.id+'-crown',name:crownName,kind:'keystone',flag,color:d.color,discipline:d.id,x:Math.cos(a)*1370,y:Math.sin(a)*1370,links:[0,1,2].map(k=>`${d.id}-constellation-${k}-14`),stats:{},description:crownDescription});
 const next=DISCIPLINES[(arm+1)%6],mid=a+Math.PI/6;
 PASSIVE_NODES.push({id:d.id+'-bridge',name:['Tempered in Ash','The Thawing Pyre','Winter Lightning','The Living Storm','Blood and Memory','The Runebound Blade'][arm],kind:'notable',color:d.color,x:Math.cos(mid)*790,y:Math.sin(mid)*790,links:[d.id+'-oath',next.id+'-oath'],stats:{[d.stats[0][0]]:10,[next.stats[0][0]]:10},description:`A cross-discipline passage: +10% ${statLabel(d.stats[0][0])}; +10% ${statLabel(next.stats[0][0])}. Connects two oaths.`});
}
const NODE_MAP=new Map(PASSIVE_NODES.map(n=>[n.id,n]));
export function statLabel(key){return ({physicalDamage:'physical damage',attackRate:'attack and cast speed',crit:'critical chance',critDamage:'critical damage',bleed:'physical hit damage dealt again as bleeding over 3 seconds',meleeArea:'melee area',fireDamage:'fire damage',duration:'skill and ailment duration',burnDamage:'burning damage',lifeRegen:'life regenerated/sec',fireResist:'fire resistance',area:'area of effect',coldDamage:'cold damage',chillEffect:'chill effectiveness',maxManaPercent:'maximum mana',chilledDamage:'damage against chilled enemies',coldResist:'cold resistance',lightningDamage:'lightning damage',manaOnHit:'mana gained per direct hit',shockEffect:'shock effectiveness',chainDamage:'chain damage',lightningResist:'lightning resistance',maxHpPercent:'maximum life',armorPercent:'armour',lifeLeech:'attack damage leeched as life',block:'block chance',lifeOnKill:'life gained on kill',manaRegenPercent:'mana regeneration',spellDamage:'spell damage',manaCostReduction:'reduced mana cost',skillRanks:'rank to learned active skills (does not unlock skills)',manaLeech:'direct damage leeched as mana'})[key]||key;}
export function ensurePassives(p){p.passives??=[];p.passives=[...new Set(p.passives)].filter(id=>NODE_MAP.has(id)&&id!=='root');if(p.passiveVersion!==1||!Number.isFinite(p.passivePoints))p.passivePoints=Math.max(Number(p.passivePoints)||0,(p.level||1)-1-p.passives.length,0);p.passiveVersion=1;return p;}
export function passiveEffects(p){const out={flags:new Set()};for(const id of p.passives||[]){const n=NODE_MAP.get(id);if(!n)continue;if(n.flag)out.flags.add(n.flag);for(const [key,value]of Object.entries(n.stats||{}))out[key]=(out[key]||0)+value;}return out;}
const NEIGHBOURS=new Map(PASSIVE_NODES.map(n=>[n.id,new Set()]));for(const n of PASSIVE_NODES)for(const id of n.links){NEIGHBOURS.get(n.id).add(id);NEIGHBOURS.get(id).add(n.id);}
export function passiveNeighbours(id){return [...(NEIGHBOURS.get(id)||[])];}
export function canAllocate(p,id,testing=false){const n=NODE_MAP.get(id);return !!n&&id!=='root'&&!(p.passives||[]).includes(id)&&(testing||p.passivePoints>0)&&passiveNeighbours(id).some(k=>k==='root'||p.passives?.includes(k));}
export function allocatePassive(p,id,testing=false){ensurePassives(p);if(!canAllocate(p,id,testing))return false;p.passives.push(id);if(!testing)p.passivePoints--;return true;}
export function refundPassive(p,id,free=false){
 ensurePassives(p);if(!p.passives.includes(id)||(!free&&p.gold<5))return false;
 const remaining=p.passives.filter(k=>k!==id),reachable=new Set(['root']),queue=['root'];while(queue.length)for(const next of passiveNeighbours(queue.shift()))if(remaining.includes(next)&&!reachable.has(next)){reachable.add(next);queue.push(next);}
 if(remaining.some(k=>!reachable.has(k)))return false;p.passives=remaining;p.passivePoints++;if(!free)p.gold-=5;return true;
}
