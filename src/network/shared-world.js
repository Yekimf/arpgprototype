import {createPlayer,playerStats,distance,isWalkable,moveEntity,findPath,generateItem,random,makeEnemy} from '../game.js';
import {createCampaign,generateWilderness,generateStronghold,inSanctuary} from '../campaign.js';
import {migratePlayer,addToContainer,arrange,BAG} from '../settlement.js';
import {dungeonSeed} from '../combat-rules.js';
import {actOneLootLevel} from '../act-one-balance.js';
import {goldReward} from '../economy.js';
import {rollSetItem} from '../set-items.js';
import {bossRelic} from '../boss-relics.js';
import {enemyCombatStats,rollWeaponHit,weaponAttack} from '../defense.js';
import {bossPlan,bossSweepHits,bossWaveHits} from '../boss-abilities.js';
const randomUUID=()=>globalThis.crypto.randomUUID();
const copy=x=>structuredClone(x);
const poseFacing=(raw,fallback={x:1,y:0})=>{const x=Number(raw?.x),y=Number(raw?.y),length=Math.hypot(x,y);return Number.isFinite(length)&&length>.001?{x:x/length,y:y/length}:{...fallback};};
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)))),n=>n.toString(16).padStart(2,'0')).join('');
const text=(s,n=160)=>String(s??'').replace(/[\x00-\x1f]/g,' ').trim().slice(0,n);
export const assets=p=>({inventory:p.inventory,equipment:p.equipment,gold:p.gold,stash:p.stash,bankGold:p.bankGold,buyback:p.buyback,shopStock:p.shopStock,shards:p.shards});
const fingerprint=p=>JSON.stringify(assets(p));
const owned=p=>[...(p.inventory||[]),...(p.stash||[]),...(p.buyback||[]),...(p.shopStock||[]),...Object.values(p.equipment||{}).filter(Boolean)];
const uniqueItem=(p,raw)=>{const item=copy(raw);if(owned(p).some(i=>i.id===item.id))item.id='lan-item-'+randomUUID();return item;};
export function cleanPlayer(raw,{normalize=false}={}){
 if(!raw||!Array.isArray(raw.inventory)||!raw.equipment||!raw.skills||JSON.stringify(raw).length>1500000)throw Error('Invalid character file.');
 if(!Number.isInteger(raw.level)||raw.level<1||raw.level>100)throw Error('Character level must be between 1 and 100.');
 const p=migratePlayer({...createPlayer(),...copy(raw)});p.name=text(p.name,24)||'The Loyalist';p.campaign??=createCampaign();
 for(const k of ['inventory','stash','buyback'])if(p[k].length>512)throw Error('Character storage exceeds the LAN limit.');
 if(!Number.isSafeInteger(p.gold)||p.gold<0)throw Error('Invalid character gold.');
 for(const k of ['might','dexterity','vitality','will'])if(!Number.isFinite(p.attributes[k])||p.attributes[k]<0||p.attributes[k]>2000)throw Error('Invalid attributes.');
 const ids=new Set();for(const item of owned(p)){if(ids.has(item.id)){if(!normalize)throw Error('An item identifier is duplicated. Leave and rejoin to repair it safely.');item.id='lan-item-'+randomUUID();}ids.add(item.id);}
 const stats=playerStats(p);for(const k of ['maxHp','maxMana','damage','defense','attackRating','speed'])if(!Number.isFinite(stats[k])||stats[k]<0)throw Error('Invalid equipment stats.');
 return p;
}
export class LanWorld{
 constructor({file=null,now=()=>Date.now()}={}){this.file=file;this.now=now;this.records={};this.rooms=new Map();this.sessions=new Map();this.listeners=new Map();this.pendingWrite=Promise.resolve();this.commandQueue=Promise.resolve();}
 async load(){return this;}
 async persist(){}
 on(token,callback){if(!this.sessions.has(token))throw Error('Session expired.');this.listeners.set(token,callback);return()=>{if(this.listeners.get(token)===callback)this.listeners.delete(token);};}
 send(s,event){try{this.listeners.get(s.token)?.(event);}catch{this.listeners.delete(s.token);}}
 broadcast(room,event,area=null){for(const s of room.players.values())if(!area||s.area===area)this.send(s,event);}
 list(){return [...this.rooms.values()].filter(r=>r.players.size).map(r=>({id:r.id,name:r.name,count:r.players.size,max:8,locked:!!r.password}));}
 session(token){const s=this.sessions.get(token);if(!s)throw Error('Session expired. Return to the LAN lobby.');s.seen=this.now();return s;}
 area(room,key='wilderness:0'){
 if(!/^(wilderness|stronghold):[0-2]$/.test(key))throw Error('Unknown region.');if(room.worlds.has(key))return room.worlds.get(key);
 const [kind,ch]=key.split(':'),chapter=Number(ch),p={quests:{},campaign:createCampaign()},d=kind==='wilderness'?generateWilderness(room.seed+107+chapter*7919,1,p,chapter):generateStronghold(dungeonSeed(room.seed,1,chapter,0),1,chapter);
 const world={key,d,shots:[],actions:[],tick:0};room.worlds.set(key,world);return world;
 }
 enqueue(fn){const result=this.commandQueue.catch(()=>{}).then(fn);this.commandQueue=result;return result;}
 join(data){return this.enqueue(()=>this.joinNow(data));}
 async joinNow({roomId,name,password='',player,identity,create=false}){
 if(!identity||!/^[-a-zA-Z0-9]{16,80}$/.test(identity.id)||!/^[-a-zA-Z0-9]{24,100}$/.test(identity.secret))throw Error('Invalid character identity.');
 for(const s of this.sessions.values())if(s.id===identity.id)throw Error('This character is already in a LAN game.');
 let room=this.rooms.get(roomId);if(create){room={id:randomUUID().slice(0,8),name:text(name,40)||'Emberfall company',password:password?await hash(password):null,seed:Math.floor(Math.random()*1e9),players:new Map(),worlds:new Map(),chat:[],invites:[],trades:new Map(),emptyAt:0};}
 if(!room)throw Error('That game is no longer available.');if(!create&&room.password&&room.password!==await hash(password))throw Error('Incorrect game password.');if(room.players.size>=8)throw Error('This game is full.');
 let p=cleanPlayer(player,{normalize:true}),record=this.records[identity.id];if(record&&record.secret!==await hash(identity.secret))throw Error('This character identity does not match its host record.');
 if(record&&Number(p.lanRevision||0)<record.revision)Object.assign(p,copy(assets(record.player)));
 const revision=record?.revision||0;p.lanIdentity=copy(identity);p.lanRevision=revision;p.hp=Math.max(1,p.hp||playerStats(p).maxHp);
 const s={token:randomUUID(),id:identity.id,room,player:p,revision,seen:this.now(),area:'wilderness:0',party:null,trade:null,rate:0,rateAt:this.now(),recentHits:[],lastMove:this.now()};
 const w=this.area(room);p.x=w.d.start.x;p.y=w.d.start.y;s.pos={x:p.x,y:p.y};s.pose={facing:{x:1,y:0},moving:false,walkPhase:0,attackAnim:0,attackDuration:.4,dodgeTime:0};
 this.records[s.id]={secret:await hash(identity.secret),revision,player:copy(p)};await this.persist();if(create)this.rooms.set(room.id,room);room.players.set(s.id,s);this.sessions.set(s.token,s);
 this.system(room,p.name+' joined the company.');return {token:s.token,id:s.id,room:{id:room.id,name:room.name,seed:room.seed},player:copy(p),revision,chat:copy(room.chat.filter(m=>m.channel!=='party'))};
 }
 system(room,message){this.message(room,null,message,'system');}
 message(room,s,message,channel='global'){
 const m={id:randomUUID(),at:this.now(),from:s?.id||null,name:s?.player.name||'Company',text:text(message,240),channel};if(!m.text)return;room.chat.push(m);room.chat=room.chat.slice(-100);
 for(const peer of room.players.values())if(channel!=='party'||s.party&&peer.party===s.party)this.send(peer,{type:'chat',message:m});
 }
 snapshot(s){const w=this.area(s.room,s.area);return {type:'state',self:s.id,area:s.area,bossDead:w.d.bossDead,revision:s.revision,kills:Object.values(s.killQueue||{}),loot:copy(s.loot?.[s.area]||[]),enemies:w.d.enemies.filter(e=>distance(e,s.pos)<24||e.dead&&distance(e,s.pos)<18).map(e=>({...e,path:undefined,charge:undefined})),shots:w.shots.filter(b=>distance(b,s.pos)<22),players:[...s.room.players.values()].map(p=>({id:p.id,name:p.player.name,level:p.player.level,area:p.area,party:p.party,partyLeader:p.party?[...s.room.players.values()].find(v=>v.party===p.party)?.id:null,trade:p.trade,hp:p.player.hp,maxHp:playerStats(p.player).maxHp,x:p.pos.x,y:p.pos.y,zone:this.safe(p)?'town':'field',equipment:copy(p.player.equipment),attributes:copy(p.player.attributes),...p.pose})),invites:s.room.invites.filter(i=>i.to===s.id),trade:s.trade?copy(s.room.trades.get(s.trade)):null};}
 safe(s){return inSanctuary(this.area(s.room,s.area).d,s.pos);}
 async sync(s,raw,revision){
  if(s.trade&&s.room.trades.get(s.trade)?.ready.includes(s.id))throw Error('Finish or cancel the trade before changing belongings.');if(revision!==s.revision)return {type:'assets',revision:s.revision,assets:copy(assets(s.player)),conflict:true};
  const p=cleanPlayer(raw);if(p.lanIdentity?.id!==s.id)throw Error('Character identity changed.');const changed=fingerprint(p)!==fingerprint(s.player),before={player:s.player,revision:s.revision,record:this.records[s.id]};p.lanRevision=s.revision+(changed?1:0);p.lanIdentity=copy(s.player.lanIdentity);s.player=p;s.revision=p.lanRevision;this.records[s.id]={...this.records[s.id],player:copy(p),revision:s.revision};try{if(changed||this.now()-(s.persisted||0)>5000){await this.persist();s.persisted=this.now();}}catch(e){s.player=before.player;s.revision=before.revision;this.records[s.id]=before.record;throw e;}return {type:'ack',revision:s.revision};
 }
 action(token,a){return this.enqueue(()=>this.actionNow(token,a));}
 async actionNow(token,a){const s=this.session(token),r=s.room;if(this.now()-s.rateAt>1000){s.rateAt=this.now();s.rate=0;}if(++s.rate>220)throw Error('Too many commands.');
  if(a.type==='batch'){if(!Array.isArray(a.actions)||a.actions.length>100)throw Error('Invalid command batch.');for(const item of a.actions){if(!['move','hit'].includes(item.type))throw Error('Invalid batched command.');await this.actionNow(token,item);}return;}
  if(a.type==='sync')return this.sync(s,a.player,a.revision);
  if(a.type==='move'){
   if(a.area!==s.area)return;const d=this.area(r,s.area).d,dt=Math.min(2,Math.max(.1,(this.now()-s.lastMove)/1000)),max=Math.max(playerStats(s.player).speed,13)*dt+2;
   const pos={x:Number(a.x),y:Number(a.y)};if(!Number.isFinite(pos.x)||!Number.isFinite(pos.y)||!isWalkable(d,pos.x,pos.y,.2))return;
   if(distance(pos,s.pos)<=max)s.pos=pos;s.lastMove=this.now();s.player.hp=Math.max(0,Math.min(playerStats(s.player).maxHp,Number(a.hp)||0));
   s.pose={facing:poseFacing(a.facing),moving:!!a.moving,walkPhase:Number(a.walkPhase)||0,attackAnim:Math.max(0,Math.min(.7,Number(a.attackAnim)||0)),attackDuration:Math.max(.22,Math.min(.7,Number(a.attackDuration)||.4)),animationMode:a.animationMode==='cast'?'cast':'attack',actionFacing:poseFacing(a.actionFacing,poseFacing(a.facing)),dodgeTime:Math.max(0,Math.min(.3,Number(a.dodgeTime)||0)),pyre:!!a.pyre};return;
  }
  if(a.type==='enter'){if(s.trade)throw Error('Cancel the trade before travelling.');const w=this.area(r,a.area);s.area=a.area;const at={x:Number(a.x),y:Number(a.y)};s.pos=isWalkable(w.d,at.x,at.y,.2)?at:{...w.d.start};s.lastMove=this.now();return {type:'entered',area:s.area};}
  if(a.type==='cast'){if(s.trade)throw Error('Finish trading first.');this.broadcast(r,{type:'cast',area:s.area,from:s.id,skill:text(a.skill,30),x:s.pos.x,y:s.pos.y,tx:Number(a.tx)||s.pos.x,ty:Number(a.ty)||s.pos.y},s.area);return;}
  if(a.type==='hit')return this.hit(s,a);
  if(a.type==='kill-ack'){if(s.killQueue)delete s.killQueue[a.key];return;}
  if(a.type==='pickup')return this.pickup(s,a.id);
  if(a.type==='drop'){if(s.trade)throw Error('Finish trading first.');const item=s.player.inventory.find(i=>i.id===a.id);if(!item)throw Error('Put the item in your backpack before dropping it.');return this.assetTransaction(s,()=>{s.player.inventory=s.player.inventory.filter(i=>i!==item);this.drop(s,{x:s.pos.x+.6,y:s.pos.y+.3,item});});}
  if(a.type==='chat'){if(this.now()-(s.lastChat||0)<350)throw Error('Please wait before sending another message.');if(a.channel==='party'&&!s.party)throw Error('Join a party first.');s.lastChat=this.now();this.message(r,s,a.text,a.channel==='party'?'party':'global');return;}
  if(a.type==='party-invite'){const peer=r.players.get(a.to);if(!peer||peer===s||peer.party)throw Error('That player cannot join your party.');if(s.party&&[...r.players.values()].find(p=>p.party===s.party)?.id!==s.id)throw Error('Only the party leader can invite.');r.invites=r.invites.filter(i=>i.to!==peer.id);r.invites.push({id:randomUUID(),from:s.id,to:peer.id,name:s.player.name,at:this.now()});return;}
  if(a.type==='party-accept'){const i=r.invites.find(i=>i.id===a.id&&i.to===s.id),host=i&&r.players.get(i.from);if(!host||s.party)throw Error('The party invitation expired.');host.party??=randomUUID();s.party=host.party;r.invites=r.invites.filter(v=>v.to!==s.id);this.system(r,s.player.name+' joined '+host.player.name+'’s party.');return;}
  if(a.type==='party-kick'){const leader=[...r.players.values()].find(p=>p.party===s.party),peer=r.players.get(a.to);if(!s.party||leader!==s||!peer||peer===s||peer.party!==s.party)throw Error('Only the party leader can remove members.');peer.party=null;this.system(r,peer.player.name+' left the party.');return;}
  if(a.type==='party-leave'){s.party=null;r.invites=r.invites.filter(i=>i.from!==s.id&&i.to!==s.id);return;}
  if(a.type==='trade-request')return this.tradeRequest(s,a.to);
  if(a.type==='trade-accept'){const t=r.trades.get(s.trade);if(!t)throw Error('Trade request expired.');if(!t.ready.includes(s.id))t.ready.push(s.id);return this.snapshot(s);}
  if(a.type==='trade-offer')return this.tradeOffer(s,a);
  if(a.type==='trade-confirm'){try{return await this.tradeConfirm(s,a.revision);}catch(e){const t=r.trades.get(s.trade);if(t)t.confirmed=[];throw e;}}
  if(a.type==='trade-cancel'){this.cancelTrade(s);return;}
  if(a.type==='leave'){this.leave(s);return;}
  throw Error('Unknown command.');
 }
 drop(s,loot){s.loot??={};(s.loot[s.area]??=[]).push({...copy(loot),id:randomUUID()});}
 async commitAssets(sessions){const updates=[];for(const s of sessions){s.revision++;s.player.lanRevision=s.revision;this.records[s.id]={...this.records[s.id],revision:s.revision,player:copy(s.player)};updates.push([s,{type:'assets',revision:s.revision,assets:copy(assets(s.player))}]);}await this.persist();for(const [s,e]of updates)this.send(s,e);return updates[0]?.[1];}
 async assetTransaction(s,mutate){const before={player:copy(s.player),loot:copy(s.loot||{}),revision:s.revision,record:copy(this.records[s.id])};try{mutate();return await this.commitAssets([s]);}catch(e){s.player=before.player;s.loot=before.loot;s.revision=before.revision;this.records[s.id]=before.record;throw e;}}
 async pickup(s,id){if(s.trade)throw Error('Finish trading first.');const list=s.loot?.[s.area]||[],at=list.findIndex(l=>l.id===id),loot=list[at];if(!loot||distance(loot,s.pos)>2.2)return;return this.assetTransaction(s,()=>{if(loot.item&&!addToContainer(s.player.inventory,uniqueItem(s.player,loot.item)))throw Error('Your backpack is full.');if(loot.gold){s.player.gold+=loot.gold;s.player.goldEarned=(s.player.goldEarned||0)+loot.gold;}list.splice(at,1);});}

