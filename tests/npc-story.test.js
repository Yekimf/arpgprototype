import {test} from 'node:test';
import assert from 'node:assert/strict';
import {townStoryFacts,guideQuestStory,guideQuestLabel,npcGreeting,npcTalk,npcTopics} from '../src/npc-story.js';
import {NPCDialogue,guideStory} from '../src/npc-dialogue.js';
import {createPlayer} from '../src/game.js';

const character=()=>({...createPlayer(),campaign:{records:[],defeated:[]}});
test('Maelin guides the six combat objectives without requiring acceptance or a fetched item',()=>{
 const p=character();assert.match(guideQuestStory(p),/flock.*fence/);assert.equal(guideStory,guideQuestStory);
 const progress=[['field-1-0',null,/Hadrin/,/Marchgate/],[null,'captain-1-0',/Three enforcers/,/levy/],['field-1-1',null,/winter stores/,/granary/],[null,'captain-1-1',/three armed circles/,/choir/],['field-1-2',null,/third bell/,/redoubt/],[null,'knight-1',/sleeping by a fire/,/road ahead/]];
 for(const [record,boss,text,label] of progress){if(record)p.campaign.records.push(record);if(boss)p.campaign.defeated.push(boss);const before=JSON.stringify(p);assert.match(guideQuestStory(p),text);assert.match(guideQuestLabel(p),label);assert.equal(JSON.stringify(p),before);}
 assert.equal(p.quests.guideMet,false);assert.equal(p.inventory.length,0);
});
test('NPC accounts react only to events actually completed and preserve an honest witness',()=>{
 const p=character(),initial=npcGreeting(p,'guide');p.campaign.defeated.push('captain-1-1');
 assert.equal(townStoryFacts(p).levy,false);assert.match(npcTalk(p,'merchant'),/keep clear.*levy banners/);assert.notEqual(npcGreeting(p,'guide'),initial);
 p.quests.scholarRescued=true;assert.match(npcTopics(p,'scholar').find(t=>t.id==='witness').text,/did not see Alaric die/);
 assert.match(npcTopics(p,'scholar').find(t=>t.id==='binding').text,/still singing/);
 p.campaign.records.push('field-1-2');assert.match(npcTopics(p,'scholar').find(t=>t.id==='binding').text,/broke the choir/);
 for(const id of ['guide','merchant','smith','scholar']){
  const topics=npcTopics(p,id);assert.equal(topics.length,3);assert.equal(new Set(topics.map(t=>t.id)).size,3);
  for(const topic of topics){assert.ok(topic.label&&topic.text);assert.ok(topic.text.length<=400);}
 }
 const legacy=createPlayer();legacy.quests.scholarRescued=true;assert.match(guideQuestStory(legacy),/Edrin is home/);
});
test('rescuing Edrin early keeps the quest label aligned with unfinished neighbours’ battles',()=>{
 const p=character();p.quests.scholarRescued=true;p.campaign.defeated.push('knight-1');
 assert.match(guideQuestStory(p),/flock.*fence/);assert.equal(guideQuestLabel(p),'Elin’s last herd');
 p.campaign.records.push('field-1-0');assert.match(guideQuestStory(p),/Captain Hadrin/);assert.equal(guideQuestLabel(p),'Ruined Marchgate');
 p.campaign.defeated.push('captain-1-0','captain-1-1');p.campaign.records.push('field-1-1');
 assert.match(guideQuestStory(p),/three armed circles/);assert.equal(guideQuestLabel(p),'The thorn choir');
 p.campaign.records.push('field-1-2');assert.match(guideQuestStory(p),/sleeping by a fire/);assert.equal(guideQuestLabel(p),'The road ahead');
});

function conversation(){
 const names=['document','innerWidth','innerHeight'],original=Object.fromEntries(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 const element=()=>({children:[],style:{},attrs:{},innerHTML:'',textContent:'',classList:{values:new Set(),add(...names){for(const n of names)this.values.add(n);},remove(...names){for(const n of names)this.values.delete(n);}},setAttribute(k,v){this.attrs[k]=v;},append(node){this.children.push(node);},replaceChildren(){this.children=[];this.innerHTML='';},addEventListener(){},getBoundingClientRect(){return{width:330,height:220};}});
 const app=element();globalThis.document={createElement:element,getElementById:()=>app};globalThis.innerWidth=1024;globalThis.innerHeight=720;
 const game={player:character(),storyBookTab:'accounts',primaryHeld:true,secondaryHeld:true,moving:true,target:{}};const panels=[],dialogue=new NPCDialogue(game,{project:()=>({x:512,y:400}),openPanel:id=>panels.push(id),save(){},toast(){}});
 return{game,dialogue,panels,restore(){for(const n of names){if(original[n])Object.defineProperty(globalThis,n,original[n]);else delete globalThis[n];}}};
}
test('conversations retain direct services, escape text, and keep optional talk separate from progression',()=>{
 const {game,dialogue,panels,restore}=conversation();try{
  dialogue.open({id:'merchant',name:'<img src=x onerror=alert(1)>',x:0,y:0});assert.equal(game.primaryHeld,false);assert.equal(game.secondaryHeld,false);assert.equal(game.moving,false);
  assert.match(dialogue.root.innerHTML,/&lt;img/);assert.doesNotMatch(dialogue.root.innerHTML,/<img/);assert.match(dialogue.root.innerHTML,/data-talk="merchant"/);
  const before=JSON.stringify(game.player);dialogue.choose('talk');assert.match(dialogue.root.innerHTML,/data-talk="lore:trade"/);assert.match(dialogue.root.innerHTML,/data-talk="topics"/);assert.equal(JSON.stringify(game.player),before);
  dialogue.choose('topics');dialogue.choose('merchant');assert.deepEqual(panels,['merchant']);assert.equal(game.dialogue,null);
  dialogue.open({id:'guide',name:'Maelin',x:0,y:0});dialogue.choose('journal');assert.deepEqual(panels,['merchant','journal']);assert.equal(game.storyBookTab,'quests');
 }finally{restore();}
});
test('signs use literal text and no conversation buttons, and a new conversation clears account styling',()=>{
 const {dialogue,restore}=conversation();try{
  dialogue.root.classList.add('story-reading');dialogue.openSign({id:'test',x:0,y:0,text:'<button>Not a button</button>'});
  assert.equal(dialogue.root.children[0].textContent,'<button>Not a button</button>');assert.equal(dialogue.root.innerHTML,'');assert.equal(dialogue.root.classList.values.has('story-reading'),false);
  dialogue.root.classList.add('story-reading');dialogue.open({id:'smith',name:'Garran',x:0,y:0});assert.equal(dialogue.root.classList.values.has('story-reading'),false);assert.equal(dialogue.root.classList.values.has('sign-reading'),false);assert.match(dialogue.root.innerHTML,/data-talk="smith"/);
 }finally{restore();}
});
