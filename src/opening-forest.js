import {random,makeEnemy,distance,isWalkable} from './game.js';
import {generateTown,TOWN_BOUNDS} from './settlement.js';
import {dressEnemy} from './campaign-content.js';
import {createFlock,dressForestFloor,roadFacing} from './forest-life.js';
import {frontierEdges} from './wilderness-boundary.js';
export function generateOpeningForest(seed,player,task){
 const rng=random(seed),size=224,tiles=Array.from({length:size},()=>Array(size).fill(0)),roads=new Set(),water=new Set(),props=[],enemies=[];
 const start={x:48,y:50.5},portal={x:194.5,y:20.5},exit={x:66.5,y:51.5},herd={x:114.5,y:116.5},provisions={x:164.5,y:106.5,label:'Stolen winter provisions'},field={x:173.5,y:56.5,label:task,kind:'orders'},waypoint={x:148.5,y:72.5},supplies={x:132.5,y:29.5};
 const townBounds={x1:TOWN_BOUNDS.x1+16,y1:TOWN_BOUNDS.y1+18,x2:TOWN_BOUNDS.x2+16,y2:TOWN_BOUNDS.y2+18},pasture={x1:101,y1:104,x2:127,y2:129,gate:{x:101.5,y:116.5}};
 for(let y=18;y<size-4;y++)for(let x=4;x<size-4;x++){const edge=Math.hypot((x-112)/108,(y-113)/109);if(edge<.99+Math.sin(x*.13)*.035+Math.cos(y*.17)*.035)tiles[y][x]=1;}
 const carve=(p,r=3,road=false)=>{for(let y=Math.max(18,Math.floor(p.y-r));y<=Math.min(size-4,p.y+r);y++)for(let x=Math.max(4,Math.floor(p.x-r));x<=Math.min(size-4,p.x+r);x++)if(distance({x:x+.5,y:y+.5},p)<r){tiles[y][x]=1;water.delete(y*size+x);if(road&&distance({x:x+.5,y:y+.5},p)<1.4)roads.add(y*size+x);}};
 const main=[start,exit,{x:83.5,y:53.5},{x:96.5,y:66.5},{x:129.5,y:74.5},{x:151.5,y:62.5},{x:177.5,y:52.5},{x:194.5,y:39.5},portal];
 const paths=[main,[main[3],{x:102.5,y:85.5},{x:93.5,y:105.5},pasture.gate,herd],[main[4],{x:147.5,y:91.5},provisions],[main[5],{x:149.5,y:38.5},supplies,{x:111.5,y:32.5},main[3]],[main[5],waypoint],[main[6],field]];
 for(const lake of [{x:74,y:135,rx:11,ry:7},{x:166,y:153,rx:14,ry:9},{x:48,y:106,rx:8,ry:12}])for(let y=lake.y-lake.ry-2;y<lake.y+lake.ry+2;y++)for(let x=lake.x-lake.rx-2;x<lake.x+lake.rx+2;x++)if(((x-lake.x)/lake.rx)**2+((y-lake.y)/lake.ry)**2<1+Math.sin(x+y)*.08){tiles[y][x]=0;water.add(y*size+x);}
 for(const path of paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.ceil(distance(a,b)*2);for(let j=0;j<=steps;j++)carve({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps},3,true);}
 for(let y=townBounds.y1;y<=townBounds.y2;y++)for(let x=townBounds.x1;x<=townBounds.x2;x++){tiles[y][x]=1;water.delete(y*size+x);}
 const town=generateTown(player);for(const p of town.props.filter(p=>!p.exit&&!(p.type==='building'&&p.sprite===7)))props.push({...p,x:p.x+16,y:p.y+18});
 for(const b of props.filter(p=>p.type==='building'&&!p.stash)){const r=b.sprite===12?.4:1.2;for(let y=Math.floor(b.y-r);y<=b.y+r;y++)for(let x=Math.floor(b.x-r);x<=b.x+r;x++)tiles[y][x]=0;}
 for(const n of [...town.npcs.map(n=>({x:n.x+16,y:n.y+18})),{x:49,y:52}]){const steps=Math.ceil(distance(start,n)*2);for(let i=0;i<=steps;i++){const x=start.x+(n.x-start.x)*i/steps,y=start.y+(n.y-start.y)*i/steps;for(let yy=Math.floor(y-1);yy<=y+1;yy++)for(let xx=Math.floor(x-1);xx<=x+1;xx++)if(tiles[yy]?.[xx])roads.add(yy*size+xx);}}
 const fence=(x,y,axis,type='palisade',gap=false)=>{if(gap){tiles[y][x]=1;return;}tiles[y][x]=0;roads.delete(y*size+x);props.push({x:x+.5,y:y+.5,type,axis});};
 for(let x=townBounds.x1;x<=townBounds.x2;x++)for(const y of [townBounds.y1,townBounds.y2])fence(x,y,'x');
 for(let y=townBounds.y1+1;y<townBounds.y2;y++)for(const x of [townBounds.x1,townBounds.x2])fence(x,y,'y','palisade',x===townBounds.x2&&Math.abs(y-51.5)<2.5);
 for(let y=pasture.y1;y<=pasture.y2;y++)for(let x=pasture.x1;x<=pasture.x2;x++){tiles[y][x]=1;water.delete(y*size+x);}
 for(let x=pasture.x1;x<=pasture.x2;x++)for(const y of [pasture.y1,pasture.y2])fence(x,y,'x','livestock-fence');
 for(let y=pasture.y1+1;y<pasture.y2;y++)for(const x of [pasture.x1,pasture.x2])fence(x,y,'y','livestock-fence',x===pasture.x1&&Math.abs(y-pasture.gate.y)<2);
 let id=1;for(let y=24;y<size-8;y+=7)for(let x=12;x<size-8;x+=7){const at={x:x+rng()*3,y:y+rng()*3};if(!isWalkable({tiles},at.x,at.y)||at.x>townBounds.x1-4&&at.x<townBounds.x2+4&&at.y>townBounds.y1-4&&at.y<townBounds.y2+4||distance(at,herd)<19||distance(at,portal)<9||distance(at,start)<20)continue;if(rng()<.48)enemies.push(dressEnemy(makeEnemy(id++,at.x,at.y,'skeleton',1,rng()<.045),1,rng));}
 for(let y=20;y<size-5;y+=2)for(let x=6;x<size-5;x+=2){if(!tiles[y][x]||roads.has(y*size+x)||townBounds&&x>townBounds.x1-4&&x<townBounds.x2+4&&y>townBounds.y1-4&&y<townBounds.y2+4||x>pasture.x1-2&&x<pasture.x2+2&&y>pasture.y1-2&&y<pasture.y2+2||distance({x,y},portal)<19||[field,provisions,waypoint,supplies].some(p=>distance({x,y},p)<4))continue;const n=rng();if(n<.1)props.push({type:'building',sprite:7,x:x+.5,y:y+.5,width:120+(x%3)*12,height:155+(x%3)*15});else if(n<.12)props.push({type:'bones',x:x+.5,y:y+.5,variant:Math.floor(rng()*3)});}
 for(let i=0;i<6;i++){const herdId='herd-'+i;if(player.quests.herdKills?.includes(herdId)||player.campaign?.actOneKills?.['last-herd']?.includes(i))continue;const e=makeEnemy(id++,108.5+i%3*5,109.5+Math.floor(i/3)*13,'skeleton',1);Object.assign(e,{herdId,faction:1,tint:'#96947b',name:i%2?'Zombified Levy':'Bonebound Soldier',hp:32,maxHp:32,damage:11,speed:1.8});enemies.push(e);}
 const livestock=createFlock(seed,pasture);
 props.push({type:'farm-prop',farmSprite:5,x:123,y:108,width:85,height:65},{type:'farm-prop',farmSprite:5,x:123,y:125,width:85,height:65},{type:'farm-prop',farmSprite:14,x:provisions.x,y:provisions.y+1,width:130,height:90},{type:'building',sprite:14,x:supplies.x+3,y:supplies.y-3,width:165,height:180});
 const signs=[
  {id:'refuge',x:68.5,y:54,label:'EMBERFALL',target:start,text:'EMBERFALL — West. Refuge, clean water, and the kingdom’s last reasonably priced disappointment. Please shut the gate. The dead have poor manners.'},
  {id:'pasture',x:95,y:69,label:'ELIN’S PASTURE',target:paths[1][1],text:'ELIN’S PASTURE — Follow the southern lane. Keep the sheep in and the soldiers out. If you cannot tell them apart, the sheep still pay their taxes.'},
  {id:'wagon',x:132,y:77,label:'THE LEVY WAGON',target:paths[2][1],text:'WINTER STORES — Southeast, along the wagon ruts. Property of the Crown, according to the Crown. Property of the hungry, according to everyone else.'},
  {id:'marchgate',x:149,y:59,label:'MARCHGATE',target:main[6],text:'MARCHGATE — Northeast along the old road. All visitors must declare weapons, illnesses, and unreasonable hopes. Complaints may be left with the skeleton on duty.'},
  {id:'camp',x:148,y:40,label:'OLD WATCH CAMP',target:supplies,text:'OLD WATCH CAMP — West. Shelter and supplies, subject to availability. The watch has been reduced to one crow. He regrets the inconvenience.'}
 ].map(p=>({...p,...roadFacing(p.target.x-p.x,p.target.y-p.y)}));props.push(...signs.map(p=>({...p,type:'signpost'})));
 for(const path of paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=distance(a,b);for(let at=6;at<length;at+=13){const t=at/length,dx=(b.x-a.x)/length,dy=(b.y-a.y)/length,p={x:a.x+(b.x-a.x)*t-dy*2.3,y:a.y+(b.y-a.y)*t+dx*2.3};if(isWalkable({tiles},p.x,p.y)&&distance(p,portal)>17)props.push({...p,...roadFacing(dx,dy),type:'road-lantern'});}}
 for(const p of [portal,field,waypoint,supplies,provisions])carve(p,3);
 for(let y=18;y<=28;y++)for(let x=176;x<=213;x++)if(x<191||x>198){tiles[y][x]=0;roads.delete(y*size+x);}
 props.push(...frontierEdges(tiles,water));for(let i=props.length-1;i>=0;i--){const p=props[i];if(p.x>177&&p.x<213&&p.y<42)props.splice(i,1);}props.push({type:'kingdom-gate',x:portal.x,y:portal.y-1,width:1120,height:747,exit:true});
 const seen=new Set();for(let y=townBounds.y1-2;y<=townBounds.y2+2;y++)for(let x=townBounds.x1-2;x<=townBounds.x2+2;x++)seen.add(y*size+x);
 const grass=dressForestFloor({seed,size,tiles,roads,townBounds,portal});props.push(...grass);
 return {seed,size,tiles,livestock,grassCount:grass.length,rooms:main.map(p=>({x:p.x-3,y:p.y-3,w:6,h:6})),start,portal,herd,pasture,provisions,field,waypoint,supplies,paths,signs,townExit:exit,enemies:enemies.filter(e=>isWalkable({tiles},e.x,e.y,.23)),props,roads,water,depth:1,seen,bossDead:false,outdoor:true,act:1,kind:'wilderness',chapter:0,exitReady:true,townBounds,npcs:town.npcs.map(n=>({...n,x:n.x+16,y:n.y+18})),townWaypoint:{x:49,y:52},critters:[{x:121,y:120,species:'hen',phase:1},{x:103,y:91,species:'crow',phase:2}]};
}
