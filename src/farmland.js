import {random,makeEnemy,isWalkable} from './game.js';
export function dressFarmland(d){
 const rng=random(d.seed+601);d.farm=true;d.biome='widows-fields';d.cropPlots=[];
 for(let y=23;y<d.size-12;y+=17)for(let x=14;x<d.size-12;x+=20)d.cropPlots.push({x,y,w:13+rng()*4,h:9+rng()*4});
 d.props=d.props.filter(p=>!(['frontier','palisade','road-gate'].includes(p.type)&&Math.abs(p.x-d.portal.x)<7&&Math.abs(p.y-d.portal.y)<7)).map(p=>p.exit?{...p,type:'farm-entrance',width:240,height:180}:p.type==='building'&&p.sprite===7?{...p,type:'farm-prop',farmSprite:[8,9,10][Math.floor(rng()*3)],width:120+(Math.floor(p.x)%3)*15,height:165+(Math.floor(p.x)%3)*20}:p);
 decorate(d,rng);return d;
}
function decorate(d,rng){
 for(const plot of d.cropPlots)for(let y=plot.y;y<plot.y+plot.h;y+=2)for(let x=plot.x;x<plot.x+plot.w;x+=2){const at={x:x+.5,y:y+.5};if(rng()<.62&&isWalkable(d,at.x,at.y)&&!d.roads.has(Math.floor(at.y)*d.size+Math.floor(at.x))&&Math.hypot(at.x-d.start.x,at.y-d.start.y)>4)d.props.push({...at,type:'farm-prop',farmSprite:4,width:50+(Math.floor(x+y)%3)*5,height:60+(Math.floor(x+y)%3)*6});}
 for(let i=0;i<50;i++){const at={x:7+rng()*(d.size-14),y:20+rng()*(d.size-27)};if(!isWalkable(d,at.x,at.y)||Math.hypot(at.x-d.start.x,at.y-d.start.y)<4)continue;const index=[5,7,11,14,15][i%5];d.props.push({...at,type:'farm-prop',farmSprite:index,width:index===7?70:85,height:index===7?110:65});}
 d.critters=[];for(let i=0;i<10;i++){const at={x:12+rng()*(d.size-24),y:25+rng()*(d.size-35)};if(isWalkable(d,at.x,at.y))d.critters.push({...at,species:i%3?'crow':'hen',phase:rng()*6});}
}
export function generateGranary(seed,depth){
 const rng=random(seed),size=88,tiles=Array.from({length:size},(_,y)=>Array.from({length:size},(_,x)=>x>3&&y>3&&x<size-4&&y<size-4?1:0)),roads=new Set(),props=[],enemies=[],start={x:43.5,y:77.5},portal={x:43.5,y:15.5};
 for(let y=5;y<size-4;y++)for(let x=5;x<size-4;x++)if(Math.abs(x-43)<2||Math.abs(y-40)<2||Math.abs(y-62)<2)roads.add(y*size+x);
 const rooms=[{x:34,y:68,w:18,h:14,name:'The Broken Field Gate'},{x:24,y:32,w:40,h:19,name:'The Threshing Yard',court:true},{x:32,y:8,w:24,h:17,name:'The Levy Store',court:true}];
 const barnFloors=[{x:36,y:12,w:15,h:13},{x:15,y:35,w:12,h:11}];
 props.push({x:24,y:29,type:'farm-prop',farmSprite:12,width:245,height:205},{x:60,y:26,type:'farm-prop',farmSprite:13,width:205,height:205});
 for(let x=5;x<size-5;x++)for(const y of [5,size-5])if(y===5||Math.abs(x-43)>2)props.push({type:'frontier',axis:'x',x:x+.5,y:y+.5});
 for(let y=6;y<size-5;y++)for(const x of [5,size-5])props.push({type:'frontier',axis:'y',x:x+.5,y:y+.5});
 for(let y=14;y<75;y+=12)for(const x of [8,79])props.push({type:'farm-prop',farmSprite:[8,9,10][Math.floor(rng()*3)],x:x+rng(),y:y+rng()*3,width:125,height:180});
 let id=1;for(let i=0;i<58;i++){const x=10+rng()*67,y=9+rng()*60;if(Math.hypot(x-start.x,y-start.y)>10&&Math.hypot(x-portal.x,y-portal.y)>5)enemies.push(makeEnemy(id++,x,y,i%4===0?'wraith':i%3===0?'crawler':'skeleton',depth,rng()<.06));}
 enemies.push(makeEnemy(id++,portal.x,portal.y,'warden',depth,true));
 const d={seed,size,tiles,roads,props,enemies,rooms,start,portal,barnFloors,depth,seen:new Set(),water:new Set(),outdoor:true,farm:true,biome:'tithe-granary',returnGate:{x:43.5,y:80.5},entryGate:{x:43.5,y:80.5},entryFacing:{x:0,y:-1},bossDead:false,cropPlots:[]};
 for(let y=24;y<75;y+=18)for(const x of [10,57])d.cropPlots.push({x:x+rng()*2,y:y+rng()*2,w:17+rng()*3,h:10+rng()*3});decorate(d,rng);return d;
}
export function passivePosition(animal,d,time){const x=animal.x+Math.sin(time*.35+animal.phase)*.7,y=animal.y+Math.cos(time*.28+animal.phase)*.6;return isWalkable(d,x,y,.05)?{x,y}:{x:animal.x,y:animal.y};}
