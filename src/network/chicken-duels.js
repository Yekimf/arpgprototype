import {selectedCompanion} from './chicken-companions.js';
import {restorePet,petStats,petName,movesFor,MOVES,strikePet} from '../chicken-pets.js';
const copy=value=>structuredClone(value);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const current=s=>s.room.petDuels?.get(s.petDuel);
const available=(w,s)=>s&&s.player.hp>0&&!s.trade&&!s.petBusy&&w.safe(s)&&selectedCompanion(s.player);
const battlePet=s=>{const c=selectedCompanion(s.player);return restorePet({id:'duel:'+s.id,petId:c.id,breed:c.breed,element:c.element,name:petName(c).slice(0,40),hat:c.hat,level:Math.max(1,Math.min(50,Math.floor(c.level)||1)),xp:0});};
export function petDuelView(s){const d=current(s);if(!d)return null;const other=d.players.find(id=>id!==s.id);return {id:d.id,revision:d.revision,phase:d.phase,challenger:d.players[0],opponent:d.names[other],self:copy(d.pets[s.id]),foe:copy(d.pets[other]),round:d.round,status:copy(d.status),log:[...d.log],events:copy(d.events),waiting:!!d.choices[s.id],opponentReady:!!d.choices[other],expiresAt:d.expiresAt,result:d.phase==='ended'?(d.winner===s.id?'won':d.winner?'lost':d.cancelled?'cancelled':'draw'):null};}
function notify(w,d){for(const id of d.players){const s=d.room.players.get(id);if(s)w.send(s,w.snapshot(s));}}
function end(w,d,winner,message,cancelled=false,keepEvents=false){if(d.phase==='ended')return;if(!keepEvents)d.events=[];d.phase='ended';d.winner=winner;d.cancelled=cancelled;d.choices={};d.revision++;d.log.push(message);d.log=d.log.slice(-12);d.events.push({text:message});d.expiresAt=w.now()+60000;notify(w,d);}
function forget(w,s){const d=current(s);s.petDuel=null;w.send(s,w.snapshot(s));if(d&&d.players.every(id=>d.room.players.get(id)?.petDuel!==d.id))d.room.petDuels.delete(d.id);}
export function cancelPetDuel(w,s,reason='left the company'){const d=current(s);if(!d)return;if(d.phase!=='ended')end(w,d,d.phase==='active'?d.players.find(id=>id!==s.id):null,s.player.name+' '+reason+'.',d.phase==='pending');forget(w,s);}
export function tickPetDuels(w,room){for(const d of room.petDuels?.values()||[]){if(w.now()<d.expiresAt)continue;if(d.phase==='ended'){for(const id of d.players){const s=room.players.get(id);if(s?.petDuel===d.id)forget(w,s);}room.petDuels.delete(d.id);}else if(d.phase==='pending')end(w,d,null,'The challenge expired.',true);else{const ready=d.players.filter(id=>d.choices[id]);end(w,d,ready.length===1?ready[0]:null,ready.length===1?d.names[ready[0]]+' wins by timeout.':'The bout ends in a draw: neither keeper chose a move.');}}}
export function chickenDuelAction(w,s,a){
 tickPetDuels(w,s.room);
 if(a.type==='pet-duel-request'){
  const peer=s.room.players.get(a.to);if(!peer||peer===s||s.petDuel||peer.petDuel||!available(w,s)||!available(w,peer)||s.area!==peer.area||distance(s.pos,peer.pos)>8)throw Error('Challenge a nearby keeper in Emberfall. Both need a companion at home and must finish any battle or trade.');
  if(w.now()-(s.lastPetChallenge||0)<3000)throw Error('Give the other keeper a moment before challenging again.');s.lastPetChallenge=w.now();
  const id=crypto.randomUUID(),d={id,room:s.room,players:[s.id,peer.id],names:{[s.id]:s.player.name,[peer.id]:peer.player.name},pets:{[s.id]:battlePet(s),[peer.id]:battlePet(peer)},phase:'pending',revision:1,round:0,status:{},choices:{},events:[],log:[s.player.name+' challenges '+peer.player.name+' to a friendly Trial of Feathers.'],expiresAt:w.now()+45000};s.room.petDuels??=new Map();s.room.petDuels.set(id,d);s.petDuel=peer.petDuel=id;notify(w,d);return;
 }
 const d=current(s);if(!d||a.id!==d.id)throw Error('That chicken challenge has ended.');
 if(a.type==='pet-duel-dismiss'){if(d.phase!=='ended')throw Error('Withdraw before closing the bout.');forget(w,s);return;}
 if(a.type==='pet-duel-cancel'){end(w,d,d.phase==='active'?d.players.find(id=>id!==s.id):null,s.player.name+(d.phase==='active'?' withdraws. The other keeper wins.':' declined the challenge.'),d.phase==='pending');return;}
 if(a.type==='pet-duel-accept'){
  if(d.phase!=='pending'||s.id===d.players[0])throw Error('Only the invited keeper can accept.');const peers=d.players.map(id=>s.room.players.get(id));if(peers.some(p=>!available(w,p)||selectedCompanion(p.player).id!==d.pets[p.id].petId)||peers[0].area!==peers[1].area||distance(peers[0].pos,peers[1].pos)>8){end(w,d,null,'The keepers or companions are no longer ready. Challenge again in Emberfall.',true);return;}
  d.phase='active';d.revision++;d.expiresAt=w.now()+60000;d.log.push('Choose a move. Both chickens act after their keepers commit.');notify(w,d);return;
 }
 if(a.type!=='pet-duel-move'||d.phase!=='active'||a.round!==d.round||d.choices[s.id])throw Error('Wait for the next round before choosing again.');
 const pet=d.pets[s.id],usable=movesFor(pet).filter(k=>(pet.pp[k]??MOVES[k].pp)>0);if(!usable.includes(a.move)&&!(a.move==='struggle'&&!usable.length))throw Error('That chicken move is unavailable.');d.choices[s.id]=a.move;d.revision++;
 if(!d.players.every(id=>d.choices[id])){notify(w,d);return;}
 resolveRound(d);if(Object.values(d.pets).some(p=>p.hp<=0)){const alive=d.players.filter(id=>d.pets[id].hp>0);end(w,d,alive.length===1?alive[0]:null,alive.length===1?d.names[alive[0]]+' wins the Trial of Feathers!':'Both chickens are exhausted. A draw!',false,true);}else{d.expiresAt=w.now()+60000;notify(w,d);}
}
export function resolveRound(d,rng=Math.random){
 d.events=[];const speed=p=>petStats(p).speed*(d.status[p.id]?.slow?.65:1)*(d.status[p.id]?.haste?1.5:1),[a,b]=d.players;
 const delta=speed(d.pets[a])-speed(d.pets[b]),order=delta>0||delta===0&&rng()<.5?[a,b]:[b,a];
 for(const id of order){const attacker=d.pets[id],target=d.pets[d.players.find(v=>v!==id)];if(attacker.hp<=0||target.hp<=0)continue;const move=d.choices[id];if(move==='struggle'){const damage=Math.max(3,attacker.level*2);target.hp=Math.max(0,target.hp-damage);attacker.hp=Math.max(0,attacker.hp-2);const text=petName(attacker)+' struggles for '+damage+' damage.';d.log.push(text);d.events.push({actor:attacker.id,target:target.id,text,damage});}else strikePet(d,attacker,target,move,rng);}
 for(const p of Object.values(d.pets)){const st=d.status[p.id]||{};if(p.hp>0&&st.burn){const damage=Math.max(2,Math.ceil(petStats(p).hp*.06));p.hp=Math.max(0,p.hp-damage);const text=petName(p)+' is scorched for '+damage+'.';d.log.push(text);d.events.push({target:p.id,damage,text,move:'ember0'});}for(const k of ['burn','slow','haste','weaken'])if(st[k]&&--st[k]<=0)delete st[k];}
 d.round++;d.revision++;d.choices={};d.log=d.log.slice(-12);
}
