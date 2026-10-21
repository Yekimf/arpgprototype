import './style.css';
import './town.css';
import './hud.css';
import {generateDungeon,random,distance,moveEntity,isWalkable,findPath,createPlayer,playerStats,MASTERIES,ALL_SKILLS,getSkill,rankOf,masteryPoints,learnSkill,canLearn,clamp,xpNeeded,generateItem} from './game.js';
import {Renderer} from './renderer.js';
import {migratePlayer,generateTown,generateStock,addToContainer,itemName} from './settlement.js';
import {TownUI,HUD_PANELS} from './town-ui.js';

const $=id=>document.getElementById(id);
const isTouch=matchMedia('(pointer:coarse)').matches;
const SAVE_KEY='ashen-reliquary-save-v1';
const renderer=new Renderer($('world'),$('minimap'));
let saved=null;
try{saved=JSON.parse(localStorage.getItem(SAVE_KEY));}catch{}
const validSave=saved?.version===1&&saved.player?.skills&&Array.isArray(saved.player.inventory)&&saved.player.equipment;
const player=migratePlayer(validSave?{...createPlayer(),...saved.player}:createPlayer());
const game={player,stats:playerStats(player),dungeon:null,loot:[],projectiles:[],effects:[],floaters:[],cooldowns:{},attackCooldown:0,attackAnim:0,dodgeCooldown:0,dodgeTime:0,potionCooldown:0,hurtFlash:0,moving:false,paused:false,panel:null,time:0,showLoot:false,largeMap:false,depth:validSave?saved.depth:1,seed:validSave?saved.seed:Math.floor(Math.random()*1e9),flow:null,flowTimer:0,aim:{x:player.x+1,y:player.y},target:null,mouseDown:false,lastMove:{x:1,y:0},sound:false,selectedMastery:'iron',selectedItem:null};
let keys=new Set(),touchMove={x:0,y:0},toastTimer,saveTimer=0,audioCtx,mouseScreen=null;
const townUI=new TownUI(game,{save,toast,openPanel,closePanel,enterDungeon,sound});
const SKILL_KEYS=['q','w','e','r'];
Object.assign(game,{primaryHeld:false,secondaryHeld:false,primaryMode:null,combatTarget:null,attackPending:false,walkPhase:0,facing:{x:1,y:0},actionFacing:{x:1,y:0},castLock:0,pointerOverWorld:false,hudWidth:0,moveRefresh:0,combatRefresh:0});

function setZoneUI(){
  const town=game.zone==='town';
  $('floor-label').textContent=town?'SANCTUARY':`DEPTH ${String(game.depth).padStart(2,'0')}`;
  $('map-depth').textContent=town?'⌂':String(game.depth);
  $('location').textContent=town?'Emberfall Encampment':game.depth===1?'The Hollow Crypt':game.depth<4?'The Sunken Ossuary':'The Endless Hollow';
  document.querySelector('.chapter>.eyebrow').textContent=town?'ACT I · THE LAST LIGHT':'ACT I · THE FORSAKEN DEPTHS';
  document.querySelector('.map-heading>span').textContent=town?'EMBERFALL':'THE HOLLOW CRYPT';
  document.querySelector('.map-caption').innerHTML=`<span class="map-dot"></span>${town?' SAFE HAVEN ':' UNCHARTED TERRITORY '}<span class="key-cap">M</span>`;
  $('objective').textContent=town?!player.quests.guideMet?'Speak to Sister Maelin':player.quests.wardenDefeated&&!player.quests.guideRewarded?'Return to Maelin for your reward':player.quests.scholarRescued?'Visit Edrin to identify your relics':'Rescue the archivist beneath the monastery':game.dungeon.bossDead?'Enter the rift to descend deeper':'Find and defeat the Hollow Warden';
  $('quest-progress').textContent=town?'Trade · Rest · Reforge · Prepare':`Explore the crypt · Depth ${game.depth}`;
  $('journey-button').textContent=town?'Enter the crypt →':'Town portal · T';
  $('town-services').classList.toggle('hidden',!town);
  document.querySelector('[data-npc="scholar"]').disabled=!player.quests.scholarRescued;
  document.querySelector('[data-npc="scholar"] small').textContent=player.quests.scholarRescued?'IDENTIFY RELICS':'ARCHIVIST · MISSING';
  $('seed-label').textContent=town?'EMBERFALL · SAFE HAVEN':`SEED ${game.seed.toString(16).toUpperCase()}`;
  document.querySelector('.zone-intro h1').textContent=$('location').textContent;
  document.querySelector('.zone-intro .eyebrow').textContent=town?'WHERE THE LAST LANTERNS BURN':'BENEATH THE OLD MONASTERY';
  document.querySelector('.zone-intro>div').textContent=town?'A small light against a gathering dark.':'Let the forgotten remember your name.';
}
function enterTown(initial=false){
  if(!initial&&game.zone==='dungeon')game.expedition={dungeon:game.dungeon,loot:game.loot,position:{x:player.x,y:player.y},depth:game.depth,seed:game.seed};
  clearAttackOrder();game.zone='town';game.dungeon=generateTown(player);game.loot=[];game.projectiles=[];game.effects=[];game.floaters=[];game.target=null;game.path=null;game.channel=null;game.interactTarget=null;game.mouseDown=false;
  player.x=game.dungeon.start.x;player.y=game.dungeon.start.y;
  player.shopStock??=generateStock(player.level,game.seed);
  renderer.camera={...renderer.iso(player.x,player.y)};buildFlow();setZoneUI();
  if(!initial){save();toast('EMBERFALL · You are safe here.');}
}
function enterDungeon(){
  if(game.expedition){
    const expedition=game.expedition;clearAttackOrder();game.zone='dungeon';game.dungeon=expedition.dungeon;game.loot=expedition.loot;game.depth=expedition.depth;game.seed=expedition.seed;player.x=expedition.position.x;player.y=expedition.position.y;game.expedition=null;game.target=null;game.path=null;game.interactTarget=null;game.channel=null;game.projectiles=[];game.effects=[];game.floaters=[];renderer.camera={...renderer.iso(player.x,player.y)};buildFlow();setZoneUI();
  }else newFloor(game.depth,game.seed);
  save();toast('The Hollow Crypt · Press T to return to town.');
}
function townPortal(){
  clearAttackOrder();
  if(game.paused)return;if(game.zone==='town'){openPanel('departure');return;}
  if(game.channel)return;game.target=null;game.path=null;game.channel={remaining:3};game.mouseDown=false;
  toast('Opening a town portal · Hold still for 3 seconds',3100);effect('ring',player.x,player.y,3,{radius:1.3,color:'#a8bbd0'});
}

function newFloor(depth,seed){
  clearAttackOrder();game.zone='dungeon';game.path=null;game.channel=null;game.interactTarget=null;
  game.depth=depth;game.seed=seed;game.dungeon=generateDungeon(seed,depth);game.loot=[];game.effects=[];game.projectiles=[];game.floaters=[];game.target=null;
  const start=game.dungeon.start;player.x=start.x;player.y=start.y;game.aim={x:player.x+2,y:player.y};game.flowTimer=0;
  renderer.camera={...renderer.iso(player.x,player.y)};
  setZoneUI();reveal();buildFlow();
}
if(saved?.zone==='dungeon')newFloor(game.depth,game.seed);else enterTown(true);
player.hp=clamp(player.hp||game.stats.maxHp,1,game.stats.maxHp);player.mana=clamp(player.mana,0,game.stats.maxMana);

