import {random} from './game.js';
export function dressGrainStore(d){
 const rng=random(d.seed+8197),protectedAt=[d.start,d.portal,d.waypoint,d.supplies].filter(Boolean);
 const clear=(x,y,r=1)=>protectedAt.every(p=>Math.hypot(x-p.x,y-p.y)>r+5)&&[-r,0,r].every(dx=>[-r,0,r].every(dy=>d.tiles[Math.floor(y+dy)]?.[Math.floor(x+dx)]===1&&!d.roads.has(Math.floor(y+dy)*d.size+Math.floor(x+dx))));
 const place=(x,y,id,width,height)=>{const p={type:'granary-prop',granarySprite:id,x,y,width,height};d.props.push(p);return p;};
 d.barnFloors=[];d.grainYards=[];
 for(const [x,y,id]of [[64,110,0],[44,96,1],[48,75,0],[77,58,1],[98,41,0],[50,23,0]]){
  let at;for(let r=0;r<5&&!at;r++)for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]])if(clear(x+dx,y+dy,2)){at={x:x+dx,y:y+dy};break;}if(!at)continue;
  place(at.x,at.y,id,id===0?300:270,id===0?280:245);d.grainYards.push(at);d.barnFloors.push({x:at.x-3,y:at.y-2,w:6,h:4});
  d.props=d.props.filter(p=>p.type!=='farm-prop'||p.farmSprite!==4||Math.hypot(p.x-at.x,p.y-at.y)>4);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=at.x+Math.cos(a)*(3.5+rng()),y=at.y+Math.sin(a)*(3+rng());if(clear(x,y,.8))place(x,y,[3,5,7,6,4,3,6,5][i],75+i%3*9,75+i%3*8);}
 }
 for(let i=0;i<95;i++){const x=13+rng()*102,y=20+rng()*96;if(!clear(x,y,.9)||d.props.some(p=>Math.hypot(p.x-x,p.y-y)<1.7))continue;const id=i%10===0?2:[3,4,5,6,7][i%5];place(x,y,id,id===2?150:id===6?100:70+rng()*15,id===2?135:70+rng()*15);}
 return d;
}
