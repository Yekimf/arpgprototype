import {STORY_BEATS,STORY_RECORDS} from './act-one-story.js';

const beats=[...Object.values(STORY_BEATS.town),...STORY_BEATS.areas,STORY_BEATS.pasture,...Object.values(STORY_BEATS.bosses).flatMap(phases=>Object.values(phases))];
const beatIds=new Set(beats.flatMap(beat=>[beat.id,...(beat.reply?[beat.id+'-reply']:[])]));
const recordIds=new Set(STORY_RECORDS.map(record=>record.id));
function cleanIds(value,known){return Array.isArray(value)?[...new Set(value.filter(id=>typeof id==='string'&&known.has(id)))].slice(0,128):[];}
function sameIds(a,b){return Array.isArray(a)&&a.length===b.length&&a.every((id,i)=>id===b[i]);}

// Personal testimony travels with the character, never with browser-wide options.
// Older saves initialize lazily without changing any campaign or quest flags.
export function ensureStory(player){
 if(!player.story||typeof player.story!=='object'||Array.isArray(player.story))player.story={seen:[],records:[]};
 const story=player.story,seen=cleanIds(story.seen,beatIds),records=cleanIds(story.records,recordIds);
 if(!sameIds(story.seen,seen))story.seen=seen;
 if(!sameIds(story.records,records))story.records=records;
 return story;
}
export function readStoryRecord(player,id){
 if(!recordIds.has(id))return false;const story=ensureStory(player);
 if(story.records.includes(id))return false;story.records.push(id);return true;
}
export function hasStoryBeat(player,id){return ensureStory(player).seen.includes(id);}

const seconds=text=>Math.min(8,Math.max(3.6,String(text).length/25+1));
export class StoryQueue{
 constructor(player){this.player=player;this.revision=0;this.reset(player);}
 reset(player=this.player){this.player=player;this.pending=[];this.current=null;this.remaining=0;this.gap=0;this.deadBosses=new Set();}
 clear(){this.pending=[];this.current=null;this.remaining=0;this.gap=0;}
 discard(id){
  this.pending=this.pending.filter(entry=>entry.id!==id&&entry.id!==id+'-reply');
  if(this.current?.id===id||this.current?.id===id+'-reply'){this.current=null;this.remaining=0;this.gap=0;}
 }
 silenceBoss(thread){
  this.deadBosses.add(thread);this.pending=this.pending.filter(entry=>entry.thread!==thread);
  if(this.current?.thread===thread){this.current=null;this.remaining=0;this.gap=0;}
 }
 enqueue(beat,{thread=null,phase=null,priority=false}={}){
  if(!beat||!beatIds.has(beat.id)||hasStoryBeat(this.player,beat.id)||this.current?.id===beat.id||this.pending.some(entry=>entry.id===beat.id))return false;
  if(thread&&this.deadBosses.has(thread)&&phase!=='death')return false;
  const entries=[{id:beat.id,speaker:beat.speaker,text:beat.text,thread,phase}];
  if(beat.reply)entries.push({id:beat.id+'-reply',speaker:beat.reply.speaker,text:beat.reply.text,thread,phase});
  if(!priority&&this.pending.length+entries.length>6)return false;
  this.pending=priority?[...entries,...this.pending].slice(0,6):[...this.pending,...entries];return true;
 }
 // Seen flags are written only when the caption actually reaches the screen.
 tick(dt,{blocked=false,enabled=true}={}){
  if(!enabled){this.clear();return null;}if(blocked)return this.current;
  dt=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.25));
  if(this.current){this.remaining-=dt;if(this.remaining>0)return this.current;this.current=null;this.gap=.3;}
  this.gap=Math.max(0,this.gap-dt);if(this.gap>0)return null;
  while(this.pending.length){
   const entry=this.pending.shift();
   if(hasStoryBeat(this.player,entry.id)||entry.thread&&this.deadBosses.has(entry.thread)&&entry.phase!=='death')continue;
   ensureStory(this.player).seen.push(entry.id);this.current=entry;this.remaining=seconds(entry.text);this.revision++;return entry;
  }return null;
 }
}