function save(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,player,depth:game.depth,seed:game.seed,zone:game.zone}));}catch{}
}
function toast(text,duration=2700){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.remove('hidden');toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),duration);}
function sound(freq=200,length=.08,type='triangle',volume=.035){
  if(!game.sound)return;
  try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.4,audioCtx.currentTime+length);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+length);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+length);}catch{}
}
function effect(type,x,y,life=.5,extra={}){game.effects.push({type,x,y,life,maxLife:life,...extra});}
function floater(text,x,y,color,crit=false){game.floaters.push({text:String(text),x,y,life:1.4,color,crit});}
function nearestEnemy(range=8,point=player){return game.dungeon.enemies.filter(e=>!e.dead&&distance(e,player)<range).sort((a,b)=>distance(a,point)-distance(b,point))[0];}
function enemyUnderPointer(){
  if(!mouseScreen||!game.pointerOverWorld)return null;
  return game.dungeon.enemies.filter(e=>!e.dead&&game.dungeon.seen.has(Math.floor(e.y)*game.dungeon.size+Math.floor(e.x))).sort((a,b)=>(b.x+b.y)-(a.x+a.y)).find(e=>{
    const at=renderer.screen(e.x,e.y),height=(e.type==='warden'?144:e.type==='crawler'?30:82)*renderer.zoom,width=(e.type==='warden'?49:e.type==='crawler'?24:31)*renderer.zoom;
    return Math.abs(mouseScreen.x-at.x)<width&&mouseScreen.y>=at.y-height&&mouseScreen.y<=at.y+7;
  })||null;
}
function aimPoint(id='basic'){
  if(isTouch){const target=nearestEnemy(8);return target?{x:target.x,y:target.y}:{x:player.x+game.lastMove.x*3,y:player.y+game.lastMove.y*3};}
  const enemy=enemyUnderPointer();if(enemy)return {x:enemy.x,y:enemy.y};
  return mouseScreen?renderer.unproject(mouseScreen.x,mouseScreen.y,['meteor','vortex'].includes(id)?0:24):game.aim;
}
function facePoint(point){const dx=point.x-player.x,dy=point.y-player.y,length=Math.hypot(dx,dy)||1;game.actionFacing={x:dx/length,y:dy/length};game.facing={...game.actionFacing};}
function clearAttackOrder(){game.combatTarget=null;game.attackPending=false;game.primaryHeld=false;game.secondaryHeld=false;game.primaryMode=null;}
function damageEnemy(e,base,element='physical',allowCrit=true){
  if(e.dead)return;
  let damage=base*game.stats.bonus*(element==='fire'?game.stats.fire:element==='cold'||element==='aether'?game.stats.cold:1);
  const crit=allowCrit&&Math.random()*100<game.stats.crit;if(crit)damage*=1.75;
  if(e.hp/e.maxHp<.35)damage*=1+rankOf(player,'execution')*.15;
  damage=Math.max(1,Math.round(damage*(.9+Math.random()*.2)));e.hp-=damage;e.hit=.16;e.aggro=true;
  floater(damage,e.x,e.y,crit?'#f0d28a':element==='fire'?'#eab184':element==='cold'?'#b7dde0':'#d7dbbf',crit);
  if(element==='physical'&&rankOf(player,'blood'))player.hp=Math.min(game.stats.maxHp,player.hp+rankOf(player,'blood')*2);
  if(e.hp<=0)kill(e);
}
function kill(e){
  e.dead=true;e.hp=0;player.kills++;const boss=e.type==='warden';
  const xp=boss?150+game.depth*30:e.elite?32:12+game.depth*2;player.xp+=xp;
  effect('impact',e.x,e.y,.5,{color:boss?'#d1b971':'#a5b78e'});
  game.loot.push({x:e.x+.2,y:e.y,gold:boss?80+game.depth*30:3+Math.floor(Math.random()*9*game.depth)});
  const rng=random(Math.floor(Math.random()*1e9));
  if(boss||e.elite||rng()<.3)game.loot.push({x:e.x-.3,y:e.y+.3,item:generateItem(rng,game.depth,boss)});
  if(boss){game.dungeon.bossDead=true;player.quests.wardenDefeated=true;player.quests.scholarRescued=true;player.points+=2;player.potions=Math.min(5,player.potions+2);$('objective').textContent='Return to Maelin · or descend deeper';$('quest-progress').textContent='Archivist rescued · +2 mastery points';toast('EDRIN IS FREE · The archivist awaits you in Emberfall. Press T.',5500);sound(560,.7,'sine');}
  player.hp=Math.min(game.stats.maxHp,player.hp+rankOf(player,'phoenix')*6);player.mana=Math.min(game.stats.maxMana,player.mana+rankOf(player,'phoenix')*3);
  while(player.xp>=xpNeeded(player.level)){
    player.xp-=xpNeeded(player.level);player.level++;player.points+=3;game.stats=playerStats(player);player.hp=game.stats.maxHp;player.mana=game.stats.maxMana;player.potions=Math.min(5,player.potions+1);effect('ring',player.x,player.y,1.2,{radius:3,color:'#cbd69c'});toast(`LEVEL ${player.level} · +3 mastery points · Press K`);sound(680,.45,'sine');
  }
  if(Math.random()<.07&&player.potions<5){player.potions++;floater('+1 flask',e.x,e.y,'#ba9b87');}
}
function hurt(amount){
  if(game.dodgeTime>0||player.hp<=0)return;
  if(game.channel){game.channel=null;toast('Portal interrupted by damage.',1300);}
  for(const item of Object.values(player.equipment).filter(Boolean))item.durability=Math.max(0,(item.durability??100)-.35);
  const reduction=player.mana>game.stats.maxMana*.5?rankOf(player,'ash')*.05:0;
  const damage=Math.max(1,Math.round(amount*100/(100+game.stats.armor*3)*(1-reduction)));
  player.hp-=damage;game.hurtFlash=.8;floater(`−${damage}`,player.x,player.y,'#df8e78');sound(95,.1,'sawtooth',.018);
  if(player.hp<=0){player.hp=0;player.deaths++;game.mouseDown=false;openPanel('death');save();}
}
function basicAttack(target=null){
  if(game.zone==='town'||game.channel||game.dodgeTime>0||game.attackCooldown>0||game.paused||player.hp<=0)return false;
  if(player.equipment.weapon)player.equipment.weapon.durability=Math.max(0,(player.equipment.weapon.durability??100)-.12);
  game.castColor=null;game.attackCooldown=.48;game.attackAnim=.36;game.castLock=.12;const aim=target||aimPoint();facePoint(aim);const ax=aim.x-player.x,ay=aim.y-player.y,len=Math.hypot(ax,ay)||1;
  effect('slash',player.x,player.y,.28,{dx:ax/len,dy:ay/len,radius:1.85});
  let hit=false;
  for(const e of game.dungeon.enemies){if(e.dead||distance(e,player)>1.85)continue;const dot=((e.x-player.x)*ax+(e.y-player.y)*ay)/((distance(e,player)||1)*len);if(dot>.35||isTouch){damageEnemy(e,game.stats.damage);hit=true;effect('impact',e.x,e.y,.23);}}
  sound(hit?180:120,.1,'triangle');
  return true;
}
function cast(slot){return castSkill(player.slots[slot]);}
function castSkill(id,quiet=false){
  if(game.paused||game.dodgeTime>0||player.hp<=0)return;
  if(game.zone==='town'){if(!quiet)toast('Emberfall is a sanctuary. Save your strength for the crypt.',1700);return;}
  if(game.channel){game.channel=null;toast('Portal interrupted.',1000);}
  const skill=getSkill(id),rank=rankOf(player,id);
  if(!skill||!rank)return toast('Learn and equip an ability in Masteries · K');
  if((game.cooldowns[id]||0)>0)return;
  if(player.mana<skill.cost){if(!quiet){toast('Not enough spirit',1200);sound(100,.08);}return;}
  player.mana-=skill.cost;game.cooldowns[id]=skill.cooldown*game.stats.cdr;
  const power=game.stats.damage*(skill.base+(rank-1)*skill.step)/100,aim=aimPoint(id);facePoint(aim);game.attackAnim=.38;game.castLock=.12;game.castColor=id==='bolt'||id==='meteor'||id==='inferno'?'#ec9c5e':'#a1c8e5';let dx=aim.x-player.x,dy=aim.y-player.y,len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
  const range=7,point={x:player.x+dx*Math.min(len,range),y:player.y+dy*Math.min(len,range)};
  if(id==='cleave'){
    effect('slash',player.x,player.y,.4,{dx,dy,radius:2.7});
    for(const e of game.dungeon.enemies)if(!e.dead&&distance(e,player)<2.7&&((e.x-player.x)*dx+(e.y-player.y)*dy)/(distance(e,player)||1)>.35)damageEnemy(e,power);
    game.attackAnim=.4;sound(150,.22,'sawtooth',.025);
  }else if(id==='bolt'||id==='lance'){
    game.projectiles.push({x:player.x,y:player.y,dx,dy,speed:id==='lance'?12:10,life:1.05,damage:power,kind:id==='lance'?'aether':'fire',hits:new Set(),hostile:false});sound(id==='lance'?570:410,.2,'sawtooth',.015);
  }else if(id==='nova'||id==='quake'||id==='inferno'){
    const radius=id==='quake'?3.2:id==='nova'?3.6:4.5;elementBurst(id,player.x,player.y,radius,power);sound(id==='nova'?620:130,.4,'triangle');
  }else if(id==='meteor'){
    effect('meteor-warning',point.x,point.y,.85,{radius:2.4,pending:true,damage:power});sound(180,.6,'sine');
  }else if(id==='chain'){
    const targets=game.dungeon.enemies.filter(e=>!e.dead&&distance(e,player)<8).sort((a,b)=>distance(a,aim)-distance(b,aim)).slice(0,5);
    let source=player;for(const e of targets){effect('lightning',source.x,source.y,.35,{tx:e.x,ty:e.y});damageEnemy(e,power,'aether');source=e;}if(!targets.length)effect('lightning',player.x,player.y,.3,{tx:point.x,ty:point.y});sound(730,.2,'sawtooth',.02);
  }else if(id==='whirl'){
    for(let i=0;i<6;i++){const a=i*Math.PI/3;game.projectiles.push({x:player.x,y:player.y,dx:Math.cos(a),dy:Math.sin(a),speed:6,life:1,damage:power,kind:'blade',hits:new Set(),hostile:false});}effect('ring',player.x,player.y,.65,{radius:4,color:'#d3c59c'});sound(200,.4);
  }else if(id==='vortex'){
    effect('vortex',point.x,point.y,4,{radius:3,damage:power,tick:.5});sound(220,.4,'sine');
  }
  return true;
}
function elementBurst(id,x,y,radius,power){
  const element=id==='nova'?'cold':id==='quake'?'physical':'fire';effect(id,x,y,.8,{radius,color:element==='cold'?'#95cfd0':element==='fire'?'#e2a56e':'#b3aa79'});
  for(const e of game.dungeon.enemies)if(!e.dead&&distance(e,{x,y})<radius){damageEnemy(e,power,element);if(id==='nova'||id==='quake')e.slow=3;if(id==='inferno'){e.burn=4;e.burnPower=power*.15;}}
}
function dodge(){
  if(game.paused||game.dodgeCooldown>0||player.hp<=0)return;
  const input=movement(),aim=aimPoint(),direction=!isTouch?{x:aim.x-player.x,y:aim.y-player.y}:Math.hypot(input.x,input.y)>.05?input:game.lastMove;let dx=direction.x,dy=direction.y,len=Math.hypot(dx,dy)||1;
  clearAttackOrder();game.path=null;game.attackAnim=0;game.facing={x:dx/len,y:dy/len};game.dodgeVector={x:dx/len,y:dy/len};game.dodgeTime=.28;game.dodgeCooldown=2.8;player.mana=Math.min(game.stats.maxMana,player.mana+rankOf(player,'ward')*6);effect('ring',player.x,player.y,.35,{radius:1,color:'#b5c5a4'});game.target=null;sound(140,.12);
}
function potion(){
  if(game.paused||game.potionCooldown>0||player.hp<=0)return;
  if(player.hp>=game.stats.maxHp)return toast('Your life is already full',1200);
  if(!player.potions)return toast('Flask empty · Enemies may drop charges',1800);
  player.potions--;player.hp=Math.min(game.stats.maxHp,player.hp+game.stats.maxHp*.55);game.potionCooldown=4;effect('heal',player.x,player.y,.8);floater('+55% life',player.x,player.y,'#c4d995');sound(440,.3,'sine');
}
function interact(){
  if(game.paused)return;
  if(game.zone==='town'){
    const npc=game.dungeon.npcs.filter(n=>distance(n,player)<3).sort((a,b)=>distance(a,player)-distance(b,player))[0];
    if(npc){openPanel(npc.id);return;}
    const stash=game.dungeon.props.find(p=>p.stash);if(distance(stash,player)<2.5){openPanel('stash');return;}
    if(distance(game.dungeon.portal,player)<2.7){openPanel('departure');return;}
    toast('Click a townsfolk, the stash, or the crypt gate to approach.',1900);return;
  }
  if(game.dungeon.bossDead&&distance(player,game.dungeon.portal)<2.7){descend();return;}
  const nearby=game.loot.filter(l=>distance(l,player)<3.5);if(nearby.length)nearby.forEach(pickup);else toast('Move close to loot or an open rift',1400);
}
function descend(){
  player.hp=game.stats.maxHp;player.mana=game.stats.maxMana;player.potions=Math.min(5,player.potions+1);
  newFloor(game.depth+1,Math.floor(Math.random()*1e9));save();toast(`DEPTH ${game.depth} · The darkness grows stronger`,3500);
  const intro=$('zone-intro');intro.querySelector('h1').textContent=$('location').textContent;intro.style.animation='none';void intro.offsetWidth;intro.style.animation='intro 9s forwards';
}
function pickup(loot){
  if(!game.loot.includes(loot))return;
  if(loot.item){if(!addToContainer(player.inventory,loot.item)){if(!loot.warned){toast('Your pack is full · Return to town to trade or store gear.');loot.warned=true;}return;}toast(`Acquired ${itemName(loot.item)}`,1800);sound(760,.15,'sine');}
  else{player.gold+=loot.gold;floater(`+${loot.gold} gold`,loot.x,loot.y,'#c8b477');sound(840,.07,'sine',.015);}
  game.loot.splice(game.loot.indexOf(loot),1);
}
function reveal(){const d=game.dungeon,r=9.5;for(let y=Math.floor(player.y-r);y<=player.y+r;y++)for(let x=Math.floor(player.x-r);x<=player.x+r;x++)if(x>=0&&y>=0&&x<d.size&&y<d.size&&Math.hypot(x-player.x,y-player.y)<r)d.seen.add(y*d.size+x);}
function buildFlow(){
  const d=game.dungeon,flow=Array.from({length:d.size},()=>Array(d.size).fill(Infinity)),queue=[[Math.floor(player.x),Math.floor(player.y)]];
  flow[queue[0][1]][queue[0][0]]=0;
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(d.tiles[ny]?.[nx]&&flow[ny][nx]===Infinity){flow[ny][nx]=flow[y][x]+1;queue.push([nx,ny]);}}}
  game.flow=flow;game.flowTimer=.65;
}
function movement(){
  let sx=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0),sy=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0);
  sx+=touchMove.x;sy+=touchMove.y;
  // Convert screen-relative input to the isometric world plane.
  let dx=sx+sy,dy=sy-sx,len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
  return{x:dx,y:dy};
}
function update(dt){
  game.time+=dt;if(game.paused)return;
  if(mouseScreen&&!isTouch)game.aim=aimPoint();
  $('world').classList.toggle('is-hostile',Boolean(enemyUnderPointer()));
  game.castLock=Math.max(0,game.castLock-dt);game.moveRefresh-=dt;game.combatRefresh-=dt;
  game.stats=playerStats(player);game.attackCooldown=Math.max(0,game.attackCooldown-dt);game.attackAnim=Math.max(0,game.attackAnim-dt);game.dodgeCooldown=Math.max(0,game.dodgeCooldown-dt);game.potionCooldown=Math.max(0,game.potionCooldown-dt);game.hurtFlash=Math.max(0,game.hurtFlash-dt*2);
  for(const id in game.cooldowns)game.cooldowns[id]=Math.max(0,game.cooldowns[id]-dt);
  player.mana=Math.min(game.stats.maxMana,player.mana+game.stats.regen*dt);
  if(!nearestEnemy(6))player.hp=Math.min(game.stats.maxHp,player.hp+dt*.8);
  let m=movement();const manual=Math.hypot(m.x,m.y)>.05;
  if(manual){game.target=null;game.path=null;game.interactTarget=null;game.combatTarget=null;game.attackPending=false;}
  if(game.primaryHeld&&game.primaryMode==='move'&&mouseScreen&&game.moveRefresh<=0&&game.pointerOverWorld&&!manual){
    game.moveRefresh=.16;walkTo(renderer.unproject(mouseScreen.x,mouseScreen.y),false);
  }
  if(game.combatTarget?.dead){game.combatTarget=null;game.attackPending=false;game.target=null;game.path=null;}
  if(game.combatTarget){
    if(distance(game.combatTarget,player)>1.55){if(game.combatRefresh<=0){setMoveTarget(game.combatTarget);game.combatRefresh=.3;}}
    else{game.target=null;game.path=null;if(game.attackPending||game.primaryHeld){if(basicAttack(game.combatTarget)){game.attackPending=false;if(!game.primaryHeld)game.combatTarget=null;}}}
  }
  if(!manual&&game.target){
    if(game.target.dead){game.target=null;game.path=null;}
    while(game.path?.length&&distance(player,game.path[0])<.2)game.path.shift();
    const waypoint=game.path?.[0]||game.target||player;
    const dx=waypoint.x-player.x,dy=waypoint.y-player.y,len=Math.hypot(dx,dy);
    if(len>.2){m={x:dx/len,y:dy/len};}else game.target=null;
  }
  const beforeMove={x:player.x,y:player.y};
  if(game.dodgeTime>0){game.dodgeTime=Math.max(0,game.dodgeTime-dt);m=game.dodgeVector;moveEntity(game.dungeon,player,m.x*13*dt,m.y*13*dt);}
  else if(game.castLock<=0)moveEntity(game.dungeon,player,m.x*game.stats.speed*dt,m.y*game.stats.speed*dt);
  game.moving=distance(beforeMove,player)>.0001;if(game.moving){game.lastMove={...m};game.walkPhase+=dt*8;if(game.attackAnim<=0)game.facing={...m};}
  else if(game.pointerOverWorld&&game.attackAnim<=0)facePoint(aimPoint());
  game.stepTimer=(game.stepTimer||0)-dt;
  if(game.moving&&game.stepTimer<=0){game.stepTimer=.22;effect('dust',beforeMove.x,beforeMove.y,.4);}
  if(game.channel){
    if(game.moving){game.channel=null;toast('Portal interrupted by movement.',1300);}
    else{game.channel.remaining-=dt;if(game.channel.remaining<=0){enterTown();return;}}
  }
  if(game.interactTarget&&distance(player,game.interactTarget)<1.5){const target=game.interactTarget;game.interactTarget=null;game.target=null;game.path=null;openPanel(target.interaction);return;}
  if(game.zone==='town'){player.hp=Math.min(game.stats.maxHp,player.hp+dt*6);}
  if(game.mouseDown||game.primaryHeld&&game.primaryMode==='force')basicAttack();
  if(game.zone==='dungeon'){
    if(game.secondaryHeld)castSkill(player.mouseSkill,true);
    SKILL_KEYS.forEach((key,slot)=>{if(keys.has(key))castSkill(player.slots[slot],true);});
  }
  reveal();game.flowTimer-=dt;if(game.flowTimer<=0)buildFlow();
  for(const e of game.dungeon.enemies){
    if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);e.cooldown-=dt;e.phase+=dt;
    if(e.burn>0){e.burn-=dt;e.burnTick=(e.burnTick||0)-dt;if(e.burnTick<=0){e.burnTick=.7;damageEnemy(e,e.burnPower||4,'fire',false);}}
    if(e.dead)continue;
    const dist=distance(e,player),boss=e.type==='warden';
    if(dist<(boss?9:6.5))e.aggro=true;if(!e.aggro||dist>18)continue;
    if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.attackAnim=.3;if(boss){effect('quake',e.x,e.y,.65,{radius:2.6,color:'#b7a579'});if(dist<2.7)hurt(e.damage*1.6);e.cooldown=3.2;}else{if(dist<1.35)hurt(e.damage);e.cooldown=1.2;}}continue;}
    if(boss&&dist<2.6&&e.cooldown<=0){e.windup=.85;continue;}
    if(e.type==='wraith'&&dist<6&&e.cooldown<=0){const dx=player.x-e.x,dy=player.y-e.y;game.projectiles.push({x:e.x,y:e.y,dx:dx/dist,dy:dy/dist,speed:3.4,life:2.8,damage:e.damage,kind:'aether',hostile:true});e.cooldown=2.5;continue;}
    if(dist<1.05){if(e.cooldown<=0)e.windup=.32;continue;}
    if(e.type==='wraith'&&dist<3)continue;
    let dx=(player.x-e.x)/dist,dy=(player.y-e.y)/dist;
    const clear=isWalkable(game.dungeon,e.x+dx*.7,e.y+dy*.7);
    if(!clear||dist>5){const tx=Math.floor(e.x),ty=Math.floor(e.y);let best={value:game.flow[ty]?.[tx]??Infinity,x:tx,y:ty};
      for(const[ox,oy]of[[1,0],[-1,0],[0,1],[0,-1]]){const value=game.flow[ty+oy]?.[tx+ox]??Infinity;if(value<best.value)best={value,x:tx+ox,y:ty+oy};}
      const vx=best.x+.5-e.x,vy=best.y+.5-e.y,l=Math.hypot(vx,vy)||1;dx=vx/l;dy=vy/l;
    }
    const speed=e.speed*(e.slow>0?.4:1);
    // Local separation prevents a pack collapsing into one sprite.
    let repelX=0,repelY=0;for(const other of game.dungeon.enemies){if(other===e||other.dead)continue;const len=distance(e,other);if(len<.55&&len>.01){repelX+=(e.x-other.x)/len*.4;repelY+=(e.y-other.y)/len*.4;}}
    moveEntity(game.dungeon,e,(dx+repelX)*speed*dt,(dy+repelY)*speed*dt);
  }
  for(const b of game.projectiles){
    b.life-=dt;b.x+=b.dx*b.speed*dt;b.y+=b.dy*b.speed*dt;
    if(!isWalkable(game.dungeon,b.x,b.y,.05)){b.life=0;effect('impact',b.x,b.y,.2,{color:'#d5a671'});continue;}
    if(b.hostile){if(distance(b,player)<.55){hurt(b.damage);b.life=0;effect('impact',b.x,b.y,.3,{color:'#92c7b0'});}}
    else for(const e of game.dungeon.enemies){if(e.dead||b.hits.has(e.id)||distance(b,e)>.65)continue;b.hits.add(e.id);damageEnemy(e,b.damage,b.kind==='blade'?'physical':b.kind==='aether'?'aether':'fire');if(b.kind==='fire'){e.burn=3;e.burnPower=b.damage*.12;}effect('impact',e.x,e.y,.3,{color:b.kind==='fire'?'#ebbc7c':'#b4cee5'});}
  }
  game.projectiles=game.projectiles.filter(b=>b.life>0);
  for(const e of game.effects){
    e.life-=dt;
    if(e.type==='meteor-warning'&&e.life<=0&&e.pending){e.pending=false;elementBurst('inferno',e.x,e.y,e.radius,e.damage);}
    if(e.type==='vortex'){
      e.tick-=dt;
      for(const enemy of game.dungeon.enemies)if(!enemy.dead&&distance(enemy,e)<3.5){const dx=e.x-enemy.x,dy=e.y-enemy.y;moveEntity(game.dungeon,enemy,dx*dt*.9,dy*dt*.9);enemy.slow=.2;if(e.tick<=0)damageEnemy(enemy,e.damage*.5,'aether');}
      if(e.tick<=0)e.tick=.5;
    }
  }
  game.effects=game.effects.filter(e=>e.life>0);for(const f of game.floaters)f.life-=dt;game.floaters=game.floaters.filter(f=>f.life>0);
  for(const loot of [...game.loot])if(distance(loot,player)<(loot.item?1.05:1.6))pickup(loot);
  if(isTouch&&game.dungeon.bossDead&&distance(player,game.dungeon.portal)<1.2){game.target=null;openPanel('descend');}
  saveTimer+=dt;if(saveTimer>5){save();saveTimer=0;}
}

