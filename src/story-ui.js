import {STORY_BEATS,areaStoryBeat,bossStoryBeat,storyStage} from './act-one-story.js';
import {StoryQueue,ensureStory} from './story-state.js';

const range=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const bossFor=chapter=>chapter===2?'knight-1':`captain-1-${chapter}`;

export class Storyteller{
 constructor(game,{save=()=>{},document:doc=globalThis.document}={}){
  this.game=game;this.save=save;this.document=doc;this.queue=new StoryQueue(game.player);this.clock=0;this.arrivalDelay=1.2;this.displayed=null;
  if(doc){
   this.root=doc.createElement('aside');this.root.id='story-caption';this.root.className='story-caption';this.root.hidden=true;this.root.setAttribute('role','status');this.root.setAttribute('aria-live','polite');this.root.setAttribute('aria-atomic','true');
   this.speaker=doc.createElement('div');this.speaker.className='story-caption-speaker';this.line=doc.createElement('div');this.line.className='story-caption-line';this.root.append(this.speaker,this.line);(doc.getElementById('app')||doc.body).append(this.root);
  }
 }
 reset(){this.queue.reset(this.game.player);this.clock=0;this.arrivalDelay=1.2;this.displayed=null;if(this.root)this.root.hidden=true;}
 blocked(){
  const g=this.game,doc=this.document;
  const visible=id=>{const node=doc?.getElementById(id);return !!node&&!node.hidden&&!node.classList.contains('hidden');};
  return !g.player.campaign||g.player.hp<=0||g.frontScreen||g.loading||g.paused||!!g.panel||!!g.dialogue||!!doc?.hidden||visible('skill-picker')||visible('lan-panel')||visible('friends-panel')||!!doc?.getElementById('lan-hud')?.classList.contains('chat-open');
 }
 areaFinished(){
  const g=this.game,c=g.player.campaign;
  return g.dungeon.kind==='stronghold'?(c.defeated||[]).includes(bossFor(g.chapter)):(c.records||[]).includes(`field-1-${g.chapter}`);
 }
 scan(){
  const g=this.game,p=g.player,d=g.dungeon;if(!d||g.act!==1)return;
  if(g.zone==='town'){this.queue.enqueue(STORY_BEATS.town[storyStage(p)]);return;}
  if(!this.areaFinished())this.queue.enqueue(areaStoryBeat(g.chapter,d.kind));
  if(g.chapter===0&&d.kind==='wilderness'&&!p.quests?.herdRewarded&&!(p.campaign.records||[]).includes('field-1-0')){
   const pasture=d.pasture?.gate||d.herd;if(pasture&&range(p,pasture)<10)this.queue.enqueue(STORY_BEATS.pasture);
  }
  for(const boss of d.enemies||[]){
   if(!boss.bossId||boss.dead||boss.hp<=0||!boss.aggro||range(p,boss)>12||(p.campaign.defeated||[]).includes(boss.bossId))continue;
   this.queue.enqueue(bossStoryBeat(boss.bossId,'engage'),{thread:boss.bossId,phase:'engage'});
   if(boss.hp/boss.maxHp<=.45)this.queue.enqueue(bossStoryBeat(boss.bossId,'wounded'),{thread:boss.bossId,phase:'wounded'});
  }
 }
 bossDeath(enemy){
  const id=enemy?.bossId;if(!id||!bossStoryBeat(id,'death')||!this.game.player.campaign)return;
  if(this.queue.deadBosses.has(id))return;
  // Kill confirmation wins over a queued threat, even while menus hide captions.
  // Discard the entry memory too: it may refer to finding the now fallen officer.
  this.queue.silenceBoss(id);const area=areaStoryBeat(this.game.chapter,this.game.dungeon?.kind);if(area)this.queue.discard(area.id);
  if(this.game.settings?.storyCaptions!==false)this.queue.enqueue(bossStoryBeat(id,'death'),{thread:id,phase:'death',priority:true});
 }
 tick(dt){
  const g=this.game;if(this.queue.player!==g.player)this.reset();
  const enabled=g.settings?.storyCaptions!==false,blocked=this.blocked();
  if(enabled&&!blocked){
   this.arrivalDelay=Math.max(0,this.arrivalDelay-dt);this.clock-=dt;
   if(this.arrivalDelay===0&&this.clock<=0){this.clock=.25;this.scan();}
  }
  const revision=this.queue.revision,current=this.queue.tick(dt,{blocked,enabled});if(this.queue.revision!==revision)this.save();
  if(!this.root)return;
  this.root.classList.toggle('reduced-motion',!!g.settings?.reducedMotion);
  if(!current||blocked||!enabled){this.root.hidden=true;return;}
  if(this.displayed!==current.id){this.speaker.textContent=current.speaker;this.line.textContent=current.text;this.displayed=current.id;}
  this.root.hidden=false;
 }
 snapshot(){return{seen:[...ensureStory(this.game.player).seen],records:[...ensureStory(this.game.player).records],caption:this.root?.hidden?null:this.queue.current?{id:this.queue.current.id,speaker:this.queue.current.speaker,text:this.queue.current.text}:null,queued:this.queue.pending.map(entry=>entry.id)};}
}
