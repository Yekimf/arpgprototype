import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storyStage,STORY_BEATS,STORY_RECORDS,areaStoryBeat,bossStoryBeat,storyRecordsFor} from '../src/act-one-story.js';

const character=()=>({quests:{},campaign:{records:[],defeated:[]}});
test('story reactions follow confirmed events, including skipped fights and old rescue saves',()=>{
 const p=character();assert.equal(storyStage(p),'arrival');
 p.campaign.records.push('field-1-0');assert.equal(storyStage(p),'herd-safe');
 p.campaign.defeated.push('captain-1-0');assert.equal(storyStage(p),'marchgate-fallen');
 p.campaign.records.push('field-1-1');assert.equal(storyStage(p),'levy-broken');
 p.campaign.defeated.push('captain-1-1');assert.equal(storyStage(p),'granary-fallen');
 p.campaign.records.push('field-1-2');assert.equal(storyStage(p),'choir-silenced');
 p.campaign.defeated.push('knight-1');assert.equal(storyStage(p),'edrin-home');
 const shortcut=character();shortcut.campaign.defeated.push('captain-1-1');assert.equal(storyStage(shortcut),'granary-fallen');
 assert.equal(storyStage({quests:{herdRewarded:true}}),'herd-safe');
 assert.equal(storyStage({quests:{scholarRescued:true}}),'edrin-home');
 assert.equal(storyStage({}),'arrival');
});
test('six optional accounts cover the actual regions without affecting progress or supplying keys',()=>{
 const p=character(),before=JSON.stringify(p),ids=new Set();
 for(let chapter=0;chapter<3;chapter++)for(const kind of ['wilderness','stronghold']){
  const records=storyRecordsFor(chapter,kind);assert.equal(records.length,1);
  const [r]=records;assert.ok(r.id&&r.title&&r.text&&r.area&&r.anchor);assert.ok(r.text.length<=450);ids.add(r.id);
  assert.ok(!('reward' in r)&&!('requires' in r)&&!('item' in r));
  assert.equal(areaStoryBeat(chapter,kind)?.chapter,chapter);
 }
 assert.equal(ids.size,6);assert.equal(ids.size,STORY_RECORDS.length);assert.deepEqual(storyRecordsFor(9,'wilderness'),[]);
 assert.equal(areaStoryBeat(9,'stronghold'),null);assert.equal(JSON.stringify(p),before);
});
test('boss memories have distinct bounded cues and keep the threat and final words separate',()=>{
 const ids=[];
 for(const boss of ['captain-1-0','captain-1-1','knight-1'])for(const phase of ['engage','wounded','death']){
  const beat=bossStoryBeat(boss,phase);assert.ok(beat.id&&beat.speaker&&beat.text);assert.ok(beat.text.length<=180);ids.push(beat.id);
  assert.equal(beat.reply.speaker,'The Loyalist');assert.ok(beat.reply.text.length<=180);
 }
 for(const beat of [...Object.values(STORY_BEATS.town),...STORY_BEATS.areas,STORY_BEATS.pasture]){ids.push(beat.id);assert.ok(beat.text.length<=180);}
 assert.equal(new Set(ids).size,ids.length);assert.equal(bossStoryBeat('captain-1-0','unknown'),null);assert.equal(bossStoryBeat('unknown','death'),null);
 assert.match(bossStoryBeat('knight-1','death').text,/through/);
 assert.match(bossStoryBeat('knight-1','death').reply.text,/Rest/);
});