let hudTimer=0;
function updateHud(dt){
  hudTimer+=dt;if(hudTimer<.08)return;hudTimer=0;
  const s=game.stats;
  $('channel-progress').classList.toggle('hidden',!game.channel);
  if(game.channel)$('channel-progress').querySelector('b').style.width=`${(1-game.channel.remaining/3)*100}%`;
  const npc=game.zone==='town'?game.dungeon.npcs.filter(n=>distance(n,player)<3).sort((a,b)=>distance(a,player)-distance(b,player))[0]:null;
  const nearbyStash=game.zone==='town'&&distance(game.dungeon.props.find(o=>o.stash),player)<2.5;
  const nearGate=game.zone==='town'&&distance(game.dungeon.portal,player)<2.7;
  $('interact-button').classList.toggle('hidden',!npc&&!nearbyStash&&!nearGate);
  $('interact-label').textContent=npc?`Speak to ${npc.name}`:nearbyStash?'Open personal stash':'Enter the crypt';
  $('health-text').textContent=`${Math.ceil(player.hp)} / ${s.maxHp}`;$('mana-text').textContent=`${Math.floor(player.mana)} / ${s.maxMana}`;
  $('health-liquid').style.height=`${player.hp/s.maxHp*100}%`;$('mana-liquid').style.height=`${player.mana/s.maxMana*100}%`;
  $('level-text').textContent=`LV. ${player.level} · ${player.level<5?'WAYFARER':player.level<10?'HOLLOW WALKER':'RELIC BEARER'}`;$('gold-text').textContent=`◈ ${player.gold.toLocaleString()}`;
  $('xp-fill').style.width=`${player.xp/xpNeeded(player.level)*100}%`;$('skill-badge').textContent=player.points;$('skill-badge').classList.toggle('hidden',!player.points);
  $('potion-text').textContent=`Flask · ${player.potions}`;
  document.querySelectorAll('[data-slot]').forEach(button=>{
    const id=player.slots[Number(button.dataset.slot)],skill=getSkill(id),cd=game.cooldowns[id]||0;
    button.querySelector('.ability-art').textContent=skill?.icon||'+';button.querySelector('.ability-name').textContent=skill?.name||'Empty';button.title=skill?`${skill.name} · ${skill.cost} spirit · ${skill.cooldown}s cooldown`:'Assign an ability in Masteries';
    const overlay=button.querySelector('i');overlay.style.display=cd>0?'flex':'none';overlay.textContent=cd.toFixed(1);button.style.opacity=skill&&player.mana<skill.cost?'.5':'1';
  });
  const mouseSkill=getSkill(player.mouseSkill),mouseButton=$('mouse-slot'),mouseCd=game.cooldowns[player.mouseSkill]||0;mouseButton.querySelector('.ability-art').textContent=mouseSkill.icon;mouseButton.querySelector('.ability-name').textContent=mouseSkill.name;mouseButton.title=`Right mouse: ${mouseSkill.name} · Click to rebind`;mouseButton.querySelector('i').style.display=mouseCd>0?'flex':'none';mouseButton.querySelector('i').textContent=mouseCd.toFixed(1);
  for(const[id,cd]of[['dodge-slot',game.dodgeCooldown],['potion-slot',game.potionCooldown]]){const overlay=$(id).querySelector('i');overlay.style.display=cd>0?'flex':'none';overlay.textContent=cd.toFixed(1);}
  const enemy=nearestEnemy(8,game.aim),boss=game.dungeon.enemies.find(e=>e.type==='warden'&&!e.dead&&distance(e,player)<9),target=boss||(enemy&&distance(enemy,game.aim)<1.4?enemy:null);
  $('enemy-health').classList.toggle('hidden',!target);
  if(target){$('enemy-name').textContent=target.type==='warden'?'The Hollow Warden':target.type==='wraith'?'Sepulchral Wraith':target.type==='crawler'?'Crypt Crawler':target.elite?'Oathbound Remnant':'Restless Remnant';$('enemy-fill').style.width=`${target.hp/target.maxHp*100}%`;$('enemy-kind').textContent=target.type==='warden'?'ANCIENT · BOSS':target.elite?'CHAMPION · UNDEAD':'UNDEAD';}
}

