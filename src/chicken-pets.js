// Character-owned secret collection and deterministic, turn-based poultry combat.
export const PET_VERSION=1, MAX_PETS=120, SHOP_PERIOD=2*60*60*1000;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const TYPES={ember:{name:'Ember',color:'#c67c4a',beats:'rime'},rime:{name:'Rime',color:'#9dc1ca',beats:'gale'},gale:{name:'Gale',color:'#b6c2a3',beats:'earth'},earth:{name:'Earth',color:'#b7a174',beats:'storm'},storm:{name:'Storm',color:'#b1a9d1',beats:'ember'},shade:{name:'Shade',color:'#a89aa8',beats:'shade'}};
export const BREEDS=[
 ['ivory','Ivory Barnhen','gale',0],['russet','Russet Hearthhen','ember',1],['goldneck','Golden-neck Moorhen','earth',2],['barred','Barred Stormhen','storm',3],
 ['slate','Slate Frosthen','rime',4],['buff','Buff Meadowhen','earth',5],['redcrest','Redcrest Cockerel','ember',6],['silver','Silver Wintercock','rime',7],
 ['speckled','Speckled Duskhen','shade',8],['obsidian','Obsidian Cockerel','shade',9],['cream','Cream Windhen','gale',10],['copper','Copper Thundercock','storm',11]
].map(([id,name,type,art])=>({id,name,type,art}));
export const HATS=[['straw','Fieldhand’s Straw',2,25],['knight','Knight of the Coop',3,55],['hood','Little Red Cowl',4,35],['witch','The Peckromancer',5,65],['tricorn','Admiral of the Puddle',6,45],['crown','His Eggcellency',7,100],['ranger','Outrider’s Feather',8,40],['monk','Brother Cluck’s Cowl',9,40],['pot','The Iron Breakfast',10,50]].map(([id,name,art,price])=>({id,name,art,price}));
export const BATTLE_ITEMS={mash:{name:'Restorative Mash',price:10,description:'Restore half a chicken’s life.',art:11},ether:{name:'Spiritseed Tonic',price:14,description:'Restore all move uses for the active chicken.',art:11},revive:{name:'Second Breakfast',price:22,description:'Rouse a fainted chicken at half life.',art:11}};
export const MOVES={peck:{name:'Peck',type:null,power:35,accuracy:1,pp:35,level:1,detail:'A reliable physical strike.'},brace:{name:'Feather Guard',type:null,power:0,pp:15,level:3,status:'guard',detail:'Halve the next damaging hit.'}};
for(const [type,names,status] of [ ['ember',['Cinder Peck','Kindle','Roostfire','Sunfall'], 'burn'], ['rime',['Ice Spur','White Hush','Hoarfrost Wing','Winter’s Verdict'],'slow'], ['gale',['Wing Gust','Tailwind','Razor Gale','Skybreaker'],'haste'], ['earth',['Stone Beak','Dust Veil','Briar Talon','Gravefurrow'],'guard'], ['storm',['Spark Spur','Static Ruffle','Thundercomb','Tempest Crown'],'slow'], ['shade',['Dusk Peck','Night Ruffle','Hollow Cry','Midnight Requiem'],'weaken'] ]){
 for(let i=0;i<4;i++)MOVES[type+i]={name:names[i],type,power:[45,0,72,105][i],accuracy:i===3?.9:1,pp:[25,12,15,7][i],level:[1,3,6,12][i],status:i===1?status:null,proc:i===2&&['burn','slow','weaken'].includes(status)?status:null,detail:i===1?({burn:'Scorch the foe for three turns.',slow:'Slow the foe for three turns.',haste:'Raise your speed for three turns.',guard:'Halve the next damaging hit.',weaken:'Weaken the foe’s attacks for three turns.'}[status]):i===3?'An overwhelming elemental finisher.':'Elemental damage. Strong against '+TYPES[TYPES[type].beats].name+'.'};
}
export const breedOf=c=>BREEDS.find(b=>b.id===c?.breed)||BREEDS[0];
export const typeOf=c=>TYPES[c?.element]?c.element:breedOf(c).type;
export const petName=c=>c?.name||breedOf(c).name;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
export function ensurePets(p){
 const s=p.pets??={version:1,unlocked:false,roster:[],seen:[],hats:[],points:0,items:{},captured:[],wins:0};
 for(const k of ['roster','seen','hats','captured'])if(!Array.isArray(s[k]))s[k]=[];
 s.points=Math.max(0,Math.floor(Number(s.points)||0));s.items??={};s.wins??=0;s.unlocked=!!(s.unlocked||s.roster.length);
 if(s.roster.length&&!s.roster.some(c=>c.id===s.active))s.active=s.roster[0].id;
 return s;
}
export function movesFor(c){const t=typeOf(c),l=c.level||1;return ['peck',t+0,l>=6?t+2:'brace',l>=12?t+3:t+1].filter(k=>MOVES[k].level<=l);}
export function petStats(c){const l=clamp(c.level||1,1,50),v=hash(c.id||c.breed),b=breedOf(c);return {hp:42+l*8+(v%7),attack:11+l*3+(b.art%3)*2,defense:9+l*2+(b.art%4),speed:10+l*2+(b.art%5)*2};}
export const petXpNeeded=level=>Math.round(35+level*level*5);
export function restorePet(c){c.hp=petStats(c).hp;c.pp=Object.fromEntries(movesFor(c).map(k=>[k,MOVES[k].pp]));return c;}
export function makePet(wild){return restorePet({id:id(),breed:breedOf(wild).id,element:typeOf(wild),level:clamp(Math.floor(wild.level)||1,1,50),xp:0,hat:null,wins:0});}
export function wildIdentity(d,c){return String(d.seed||0)+':'+c.id;}
export function wildProfile(d,c){if(!c.breed){const n=hash((d.seed||0)+':'+c.id+':'+c.seed),roll=n%100;c.breed=BREEDS[roll<64?n%6:roll<94?6+n%3:9+n%3].id;c.element=breedOf(c).type;c.level=clamp(1+Math.floor((d.areaLevel||d.depth||1)/2)+(n%3),1,45);}return c;}
export function canCapture(p){return ensurePets(p).roster.length<MAX_PETS;}
export const isChickenCrate=i=>i?.consumable==='chicken-crate';
export function makeChickenCrate(){return {id:'crate-'+id(),name:'Wooden Crate',slot:'supply',consumable:'chicken-crate',rarity:'normal',identified:true,width:2,height:2,level:1,price:18};}
export function beginCapture(p,d,c,crateId){const s=ensurePets(p);if(s.pendingCapture||!canCapture(p)||c.capturing||s.captured.includes(wildIdentity(d,c)))return false;const at=p.inventory.findIndex(i=>i.id===crateId&&isChickenCrate(i));if(at<0)return false;
 wildProfile(d,c);p.inventory.splice(at,1);c.capturing=true;s.pendingCapture={key:wildIdentity(d,c),wild:{breed:c.breed,element:c.element,level:c.level},token:id()};return true;
}
export function finishCapture(p){const s=ensurePets(p),pending=s.pendingCapture;if(!pending)return null;delete s.pendingCapture;if(s.captured.includes(pending.key))return null;const c=makePet(pending.wild);s.roster.push(c);s.captured.push(pending.key);s.unlocked=true;s.active??=c.id;
 const fresh=!s.seen.includes(c.breed);if(fresh){s.seen.push(c.breed);s.points+=20;}s.points+=5;return c;
}
export function discoverPet(p,c){const s=ensurePets(p);if(!s.seen.includes(c.breed)){s.seen.push(c.breed);s.points+=20;}}
export const effectiveness=(attack,defense)=>!attack?1:TYPES[attack].beats===defense?1.75:TYPES[defense].beats===attack?.65:1;
export function gainPetXp(c,amount){let levels=0;c.xp=(c.xp||0)+Math.max(0,Math.floor(amount));while(c.level<50&&c.xp>=petXpNeeded(c.level)){c.xp-=petXpNeeded(c.level);c.level++;levels++;}if(c.level===50)c.xp=0;if(levels)restorePet(c);return levels;}
export function shopStock(now=Date.now()){const rotation=Math.floor(now/SHOP_PERIOD),pool=[...HATS];let n=hash('emberfall-coop:'+rotation);for(let i=pool.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}return {rotation,refreshAt:(rotation+1)*SHOP_PERIOD,hats:pool.slice(0,3),items:Object.entries(BATTLE_ITEMS).map(([id,item])=>({id,...item}))};}
export function buyPetWare(p,kind,key,now=Date.now()){const s=ensurePets(p);if(!s.unlocked)return {ok:false,message:'There is no one here.'};const stock=shopStock(now),ware=kind==='hat'?stock.hats.find(h=>h.id===key):stock.items.find(i=>i.id===key);if(!ware)return {ok:false,message:'Those wares have changed.'};if(kind==='hat'&&s.hats.includes(key))return {ok:false,message:'Already in your collection.'};if(s.points<ware.price)return {ok:false,message:'Not enough chicken points.'};if(kind!=='hat'&&(s.items[key]||0)>=99)return {ok:false,message:'Your provisions are full.'};s.points-=ware.price;if(kind==='hat')s.hats.push(key);else s.items[key]=(s.items[key]||0)+1;return {ok:true,message:ware.name+' acquired.'};}
export function equipPetHat(p,petId,hat){const s=ensurePets(p),c=s.roster.find(c=>c.id===petId);if(!c||hat&&!s.hats.includes(hat))return false;for(const other of s.roster)if(hat&&other.hat===hat)other.hat=null;c.hat=hat||null;return true;}
export function usePetItem(p,c,key){const s=ensurePets(p);if(!c||!(s.items[key]>0))return false;const max=petStats(c).hp;if(key==='mash'&&c.hp>0&&c.hp<max)c.hp=Math.min(max,c.hp+Math.ceil(max/2));else if(key==='revive'&&c.hp<=0)c.hp=Math.ceil(max/2);else if(key==='ether'&&movesFor(c).some(k=>(c.pp?.[k]??MOVES[k].pp)<MOVES[k].pp)){c.pp=Object.fromEntries(movesFor(c).map(k=>[k,MOVES[k].pp]));}else return false;s.items[key]--;return true;}
export function startPetBattle(p,d,wild){const s=ensurePets(p),lead=s.roster.find(c=>c.id===s.active&&c.hp>0)||s.roster.find(c=>c.hp>0);if(!lead||wild.capturing||s.captured.includes(wildIdentity(d,wild)))return null;
 wildProfile(d,wild);const foe=makePet(wild);foe.id='wild:'+wildIdentity(d,wild);restorePet(foe);return {key:wildIdentity(d,wild),wildId:wild.id,foe,active:lead.id,participants:[lead.id],round:0,status:{},result:null,rewarded:false,log:['A wild '+petName(foe)+' bars the path.'],events:[]};}
