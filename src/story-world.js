import {distance,findPath,isWalkable} from './game.js';
import {STORY_RECORDS,storyRecordsFor} from './act-one-story.js';

export const storyRecordById=id=>STORY_RECORDS.find(record=>record.id===id)||null;

function anchorFor(d,record){
 if(record.anchor==='pasture'){
  const gate=d.pasture?.gate||d.herd||d.start;
  return {x:gate.x+3,y:gate.y-3};
 }
 if(record.anchor==='boss')return {x:d.portal.x+6,y:d.portal.y+4};
 if(record.anchor==='road'){
  const route=d.paths?.[0]||[],at=route[Math.min(2,route.length-1)]||d.start;
  return {x:at.x+4,y:at.y-3};
 }
 // Place entry testimony in the first court, not across the arrival arch.
 const at=d.farm?(d.arrival||d.start):(d.waypoint||d.start);
 return {x:at.x+4,y:at.y-3};
}

function clearOfLandmarks(d,at){
 const landmarks=[d.start,d.arrival,d.portal,d.returnGate,d.entryGate,d.waypoint,d.supplies,d.pasture?.gate,...(d.signs||[])];
 if(landmarks.some(p=>p&&distance(at,p)<2.8))return false;
 // Existing tall scenery must not hide an account or share its contact point.
 return !(d.props||[]).some(p=>p.type!=='story-marker'&&distance(at,p)<(p.type==='building'||p.type==='farm-prop'?1.4:.8));
}

function findRecordFloor(d,anchor){
 const candidates=[];
 for(let y=Math.floor(anchor.y)-9;y<=Math.floor(anchor.y)+9;y++)for(let x=Math.floor(anchor.x)-9;x<=Math.floor(anchor.x)+9;x++){
  const at={x:x+.5,y:y+.5};
  if(!isWalkable(d,at.x,at.y,.3)||!clearOfLandmarks(d,at))continue;
  // Favour the verge. A nonblocking prop still should not stand in wagon ruts.
  const onRoad=d.roads?.has(y*d.size+x);
  candidates.push({...at,score:distance(at,anchor)+(onRoad?12:0)});
 }
 candidates.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
 for(const at of candidates)if(findPath(d,d.start,at).length)return {x:at.x,y:at.y};
 return null;
}

// Decorative, click-to-read accounts. This never edits terrain, encounters,
// rewards, collision or campaign state, and can safely run on a cached area.
export function dressStoryArea(d){
 if(!d||d.act!==1||!['wilderness','stronghold'].includes(d.kind))return d;
 if(Array.isArray(d.storyMarkers))return d;
 d.storyMarkers=[];d.props??=[];
 for(const record of storyRecordsFor(d.chapter,d.kind)){
  const at=findRecordFloor(d,anchorFor(d,record));if(!at)continue;
  const marker={...at,type:'story-marker',id:record.id,title:record.title,text:record.text,style:record.anchor==='boss'?'arms':'notice',angle:0};
  d.storyMarkers.push(marker);d.props.push(marker);
 }
 return d;
}