 tradeRequest(s,to){const peer=s.room.players.get(to);if(!peer||peer===s||s.trade||peer.trade||s.area!==peer.area||distance(s.pos,peer.pos)>5||!this.safe(s)||!this.safe(peer))throw Error('Trade in Emberfall, within a few steps of your partner.');const id=randomUUID(),t={id,revision:0,players:[s.id,peer.id],offers:{[s.id]:{items:[],gold:0},[peer.id]:{items:[],gold:0}},confirmed:[],ready:[s.id],names:{[s.id]:s.player.name,[peer.id]:peer.player.name}};s.trade=peer.trade=id;s.room.trades.set(id,t);return this.snapshot(s);}
 tradeOffer(s,a){const t=s.room.trades.get(s.trade);if(!t||t.ready.length!==2)throw Error('Both players must accept the trade request.');const ids=[...new Set(Array.isArray(a.items)?a.items:[])];if(ids.length>12)throw Error('Offer at most twelve items.');const items=ids.map(id=>s.player.inventory.find(i=>i.id===id));if(items.some(i=>!i||i.quest))throw Error('Only backpack equipment and supplies can be traded.');const gold=Math.floor(Number(a.gold)||0);if(gold<0||gold>s.player.gold)throw Error('Not enough gold.');t.offers[s.id]={items:copy(items),gold};t.revision++;t.confirmed=[];return;}
 async tradeConfirm(s,revision){const r=s.room,t=r.trades.get(s.trade);if(!t||t.ready.length!==2||t.revision!==revision)throw Error('The offer changed. Review it and confirm again.');if(!t.confirmed.includes(s.id))t.confirmed.push(s.id);if(t.confirmed.length!==2)return;
  const players=t.players.map(id=>r.players.get(id));if(players.some(p=>!p)||players[0].area!==players[1].area||distance(players[0].pos,players[1].pos)>5)throw Error('Your trading partner is no longer nearby.');
  const next=players.map((p,index)=>{const own=t.offers[p.id],other=t.offers[players[1-index].id],n=copy(p.player);for(const item of own.items)if(!n.inventory.some(i=>i.id===item.id))throw Error('An offered item changed.');if(n.gold<own.gold)throw Error('Offered gold changed.');n.inventory=n.inventory.filter(i=>!own.items.some(v=>v.id===i.id));arrange(n.inventory);for(const raw of other.items){const item=uniqueItem(n,raw);if(!addToContainer(n.inventory,item))throw Error('Both backpacks need room for the incoming items.');}n.gold=n.gold-own.gold+other.gold;return n;});
  const previous=players.map(p=>({player:p.player,revision:p.revision,record:this.records[p.id]}));for(let i=0;i<2;i++)players[i].player=next[i];
  try{await this.commitAssets(players);}catch(e){for(let i=0;i<2;i++){players[i].player=previous[i].player;players[i].revision=previous[i].revision;this.records[players[i].id]=previous[i].record;}t.confirmed=[];throw e;}
  for(const p of players){p.trade=null;this.send(p,{type:'trade-complete',id:t.id});}r.trades.delete(t.id);
 }
 cancelTrade(s){const t=s.room.trades.get(s.trade);if(!t)return;for(const id of t.players){const peer=s.room.players.get(id);if(peer){peer.trade=null;this.send(peer,{type:'trade-cancelled'});}}s.room.trades.delete(t.id);}
 leave(s){this.cancelTrade(s);s.room.players.delete(s.id);s.room.invites=s.room.invites.filter(i=>i.from!==s.id&&i.to!==s.id);this.listeners.delete(s.token);this.sessions.delete(s.token);this.system(s.room,s.player.name+' left the company.');if(!s.room.players.size)s.room.emptyAt=this.now();}
 async hit(s,a){
  if(s.trade||s.player.hp<=0)return;const w=this.area(s.room,s.area),e=w.d.enemies.find(e=>e.id===a.enemyId&&!e.dead);if(!e||this.safe(s)||distance(s.pos,e)>Math.min(22,16+playerStats(s.player).area/20))return;
  const damage=Number(a.damage),stats=playerStats(s.player),cap=Math.max(stats.damage,stats.spellPower)*Math.max(stats.fire,stats.cold,stats.lightning,1)*stats.bonus*Math.max(1,stats.spell)*120;if(!Number.isFinite(damage)||damage<0||damage>cap)return;
  if(weaponAttack(a.element,a.skill,a.direct!==false)&&!rollWeaponHit(stats,enemyCombatStats(e,w.d.areaLevel))){this.send(s,{type:'miss',enemyId:e.id});return;}
  const dealt=Math.min(e.hp,Math.max(1,Math.round(damage)));e.hp-=dealt;e.aggro=true;e.hit=.16;if(a.element==='cold'||a.skill==='quake')e.slow=2.5;if(a.element==='lightning'&&a.direct!==false){e.shock=3;e.shockPower=Math.min(.4,.1+(stats.shockEffect||0)/100);}if(a.direct!==false){e.dots??=[];if(a.element==='fire'&&a.skill==='bolt')e.dots=[...e.dots.filter(v=>v.kind!=='fire'),{kind:'fire',owner:s.id,power:dealt*.12,remaining:3,tick:.7}];if(a.element==='physical'&&(stats.bleed>0||a.skill==='rend'))e.dots=[...e.dots.filter(v=>v.kind!=='physical'),{kind:'physical',owner:s.id,power:dealt*((stats.bleed||0)/100+(a.skill==='rend'?.2:0))/3,remaining:3,tick:.5}];}
  const died=e.hp<=0;if(died){e.dead=true;e.hp=0;if(e.type==='warden')w.d.bossDead=true;}
  const eligible=died?[...s.room.players.values()].filter(p=>p.area===s.area&&distance(p.pos,e)<30&&(p===s||s.party&&p.party===s.party)).map(p=>p.id):[];
  if(died)for(const id of eligible){const p=s.room.players.get(id),boss=e.type==='warden',rng=random(Math.floor(Math.random()*1e9)),level=actOneLootLevel(w.d.areaLevel||1);this.drop(p,{x:e.x+.2,y:e.y,gold:goldReward(w.d.areaLevel,{boss,elite:e.elite})});if(boss||e.elite||rng()<.3)this.drop(p,{x:e.x-.3,y:e.y+.3,item:rollSetItem(rng,level,{boss,elite:e.elite})||generateItem(rng,level,boss)});if(boss)this.drop(p,{x:e.x+.5,y:e.y+.4,item:bossRelic(e,level),manual:true});}
  const event={type:'hit',area:s.area,enemy:copy(e),damage:dealt,element:a.element,crit:!!a.crit,attacker:s.id,eligible,dead:died,skill:a.skill,direct:a.direct!==false};if(died)for(const id of eligible){const peer=s.room.players.get(id),key=s.area+':'+e.id;(peer.killQueue??={})[key]={...event,key};}this.broadcast(s.room,event,s.area);
 }
 tick(dt=.05){for(const s of [...this.sessions.values()])if(this.now()-s.seen>25000){this.send(s,{type:'session-ended',reason:'The connection expired. Press P to save and rejoin.'});this.leave(s);}for(const [id,r]of this.rooms){if(!r.players.size&&this.now()-r.emptyAt>300000){this.rooms.delete(id);continue;}r.invites=r.invites.filter(i=>this.now()-i.at<60000&&r.players.has(i.from));for(const w of r.worlds.values())this.tickArea(r,w,dt);for(const s of r.players.values())this.send(s,this.snapshot(s));}}
 tickArea(room,w,dt){
 const players=[...room.players.values()].filter(s=>s.area===w.key&&s.player.hp>0&&!s.trade&&!this.safe(s));if(!players.length)return;w.tick+=dt;
 const attack=(e,p,amount,element='physical',weapon=true)=>this.send(p,{type:'hurt',source:{x:e.x,y:e.y,level:e.level,attackRating:12+e.level*4+(e.type==='warden'?18:0)},amount,element,weapon});
 const visual=(type,x,y,life,extra={})=>this.broadcast(room,{type:'world-effect',area:w.key,effect:{type,x,y,life,maxLife:life,...extra}},w.key);
 for(const e of w.d.enemies){if(e.dead)continue;for(const dot of e.dots||[]){dot.remaining-=dt;dot.tick-=dt;if(dot.tick<=0){dot.tick=.5;const owner=room.players.get(dot.owner);if(owner)this.hit(owner,{enemyId:e.id,damage:dot.power*.5,element:dot.kind,direct:false,skill:'dot'});}}e.dots=(e.dots||[]).filter(v=>v.remaining>0);if(e.dead)continue;e.hit=Math.max(0,(e.hit||0)-dt);e.shock=Math.max(0,(e.shock||0)-dt);e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);e.slow=Math.max(0,(e.slow||0)-dt);const target=players.reduce((a,b)=>distance(e,a.pos)<distance(e,b.pos)?a:b),dist=distance(e,target.pos);if(dist>19)continue;if(dist<10)e.aggro=true;if(!e.aggro)continue;e.cooldown-=dt;
  if(e.type==='warden'){e.special=(e.special??2)-dt;if(e.special<=0){const plan=bossPlan(e,target.pos,e.beat||0);e.beat=(e.beat||0)+1;e.special=3.8;e.moveName=plan.name;e.moveTimer=1.5;for(const c of plan.commands){if(c.kind==='shot')w.shots.push({...c,id:randomUUID(),element:c.element,life:c.life||4,source:copy(e),kind:c.element});if(['mark','sweep','wave'].includes(c.kind)){w.actions.push({...c,age:0,done:false,source:copy(e),hits:new Set()});visual(c.kind==='sweep'?'boss-sweep-warning':c.kind==='wave'?'ring':'meteor-warning',c.x,c.y,c.delay||1,{radius:c.radius,dx:c.dx,dy:c.dy,arc:c.arc,theme:e.phaseType,element:c.element,pending:false});}if(c.kind==='blink'&&isWalkable(w.d,c.x,c.y)){e.x=c.x;e.y=c.y;}if(c.kind==='charge')e.charge={...c,delay:.9,left:1.1,hits:new Set()};if(c.kind==='summon'&&!e.summoned){e.summoned=true;for(let i=0;i<3;i++)w.d.enemies.push(makeEnemy(10000+w.d.enemies.length,e.x+Math.cos(i*2),e.y+Math.sin(i*2),'skeleton',e.level));}}}}
  e.moveTimer=Math.max(0,(e.moveTimer||0)-dt);
  if(e.charge){e.charge.delay-=dt;if(e.charge.delay<=0){e.charge.left-=dt;moveEntity(w.d,e,e.charge.dx*7*dt,e.charge.dy*7*dt);for(const p of players)if(distance(e,p.pos)<1.3&&!e.charge.hits.has(p.id)){attack(e,p,e.damage*1.3);e.charge.hits.add(p.id);}if(e.charge.left<=0)e.charge=null;}continue;}
  if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.attackAnim=.3;e.attackDuration=.3;for(const p of players)if(distance(e,p.pos)<(e.type==='warden'?2.7:1.8))attack(e,p,e.damage*(e.type==='warden'?1.6:1));e.cooldown=.8;}continue;}
  const ranged=['archer','hexer','bomber'].includes(e.role);if(ranged&&dist<8&&e.cooldown<=0){const len=dist||1,element=e.role==='archer'?'physical':e.role==='bomber'?'fire':'aether';w.shots.push({id:randomUUID(),x:e.x,y:e.y,dx:(target.pos.x-e.x)/len,dy:(target.pos.y-e.y)/len,speed:6,life:2,damage:e.damage,element,kind:element==='physical'?'blade':element,source:copy(e)});e.attackAnim=.4;e.cooldown=2;continue;}
  if(dist<(e.type==='warden'?2.2:1.5)){if(e.cooldown<=0)e.windup=e.type==='warden'?.85:.5;continue;}
  let point=target.pos;if(!e.path||e.pathTime<w.tick){e.path=findPath(w.d,e,target.pos);e.pathTime=w.tick+.8;}while(e.path?.length&&distance(e,e.path[0])<.3)e.path.shift();point=e.path?.[0]||point;const len=distance(e,point)||1,speed=e.speed*(e.slow>0?.5:1);moveEntity(w.d,e,(point.x-e.x)/len*speed*dt,(point.y-e.y)/len*speed*dt);
 }
 for(const b of w.shots){b.life-=dt;b.x+=b.dx*b.speed*dt;b.y+=b.dy*b.speed*dt;if(!isWalkable(w.d,b.x,b.y))b.life=0;for(const p of players)if(b.life>0&&distance(b,p.pos)<.6){attack(b.source,p,b.damage,b.element);b.life=0;}}w.shots=w.shots.filter(b=>b.life>0);
 for(const a of w.actions){a.age+=dt;if(a.age<(a.delay||1))continue;const progress=Math.min(1,(a.age-(a.delay||1))/.7);if(!a.done){visual(a.kind==='sweep'?'boss-sweep':a.kind==='wave'?'boss-wave':'boss-impact',a.x,a.y,.7,{radius:a.radius,element:a.element,theme:a.source.phaseType,dx:a.dx,dy:a.dy,arc:a.arc});a.done=true;}for(const p of players){if(a.hits.has(p.id))continue;const hit=a.kind==='sweep'?bossSweepHits(a,p.pos):a.kind==='wave'?bossWaveHits(a,p.pos,progress):distance(a,p.pos)<a.radius;if(hit){attack(a.source,p,a.damage,a.element,false);a.hits.add(p.id);}}}w.actions=w.actions.filter(a=>a.age<(a.delay||1)+.75);
 }
}