function status(b,c){return b.status[c.id]??={};}
function message(b,text,event={}){b.log.push(text);b.events.push({text,...event});}
function strike(b,a,t,key,rng){const m=MOVES[key];if(!m||!movesFor(a).includes(key))return;a.pp??={};const remaining=a.pp[key]??m.pp;if(remaining<=0){message(b,petName(a)+' has no uses of '+m.name+' left.');return;}a.pp[key]=remaining-1;
 if(rng()>(m.accuracy||1)){message(b,petName(a)+' used '+m.name+' — missed.',{actor:a.id,target:t.id,move:key,miss:true});return;}
 const own=status(b,a),def=status(b,t);
 if(!m.power){const self=['guard','haste'].includes(m.status),dst=self?own:def;dst[m.status]=m.status==='guard'?1:3;message(b,petName(a)+' used '+m.name+'.',{actor:a.id,target:self?a.id:t.id,move:key});return;}
 const s=petStats(a),ts=petStats(t),mult=effectiveness(m.type,typeOf(t)),critical=rng()<.07,stab=m.type===typeOf(a)?1.25:1;
 const damage=Math.max(1,Math.round(((2*a.level/5+2)*m.power*s.attack/ts.defense/25+3)*mult*stab*(own.weaken?.7:1)*(def.guard?.5:1)*(critical?1.5:1)*(.9+rng()*.2)));
 delete def.guard;t.hp=Math.max(0,t.hp-damage);if(t.hp>0&&m.proc&&rng()<.25)def[m.proc]=3;
 message(b,petName(a)+' used '+m.name+'! '+damage+' damage.'+(mult>1?' It is devastating!':mult<1?' The feathers resist.':'')+(critical?' A vital strike!':''),{actor:a.id,target:t.id,move:key,damage,critical});
}
function availableMove(c,rng){const moves=movesFor(c).filter(k=>(c.pp?.[k]??MOVES[k].pp)>0);return moves[Math.floor(rng()*moves.length)]||null;}
export function battleAction(p,b,action,rng=Math.random){if(!b||b.result)return {ok:false};const s=ensurePets(p),lead=s.roster.find(c=>c.id===b.active);if(!lead)return {ok:false};b.events=[];
 if(action.kind==='flee'){b.result='fled';message(b,'You withdraw with your dignity. The chicken disputes this.');return {ok:true,events:b.events};}
 const replacement=s.roster.find(c=>c.id===action.id&&c.hp>0),forced=lead.hp<=0;
 if(forced&&action.kind!=='switch'&&!(action.kind==='item'&&action.item==='revive'))return {ok:false,message:'Choose a fit chicken, or use Second Breakfast.'};
 const foeKey=availableMove(b.foe,rng);
 if(action.kind==='switch'){if(!replacement||replacement.id===lead.id)return {ok:false,message:'Choose another fit chicken.'};b.active=replacement.id;if(!b.participants.includes(replacement.id))b.participants.push(replacement.id);message(b,'Go, '+petName(replacement)+'!',{switch:true});if(!forced&&foeKey)strike(b,b.foe,replacement,foeKey,rng);}
 else if(action.kind==='item'){const target=s.roster.find(c=>c.id===(action.target||b.active));if(!usePetItem(p,target,action.item))return {ok:false,message:'That provision cannot help this chicken.'};message(b,BATTLE_ITEMS[action.item].name+' was used.',{heal:true,target:target.id});if(foeKey&&lead.hp>0)strike(b,b.foe,lead,foeKey,rng);}
 else if(action.kind==='move'){
  const m=MOVES[action.move];if(!m||!movesFor(lead).includes(action.move)||(lead.pp?.[action.move]??m.pp)<=0)return {ok:false,message:'That move is unavailable.'};
  const speed=c=>petStats(c).speed*(status(b,c).slow?.65:1)*(status(b,c).haste?1.5:1),first=speed(lead)>=speed(b.foe),turns=first?[[lead,b.foe,action.move],[b.foe,lead,foeKey]]:[[b.foe,lead,foeKey],[lead,b.foe,action.move]];
  for(const [a,t,k]of turns)if(a.hp>0&&t.hp>0){if(k)strike(b,a,t,k,rng);else{const damage=Math.max(3,Math.floor(a.level*2));t.hp=Math.max(0,t.hp-damage);a.hp=Math.max(0,a.hp-2);message(b,petName(a)+' struggles for '+damage+' damage.',{actor:a.id,target:t.id,damage});}}
 }else return {ok:false};
 b.round++;for(const c of [s.roster.find(c=>c.id===b.active),b.foe]){const st=status(b,c);if(c.hp>0&&st.burn){const damage=Math.max(2,Math.ceil(petStats(c).hp*.06));c.hp=Math.max(0,c.hp-damage);message(b,petName(c)+' is scorched for '+damage+'.',{target:c.id,damage,move:'ember0'});}for(const k of ['burn','slow','haste','weaken'])if(st[k]&&--st[k]<=0)delete st[k];}
 if(b.foe.hp<=0)b.result='won';else if(!s.roster.some(c=>c.hp>0))b.result='lost';else if(s.roster.find(c=>c.id===b.active)?.hp<=0)message(b,'Your chicken is exhausted. Choose a companion.');
 if(b.result)settlePetBattle(p,b);return {ok:true,events:b.events,result:b.result};
}
export function settlePetBattle(p,b){if(b.rewarded||!['won','lost'].includes(b.result))return false;b.rewarded=true;const s=ensurePets(p),win=b.result==='won',xp=win?35+b.foe.level*19:10+b.foe.level*3,points=win?10+b.foe.level*2:0;
 if(win){s.points+=points;s.wins++;}b.rewards={xp,points,levels:[]};for(const c of s.roster.filter(c=>b.participants.includes(c.id))){if(win)c.wins=(c.wins||0)+1;const levels=gainPetXp(c,xp);if(levels)b.rewards.levels.push(petName(c)+' reached level '+c.level+'.');}
 message(b,win?'Victory! +'+points+' chicken points. Each participant earned '+xp+' XP.':'Your flock needs rest. Each participant learned '+xp+' XP.');return true;
}
export function chickenVendor(d,p){if(!ensurePets(p).unlocked||!d.town&&!d.townBounds)return null;const bounds=d.townBounds||{x1:16,y1:16,x2:50,y2:51},preferred={x:bounds.x1+5.5,y:bounds.y2-6.5};for(let r=0;r<6;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){const x=preferred.x+dx,y=preferred.y+dy;if(d.tiles[Math.floor(y)]?.[Math.floor(x)]&&(d.props||[]).every(o=>o.type!=='building'||Math.hypot(o.x-x,o.y-y)>3))return {id:'chicken-vendor',name:'Merrit',role:'THE QUIET COOP',x,y,sprite:3};}return null;}
