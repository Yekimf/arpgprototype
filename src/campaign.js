import {questRelic} from './quest-objects.js';
import {generateOpeningForest} from './opening-forest.js';
import {dressFarmland,generateGranary} from './farmland.js';
import {generateMarchgate} from './marchgate.js';
import {frontierEdges} from './wilderness-boundary.js';
import {chapterFor,dressEnemy} from './campaign-content.js';
import {generateTown,TOWN_BOUNDS} from './settlement.js';
import {generateDungeon,makeEnemy,random,distance,isWalkable} from './game.js';

export const ACTS=[
 {id:1,title:'The Broken Oath',wilds:'Kingsroad Wilds',stronghold:'Ruined Marchgate',knight:'Sir Aldren, the Thornbound',epithet:'FIRST SEAT OF THE ROUND TABLE',color:'#a1aa70',level:1,quote:'Marchgate controls the only road through the outer wall. Hadrin’s garrison holds the first clues to our missing archivist.'},
 {id:2,title:'The Drowned Covenant',wilds:'Mourning Fen',stronghold:'The Sunken Chapel',knight:'Sir Morcant, the Drowned',epithet:'KEEPER OF THE SECOND SEAT',color:'#76b1b0',level:10,quote:'Refugees report patrols in the fen. Morcant has turned the flooded chapel into a prison.'},
 {id:3,title:'Ashes of the Round',wilds:'Cinderfields',stronghold:'Red Watch Keep',knight:'Sir Gareth, the Iron Pyre',epithet:'THE KING’S ONCE-FAITHFUL BLADE',color:'#d69660',level:20,quote:'Gareth held the border for thirty winters. His men now burn the villages they once defended.'},
 {id:4,title:'The Silent Choir',wilds:'Frostwold',stronghold:'Cathedral of Thorns',knight:'Dame Yseld, the Hollow Saint',epithet:'VOICE OF THE ROUND TABLE',color:'#a5a8d7',level:30,quote:'The last messengers disappeared near Frostwold. Yseld has sealed the cathedral road.'},
 {id:5,title:'The Usurper’s Crown',wilds:'Crownfall Approach',stronghold:'Throne of Black Glass',knight:'Sir Brennan, the Last Oath',epithet:'LAST KNIGHT OF THE FALLEN TABLE',color:'#ceac65',level:40,quote:'Brennan guards the inner gate. Beyond him stand Vaelor and the stranger who armed his coup.'},
];
export const actFor=n=>ACTS[Math.max(0,Math.min(4,Number(n||1)-1))];
export const locationId=(act,kind,chapter=0)=>kind==='town'?'emberfall':`act-${act}-${kind}${chapter?`-${chapter+1}`:''}`;
export const chapterOf=(p,act=p.campaign?.act||1)=>p.campaign?.chapters?.[act]||0;
export const fieldKey=(act,chapter)=>`field-${act}-${chapter}`;
export const captainId=(act,chapter)=>chapter<3?`captain-${act}-${chapter}`:`knight-${act}`;
export function completeField(p,act,chapter){const c=ensureCampaign(p),key=fieldKey(act,chapter);if(!c||c.records.includes(key))return false;c.records.push(key);return true;}
export function nextChapter(p,act=p.campaign?.act){const c=ensureCampaign(p),chapter=chapterOf(p,act);if(!c||chapter>=3||!c.defeated.includes(captainId(act,chapter)))return false;c.chapters[act]=chapter+1;return true;}
export function createCampaign(){return {act:1,chapters:{},records:[],defeated:[],waypoints:['emberfall'],visited:['emberfall'],guidance:[],completed:false,introSeen:true};}
export function ensureCampaign(p){if(!p.campaign)return null;const c=p.campaign;c.act=Math.max(1,Math.min(5,c.act||1));const legacy=!c.chapters;c.chapters??={};for(const key of ['defeated','waypoints','visited','guidance','records'])if(!Array.isArray(c[key]))c[key]=[];for(let a=1;a<=5;a++)c.chapters[a]=Math.max(0,Math.min(3,Number(c.chapters[a])||0));if(legacy)for(let a=1;a<=5;a++)if(c.defeated.includes(`knight-${a}`)){c.chapters[a]=3;for(let ch=0;ch<4;ch++)if(!c.records.includes(fieldKey(a,ch)))c.records.push(fieldKey(a,ch));}if(!c.waypoints.includes('emberfall'))c.waypoints.unshift('emberfall');return c;}
export function discoverLocation(p,kind,act=p.campaign?.act||1,chapter=chapterOf(p,act)){const c=ensureCampaign(p);if(!c)return false;const id=locationId(act,kind,chapter),fresh=!c.visited.includes(id);if(fresh)c.visited.push(id);return fresh;}
export function attuneWaypoint(p,kind,act=p.campaign?.act||1,chapter=chapterOf(p,act)){const c=ensureCampaign(p);if(!c)return false;const id=locationId(act,kind,chapter);discoverLocation(p,kind,act,chapter);if(c.waypoints.includes(id))return false;c.waypoints.push(id);return true;}
export function canTravel(p,id){const c=ensureCampaign(p);return !!c&&c.waypoints.includes(id)&& (id==='emberfall'||Number(id.split('-')[1])<=c.act&&(!id.split('-')[3]||Number(id.split('-')[3])-1<=chapterOf(p,Number(id.split('-')[1]))));}
export function defeatCampaignBoss(p,bossId){const c=ensureCampaign(p);if(!c||c.defeated.includes(bossId))return false;if(/^captain-[1-5]-[0-2]$/.test(bossId)){if(Number(bossId.split('-')[1])>c.act)return false;}else if(/^knight-[1-5]$/.test(bossId)){if(Number(bossId.split('-')[1])>c.act)return false;}else if(bossId==='king'){if(c.act!==5||!c.defeated.includes('knight-5'))return false;}else if(bossId==='wanderer'){if(c.act!==5||!c.defeated.includes('king'))return false;}else return false;c.defeated.push(bossId);if(bossId==='wanderer')c.completed=true;return true;}
export function canAdvance(p,act=p.campaign?.act){return !!p.campaign?.defeated.includes(`knight-${act}`);}
export function advanceCampaign(p){const c=ensureCampaign(p);if(!c||c.act>=5||!canAdvance(p))return false;c.act++;return true;}
export function campaignObjective(p,kind,act=p.campaign?.act||1,chapter=chapterOf(p,act)){const a=actFor(act),ch=chapterFor(act,chapter);if(p.campaign?.completed)return 'The bargain is broken. The kingdom sees dawn.';if(kind==='town')return p.quests.guideMet?'Prepare for the next road · J opens your journal':'Speak to Sister Maelin, then follow the Kingsroad';if(kind==='wilderness')return `Enter ${ch.stronghold} · ${ch.captain||a.knight}`;if(act===5&&p.campaign?.defeated.includes('king'))return 'End the Veiled Wanderer’s bargain';if(act===5&&canAdvance(p,5))return 'Confront King Vaelor, the Usurper';return p.campaign?.defeated.includes(captainId(act,chapter))?'The road is open. Read the recovered account':`Defeat ${ch.captain||a.knight}`;}


