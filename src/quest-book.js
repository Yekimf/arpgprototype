import {QUEST_ART} from './assets.js';
import {actQuests} from './quests.js';
import {actFor} from './campaign.js';
import {STORY_RECORDS} from './act-one-story.js';
import {accountPage,visibleQuestNarrative} from './story-book.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const corners='<i class="corner-rivet tl"></i><i class="corner-rivet tr"></i><i class="corner-rivet bl"></i><i class="corner-rivet br"></i>';
function bookHeader(act,c,accounts){return `${corners}<header class="quest-book-heading"><h2 id="modal-title">${accounts?'Accounts':'Quests'}</h2><button class="close" data-action="close" aria-label="Close journal">×</button></header><nav class="quest-act-tabs" aria-label="Journal sections"><button data-quest-act="1" aria-label="Act 1 quests" aria-pressed="${act===1}" ${c.act<1?'disabled':''}>I</button><span class="story-book-tabs" role="tablist" aria-label="Journal pages"><button role="tab" data-story-book="quests" aria-selected="${!accounts}">Quests</button><button role="tab" data-story-book="accounts" aria-selected="${accounts}">Accounts</button></span></nav><div class="quest-province">${esc(actFor(act).title)}</div>`;}
function accountMarkup(game){
 const {entries,index,record}=accountPage(game.player,STORY_RECORDS,{id:game.storyAccountId,page:game.storyAccountPage});game.storyAccountPage=index;game.storyAccountId=record?.id||null;
 return `<div class="quest-selected-title">${esc(record?.title||'No accounts recorded')}</div><div class="journal-pages quest-parchment story-account-page" tabindex="0" aria-label="Discovered account">${record?`<div class="story-record-origin">${esc(record.area||'The Kingsroad')}</div><p class="story-record-text">${esc(record.text)}</p><p class="story-record-note">Kept with your account of the journey.</p>`:'<p class="story-record-empty">Inspect old markers and notices along the road to keep their words here. These accounts belong to the places you find them; they are not errands.</p>'}</div><footer class="quest-book-footer story-account-footer"><button data-story-account-page="${index-1}" aria-label="Previous account" ${!record||index===0?'disabled':''}>‹ Earlier</button><span>${record?`${index+1} / ${entries.length}`:'0 / 0'}</span><button data-story-account-page="${index+1}" aria-label="Next account" ${!record||index>=entries.length-1?'disabled':''}>Later ›</button></footer>`;
}
export function renderQuestBook(game){
 const p=game.player,c=p.campaign;if(!c)return false;const m=document.getElementById('modal'),act=Math.max(1,Math.min(c.act,game.questAct||game.act||c.act));game.questAct=act;
 const accounts=game.storyBookTab==='accounts';m.classList.add('quest-book');m.classList.toggle('story-accounts',accounts);document.getElementById('modal-backdrop').classList.add('hud-mode');m.setAttribute('aria-modal','false');document.documentElement.style.setProperty('--quest-art',`url("${QUEST_ART}")`);
 if(accounts)m.innerHTML=bookHeader(act,c,true)+accountMarkup(game);
 else{
  const quests=actQuests(p,act);let index=game.questSelection;if(!Number.isInteger(index)||index<0||index>=quests.length)index=Math.max(0,quests.findIndex(q=>q.status==='active'));game.questSelection=index;const q=quests[index],visible=visibleQuestNarrative(q);
  m.innerHTML=bookHeader(act,c,false)+`<div class="quest-seals ${quests.length>6?'extended-quests':''}" aria-label="Act quests">${quests.map((entry,i)=>`<button class="quest-seal ${entry.status} ${index===i?'selected':''}" data-quest="${i}" aria-label="${esc(entry.status==='locked'?'An unopened chapter':entry.title)} · ${entry.status}" aria-pressed="${index===i}" style="--qx:${entry.art%3*50}%;--qy:${Math.floor(entry.art/3)*100}%"><span class="quest-seal-art" aria-hidden="true"></span><span class="quest-state" aria-hidden="true">${entry.status==='complete'?'◆':entry.status==='active'?'!':'◇'}</span></button>`).join('')}</div><div class="quest-selected-title">${esc(visible.title)}</div><div class="journal-pages quest-parchment" tabindex="0" aria-label="Selected quest"><div class="quest-status ${q.status}">${q.status==='complete'?'QUEST COMPLETE':q.status==='active'?(q.optional?'OPTIONAL · REWARD & LORE':'QUEST ACTIVE'):'THE ROAD AHEAD'}</div><p class="quest-objective">${esc(visible.objective)}</p><p>${esc(visible.story)}</p>${visible.aftermath?`<p class="journal-aftermath">${esc(visible.aftermath)}</p>`:''}</div><footer class="quest-book-footer">J · QUESTS <span>ESC · CLOSE</span></footer>`;
 }
 fitQuestBook();return true;
}
export function handleQuestBookClick(game,event){
 if(game.panel!=='journal')return false;
 const tab=event.target.closest('[data-story-book]');
 if(tab){if(!['quests','accounts'].includes(tab.dataset.storyBook))return false;game.storyBookTab=tab.dataset.storyBook;renderQuestBook(game);return true;}
 const account=event.target.closest('[data-story-account]');
 if(account){const page=accountPage(game.player,STORY_RECORDS,{id:account.dataset.storyAccount});if(!page.entries.some(record=>record.id===account.dataset.storyAccount))return true;game.storyBookTab='accounts';game.storyAccountId=account.dataset.storyAccount;game.storyAccountPage=page.index;renderQuestBook(game);return true;}
 const page=event.target.closest('[data-story-account-page]');
 if(page){game.storyAccountId=null;game.storyAccountPage=Number(page.dataset.storyAccountPage);renderQuestBook(game);return true;}
 return false;
}
function fitQuestBook(){const m=document.getElementById('modal');if(!m?.classList.contains('quest-book'))return;const cell=Math.max(22,Math.min(42,Math.floor((innerHeight-118-166)/11.5),Math.floor((innerWidth-42)/10)));m.style.width=cell*10+26+'px';m.style.height=Math.round(cell*11.5+166)+'px';}
window.addEventListener('resize',fitQuestBook);
