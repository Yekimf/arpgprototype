export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}

export function generateDungeon(seed, depth = 1) {
  const rng = random(seed), size = 64;
  const tiles = Array.from({length: size}, () => Array(size).fill(0));
  const rooms = [{x: 27, y: 27, w: 11, h: 10}];
  for (let tries = 0; tries < 220 && rooms.length < 15; tries++) {
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

export function findPath(dungeon,from,to) {
  if(!isWalkable(dungeon,to.x,to.y))return [];
  const width=dungeon.tiles[0].length,height=dungeon.tiles.length;
  const start=Math.floor(from.y)*width+Math.floor(from.x),end=Math.floor(to.y)*width+Math.floor(to.x);
  const parents=new Int32Array(width*height).fill(-1),queue=[start];parents[start]=start;
  for(let i=0;i<queue.length&&parents[end]===-1;i++){
    const at=queue[i],x=at%width,y=Math.floor(at/width);
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,next=ny*width+nx;
      if(dungeon.tiles[ny]?.[nx]&&parents[next]===-1){parents[next]=at;queue.push(next);}
    }
  }
  if(parents[end]===-1)return [];
  const path=[];let at=end;
  while(at!==start){path.push({x:at%width+.5,y:Math.floor(at/width)+.5});at=parents[at];}
  path.reverse();path.push({x:to.x,y:to.y});return path;
}

export const MASTERIES = {
  iron: {name:'Ironbound',subtitle:'STEEL · ENDURANCE · RUPTURE',description:'Stand against the dark. Turn raw strength into sweeping strikes and relentless momentum.',color:'#d8b579',nodes:[
    {id:'cleave',name:'Rift Cleave',icon:'╱',max:5,req:0,active:true,cost:16,cooldown:4,description:'A sweeping arc deals {v}% weapon damage. Hits all enemies in front of you.',base:170,step:30},
    {id:'vigor',name:'Unyielding',icon:'♜',max:5,req:0,description:'+{v} maximum life and +2 armor per rank.',base:18,step:18},
    {id:'precision',name:'Keen Edge',icon:'⟡',max:5,req:0,description:'+{v}% critical chance. Critical strikes deal 175% damage.',base:3,step:3},
    {id:'quake',name:'Earthshatter',icon:'✹',max:5,req:3,active:true,cost:26,cooldown:8,description:'Slam the ground for {v}% weapon damage. Slows nearby enemies.',base:230,step:40},
    {id:'blood',name:'Blood Drinker',icon:'♧',max:3,req:3,description:'Attacks restore {v} life per enemy hit.',base:2,step:2},
    {id:'whirl',name:'Blade Tempest',icon:'✺',max:5,req:7,active:true,cost:32,cooldown:11,description:'Release six expanding blades for {v}% damage each.',base:85,step:18},
    {id:'execution',name:'Executioner',icon:'♔',max:3,req:7,description:'Deal {v}% more damage to enemies below 35% life.',base:15,step:15},
  ]},
  ember: {name:'Cinderweaver',subtitle:'FIRE · DEVOTION · IMMOLATION',description:'Bind the last embers of a fallen star. Every flame carries the promise of another.',color:'#d89a6d',nodes:[
    {id:'bolt',name:'Ember Bolt',icon:'♨',max:5,req:0,active:true,cost:12,cooldown:1.5,description:'Launch a piercing ember for {v}% damage. Burns for 3 seconds.',base:145,step:28},
    {id:'kindling',name:'Kindling',icon:'♢',max:5,req:0,description:'+{v}% fire damage, including burning damage.',base:8,step:8},
    {id:'spirit',name:'Inner Furnace',icon:'☼',max:5,req:0,description:'+{v} maximum spirit and +0.6 spirit regeneration per rank.',base:12,step:12},
    {id:'meteor',name:'Falling Star',icon:'☄',max:5,req:3,active:true,cost:30,cooldown:8,description:'Call a meteor at your aim for {v}% fire damage in an area.',base:260,step:45},
    {id:'ash',name:'Ashen Veil',icon:'◈',max:3,req:3,description:'+{v}% damage resistance while your spirit is above 50%.',base:5,step:5},
    {id:'inferno',name:'Sunfire',icon:'✷',max:5,req:7,active:true,cost:38,cooldown:12,description:'Ignite an expanding ring for {v}% damage and burning.',base:310,step:50},
    {id:'phoenix',name:'Phoenix Heart',icon:'♧',max:3,req:7,description:'Kills restore {v} life and 3 spirit per rank.',base:6,step:6},
  ]},
  aether: {name:'Hollow Sage',subtitle:'FROST · AETHER · CONVERGENCE',description:'Listen to the silence between worlds. Shape its stillness into a weapon.',color:'#8dc2be',nodes:[
    {id:'nova',name:'Frost Nova',icon:'❄',max:5,req:0,active:true,cost:22,cooldown:6,description:'A freezing wave deals {v}% damage and slows foes for 3 seconds.',base:130,step:25},
    {id:'resonance',name:'Resonance',icon:'✧',max:5,req:0,description:'+{v}% cold and aether damage.',base:8,step:8},
    {id:'flow',name:'Temporal Flow',icon:'⌛',max:5,req:0,description:'Reduce all ability cooldowns by {v}%.',base:4,step:4},
    {id:'chain',name:'Arc Lightning',icon:'ϟ',max:5,req:3,active:true,cost:24,cooldown:4,description:'Lightning jumps between up to 5 targets for {v}% damage.',base:155,step:30},
    {id:'ward',name:'Aether Ward',icon:'⛊',max:3,req:3,description:'+{v} armor. Dodge restores 6 spirit per rank.',base:4,step:4},
    {id:'vortex',name:'Gravity Well',icon:'◎',max:5,req:7,active:true,cost:35,cooldown:11,description:'Pull enemies into a vortex for 4 seconds, dealing {v}% damage per second.',base:65,step:15},
    {id:'convergence',name:'Convergence',icon:'❖',max:3,req:7,description:'+{v}% all damage for each mastery with 3+ invested points.',base:5,step:5},
  ]},
};
export const INNATE_SKILL={id:'lance',name:'Spirit Lance',icon:'➹',max:1,active:true,innate:true,cost:8,cooldown:2,base:110,step:0,description:'A focused aether projectile, aimed at the cursor. An innate ability available to every wayfarer.'};
export const ALL_SKILLS=[...Object.values(MASTERIES).flatMap(m=>m.nodes),INNATE_SKILL];
export const getSkill=id=>ALL_SKILLS.find(n=>n.id===id);
export const rankOf=(player,id)=>id==='lance'?1:player.skills[id]||0;
export const masteryPoints=(player,key)=>MASTERIES[key].nodes.reduce((sum,n)=>sum+rankOf(player,n.id),0);
export function canLearn(player,id) {
  if(getSkill(id)?.innate)return false;
  const skill=getSkill(id), key=Object.keys(MASTERIES).find(k=>MASTERIES[k].nodes.includes(skill));
  return !!skill && player.points>0 && rankOf(player,id)<skill.max && masteryPoints(player,key)>=skill.req;
}
export function learnSkill(player,id) {if(!canLearn(player,id))return false;player.skills[id]=(player.skills[id]||0)+1;player.points--;return true;}
export function playerStats(player) {
  const items=Object.values(player.equipment).filter(Boolean);
  const total=key=>items.reduce((s,i)=>s+(i.identified===false?0:(i[key]||0)*(['damage','armor'].includes(key)&&i.durability<=0?.5:1)),0);
  const r=id=>rankOf(player,id), invested=Object.keys(MASTERIES).filter(k=>masteryPoints(player,k)>=3).length;
  return {maxHp:120+(player.level-1)*16+r('vigor')*18+total('life'),maxMana:80+r('spirit')*12+total('spirit'),damage:18+(player.level-1)*2+total('damage'),armor:3+r('vigor')*2+r('ward')*4+total('armor'),crit:7+r('precision')*3+total('crit'),speed:3.8+total('speed'),regen:5+r('spirit')*.6,bonus:1+(total('bonus')+r('convergence')*5*invested)/100,fire:1+r('kindling')*.08,cold:1+r('resonance')*.08,cdr:1-r('flow')*.04};
}
export const xpNeeded=level=>70+level*45;
export function createPlayer() {
  return {x:0,y:0,level:1,xp:0,gold:0,points:4,skills:{cleave:1,bolt:1,nova:1},slots:['cleave','bolt','nova','lance'],mouseSkill:'bolt',equipment:{weapon:{name:'Pilgrim’s Longsword',slot:'weapon',rarity:'normal',damage:5,level:1,icon:'⚔',id:'starter-sword'},armor:{name:'Weathered Hauberk',slot:'armor',rarity:'normal',armor:3,level:1,icon:'⛊',id:'starter-armor'},charm:null,boots:null,helm:null,gloves:null,belt:null,ring:null,shield:null},inventory:[],stash:[],shards:0,identifyScrolls:0,buyback:[],shopStock:null,quests:{guideMet:false,scholarRescued:false,wardenDefeated:false,guideRewarded:false},hp:120,mana:80,potions:3,kills:0,deaths:0};
}
const ITEM_BASES={weapon:['Falchion','War Axe','Runeblade','Mace'],armor:['Chainmail','Brigandine','Cuirass','Vestment'],charm:['Talisman','Moonstone','Reliquary','Pendant'],boots:['Greaves','Pathfinders','Sabatons','Treads'],helm:['Sallet','War Helm','Crown','Great Helm'],gloves:['Gauntlets','Grips','Gloves','Handguards'],belt:['Girdle','War Belt','Sash','Belt'],ring:['Signet','Band','Ring','Seal'],shield:['Buckler','Kite Shield','Round Shield','Ward']};
export function generateItem(rng,depth,guaranteedRare=false) {
  const roll=rng(),rarity=guaranteedRare?(roll<.2?'legendary':'rare'):roll<.03?'legendary':roll<.22?'rare':roll<.65?'magic':'normal';
  const slot=Object.keys(ITEM_BASES)[Math.floor(rng()*Object.keys(ITEM_BASES).length)],power=({normal:1,magic:1.35,rare:1.8,legendary:2.5}[rarity])*(1+depth*.18);
  const base=ITEM_BASES[slot][Math.floor(rng()*4)];
  const prefix=['Ashen','Hollow','Gilded','Stormbound','Dread','Runic'][Math.floor(rng()*6)];
  const item={id:`${Date.now()}-${Math.floor(rng()*1e8)}`,name:rarity==='normal'?base:`${prefix} ${base}`,slot,rarity,level:depth,icon:{weapon:'⚔',armor:'⛊',charm:'◈',boots:'♜',helm:'♔',gloves:'✥',belt:'∞',ring:'◉',shield:'⛨'}[slot],identified:rarity==='normal',durability:100,reforges:0};
  if(slot==='weapon')item.damage=Math.round((4+rng()*4)*power);
  if(slot==='armor')item.armor=Math.round((3+rng()*4)*power);
  if(slot==='charm')item.spirit=Math.round((7+rng()*7)*power);
  if(slot==='boots')item.speed=Math.round((.1+rng()*.25)*power*100)/100;
  if(['helm','gloves','belt','shield'].includes(slot))item.armor=Math.round((2+rng()*3)*power);
  if(slot==='ring')item.crit=Math.max(1,Math.round(2*power));
  if(rarity!=='normal') {const key=['life','crit','bonus'][Math.floor(rng()*3)];item[key]=Math.round((key==='life'?12:key==='crit'?2:4)*power);}
  if(rarity==='rare'||rarity==='legendary') item.life=(item.life||0)+Math.round(10*power);
  if(rarity==='legendary')item.bonus=(item.bonus||0)+12;
  return item;
}
export function itemDescription(item) {
  return [['damage','Weapon damage'],['armor','Armor'],['life','Life'],['spirit','Spirit'],['crit','% critical chance'],['speed','Movement speed'],['bonus','% all damage']].filter(([key])=>item[key]).map(([key,name])=>`+${item[key]} ${name}`);
}