// The camp and its surrounding fields are one continuous, seeded area.
export const inSanctuary=(d,p)=>!!d.townBounds&&p.x>d.townBounds.x1&&p.x<d.townBounds.x2&&p.y>d.townBounds.y1&&p.y<d.townBounds.y2;
export function generateWilderness(seed,act=1,player={quests:{}},chapter=0){
 if(act===1&&chapter===0)return generateOpeningForest(seed,player,chapterFor(act,chapter).task);
 const camp=act===1&&chapter===0,ch=chapterFor(act,chapter),rng=random(seed),size=camp?128:96,tiles=Array.from({length:size},()=>Array(size).fill(0)),start=camp?{x:48,y:50.5}:{x:17.5,y:77.5},portal=camp?{x:112.5,y:18.5}:{x:76.5,y:18.5},props=[],enemies=[],roads=new Set(),water=new Set();
 const townBounds=camp?{x1:TOWN_BOUNDS.x1+16,y1:TOWN_BOUNDS.y1+18,x2:TOWN_BOUNDS.x2+16,y2:TOWN_BOUNDS.y2+18}:null;
 // A broad, irregular landmass. Ponds, groves and ruins interrupt the field rather
 // than reducing it to a single corridor; roads are always guaranteed walkable.
 for(let y=3;y<size-3;y++)for(let x=3;x<size-3;x++){
   const edge=camp?Math.hypot((x-64)/62,(y-60)/58):Math.hypot((x-48)/47,(y-48)/46),ripples=Math.sin(x*.22)*.028+Math.cos(y*.29)*.026;
   if(edge<.99+ripples)tiles[y][x]=1;
 }
 const carve=(x,y,r,road=false)=>{for(let yy=Math.max(2,Math.floor(y-r));yy<Math.min(size-2,y+r);yy++)for(let xx=Math.max(2,Math.floor(x-r));xx<Math.min(size-2,x+r);xx++)if(Math.hypot(xx+.5-x,yy+.5-y)<r){tiles[yy][xx]=1;if(road&&Math.hypot(xx+.5-x,yy+.5-y)<1.4)roads.add(yy*size+xx);}};
 const lakes=[{x:23,y:24,rx:7,ry:4},{x:73,y:64,rx:5,ry:8},{x:28,y:64,rx:4,ry:5}];
 for(const lake of lakes)for(let y=3;y<size-3;y++)for(let x=3;x<size-3;x++)if(((x-lake.x)/lake.rx)**2+((y-lake.y)/lake.ry)**2<1+Math.sin(x*2+y)*.12){tiles[y][x]=0;water.add(y*size+x);}
 const route=camp?[start,{x:64.5,y:51.5},{x:74.5,y:48.5},{x:85.5,y:40.5},{x:97.5,y:31.5},{x:112.5,y:28.5},portal]:[start,{x:48.5,y:30.5},{x:56.5,y:30.5},{x:67.5,y:27.5},portal];
 const paths=[route,[start,{x:35.5,y:51.5},{x:18.5,y:45.5}],[start,{x:48.5,y:68.5},{x:57.5,y:80.5}],[start,{x:64.5,y:51.5},{x:80.5,y:42.5}]];
 for(const path of paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.ceil(distance(a,b)*2);for(let j=0;j<=steps;j++){const t=j/steps;carve(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,2.8,true);}}
 const rooms=route.map(p=>({x:p.x-3,y:p.y-3,w:6,h:6}));
 if(camp){
   for(let y=townBounds.y1;y<=townBounds.y2;y++)for(let x=townBounds.x1;x<=townBounds.x2;x++){tiles[y][x]=1;water.delete(y*size+x);}
   const town=generateTown(player),shift=p=>({...p,x:p.x+16,y:p.y+18});
   for(const p of town.props.filter(p=>!p.exit&&!(p.type==='building'&&p.sprite===7)))props.push(shift(p));
   for(const b of props.filter(p=>p.type==='building'&&!p.stash)){const r=b.sprite===12?.4:1.2;for(let y=Math.floor(b.y-r);y<=b.y+r;y++)for(let x=Math.floor(b.x-r);x<=b.x+r;x++)tiles[y][x]=0;}
   for(let x=townBounds.x1;x<=townBounds.x2;x++)for(const y of [townBounds.y1,townBounds.y2])if(Math.abs(x-48.5)>2.7){tiles[y][x]=0;props.push({type:'palisade',axis:'x',x:x+.5,y:y+.5});}
   for(let y=townBounds.y1+1;y<townBounds.y2;y++)for(const x of [townBounds.x1,townBounds.x2])if(Math.abs(y-51.5)>2.7){tiles[y][x]=0;props.push({type:'palisade',axis:'y',x:x+.5,y:y+.5});}
 }
 const sealNorth=()=>{for(let y=0;y<18;y++)for(let x=0;x<size;x++){tiles[y][x]=0;roads.delete(y*size+x);}};sealNorth();
 let id=1;
 for(let y=8;y<size-7;y+=5)for(let x=8;x<size-7;x+=5){const at={x:x+rng()*3,y:y+rng()*3};if(!isWalkable({tiles},at.x,at.y)||townBounds&&at.x>townBounds.x1-1.2&&at.x<townBounds.x2+1.2&&at.y>townBounds.y1-1.2&&at.y<townBounds.y2+1.2||distance(at,start)<9||distance(at,portal)<4)continue;if(rng()<.5)enemies.push(dressEnemy(makeEnemy(id++,at.x,at.y,'skeleton',actFor(act).level+chapter*2,rng()<.075),act,rng));}
 // Preserve several routes through each grove. Decorative trees never block a road.
 for(let y=4;y<size-4;y++)for(let x=4;x<size-4;x++)if(tiles[y][x]&&!roads.has(y*size+x)&&!(townBounds&&x>townBounds.x1-3&&x<townBounds.x2+3&&y>townBounds.y1-3&&y<townBounds.y2+3)){
   const n=rng();if(n<.018)props.push({x:x+.5,y:y+.5,type:'building',sprite:7,width:110+rng()*55,height:135+rng()*45});else if(n<.027)props.push({x:x+.5,y:y+.5,type:'bones',variant:1});
 }
 props.push(camp?{type:'kingdom-gate',x:portal.x,y:portal.y-1,width:1120,height:747,exit:true}:{type:'building',sprite:15,x:portal.x,y:portal.y-1,width:225,height:230,exit:true});
 if(camp){
  // A walled forecourt funnels the last stretch into a long gate approach.
  for(let y=18;y<=25;y++)for(let x=97;x<=126;x++)if(x<109||x>116){tiles[y][x]=0;roads.delete(y*size+x);}
 }
 const waypoint=camp?{x:91.5,y:36.5}:{x:56.5,y:30.5},supplies=camp?{x:96.5,y:40.5}:{x:67.5,y:27.5};carve(waypoint.x,waypoint.y,2);carve(supplies.x,supplies.y,2);carve(portal.x,portal.y,3);
 carve(37.5,29.5,2);
 // The keep's gate is a solid barrier. Approach its south side and interact;
 // the arch is not a walk-through opening onto the back of the map.
 sealNorth();
 for(let x=1;x<size-1;x++)if(tiles[18][x]&&(x<portal.x-2.5||x>portal.x+2.5))props.push({type:'frontier',axis:'x',x,y:18});
 props.push({type:'road-gate',x:portal.x-2.5,y:18,span:6,stone:camp});
 for(let i=enemies.length-1;i>=0;i--)if(!isWalkable({tiles},enemies[i].x,enemies[i].y,.23))enemies.splice(i,1);
 props.push(...frontierEdges(tiles,water));
 // The monumental gate owns this apron. No decorative trees, fence segments
 // or debris may be painted across the portcullis or its approach.
 if(camp)for(let i=props.length-1;i>=0;i--){const p=props[i];if(p.type!=='kingdom-gate'&&p.x>=96&&p.x<=128&&p.y>=17&&p.y<=38)props.splice(i,1);}
 const d={seed,size,tiles,rooms,start,portal,enemies,props,roads,water,depth:act,seen:new Set(),bossDead:false,outdoor:true,act,kind:'wilderness',chapter,field:camp?{x:85.5,y:40.5,label:ch.task}:{x:37.5,y:29.5,label:ch.task},waypoint,supplies,exitReady:true,townBounds,npcs:[]};
 if(camp){
  d.provisions={x:77.5,y:49.5,label:'Stolen winter provisions'};carve(d.provisions.x,d.provisions.y,3,true);carve(d.field.x,d.field.y,3,true);
  const herd=d.herd={x:70.5,y:51.5};carve(herd.x,herd.y,5,true);
  for(let i=props.length-1;i>=0;i--)if(props[i].type==='building'&&[herd,d.provisions,d.field].some(at=>distance(at,props[i])<4))props.splice(i,1);
  for(let i=0;i<4;i++)props.push({type:'livestock',x:68.5+i%2*1.5,y:50.5+Math.floor(i/2)*1.7});
  props.push({type:'brazier',x:67.5,y:53.5,variant:1});
  for(let i=0;i<6;i++){const herdId='herd-'+i;if(player.quests.herdKills?.includes(herdId))continue;const e=makeEnemy(id++,69.5+i%3*1.8,47.5+Math.floor(i/3)*7,'skeleton',1);Object.assign(e,{herdId,faction:1,tint:'#96947b',name:i%2?'Zombified Levy':'Bonebound Soldier',hp:26,maxHp:26,damage:5,speed:1.1});enemies.push(e);}
 }
 if(camp){d.npcs=generateTown(player).npcs.map(n=>({...n,x:n.x+16,y:n.y+18}));d.townWaypoint={x:49,y:52};for(let y=townBounds.y1-2;y<=townBounds.y2+2;y++)for(let x=townBounds.x1-2;x<=townBounds.x2+2;x++)d.seen.add(y*size+x);}
 d.field.kind=questRelic(act,chapter).kind;
 if(act===1&&chapter===1)dressFarmland(d);
 return d;
}
export function generateStronghold(seed,act=1,chapter=0){
 const level=actFor(act).level+chapter*2,ch=chapterFor(act,chapter),d=act===1&&chapter===1?generateGranary(seed,level):act===1&&chapter===0?generateMarchgate(seed,level):generateDungeon(seed,level,{roomCount:22,size:80}),boss=d.enemies.find(e=>e.type==='warden'),rng=random(seed+41);
 for(const enemy of d.enemies)if(enemy!==boss)dressEnemy(enemy,act,rng);
 d.act=act;d.chapter=chapter;d.kind='stronghold';d.returnGate=d.entryGate||{x:d.start.x,y:d.start.y-1};d.waypoint={x:d.start.x+2,y:d.start.y+1};
 Object.assign(boss,{name:ch.captain||actFor(act).knight,bossId:captainId(act,chapter),phaseType:act===1&&chapter===1?'harvest':['thorns','flood','fire','frost','oath'][act-1],tint:actFor(act).color,chapter});
 d.supplies={x:d.start.x-2,y:d.start.y+2};return d;
}

