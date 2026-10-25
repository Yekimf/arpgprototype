import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STORY_BEATS,bossStoryBeat} from '../src/act-one-story.js';
import {ensureStory,readStoryRecord,StoryQueue} from '../src/story-state.js';
import {Storyteller} from '../src/story-ui.js';

const player=()=>({hp:100,x:0,y:0,campaign:{defeated:[],records:[]},quests:{}});
const game=()=>({player:player(),act:1,chapter:0,zone:'town',settings:{},dungeon:{kind:'wilderness',enemies:[]}});
test('story state is character-owned, rejects unknown flags and tolerates old or malformed saves',()=>{
 const p=player();assert.deepEqual(ensureStory(p),{seen:[],records:[]});assert.equal(readStoryRecord(p,'marchgate-roll'),true);assert.equal(readStoryRecord(p,'marchgate-roll'),false);assert.equal(readStoryRecord(p,'not-a-record'),false);
 const other=player();ensureStory(other);assert.deepEqual(other.story.records,[]);assert.equal(p.campaign.records.length,0);
 p.story={seen:['hadrin-engage','bad','hadrin-engage',{}],records:['marchgate-roll','bad','marchgate-roll']};assert.deepEqual(ensureStory(p),{seen:['hadrin-engage'],records:['marchgate-roll']});
 const loaded=JSON.parse(JSON.stringify(p));assert.equal(readStoryRecord(loaded,'marchgate-roll'),false);assert.deepEqual(loaded.story,p.story);
 p.story=[];assert.deepEqual(ensureStory(p),{seen:[],records:[]});
});
test('queued text is remembered only after display and does not replay after reload',()=>{
 const p=player(),q=new StoryQueue(p);q.enqueue(STORY_BEATS.town.arrival);q.tick(.1,{blocked:true});assert.deepEqual(p.story.seen,[]);
 const first=q.tick(.1);assert.equal(first.id,'town-arrival');assert.deepEqual(p.story.seen,['town-arrival']);
 const reload=new StoryQueue(JSON.parse(JSON.stringify(p)));assert.equal(reload.enqueue(STORY_BEATS.town.arrival),false);assert.equal(reload.tick(.1),null);
});
test('boss death removes current and queued threats including their replies',()=>{
 const p=player(),q=new StoryQueue(p),id='captain-1-0';q.enqueue(bossStoryBeat(id,'engage'),{thread:id,phase:'engage'});q.enqueue(bossStoryBeat(id,'wounded'),{thread:id,phase:'wounded'});q.tick(.1);
 q.silenceBoss(id);assert.equal(q.current,null);assert.equal(q.pending.length,0);assert.equal(q.enqueue(bossStoryBeat(id,'wounded'),{thread:id,phase:'wounded'}),false);
 q.enqueue(bossStoryBeat(id,'death'),{thread:id,phase:'death',priority:true});assert.equal(q.tick(.1).id,'hadrin-death');assert.deepEqual(q.pending.map(x=>x.id),['hadrin-death-reply']);assert.equal(p.story.seen.includes('hadrin-wounded'),false);
});
test('captions pause under reading and menus, never pause combat, and obey the captions option',()=>{
 const g=game();let saves=0;const ui=new Storyteller(g,{document:null,save:()=>saves++});
 g.panel='journal';for(let i=0;i<20;i++)ui.tick(.1);assert.equal(ui.queue.current,null);assert.equal(g.paused,undefined);
 g.panel=null;for(let i=0;i<15;i++)ui.tick(.1);assert.equal(ui.queue.current.id,'town-arrival');assert.equal(saves,1);const remaining=ui.queue.remaining;
 g.dialogue='guide';for(let i=0;i<10;i++)ui.tick(.1);assert.equal(ui.queue.remaining,remaining);
 g.settings.storyCaptions=false;ui.tick(.1);assert.equal(ui.queue.current,null);assert.equal(ui.queue.pending.length,0);
});
test('late-save area memories and defeated officers do not replay their living threats',()=>{
 const g=game();g.zone='stronghold';g.dungeon={kind:'stronghold',enemies:[{bossId:'captain-1-0',x:0,y:0,hp:40,maxHp:100,aggro:true}]};g.player.campaign.defeated=['captain-1-0'];const ui=new Storyteller(g,{document:null});ui.scan();assert.equal(ui.queue.pending.length,0);
});
test('boss death cleans stale entry narration and remains safe when captions are disabled',()=>{
 const g=game();g.zone='stronghold';g.dungeon.kind='stronghold';const ui=new Storyteller(g,{document:null});ui.scan();ui.queue.tick(.1);assert.equal(ui.queue.current.id,'entry-marchgate');
 ui.bossDeath({bossId:'captain-1-0'});assert.equal(ui.queue.current,null);assert.equal(ui.queue.tick(.1).id,'hadrin-death');
 ui.bossDeath({bossId:'captain-1-0'});assert.equal(ui.queue.current.id,'hadrin-death');assert.deepEqual(ui.queue.pending.map(x=>x.id),['hadrin-death-reply']);
 g.settings.storyCaptions=false;ui.tick(.1);ui.bossDeath({bossId:'captain-1-1'});assert.equal(ui.queue.pending.length,0);assert.equal(ui.queue.deadBosses.has('captain-1-1'),true);
});
