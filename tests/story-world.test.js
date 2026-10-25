import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,distance,findPath,isWalkable} from '../src/game.js';
import {createCampaign,generateWilderness,generateStronghold} from '../src/campaign.js';
import {STORY_RECORDS} from '../src/act-one-story.js';
import {dressStoryArea,storyRecordById} from '../src/story-world.js';

function gameplayOf(d){return JSON.stringify({tiles:d.tiles,enemies:d.enemies,roads:[...(d.roads||[])],water:[...(d.water||[])],start:d.start,portal:d.portal,seen:[...d.seen],bossDead:d.bossDead});}

test('all six field accounts have reachable, deterministic placements without changing gameplay',()=>{
 for(const seed of [17,42817,939801]){
  const player=createPlayer();player.campaign=createCampaign();
  const found=[];
  for(let chapter=0;chapter<3;chapter++)for(const kind of ['wilderness','stronghold']){
   const make=()=>kind==='wilderness'?generateWilderness(seed,1,player,chapter):generateStronghold(seed,1,chapter);
   const d=make(),before=gameplayOf(d),oldProps=d.props.slice();
   assert.equal(dressStoryArea(d),d);assert.equal(gameplayOf(d),before);
   assert.equal(d.storyMarkers.length,1,`${seed}/${chapter}/${kind}`);
   const [marker]=d.storyMarkers;found.push(marker.id);
   assert.ok(isWalkable(d,marker.x,marker.y,.3));assert.ok(findPath(d,d.start,marker).length);
   for(const gate of [d.portal,d.entryGate,d.returnGate,d.pasture?.gate])if(gate)assert.ok(distance(marker,gate)>=2.8);
   assert.equal(d.props.length,oldProps.length+1);assert.deepEqual(d.props.slice(0,-1),oldProps);
   const count=d.props.length;dressStoryArea(d);assert.equal(d.props.length,count);
   assert.deepEqual(dressStoryArea(make()).storyMarkers,d.storyMarkers);
  }
  assert.deepEqual(found.sort(),STORY_RECORDS.map(record=>record.id).sort());
 }
});

test('accounts stay off the road and do not create inventory or quest objects',()=>{
 const player=createPlayer();player.campaign=createCampaign();
 for(let chapter=0;chapter<3;chapter++){
  const d=dressStoryArea(generateWilderness(42817,1,player,chapter)),marker=d.storyMarkers[0];
  assert.equal(d.roads.has(Math.floor(marker.y)*d.size+Math.floor(marker.x)),false);
  assert.equal(marker.questId,undefined);assert.equal(marker.item,undefined);assert.equal(marker.exit,undefined);
 }
 assert.equal(player.inventory.length,0);assert.deepEqual(player.campaign.records,[]);
 assert.equal(storyRecordById('not-a-record'),null);assert.equal(storyRecordById('pasture-post'),STORY_RECORDS[0]);
 const legacy={act:2,kind:'wilderness',props:[]};assert.equal(dressStoryArea(legacy),legacy);assert.equal(legacy.storyMarkers,undefined);
});