function openPanel(panel){
  if(player.hp<=0&&panel!=='death')return;
  if(game.panel===panel&&panel!=='death'){closePanel();return;}
  game.panel=panel;game.paused=!HUD_PANELS.includes(panel)||innerWidth<=700;game.mouseDown=false;clearAttackOrder();game.target=null;game.path=null;game.interactTarget=null;keys.clear();touchMove={x:0,y:0};$('joystick-knob').style.transform='';$('modal-backdrop').classList.remove('hidden');$('modal').setAttribute('aria-modal',String(game.paused));$('skill-picker').classList.add('hidden');renderPanel();
  setTimeout(()=>$('modal').querySelector('button')?.focus(),0);
}
function closePanel(){if(game.panel==='death')return;game.panel=null;game.paused=false;game.hudWidth=0;$('modal-backdrop').classList.add('hidden');$('modal-backdrop').classList.remove('hud-mode');townUI.hud.hideTooltip();$('world').focus({preventScroll:true});save();}
const title=(eyebrow,name)=>`<button class="close" data-action="close" aria-label="Close panel">×</button><span class="eyebrow">${eyebrow}</span><h2 id="modal-title">${name}</h2>`;
function renderPanel(){
  const modal=$('modal');
  modal.classList.remove('expanded-modal');
  if(townUI.render(game.panel))return;
  if(game.panel==='skills'){
    const key=game.selectedMastery,mastery=MASTERIES[key],points=masteryPoints(player,key);
    modal.innerHTML=title('THREE PATHS. ONE FATE.','Shape your legacy')+`<p>Weave any of the three masteries into your build. Invest points to unlock deeper powers.</p><div class="mastery-tabs">${Object.entries(MASTERIES).map(([k,m])=>`<button class="${k===key?'active':''}" data-mastery="${k}">${m.name}<small>${m.subtitle}</small></button>`).join('')}</div><div class="skill-summary"><span><strong>${player.points}</strong> points available · <strong>${points}</strong> invested in ${mastery.name}</span><button class="text-button" data-action="respec">Respec · ${respecCost()} gold</button></div><div class="skill-tree">${mastery.nodes.map(n=>{
      const rank=rankOf(player,n.id),locked=points<n.req,value=n.base+Math.max(0,rank-1)*n.step;
      return `<article class="skill-node ${locked?'locked':''} ${rank?'learned':''}"><span class="node-icon">${n.icon}</span><h3>${n.name}</h3><span class="rank">${n.active?'ACTIVE':'PASSIVE'} · ${rank} / ${n.max}</span><p>${n.description.replace('{v}',value)}</p><span class="rank">${locked?`REQUIRES ${n.req} INVESTED POINTS`:n.active?`${n.cost} SPIRIT · ${n.cooldown}s COOLDOWN`:`${rank?'NEXT RANK: '+(n.base+rank*n.step):'AVAILABLE TO LEARN'}`}</span><div class="node-actions"><button class="small-button" data-learn="${n.id}" ${!canLearn(player,n.id)?'disabled':''}>${rank===n.max?'Max rank':rank?'Rank up +':'Learn +'}</button>${n.active&&rank?`<select data-bind="${n.id}" aria-label="Assign ${n.name} to skill slot"><option value="">Equip…</option>${[0,1,2,3].map(s=>`<option value="${s}">${SKILL_KEYS[s].toUpperCase()}${player.slots[s]===n.id?' ✓':''}</option>`).join('')}</select>`:''}</div></article>`;
    }).join('')}</div><div class="modal-footer"><small>Level up: +3 points · Warden defeated: +2 points<br>Masteries and equipment combine. Experiment freely.</small><button class="primary-button" data-action="close">Return to ${game.zone==='town'?'Emberfall':'the crypt'}</button></div>`;
  }else if(game.panel==='character'){
    const s=game.stats,stats=[['Level',player.level],['Life',s.maxHp],['Spirit',s.maxMana],['Weapon damage',s.damage],['Armor',s.armor],['Critical chance',`${s.crit}%`],['Damage multiplier',`${Math.round(s.bonus*100)}%`],['Spirit regeneration',`${s.regen.toFixed(1)} / sec`],['Fire damage',`${Math.round(s.fire*100)}%`],['Cold / aether damage',`${Math.round(s.cold*100)}%`],['Cooldown reduction',`${Math.round((1-s.cdr)*100)}%`],['Movement speed',s.speed.toFixed(2)],['Enemies defeated',player.kills],['Deepest descent',game.depth],['Deaths',player.deaths],['Next level',`${player.xp} / ${xpNeeded(player.level)} XP`]];
    modal.innerHTML=title('A PILGRIM WITHOUT A GRAVE','The Wayfarer')+`<p>Steel, cinder, and aether. Your choices write the chronicle.</p><div class="stats-grid">${stats.map(([n,v])=>`<div class="stat"><span>${n}</span><strong>${v}</strong></div>`).join('')}</div><div class="build-tags">${Object.entries(MASTERIES).map(([k,m])=>`<span>${m.name} · ${masteryPoints(player,k)} points</span>`).join('')}</div><div class="modal-footer"><button class="text-button" data-action="new-confirm">Begin a new chronicle</button><button class="primary-button" data-action="close">Return to ${game.zone==='town'?'Emberfall':'the crypt'}</button></div>`;
  }else if(game.panel==='help'){
    modal.innerHTML=title('YOUR JOURNEY BEGINS','Into the Hollow')+`<p>A monastery fell silent. Beneath it, the dead keep a debt that only the living can repay. Find the Warden, claim its relic, and descend into a new dungeon.</p><div class="help-grid">${[['Move','Click / hold ground'],['Attack a target','Left click enemy'],['Attack in place','Shift + left click'],['Selected spell','Hold right click'],['Active abilities','Q · W · E · R'],['Evade (invulnerable)','Space'],['Healing flask','1'],['Talk / loot / descend','F'],['Town portal / crypt gate','T'],['Show loot labels','Hold Alt'],['Masteries / inventory','K / I'],['Character / map zoom','C / M'],['Pause / close panel','Esc'],['Mobile','Stick · attack · skill buttons']].map(([n,k])=>`<p><span>${n}</span><kbd>${k}</kbd></p>`).join('')}</div><div class="modal-rule"></div><p>Spend your four starting mastery points with <b>K</b>. Mix any masteries; invest 3 and 7 points to unlock advanced abilities. Equip learned skills in one of four slots. Dodge the Warden’s marked attacks. Life slowly recovers outside combat; spirit regenerates continuously.</p><p>Your character, gear, and current dungeon seed save automatically on this device. Reloading preserves your character and town services. An expedition restarts at its saved depth. Speak to Maelin for your first quest. Rescue Edrin to unlock free identification. Visit Orrin to trade and Garran to repair or reforge. No account needed.</p><div class="modal-footer"><small>Original, single-player ARPG prototype · Procedural floors continue indefinitely.</small><button class="primary-button" data-action="close">Enter the crypt</button></div>`;
  }else if(game.panel==='pause'){
    modal.innerHTML=title('A MOMENT BETWEEN BATTLES','The hollow can wait')+`<p>Your expedition is paused. Your progress is saved on this device.</p><div class="modal-footer"><button class="text-button" data-action="help">How to play</button><button class="primary-button" data-action="close">Continue expedition</button></div>`;save();
  }else if(game.panel==='death'){
    modal.innerHTML=`<div class="death-content"><span class="eyebrow">THE HOLLOW CLAIMS ANOTHER</span><h2 id="modal-title">Not yet forgotten.</h2><p>You fell in depth ${game.depth}. Your equipment and mastery progress endure.<br>Awaken in Emberfall with full life and spirit. Your expedition remains accessible.</p><p>Cost of returning: ${Math.floor(player.gold*.1)} gold</p><button class="primary-button" data-action="revive">Rise from the ashes</button></div>`;
  }else if(game.panel==='descend'){
    modal.innerHTML=title('THE WARDEN HAS FALLEN','The dark runs deeper')+`<p>A new dungeon waits beyond the rift. Descend with full life and spirit, and one replenished flask charge. The next Warden will be stronger.</p><div class="modal-footer"><button class="text-button" data-action="close">Stay on this floor</button><button class="primary-button" data-action="descend">Descend to depth ${game.depth+1}</button></div>`;
  }else if(game.panel==='new-confirm'){
    modal.innerHTML=title('A DIFFERENT PATH','Begin again?')+`<p>This replaces your saved character, skills, inventory, and dungeon progress on this device.</p><div class="modal-footer"><button class="text-button" data-action="character">Keep my chronicle</button><button class="primary-button" data-action="new-game">Start a new chronicle</button></div>`;
  }
}
function respecCost(){return Math.max(0,(Object.values(player.skills).reduce((s,r)=>s+r,0)-3)*4);}

