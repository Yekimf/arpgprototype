import {createRelic} from './itemization.js';
export const requiresIdentification=item=>!!item&&['magic','rare','legendary'].includes(item.rarity)&&item.identified===false;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}

export function generateDungeon(seed, depth = 1, options = {}) {
  const rng = random(seed), size = options.size||64;
  const tiles = Array.from({length: size}, () => Array(size).fill(0));
  const rooms = [{x: 27, y: 27, w: 11, h: 10}];
  for (let tries = 0; tries < 220 && rooms.length < (options.roomCount||15); tries++) {
    const w = 6 + Math.floor(rng() * 6), h = 6 + Math.floor(rng() * 5);
    const room = {x: 3 + Math.floor(rng() * (size - w - 6)), y: 3 + Math.floor(rng() * (size - h - 6)), w, h};
    if (!rooms.some(r => room.x < r.x + r.w + 3 && room.x + room.w + 3 > r.x && room.y < r.y + r.h + 3 && room.y + room.h + 3 > r.y)) rooms.push(room);
  }
  const carve = (x,y) => { if(x > 0 && y > 0 && x < size - 1 && y < size - 1) tiles[y][x] = 1; };
  const center = r => ({x: r.x + Math.floor(r.w / 2) + .5, y: r.y + Math.floor(r.h / 2) + .5});
  for (const r of rooms) for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) carve(x,y);
  const connect = (a,b) => {
    let x=Math.floor(a.x), y=Math.floor(a.y), tx=Math.floor(b.x), ty=Math.floor(b.y);
    const horizontalFirst = rng() < .5;
    const h=()=>{while(x!==tx){x+=Math.sign(tx-x);carve(x,y);carve(x,y+1);}};
    const v=()=>{while(y!==ty){y+=Math.sign(ty-y);carve(x,y);carve(x+1,y);}};
    if(horizontalFirst){h();v();}else{v();h();}
  };
  for (let i=1;i<rooms.length;i++) {
    const a=center(rooms[i]);
    const nearest=rooms.slice(0,i).sort((u,v)=>distance(a,center(u))-distance(a,center(v)))[0];
    connect(a,center(nearest));
    if(i>3 && rng()<.3) connect(a,center(rooms[Math.floor(rng()*i)]));
  }
  const start=center(rooms[0]);
  const bossRoom=rooms.slice(1).sort((a,b)=>distance(start,center(b))-distance(start,center(a)))[0];
  const portal=center(bossRoom), enemies=[], props=[];
  let id=1;
  rooms.forEach((room,ri)=>{
    for (let i=0;i<(ri===0?4:4+Math.floor(rng()*4));i++) {
      let x=room.x+1+rng()*(room.w-2), y=room.y+1+rng()*(room.h-2);
      if(ri===0 && distance({x,y},start)<3.7){x=room.x+1.2;y=room.y+1.3+i*.9;}
      const type=rng()<.2?'wraith':rng()<.35?'crawler':'skeleton';
      enemies.push(makeEnemy(id++,x,y,type,depth,rng()<.1 && ri>0));
    }
    const points=[[room.x+.8,room.y+.8],[room.x+room.w-1,room.y+.8],[room.x+.8,room.y+room.h-1],[room.x+room.w-1,room.y+room.h-1]];
    points.forEach(([x,y],i)=>props.push({x,y,type:i%2?'pillar':'brazier',variant:Math.floor(rng()*5)}));
    if(room.w>8) props.push({x:room.x+2.5,y:room.y+2.5,type:'tomb',variant:ri%4});
    for(let i=0;i<7;i++) props.push({x:room.x+.5+rng()*(room.w-1),y:room.y+.5+rng()*(room.h-1),type:rng()<.45?'bones':'rubble',variant:Math.floor(rng()*4)});
  });
  enemies.push(makeEnemy(id++,portal.x,portal.y,'warden',depth,true));
  props.push({x:start.x+1.4,y:start.y-1.5,type:'brazier',variant:1});
  return {seed,size,tiles,rooms,start,portal,enemies,props,depth,seen:new Set(),bossDead:false};
}

