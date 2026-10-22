import {isWalkable,distance} from './game.js';
export {clearPath as clearSegment} from './game.js';
// Clicking a wall edge chooses the nearest reachable ground, never a cell on
// the other side of a fence simply because its centre was a little closer.
export function planWalk(d,from,point,findPath){
 if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
 if(isWalkable(d,point.x,point.y,.23)){const path=findPath(d,from,point);if(path.length)return {target:{...point},path,exact:true};}
 const candidates=[];for(let y=Math.floor(point.y)-2;y<=Math.floor(point.y)+2;y++)for(let x=Math.floor(point.x)-2;x<=Math.floor(point.x)+2;x++){const p={x:x+.5,y:y+.5};if(distance(p,point)<=1.65&&isWalkable(d,p.x,p.y,.23))candidates.push(p);}
 candidates.sort((a,b)=>distance(a,point)-distance(b,point)||distance(a,from)-distance(b,from));
 for(const target of candidates){const path=findPath(d,from,target);if(path.length)return {target,path,exact:false};}return null;
}
