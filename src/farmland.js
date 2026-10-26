import {dressGrainStore} from './granary-dressing.js';
import {random,makeEnemy,isWalkable} from './game.js';
export function dressFarmland(d){
 const rng=random(d.seed+601);d.farm=true;d.tileset='widows-fields';d.biome='widows-fields';d.cropPlots=[];
 for(let y=23;y<d.size-12;y+=17)for(let x=14;x<d.size-12;x+=20)d.cropPlots.push({x,y,w:13+rng()*4,h:9+rng()*4});
 d.props=d.props.filter(p=>!(['frontier','palisade','road-gate'].includes(p.type)&&Math.abs(p.x-d.portal.x)<7&&Math.abs(p.y-d.portal.y)<7)).map(p=>p.exit?{...p,type:'farm-entrance',width:240,height:180}:p.type==='building'&&p.sprite===7?{...p,type:'farm-prop',farmSprite:[8,9,10][Math.floor(rng()*3)],width:120+(Math.floor(p.x)%3)*15,height:165+(Math.floor(p.x)%3)*20}:p);
 // Put the visual opening on the actual travel threshold, with wagon ruts
 // continuing through the fence instead of a loose gate in a wheat plot.
 const gate=d.props.find(p=>p.exit);if(gate)Object.assign(gate,{x:d.portal.x,y:d.portal.y});
 d.props=d.props.filter(p=>p.exit||Math.hypot(p.x-d.portal.x,p.y-d.portal.y)>6);
 for(let y=Math.floor(d.portal.y);y<=d.portal.y+9;y++)for(let x=Math.floor(d.portal.x)-2;x<=d.portal.x+2;x++){d.tiles[y][x]=1;d.water.delete(y*d.size+x);d.roads.add(y*d.size+x);}
 for(const side of [-1,1])for(let i=3;i<=9;i++)d.props.push({type:'livestock-fence',axis:'x',x:d.portal.x+side*i,y:d.portal.y});
 d.gateApron={x:d.portal.x,y:d.portal.y+4,radius:5};
 decorate(d,rng);d.props=d.props.filter(p=>p.exit||p.type==='livestock-fence'||Math.hypot(p.x-d.portal.x,p.y-d.portal.y)>6);return d;
}
function decorate(d,rng){
 for(const plot of d.cropPlots)for(let y=plot.y;y<plot.y+plot.h;y+=2)for(let x=plot.x;x<plot.x+plot.w;x+=2){const at={x:x+.5,y:y+.5};if(rng()<.62&&isWalkable(d,at.x,at.y)&&!d.roads.has(Math.floor(at.y)*d.size+Math.floor(at.x))&&Math.hypot(at.x-d.start.x,at.y-d.start.y)>4)d.props.push({...at,type:'farm-prop',farmSprite:4,width:50+(Math.floor(x+y)%3)*5,height:60+(Math.floor(x+y)%3)*6});}
 for(let i=0;i<50;i++){const at={x:7+rng()*(d.size-14),y:20+rng()*(d.size-27)};if(!isWalkable(d,at.x,at.y)||Math.hypot(at.x-d.start.x,at.y-d.start.y)<4)continue;const index=[5,7,11,14,15][i%5];d.props.push({...at,type:'farm-prop',farmSprite:index,width:index===7?70:85,height:index===7?110:65});}
 d.critters=[];for(let i=0;i<10;i++){const at={x:12+rng()*(d.size-24),y:25+rng()*(d.size-35)};if(isWalkable(d,at.x,at.y))d.critters.push({...at,species:i%3?'crow':'hen',phase:rng()*6});}
}
export function generateGranary(seed,depth){
 const rng=random(seed),size=128,tiles=Array.from({length:size},(_,y)=>Array.from({length:size},(_,x)=>x>4&&y>4&&x<size-5&&y<size-5?1:0)),roads=new Set(),props=[],enemies=[],start={x:63.5,y:120.5},portal={x:63.5,y:14.5};
 const route=[start,{x:35.5,y:99.5},{x:35.5,y:79.5},{x:87.5,y:64.5},{x:87.5,y:43.5},{x:63.5,y:30.5},portal];
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2);for(let j=0;j<=steps;j++){const x=Math.floor(a.x+(b.x-a.x)*j/steps),y=Math.floor(a.y+(b.y-a.y)*j/steps);for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++)roads.add(yy*size+xx);}}
 const rooms=route.map((p,i)=>({x:p.x-9,y:p.y-7,w:18,h:14,name:['The Broken Field Gate','The Fallow Pens','The Millrace','The Threshing Yard','The Burnt Orchard','The Levy Store','Oswen’s Counting Yard'][i],court:true}));
 const barnFloors=[{x:51,y:9,w:25,h:20},{x:77,y:51,w:20,h:16},{x:23,y:70,w:16,h:12}];
 props.push({x:48,y:22,type:'farm-prop',farmSprite:12,width:245,height:205},{x:79,y:22,type:'farm-prop',farmSprite:13,width:205,height:205});
 // Divided occupied fields, with wide openings along the winding wagon road.
 for(const [y,gap]of [[105,39],[84,38],[66,84],[44,84],[29,65]])for(let x=6;x<size-6;x++)if(Math.abs(x-gap)>8){tiles[y][x]=0;props.push({type:'livestock-fence',axis:'x',x:x+.5,y:y+.5});}
 for(let x=5;x<size-5;x++)for(const y of [5,size-6])if(y===5||Math.abs(x-63)<4)props.push({type:'frontier',axis:'x',x:x+.5,y:y+.5});
 for(let y=6;y<size-6;y++)for(const x of [5,size-6])props.push({type:'frontier',axis:'y',x:x+.5,y:y+.5});
 let id=1;for(const r of rooms)for(let i=0;i<12;i++){const x=r.x+2+rng()*(r.w-4),y=r.y+2+rng()*(r.h-4);if(isWalkable({tiles},x,y,.23)&&Math.hypot(x-start.x,y-start.y)>9&&Math.hypot(x-portal.x,y-portal.y)>5)enemies.push(makeEnemy(id++,x,y,i%4===0?'wraith':i%3===0?'crawler':'skeleton',depth,rng()<.06));}
 for(let i=0;i<44;i++){const x=10+rng()*107,y=10+rng()*100;if(isWalkable({tiles},x,y,.23)&&Math.hypot(x-start.x,y-start.y)>10&&Math.hypot(x-portal.x,y-portal.y)>5)enemies.push(makeEnemy(id++,x,y,i%3?'skeleton':'wraith',depth));}
 enemies.push(makeEnemy(id++,portal.x,portal.y,'warden',depth,true));
 const d={seed,size,tiles,roads,props,enemies,rooms,start,portal,barnFloors,depth,seen:new Set(),water:new Set(),outdoor:true,farm:true,biome:'tithe-granary',tileset:'granary',returnGate:{x:63.5,y:120.5},entryGate:{x:63.5,y:120.5},entryFacing:{x:0,y:-1},arrival:{x:63.5,y:116.5},bossDead:false,cropPlots:[],landmarks:rooms.map(r=>({x:r.x+r.w/2,y:r.y+r.h/2,name:r.name}))};
 for(let y=34;y<115;y+=18)for(const x of [10,51,99])d.cropPlots.push({x:x+rng()*2,y:y+rng()*2,w:16+rng()*3,h:10+rng()*3});decorate(d,rng);return dressGrainStore(d);
}

export function passivePosition(animal,d,time){const x=animal.x+Math.sin(time*.35+animal.phase)*.7,y=animal.y+Math.cos(time*.28+animal.phase)*.6;return isWalkable(d,x,y,.05)?{x,y}:{x:animal.x,y:animal.y};}