export function makeEnemy(id,x,y,type,depth,elite=false) {
  const hp=({skeleton:43,crawler:32,wraith:34,warden:520}[type])*(1+(depth-1)*.32)*(elite&&type!=='warden'?2:1);
  return {id,x,y,type,elite,hp,maxHp:hp,speed:({skeleton:1.35,crawler:2.25,wraith:1.45,warden:1.15}[type]),damage:({skeleton:9,crawler:6,wraith:11,warden:23}[type])*(1+(depth-1)*.22),cooldown:1,hit:0,slow:0,burn:0,aggro:false,phase:Math.random()*6,dead:false,windup:0};
}

export function isWalkable(dungeon,x,y,radius=.21) {
  return [[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]].every(([a,b])=>dungeon.tiles[Math.floor(y+b)]?.[Math.floor(x+a)]===1);
}
export function moveEntity(dungeon,entity,dx,dy,radius=.21) {
  if(isWalkable(dungeon,entity.x+dx,entity.y,radius)) entity.x+=dx;
  if(isWalkable(dungeon,entity.x,entity.y+dy,radius)) entity.y+=dy;
}

export function clearPath(d,a,b,radius=.23){const steps=Math.max(1,Math.ceil(distance(a,b)/.12));for(let i=0;i<=steps;i++){const t=i/steps;if(!isWalkable(d,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,radius))return false;}return true;}
export function findPath(dungeon,from,to,{smooth=true}={}) {
  if(!isWalkable(dungeon,to.x,to.y,.23)||!isWalkable(dungeon,from.x,from.y,.21))return [];
  if(smooth&&clearPath(dungeon,from,to))return [{x:to.x,y:to.y}];
  const width=dungeon.tiles[0].length,height=dungeon.tiles.length,start=Math.floor(from.y)*width+Math.floor(from.x),end=Math.floor(to.y)*width+Math.floor(to.x),parents=new Int32Array(width*height).fill(-1),cost=new Float64Array(width*height).fill(Infinity),closed=new Uint8Array(width*height),heap=[];
  const centre=id=>({x:id%width+.5,y:Math.floor(id/width)+.5});
  const push=value=>{heap.push(value);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p].score<=value.score)break;heap[i]=heap[p];i=p;}heap[i]=value;};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;if(heap[child].score>=last.score)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;};
  cost[start]=0;parents[start]=start;push({id:start,score:distance(from,to)});
  while(heap.length){const {id}=pop();if(closed[id])continue;closed[id]=1;if(id===end)break;const at=centre(id),x=id%width,y=Math.floor(id/width);
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const next=ny*width+nx,point=centre(next);if(closed[next]||!isWalkable(dungeon,point.x,point.y,.23)||dx&&dy&&(!dungeon.tiles[y]?.[nx]||!dungeon.tiles[ny]?.[x])||!clearPath(dungeon,at,point))continue;const value=cost[id]+Math.hypot(dx,dy);if(value>=cost[next])continue;cost[next]=value;parents[next]=id;push({id:next,score:value+distance(point,to)});}
  }
  if(parents[end]===-1)return [];
  const raw=[{x:to.x,y:to.y}];let at=end;while(at!==start){raw.push(centre(at));at=parents[at];}raw.reverse();
  if(!clearPath(dungeon,from,raw[0]))raw.unshift(centre(start));
  if(!smooth)return raw;
  const path=[];let anchor=from,index=0;while(index<raw.length){let next=index;while(next+1<raw.length&&clearPath(dungeon,anchor,raw[next+1]))next++;path.push(raw[next]);anchor=raw[next];index=next+1;}return path;
}

