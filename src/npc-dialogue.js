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
  this.root.addEventListener('click',e=>{const action=e.target.closest('[data-talk]')?.dataset.talk;if(action)this.choose(action);});
 }
 openSign(sign){
  Object.assign(this.game,{target:null,path:null,interactTarget:null,primaryHeld:false,secondaryHeld:false,moving:false});this.npc=sign;this.page='main';this.game.dialogue='sign:'+sign.id;this.root.classList.remove('story-reading');this.root.classList.add('sign-reading');this.root.classList.remove('hidden');this.root.setAttribute('aria-label','Road sign');this.root.replaceChildren();const text=document.createElement('div');text.className='npc-spoken';text.textContent=sign.text;this.root.append(text);this.position();
 }
 open(npc){
  this.root.classList.remove('sign-reading','story-reading');this.root.setAttribute('aria-label','Conversation with '+npc.name);Object.assign(this.game,{target:null,path:null,interactTarget:null,primaryHeld:false,secondaryHeld:false,moving:false});this.npc=npc;this.game.dialogue=npc.id;this.page='main';this.speech=npcGreeting(this.game.player,npc.id);this.root.classList.remove('hidden');this.render();
 }
 close(){this.root.classList.add('hidden');this.npc=null;this.page='main';this.game.dialogue=null;}
 position(){if(!this.npc)return;const at=this.project(this.npc.x,this.npc.y),r=this.root.getBoundingClientRect();this.root.style.left=Math.max(8,Math.min(innerWidth-r.width-8,at.x-r.width/2))+'px';this.root.style.top=Math.max(42,Math.min(innerHeight-r.height-140,at.y-130-r.height))+'px';}
 render(){
  const n=this.npc,p=this.game.player;if(!n)return;
  const btn=(id,text,quest=false)=>`<button data-talk="${esc(id)}"><span class="npc-quest-mark" ${quest?'aria-label="Quest"':'aria-hidden="true"'}>${quest?'!':''}</span><span class="npc-topic">${esc(text)}</span></button>`;
  let topics='';
  if(this.page==='stories'){
   topics=npcTopics(p,n.id).map(t=>btn('lore:'+t.id,t.label)).join('')+btn('topics','Back');
  }else{
   topics=btn('talk','Talk');
   if(n.id==='guide')topics+=btn(p.quests.guideMet?'quest':'accept',guideQuestLabel(p),true)+btn('heal','Heal')+(p.quests.wardenDefeated&&!p.quests.guideRewarded?btn('reward','Claim reward',true):'');
   if(n.id==='merchant')topics+=btn('merchant','Trade');
   if(n.id==='smith')topics+=btn('smith','Repair / Reforge');
   if(n.id==='scholar')topics+=btn('identify','Identify items')+btn('inventory','Examine belongings');
   if(p.campaign)topics+=btn('journal','Quest log',n.id==='guide'&&!p.quests.guideMet);
  }
  this.root.innerHTML=`<header>${esc(n.name)}</header>${this.speech?`<div class="npc-spoken" aria-live="polite">${esc(this.speech)}</div>`:''}<nav>${topics}${btn('leave','Leave')}</nav>`;this.root.scrollTop=0;this.position();
 }
 choose(action){
  const p=this.game.player;if(!this.npc)return;if(action==='leave')return this.close();
  if(['merchant','smith','inventory','journal'].includes(action)){if(action==='journal')this.game.storyBookTab='quests';this.close();this.openPanel(action);return;}
  if(action==='talk'){this.page='stories';this.speech=npcTalk(p,this.npc.id);}
  else if(action==='topics'){this.page='main';this.speech=npcGreeting(p,this.npc.id);}
  else if(action.startsWith('lore:')){const entry=npcTopics(p,this.npc.id).find(t=>t.id===action.slice(5));if(!entry)return;this.speech=entry.text;}
  else if(action==='quest'){this.page='main';this.speech=this.npc.id==='guide'?guideStory(p):npcTalk(p,this.npc.id);}
  else if(action==='accept'){const result=acceptGuideQuest(p);this.toast(result.message);this.speech=result.ok?guideStory(p):result.message;this.save();}
  else if(action==='herd-reward'||action==='provisions-reward'){const result=action==='herd-reward'?claimHerdReward(p):claimProvisionsReward(p);this.speech=result.message;this.toast(result.message);this.game.stats=playerStats(p);this.save();}
  else if(action==='reward'){const result=claimGuideReward(p);this.speech=result.ok?'A pouch from the people who could spare it. Edrin is home. I will not pretend gold makes a fair payment for that. Thank you.':result.message;this.toast(result.message);this.save();}
  else if(action==='heal'){p.hp=this.game.stats.maxHp;p.mana=this.game.stats.maxMana;refillFlask(p,Math.max(0,60-ensureFlask(p).charges));refillManaFlask(p,Math.max(0,60-(p.manaFlask?.charges||0)));this.toast('Life and spirit restored.');this.speech='Clean bandages. A full flask. Sit until your hands stop shaking; nobody here needs you to look brave.';this.save();}
  else if(action==='identify'){const result=identifyAll(p);this.toast(result.message);this.speech=result.message;this.save();}
  this.render();
 }
}