export const PROLOGUE=[
 {title:'A kingdom worth defending',text:'King Alaric was beloved by his people. One winter night, a hooded stranger came to his court, offering riches and power beyond imagining. Alaric heard the corruption beneath the promise. He refused.',image:0},
 {title:'A son’s hunger',text:'Prince Vaelor heard the bargain from the shadows. Blinded by greed, he conspired with the visitor. Before dawn, the king lay dead. His son wore the crown—and accepted the bargain.',image:1},
 {title:'The price of a crown',text:'The Wanderer’s magic flowed through the royal army. The knights of the Round Table became monstrous vessels for it. Harvests failed. Roads emptied. The kingdom sank into despair.',image:2},
 {title:'The soldier who returned',text:'You served in Alaric’s royal guard. By his leave, you had gone home to visit your family. You returned to a stolen throne and a country that no longer knew the light.',image:3},
 {title:'Those who remain',text:'At Emberfall, the survivors tend their wounded and count their missing. Maelin tells you of the royal patrols, and of an archivist taken to Marchgate. No army remains to help them. You take the north road.',image:4},
 {title:'The road to Crownfall',text:'Beyond Emberfall lie the Kingsroad wilds and the sealed gates of the kingdom. Each fallen knight holds a road forward. At the end waits the mad king—and the shadow that bought his soul.',image:5},
];