$('modal').addEventListener('click',event=>{
  if(townUI.handleClick(event)){if(game.zone==='town')setZoneUI();return;}
  const mastery=event.target.closest('[data-mastery]');if(mastery){game.selectedMastery=mastery.dataset.mastery;renderPanel();return;}
  const learn=event.target.closest('[data-learn]');if(learn){if(learnSkill(player,learn.dataset.learn)){game.stats=playerStats(player);sound(550,.2,'sine');renderPanel();save();}return;}
  const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='close')closePanel();
  else if(['help','character','new-confirm'].includes(action))openPanel(action);
  else if(action==='respec'){
    const cost=respecCost();if(player.gold<cost){toast(`Respec requires ${cost} gold`);return;}
    player.gold-=cost;player.points+=Object.values(player.skills).reduce((a,b)=>a+b,0)-3;player.skills={cleave:1,bolt:1,nova:1};player.slots=['cleave','bolt','nova','lance'];player.mouseSkill='bolt';game.cooldowns={};game.stats=playerStats(player);player.hp=Math.min(player.hp,game.stats.maxHp);player.mana=Math.min(player.mana,game.stats.maxMana);renderPanel();save();
  }else if(action==='revive'){
    player.gold-=Math.floor(player.gold*.1);player.hp=game.stats.maxHp;player.mana=game.stats.maxMana;player.potions=Math.max(2,player.potions);player.x=game.dungeon.start.x;player.y=game.dungeon.start.y;
    game.projectiles=[];game.panel=null;closePanel();enterTown();save();toast('You awaken beneath the lanterns of Emberfall.');
  }else if(action==='descend'){game.panel=null;closePanel();descend();}
  else if(action==='new-game'){
    Object.assign(player,migratePlayer(createPlayer()));game.stats=playerStats(player);game.depth=1;game.seed=Math.floor(Math.random()*1e9);game.expedition=null;enterTown(true);game.cooldowns={};game.panel=null;closePanel();save();toast('A new chronicle begins.');
  }
});
$('modal').addEventListener('change',event=>{
  if(townUI.handleChange(event))return;
  const select=event.target.closest('[data-bind]');if(!select||select.value==='')return;const slot=Number(select.value),id=select.dataset.bind,old=player.slots.indexOf(id);if(old!==-1)player.slots[old]=player.slots[slot];player.slots[slot]=id;renderPanel();save();
});
$('modal-backdrop').addEventListener('click',e=>{if(e.target===$('modal-backdrop'))closePanel();});
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel)));
document.querySelectorAll('[data-slot]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(e.button===2)showSkillPicker(Number(b.dataset.slot));else cast(Number(b.dataset.slot));});b.addEventListener('contextmenu',e=>e.preventDefault());});
$('mouse-slot').addEventListener('click',()=>showSkillPicker('mouse'));
$('skill-picker').addEventListener('click',event=>{const choice=event.target.closest('[data-choose-skill]');if(choice){if(game.bindingTarget==='mouse')player.mouseSkill=choice.dataset.chooseSkill;else player.slots[Number(game.bindingTarget)]=choice.dataset.chooseSkill;save();$('skill-picker').classList.add('hidden');}if(event.target.closest('[data-close-picker]'))$('skill-picker').classList.add('hidden');});
$('basic-slot').addEventListener('pointerdown',e=>{e.preventDefault();basicAttack();});
$('dodge-slot').addEventListener('pointerdown',e=>{e.preventDefault();dodge();});$('potion-slot').addEventListener('pointerdown',e=>{e.preventDefault();potion();});
$('help').addEventListener('click',()=>openPanel('help'));$('pause').addEventListener('click',()=>openPanel('pause'));
$('journey-button').addEventListener('click',()=>game.zone==='town'?openPanel('departure'):townPortal());
$('interact-button').addEventListener('click',interact);
document.querySelectorAll('[data-npc]').forEach(button=>button.addEventListener('click',()=>{
  if(game.zone!=='town'||game.paused)return;
  const npc=game.dungeon.npcs.find(n=>n.id===button.dataset.npc);if(!npc)return;
  if(distance(npc,player)<3)openPanel(npc.id);else{const target={...npc,interaction:npc.id};game.interactTarget=target;setMoveTarget(target);}
}));
$('sound').addEventListener('click',()=>{game.sound=!game.sound;$('sound').textContent=game.sound?'♫':'♪';$('sound').title=game.sound?'Mute sound':'Enable sound';$('sound').setAttribute('aria-label',$('sound').title);toast(game.sound?'Sound enabled':'Sound muted',1200);sound(440,.2,'sine');});
function showSkillPicker(target){
  game.bindingTarget=target;clearAttackOrder();
  $('skill-picker').innerHTML=`<div class="skill-picker-title">Bind ${target==='mouse'?'right mouse':SKILL_KEYS[target].toUpperCase()}<button data-close-picker aria-label="Close skill selection">×</button></div><div class="skill-picker-options">${ALL_SKILLS.filter(skill=>skill.active&&rankOf(player,skill.id)).map(skill=>`<button data-choose-skill="${skill.id}"><span>${skill.icon}</span><div>${skill.name}<small>${skill.cost} spirit · ${skill.cooldown}s${skill.innate?' · INNATE':''}</small></div></button>`).join('')}</div><div class="skill-picker-hint">Right-click a QWER hotbar slot to change its ability.</div>`;
  $('skill-picker').classList.remove('hidden');
}
window.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase();if(['input','select','textarea'].includes(event.target?.tagName?.toLowerCase())&&!['escape','tab'].includes(key))return;
  if([' ','arrowup','arrowdown','arrowleft','arrowright','alt'].includes(key)||key==='tab'&&game.panel)event.preventDefault();
  if(key==='tab'&&game.panel){const focusable=[...$('modal').querySelectorAll('button:not(:disabled),select')];const index=focusable.indexOf(document.activeElement);focusable[(index+(event.shiftKey?-1:1)+focusable.length)%focusable.length]?.focus();return;}
  if(key==='escape'){if(!$('skill-picker').classList.contains('hidden'))$('skill-picker').classList.add('hidden');else game.panel?closePanel():openPanel('pause');return;}
  if(event.repeat){if(!game.paused)keys.add(key);return;}
  if(key==='i'||key==='k'||key==='c'){openPanel({i:'inventory',k:'skills',c:'character'}[key]);return;}
  if(game.paused)return;keys.add(key);
  if(SKILL_KEYS.includes(key)){cast(SKILL_KEYS.indexOf(key));return;}
  if(key===' ')dodge();if(key==='1')potion();if(key==='f')interact();if(key==='alt')game.showLoot=true;
  if(key==='t')townPortal();
  if(key==='m'){game.largeMap=!game.largeMap;toast(game.largeMap?'Map zoomed in':'Map overview',1000);}
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(e.key==='Alt')game.showLoot=false;});
window.addEventListener('blur',()=>{keys.clear();clearAttackOrder();game.mouseDown=false;touchMove={x:0,y:0};save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!game.paused&&player.hp>0)openPanel('pause');});
window.addEventListener('beforeunload',save);
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('pointerenter',()=>game.pointerOverWorld=true);
$('world').addEventListener('pointerleave',()=>game.pointerOverWorld=false);
$('world').addEventListener('pointermove',e=>{if(e.pointerType!=='touch'){mouseScreen={x:e.clientX,y:e.clientY};game.pointerOverWorld=true;game.aim=aimPoint();}});
function setMoveTarget(target){game.target=target;game.path=findPath(game.dungeon,player,target);}
function walkTo(point,marker=true){
  let target=point;
  if(!isWalkable(game.dungeon,target.x,target.y)){
    const options=[];for(let y=Math.floor(point.y)-1;y<=Math.floor(point.y)+1;y++)for(let x=Math.floor(point.x)-1;x<=Math.floor(point.x)+1;x++)if(isWalkable(game.dungeon,x+.5,y+.5))options.push({x:x+.5,y:y+.5});
    target=options.sort((a,b)=>distance(a,point)-distance(b,point))[0];if(!target||distance(target,point)>1.5)return false;
  }
  const path=findPath(game.dungeon,player,target);if(!path.length)return false;
  game.target={...target};game.path=path;if(marker)effect('destination',target.x,target.y,.65,{radius:.35});return true;
}
$('world').addEventListener('pointerdown',e=>{
  if(game.paused)return;e.preventDefault();$('world').focus({preventScroll:true});$('skill-picker').classList.add('hidden');townUI.hud.hideTooltip();
  if(e.pointerType!=='touch'){mouseScreen={x:e.clientX,y:e.clientY};game.pointerOverWorld=true;}
  game.aim=aimPoint();
  if(e.button===2){game.secondaryHeld=true;game.combatTarget=null;game.target=null;game.path=null;castSkill(player.mouseSkill);return;}
  clearAttackOrder();
  if(game.zone==='town'){
    const targets=[...game.dungeon.npcs.map(n=>({...n,interaction:n.id,height:91,width:31})),...game.dungeon.props.filter(p=>p.stash||p.exit).map(p=>({...p,interaction:p.stash?'stash':'departure',height:p.stash?90:145,width:p.stash?45:65,x:p.exit?game.dungeon.portal.x:p.x,y:p.exit?game.dungeon.portal.y:p.y}))];
    const target=targets.find(t=>{const point=renderer.screen(t.x,t.y);return Math.abs(point.x-e.clientX)<t.width&&e.clientY>point.y-t.height&&e.clientY<point.y+7;});
    if(target){if(distance(target,player)<3){openPanel(target.interaction);}else{game.interactTarget=target;setMoveTarget(target);}return;}
  }
  game.interactTarget=null;
  const portalScreen=renderer.screen(game.dungeon.portal.x,game.dungeon.portal.y,30);
  if(game.dungeon.bossDead&&Math.hypot(e.clientX-portalScreen.x,e.clientY-portalScreen.y)<65&&distance(player,game.dungeon.portal)<3){openPanel('descend');return;}
  const enemy=e.pointerType==='touch'?null:enemyUnderPointer();
  game.primaryHeld=e.pointerType!=='touch';game.primaryPointer=e.pointerId;
  if(e.shiftKey||keys.has('shift')){game.primaryMode='force';game.target=null;game.path=null;basicAttack();return;}
  if(enemy){game.primaryMode='attack';game.combatTarget=enemy;game.attackPending=true;game.combatRefresh=0;if(distance(enemy,player)<=1.55&&basicAttack(enemy))game.attackPending=false;return;}
  game.primaryMode='move';game.moveRefresh=.16;walkTo(renderer.unproject(e.clientX,e.clientY));
});
window.addEventListener('pointerup',e=>{
  if(e.button===2){game.secondaryHeld=false;return;}
  if(e.pointerId===game.primaryPointer){game.primaryHeld=false;if(!game.attackPending)game.combatTarget=null;}
  if(e.pointerId===game.attackPointer)game.mouseDown=false;
});
window.addEventListener('pointercancel',()=>{clearAttackOrder();game.mouseDown=false;});
$('touch-attack').addEventListener('pointerdown',e=>{e.preventDefault();e.target.setPointerCapture(e.pointerId);game.mouseDown=true;game.attackPointer=e.pointerId;basicAttack();});
$('touch-attack').addEventListener('pointerup',()=>game.mouseDown=false);$('touch-attack').addEventListener('pointercancel',()=>game.mouseDown=false);
let joystickPointer=null;
function joystickMove(e){if(e.pointerId!==joystickPointer)return;const r=$('joystick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),max=r.width*.34;const scale=len>max?max/len:1;touchMove={x:dx*scale/max,y:dy*scale/max};$('joystick-knob').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;}
$('joystick').addEventListener('pointerdown',e=>{e.preventDefault();joystickPointer=e.pointerId;e.target.setPointerCapture(e.pointerId);joystickMove(e);});$('joystick').addEventListener('pointermove',joystickMove);
for(const event of ['pointerup','pointercancel'])$('joystick').addEventListener(event,()=>{joystickPointer=null;touchMove={x:0,y:0};$('joystick-knob').style.transform='';});
if(isTouch)$('control-hint').textContent='Drag to move · Hold attack · Tap skills';

let previous=performance.now();
function frame(now){const dt=Math.min((now-previous)/1000,.04);previous=now;update(dt);renderer.draw(game,game.paused?0:dt);updateHud(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
setTimeout(()=>{if(!validSave)toast(isTouch?'Welcome to Emberfall · Tap Sister Maelin to begin.':'Welcome to Emberfall · Speak to Sister Maelin with F.',5000);},7500);

// Read-only diagnostics are useful for smoke tests without granting in-game powers.
window.__reliquary={project:(x,y,z=0)=>renderer.screen(x,y,z),snapshot:()=>({level:player.level,hp:player.hp,mana:player.mana,points:player.points,position:{x:player.x,y:player.y},depth:game.depth,zone:game.zone,enemies:game.dungeon.enemies.filter(e=>!e.dead).length,enemyHealth:game.dungeon.enemies.reduce((sum,e)=>sum+Math.max(0,e.hp),0),loot:game.loot.length,inventory:player.inventory.length,paused:game.paused,panel:game.panel,skills:{...player.skills},slots:[...player.slots],cooldowns:{...game.cooldowns},seed:game.seed,bossDead:game.dungeon.bossDead,gold:player.gold,shards:player.shards,quests:{...player.quests},npcs:game.dungeon.npcs?.map(n=>({id:n.id,...renderer.screen(n.x,n.y)})),artLoaded:renderer.artLoaded,animation:{...renderer.heroFrame},attackAnim:game.attackAnim,moving:game.moving,aim:{...game.aim},heroScreen:renderer.screen(player.x,player.y,24),mouseSkill:player.mouseSkill,projectiles:game.projectiles.map(b=>({...renderer.screen(b.x,b.y,24),dx:renderer.iso(b.dx,b.dy).x,dy:renderer.iso(b.dx,b.dy).y,kind:b.kind})),visibleEnemies:game.dungeon.enemies.filter(e=>!e.dead&&game.dungeon.seen.has(Math.floor(e.y)*game.dungeon.size+Math.floor(e.x))).map(e=>({id:e.id,hp:e.hp,x:e.x,y:e.y,screen:renderer.screen(e.x,e.y,24)}))})};