export const MASTERIES = {
  iron: {name:'Ironbound',subtitle:'STEEL · ENDURANCE · RUPTURE',description:'Stand against the dark. Turn raw strength into sweeping strikes and relentless momentum.',color:'#d8b579',nodes:[
    {id:'cleave',name:'Sweeping Cut',icon:'╱',max:5,req:0,active:true,cost:16,cooldown:4,description:'A sweeping arc deals {v}% weapon damage. Hits all enemies in front of you.',base:170,step:30},
    {id:'vigor',name:'Unyielding',icon:'♜',max:5,req:0,description:'+{v} maximum life and +2 armor per rank.',base:18,step:18},
    {id:'precision',name:'Keen Edge',icon:'⟡',max:5,req:0,description:'+{v}% critical chance. Critical strikes deal 175% damage.',base:3,step:3},
    {id:'quake',name:'Shieldbreaker',icon:'✹',max:5,req:3,active:true,cost:26,cooldown:8,description:'Slam the ground for {v}% weapon damage. Slows nearby enemies.',base:230,step:40},
    {id:'blood',name:'Blood Drinker',icon:'♧',max:3,req:3,description:'Attacks restore {v} life per enemy hit.',base:2,step:2},
    {id:'whirl',name:'Whirling Guard',icon:'✺',max:5,req:7,active:true,cost:32,cooldown:11,description:'A close whirling defence strikes nearby foes for {v}% damage per sweep over 1.2 seconds.',base:85,step:18},
    {id:'execution',name:'Executioner',icon:'♔',max:3,req:7,description:'Deal {v}% more damage to enemies below 35% life.',base:15,step:15},
  ]},
  ember: {name:'Cinderweaver',subtitle:'FIRE · DEVOTION · IMMOLATION',description:'Bind the last embers of a fallen star. Every flame carries the promise of another.',color:'#d89a6d',nodes:[
    {id:'bolt',name:'Ember Bolt',icon:'♨',max:5,req:0,active:true,cost:12,cooldown:1.5,description:'Launch a piercing ember for {v}% damage. Burns for 3 seconds.',base:145,step:28},
    {id:'kindling',name:'Kindling',icon:'♢',max:5,req:0,description:'+{v}% fire damage, including burning damage.',base:8,step:8},
    {id:'spirit',name:'Inner Furnace',icon:'☼',max:5,req:0,description:'+{v} maximum spirit and +0.6 spirit regeneration per rank.',base:12,step:12},
    {id:'meteor',name:'Consecrated Ground',icon:'☄',max:5,req:3,active:true,cost:30,cooldown:8,description:'Kindle the aimed ground for 5 seconds, dealing {v}% fire damage per second to enemies standing within it.',base:75,step:15},
    {id:'ash',name:'Ashen Veil',icon:'◈',max:3,req:3,description:'+{v}% damage resistance while your spirit is above 50%.',base:5,step:5},
    {id:'inferno',name:'Martyr’s Pyre',icon:'✷',max:5,req:3,active:true,toggle:true,cost:0,cooldown:0,description:'Toggle a burning aura. Scorches nearby enemies using maximum life and spirit. Burns 9% of your maximum life each second before fire resistance; life regeneration and flasks sustain it. Stops at 5% life. Higher ranks deal {v}% base aura damage.',base:100,step:18},
    {id:'phoenix',name:'Phoenix Heart',icon:'♧',max:3,req:7,description:'Kills restore {v} life and 3 spirit per rank.',base:6,step:6},
  ]},
  aether: {name:'Hollow Sage',subtitle:'FROST · AETHER · CONVERGENCE',description:'Listen to the silence between worlds. Shape its stillness into a weapon.',color:'#8dc2be',nodes:[
    {id:'nova',name:'Hoarfrost',icon:'❄',max:5,req:0,active:true,cost:22,cooldown:6,description:'A freezing wave deals {v}% damage and slows foes for 3 seconds.',base:130,step:25},
    {id:'resonance',name:'Resonance',icon:'✧',max:5,req:0,description:'+{v}% cold and aether damage.',base:8,step:8},
    {id:'flow',name:'Temporal Flow',icon:'⌛',max:5,req:0,description:'Reduce all ability cooldowns by {v}%.',base:4,step:4},
    {id:'chain',name:'Storm Thread',icon:'ϟ',max:5,req:3,active:true,cost:24,cooldown:4,description:'Lightning jumps between up to 5 targets for {v}% damage.',base:155,step:30},
    {id:'ward',name:'Aether Ward',icon:'⛊',max:3,req:3,description:'+{v} armor. Dodge restores 6 spirit per rank.',base:4,step:4},
    {id:'vortex',name:'Gravewind',icon:'◎',max:5,req:7,active:true,cost:35,cooldown:11,description:'Pull enemies into a vortex for 4 seconds, dealing {v}% damage per second.',base:65,step:15},
    {id:'convergence',name:'Convergence',icon:'❖',max:3,req:7,description:'+{v}% all damage for each mastery with 3+ invested points.',base:5,step:5},
  ]},
};
export const INNATE_SKILL={id:'lance',name:'Spectral Shard',icon:'➹',max:5,req:0,active:true,cost:8,cooldown:2,base:110,step:20,description:'A focused aether projectile deals {v}% weapon damage, aimed at the cursor.'};
MASTERIES.aether.nodes.push(INNATE_SKILL);
export const ALL_SKILLS=Object.values(MASTERIES).flatMap(m=>m.nodes);
export const getSkill=id=>ALL_SKILLS.find(n=>n.id===id);
export const rankOf=(player,id)=>player.skills[id]||0;
export const skillLevel=id=>{const s=getSkill(id);return !s?99:s.req>=7?8:s.req>=3?4:2;};
export const masteryPoints=(player,key)=>MASTERIES[key].nodes.reduce((sum,n)=>sum+rankOf(player,n.id),0);
export function canLearn(player,id) {
  if(getSkill(id)?.innate)return false;
  const skill=getSkill(id), key=Object.keys(MASTERIES).find(k=>MASTERIES[k].nodes.includes(skill));
  return !!skill && player.level>=skillLevel(id) && player.points>0 && rankOf(player,id)<skill.max && masteryPoints(player,key)>=skill.req;
}
export function learnSkill(player,id) {if(!canLearn(player,id))return false;player.skills[id]=(player.skills[id]||0)+1;player.points--;if(getSkill(id).active&&!player.slots.includes(id)){const empty=player.slots.indexOf(null);if(empty>=0)player.slots[empty]=id;if(player.mouseSkill==='basic')player.mouseSkill=id;}return true;}
export function playerStats(player) {
  const items=Object.values(player.equipment).filter(Boolean);
  const total=key=>items.reduce((s,i)=>s+(requiresIdentification(i)?0:(i[key]||0)*(['damage','armor'].includes(key)&&i.durability<=0?.5:1)),0);
  const r=id=>rankOf(player,id), invested=Object.keys(MASTERIES).filter(k=>masteryPoints(player,k)>=3).length,a=player.attributes||{},might=a.might||0,vitality=a.vitality||0,will=a.will||0,dexterity=a.dexterity||0;
  return {maxHp:120+(player.level-1)*16+r('vigor')*18+total('life')+vitality*6,maxMana:80+r('spirit')*12+total('spirit')+will*4,damage:18+(player.level-1)*2+total('damage')+might*1.5,armor:3+r('vigor')*2+r('ward')*4+total('armor')+vitality*.25,crit:7+r('precision')*3+total('crit')+dexterity*.4,reach:player.equipment.weapon?(player.equipment.weapon.reach||1.85):1.15,attackSpeed:(player.equipment.weapon?.attackSpeed||(player.equipment.weapon?1:1.35))*(1+total('attackRate')/100),fireResist:clamp(total('fireResist'),0,75),coldResist:clamp(total('coldResist'),0,75),lightningResist:clamp(total('lightningResist'),0,75),lifeRegen:.8+total('lifeRegen'),flaskGain:total('flaskGain'),flaskRecovery:total('flaskRecovery'),block:clamp(total('block'),0,60),evasion:clamp(total('evasion'),0,50),speed:Math.max(2.4,3.8+total('speed')),regen:5+r('spirit')*.6+will*.08,bonus:1+(total('bonus')+r('convergence')*5*invested)/100,fire:1+r('kindling')*.08+total('fireDamage')/100,cold:1+r('resonance')*.08,cdr:1-r('flow')*.04};
}
export function mitigateDamage(amount,stats,element='physical',guard=0){
  const resistance=element==='fire'?stats.fireResist:element==='cold'?stats.coldResist:element==='aether'||element==='lightning'?stats.lightningResist:0;
  return Math.max(1,Math.round(amount*(element==='physical'?100/(100+stats.armor*3):1)*(1-guard)*(1-(resistance||0)/100)));
}
export const xpNeeded=level=>Math.round(55+level*30+Math.pow(level,1.7)*10);
export const ORIGINS={vanguard:{name:'Royal Vanguard',description:'You held the king’s shield wall. Strength and endurance are your inheritance.',attributes:{might:2,vitality:2,will:0,dexterity:0}},templar:{name:'Royal Chirurgeon',description:'You served the field hospitals. Steady hands and knowledge of herbs kept the wounded alive.',attributes:{might:0,vitality:1,will:3,dexterity:0}},outrider:{name:'King’s Outrider',description:'You carried the king’s word beyond the walls. Your blade is swift and certain.',attributes:{might:1,vitality:0,will:0,dexterity:3}}};
export function createPlayer(options={}) {
  const origin=ORIGINS[options.origin]?options.origin:'vanguard';
  return {sex:'male',name:String(options.name||'The Loyalist').trim().slice(0,24),origin,appearance:options.appearance==='iron'?'iron':'crimson',progressionVersion:2,attributes:{...ORIGINS[origin].attributes},attributePoints:0,x:0,y:0,level:1,xp:0,gold:0,points:0,skills:{},slots:[null,null,null,null],mouseSkill:'basic',equipment:{weapon:{name:'King’s Service Sword',slot:'weapon',rarity:'normal',damage:5,level:1,icon:'⚔',id:'starter-sword'},armor:{name:'Weathered Hauberk',slot:'armor',rarity:'normal',armor:3,level:1,icon:'⛊',id:'starter-armor'},charm:null,boots:{id:'starter-greaves',name:'Worn Greaves',slot:'boots',rarity:'normal',level:1,look:'steel'},helm:{id:'starter-helm',name:'Worn Sallet',slot:'helm',rarity:'normal',level:1,armor:1,look:'sallet'},gloves:{id:'starter-gauntlets',name:'Worn Gauntlets',slot:'gloves',rarity:'normal',level:1,look:'steel'},belt:null,ring:null,ring2:null,shield:{id:'starter-buckler',name:'Scarred Buckler',slot:'shield',rarity:'normal',level:1,armor:1,block:4,look:'round'}},inventory:[],stash:[],shards:0,identifyScrolls:0,buyback:[],shopStock:null,quests:{guideMet:false,scholarRescued:false,wardenDefeated:false,guideRewarded:false},hp:120,mana:80,potions:3,kills:0,deaths:0};
}
export function grantExperience(player,amount){
  if(!Number.isFinite(amount)||amount<=0)return 0;player.xp+=amount;let levels=0;
  while(player.xp>=xpNeeded(player.level)&&player.level<60){player.xp-=xpNeeded(player.level);player.level++;player.points+=2;player.attributePoints=(player.attributePoints||0)+5;levels++;}
  if(levels){const s=playerStats(player);player.hp=s.maxHp;player.mana=s.maxMana;player.potions=Math.min(5,player.potions+levels);if(player.flask){player.flask.charges=Math.min(100,player.flask.charges+levels*20);player.potions=Math.floor(player.flask.charges/20);}}return levels;
}
export function spendAttribute(player,key){if(!['might','vitality','will','dexterity'].includes(key)||!(player.attributePoints>0))return false;player.attributes??={};player.attributes[key]=(player.attributes[key]||0)+1;player.attributePoints--;return true;}
export const generateItem=createRelic;
export function itemDescription(item) {
  const lines=[['damage','Weapon damage'],['armor','Armor'],['life','Life'],['spirit','Spirit'],['crit','% critical chance'],['speed','Movement speed'],['bonus','% all damage'],['fireResist','% fire resistance'],['coldResist','% cold resistance'],['lightningResist','% storm resistance'],['lifeRegen','Life regenerated / sec'],['fireDamage','% fire damage'],['flaskGain','% flask charge recovery'],['attackRate','% attack speed'],['block','% block chance'],['evasion','% evasion']].filter(([key])=>item[key]).map(([key,name])=>`${item[key]<0?'':'+'}${item[key]} ${name}`);
  if(item.reach)lines.push(`Reach ${item.reach.toFixed(2)}`);if(item.attackSpeed)lines.push(`Attack speed ×${item.attackSpeed.toFixed(2)}`);return lines;
}
