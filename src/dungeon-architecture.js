import {random,isWalkable,distance} from './game.js';
// Each wall belongs to a floor edge. Its base uses the same world coordinates
// as that edge, so neither camera movement nor room shape can detach it.
export function dungeonWalls(d){
 const walls=[];
 for(let y=1;y<d.size-1;y++)for(let x=1;x<d.size-1;x++)if(d.tiles[y][x]){
  for(const [dx,dy,axis,ox,oy,side]of [[0,-1,'x',.5,0,'north'],[-1,0,'y',0,.5,'west'],[0,1,'x',.5,1,'south'],[1,0,'y',1,.5,'east']])if(!d.tiles[y+dy]?.[x+dx]){
   const at={x:x+ox,y:y+oy};
   // The gateway art owns the threshold; do not build a wall through its arch.
   if(d.entryGate&&distance(at,d.entryGate)<4.5)continue;
   walls.push({...at,type:'dungeon-wall',axis,side,theme:d.tileset||'crypt',variant:(x*7+y*11)%4,foreground:side==='south'||side==='east'});
  }
 }
 return walls;
}
export function dressDungeon(d){
 if(d.outdoor||d.town||d.architectureVersion===1)return d;
 d.architectureVersion=1;d.wallSegments=dungeonWalls(d);
 const rng=random(d.seed+7121),crypt=d.tileset==='redoubt';
 const safe=at=>isWalkable(d,at.x,at.y,.2)&&[d.start,d.portal,d.entryGate,d.waypoint,d.supplies].filter(Boolean).every(p=>distance(at,p)>3);
 // Fixtures sit beside boundaries, leaving the main room and doorways clear.
 for(let i=0;i<d.rooms.length;i++){
  const r=d.rooms[i],spots=[{x:r.x+1.25,y:r.y+3},{x:r.x+r.w-2,y:r.y+2},{x:r.x+2,y:r.y+r.h-2}];
  for(let j=0;j<spots.length;j++){const at=spots[j];if(!safe(at))continue;const kind=crypt?['ossuary','candles','urns'][(i+j)%3]:['rack','stores','fallen-arms'][(i+j)%3];d.props.push({...at,type:'dungeon-dressing',kind,variant:i%4});}
  // Torch and heraldry pairs punctuate continuous walls rather than filling
  // the floor with arbitrary pillars. Only actual, uninterrupted edges qualify.
  const edge=d.wallSegments.find(w=>!w.foreground&&w.x>=r.x+2&&w.x<r.x+r.w-2&&w.y>=r.y&&w.y<r.y+1&&safe({x:w.x,y:w.y+1}));
  if(edge)d.props.push({...edge,type:'wall-fixture',kind:i%3===0?'banner':crypt?'niche':'sconce',variant:i%3});
  const at={x:r.x+2+rng()*(r.w-4),y:r.y+r.h-2};if(safe(at))d.props.push({...at,type:'dungeon-dressing',kind:'rubble',variant:i%3});
 }
 return d;
}
