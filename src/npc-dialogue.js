import {questSpeech} from './quest-conversations.js';
import {currentActOneQuest,questGiver,actOneQuests,acceptActOneQuest,claimActOneQuest,questDirections,actOneObjective} from './act-one.js';
import {claimHerdReward,claimProvisionsReward} from './opening-quests.js';
import {playerStats} from './game.js';
import {refillManaFlask,ensureFlask,refillFlask} from './flasks.js';
import {acceptGuideQuest,claimGuideReward,identifyAll} from './settlement.js';
import {npcGreeting,npcTalk,npcTopics,guideQuestStory,guideQuestLabel} from './npc-story.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const guideStory=guideQuestStory;
export class NPCDialogue{
 constructor(game,{project,openPanel,save,toast}){
  Object.assign(this,{game,project,openPanel,save,toast});this.root=document.createElement('section');this.root.id='npc-dialogue';this.root.className='npc-conversation hidden';this.root.setAttribute('aria-label','Conversation');document.getElementById('app').append(this.root);
  this.root.addEventListener('click',e=>{if(this.reading){this.advanceSpeech();return;}const action=e.target.closest('[data-talk]')?.dataset.talk;if(action)this.choose(action);});
 }
 openSign(sign){
  this.stopSpeech();
  Object.assign(this.game,{target:null,path:null,interactTarget:null,primaryHeld:false,secondaryHeld:false,moving:false});this.npc=sign;this.page='main';this.game.dialogue='sign:'+sign.id;this.root.classList.remove('story-reading');this.root.classList.add('sign-reading');this.root.classList.remove('hidden');this.root.setAttribute('aria-label','Road sign');this.root.replaceChildren();const text=document.createElement('div');text.className='npc-spoken';text.textContent=sign.text;this.root.append(text);this.position();
 }
 open(npc){
  this.root.classList.remove('sign-reading','story-reading');this.root.setAttribute('aria-label','Conversation with '+npc.name);Object.assign(this.game,{target:null,path:null,interactTarget:null,primaryHeld:false,secondaryHeld:false,moving:false});this.npc=npc;this.game.dialogue=npc.id;this.page='main';this.speech=npcGreeting(this.game.player,npc.id);this.root.classList.remove('hidden');
  const quest=currentActOneQuest(this.game.player);
  if(quest&&questGiver(quest).id===npc.id)this.presentQuest(quest);else this.render();
 }
 close(){this.stopSpeech();this.root.classList.add('hidden');this.npc=null;this.page='main';this.game.dialogue=null;}
 position(){if(!this.npc)return;const at=this.project(this.npc.x,this.npc.y),r=this.root.getBoundingClientRect();this.root.style.left=Math.max(8,Math.min(innerWidth-r.width-8,at.x-r.width/2))+'px';this.root.style.top=Math.max(42,Math.min(innerHeight-r.height-140,at.y-130-r.height))+'px';}
 render(){
  const n=this.npc,p=this.game.player;if(!n)return;
  const btn=(id,text,quest=false)=>`<button data-talk="${esc(id)}"><span class="npc-quest-mark" ${quest?'aria-label="Quest"':'aria-hidden="true"'}>${quest?'!':''}</span><span class="npc-topic">${esc(text)}</span></button>`;
  let topics='';
  if(this.page==='stories'){
   topics=npcTopics(p,n.id).map(t=>btn('lore:'+t.id,t.label)).join('')+btn('topics','Back');
  }else{
   topics=btn('talk','Talk');
   if(n.id==='guide')topics+=(p.campaign?'':btn(p.quests.guideMet?'quest':'accept',guideQuestLabel(p),true))+btn('heal','Heal')+(!p.campaign&&p.quests.wardenDefeated&&!p.quests.guideRewarded?btn('reward','Claim reward',true):'');
   const active=currentActOneQuest(p);if(active&&questGiver(active).id===n.id)topics+=btn('quest',active.title,true);
   if(n.id==='merchant')topics+=btn('merchant','Trade');
   if(n.id==='smith')topics+=btn('smith','Repair / Reforge');
   if(n.id==='scholar')topics+=btn('identify','Identify items')+btn('inventory','Examine belongings');
   if(p.campaign)topics+=btn('journal','Quest log',n.id==='guide'&&!p.quests.guideMet);
  }
  this.root.innerHTML=`<header>${esc(n.name)}</header>${this.speech?`<div class="npc-spoken" aria-live="polite">${esc(this.speech)}</div>`:''}<nav>${topics}${btn('leave','Leave')}</nav>`;this.root.scrollTop=0;this.position();if(this.speech)this.beginSpeech();
 }
 stopSpeech(){cancelAnimationFrame(this.speechFrame);this.reading=false;this.onSpeechDone=null;}
 beginSpeech(done=null){
  cancelAnimationFrame(this.speechFrame);this.reading=true;this.onSpeechDone=done;this.speechChars=Array.from(this.speech||'');this.shown=0;this.speechStart=performance.now();
  const spoken=this.root.querySelector('.npc-spoken');if(!spoken)return;
  spoken.removeAttribute('aria-live');spoken.setAttribute('aria-label',this.speech);spoken.replaceChildren();
  const full=document.createElement('span');full.className='npc-speech-measure';full.textContent=this.speech;full.setAttribute('aria-hidden','true');
  this.reveal=document.createElement('span');this.reveal.className='npc-speech-reveal';this.reveal.setAttribute('aria-hidden','true');spoken.append(full,this.reveal);
  this.root.querySelector('nav').hidden=true;const hint=document.createElement('p');hint.className='npc-reading-hint';hint.textContent='Click or Space to reveal · Esc to leave';this.root.append(hint);this.position();
  const step=now=>{if(!this.reading)return;this.shown=Math.min(this.speechChars.length,Math.floor((now-this.speechStart)*.042));this.reveal.textContent=this.speechChars.slice(0,this.shown).join('');spoken.scrollTop=Math.max(0,this.reveal.scrollHeight-spoken.clientHeight+12);if(this.shown<this.speechChars.length)this.speechFrame=requestAnimationFrame(step);else hint.textContent='Click or Space to continue · Esc to leave';};
  this.speechFrame=requestAnimationFrame(step);
 }
 advanceSpeech(){
  if(!this.reading)return false;
  if(this.shown<this.speechChars.length){cancelAnimationFrame(this.speechFrame);this.shown=this.speechChars.length;this.reveal.textContent=this.speech;this.root.querySelector('.npc-reading-hint').textContent='Click or Space to continue · Esc to leave';return true;}
  const done=this.onSpeechDone;this.stopSpeech();this.root.querySelector('.npc-reading-hint')?.remove();this.root.querySelector('nav').hidden=false;if(done)done();this.position();return true;
 }
 presentQuest(quest){
  const p=this.game.player,q=actOneQuests(p).find(q=>q.id===quest.id),giver=questGiver(quest);
  const ready=q.ready;
  this.speech=ready?questSpeech(quest,'reward'):q.accepted?actOneObjective(p):questSpeech(quest)+(quest.leaders?'\n\n'+questDirections(p,quest):'');
  this.render();this.onSpeechDone=()=>{
   if(ready){const reward=claimActOneQuest(p,quest.id);if(reward){this.game.stats=playerStats(p);this.toast(`${quest.title} · +${reward.gold} gold · +${reward.xp} experience${reward.levels?' · Level '+p.level:''}`);this.save();const next=currentActOneQuest(p);if(next&&questGiver(next).id===giver.id){this.presentQuest(next);return;}}}
   else if(!q.accepted){if(quest.id==='last-herd'&&!p.quests.guideMet){const gift=acceptGuideQuest(p);if(!gift.ok){this.toast(gift.message);return;}}acceptActOneQuest(p,quest.id);this.save();}
   this.speech='';this.render();
  };
 }
 choose(action){
  const p=this.game.player;if(!this.npc||this.reading)return;if(action==='leave')return this.close();
  if(['merchant','smith','inventory','journal'].includes(action)){if(action==='journal')this.game.storyBookTab='quests';this.close();this.openPanel(action);return;}
  if(action==='talk'){this.page='stories';this.speech=npcTalk(p,this.npc.id);}
  else if(action==='topics'){this.page='main';this.speech=npcGreeting(p,this.npc.id);}
  else if(action.startsWith('lore:')){const entry=npcTopics(p,this.npc.id).find(t=>t.id===action.slice(5));if(!entry)return;this.speech=entry.text;}
  else if(action==='quest'&&p.campaign){const q=currentActOneQuest(p);if(q&&questGiver(q).id===this.npc.id)this.presentQuest(q);return;}
  else if(action==='quest'){this.page='main';this.speech=this.npc.id==='guide'?guideStory(p):npcTalk(p,this.npc.id);}
  else if(action==='accept'){const result=acceptGuideQuest(p);this.toast(result.message);this.speech=result.ok?guideStory(p):result.message;this.save();}
  else if(action==='herd-reward'||action==='provisions-reward'){const result=action==='herd-reward'?claimHerdReward(p):claimProvisionsReward(p);this.speech=result.message;this.toast(result.message);this.game.stats=playerStats(p);this.save();}
  else if(action==='reward'){const result=claimGuideReward(p);this.speech=result.ok?'A pouch from the people who could spare it. Edrin is home. I will not pretend gold makes a fair payment for that. Thank you.':result.message;this.toast(result.message);this.save();}
  else if(action==='heal'){p.hp=this.game.stats.maxHp;p.mana=this.game.stats.maxMana;refillFlask(p,Math.max(0,60-ensureFlask(p).charges));refillManaFlask(p,Math.max(0,60-(p.manaFlask?.charges||0)));this.toast('Life and spirit restored.');this.speech='Clean bandages. A full flask. Sit until your hands stop shaking; nobody here needs you to look brave.';this.save();}
  else if(action==='identify'){const result=identifyAll(p);this.toast(result.message);this.speech=result.message;this.save();}
  this.render();
 }
}
