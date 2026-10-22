import {generateTown} from './settlement.js';
import {generateDungeon,makeEnemy,random,distance,isWalkable} from './game.js';

export const ACTS=[
 {id:1,title:'The Broken Oath',wilds:'Kingsroad Wilds',stronghold:'Ruined Marchgate',knight:'Sir Aldren, the Thornbound',epithet:'FIRST SEAT OF THE ROUND TABLE',color:'#a1aa70',level:1,quote:'Marchgate controls the only road through the outer wall. Aldren holds our archivist beneath it.'},
 {id:2,title:'The Drowned Covenant',wilds:'Mourning Fen',stronghold:'The Sunken Chapel',knight:'Sir Morcant, the Drowned',epithet:'KEEPER OF THE SECOND SEAT',color:'#76b1b0',level:4,quote:'Refugees report patrols in the fen. Morcant has turned the flooded chapel into a prison.'},
 {id:3,title:'Ashes of the Round',wilds:'Cinderfields',stronghold:'Red Watch Keep',knight:'Sir Gareth, the Iron Pyre',epithet:'THE KING’S ONCE-FAITHFUL BLADE',color:'#d69660',level:7,quote:'Gareth held the border for thirty winters. His men now burn the villages they once defended.'},
 {id:4,title:'The Silent Choir',wilds:'Frostwold',stronghold:'Cathedral of Thorns',knight:'Dame Yseld, the Hollow Saint',epithet:'VOICE OF THE ROUND TABLE',color:'#a5a8d7',level:10,quote:'The last messengers disappeared near Frostwold. Yseld has sealed the cathedral road.'},
 {id:5,title:'The Usurper’s Crown',wilds:'Crownfall Approach',stronghold:'Throne of Black Glass',knight:'Sir Brennan, the Last Oath',epithet:'LAST KNIGHT OF THE FALLEN TABLE',color:'#ceac65',level:13,quote:'Brennan guards the inner gate. Beyond him stand Vaelor and the stranger who armed his coup.'},
];
export const actFor=n=>ACTS[Math.max(0,Math.min(4,Number(n||1)-1))];
export const locationId=(act,kind)=>kind==='town'?'emberfall':`act-${act}-${kind}`;
export function createCampaign(){return {act:1,defeated:[],waypoints:['emberfall'],visited:['emberfall'],guidance:[],completed:false,introSeen:true};}
export function ensureCampaign(p){if(!p.campaign)return null;const c=p.campaign;c.act=Math.max(1,Math.min(5,c.act||1));for(const key of ['defeated','waypoints','visited','guidance'])if(!Array.isArray(c[key]))c[key]=[];if(!c.waypoints.includes('emberfall'))c.waypoints.unshift('emberfall');return c;}
export function discoverLocation(p,kind,act=p.campaign?.act||1){const c=ensureCampaign(p);if(!c)return false;const id=locationId(act,kind),fresh=!c.visited.includes(id);if(fresh)c.visited.push(id);return fresh;}
export function attuneWaypoint(p,kind,act=p.campaign?.act||1){const c=ensureCampaign(p);if(!c)return false;const id=locationId(act,kind);discoverLocation(p,kind,act);if(c.waypoints.includes(id))return false;c.waypoints.push(id);return true;}
export function canTravel(p,id){const c=ensureCampaign(p);return !!c&&c.waypoints.includes(id)&& (id==='emberfall'||Number(id.split('-')[1])<=c.act);}
export function defeatCampaignBoss(p,bossId){const c=ensureCampaign(p);if(!c||c.defeated.includes(bossId))return false;if(/^knight-[1-5]$/.test(bossId)){if(Number(bossId.split('-')[1])>c.act)return false;}else if(bossId==='king'){if(c.act!==5||!c.defeated.includes('knight-5'))return false;}else if(bossId==='wanderer'){if(c.act!==5||!c.defeated.includes('king'))return false;}else return false;c.defeated.push(bossId);if(bossId==='wanderer')c.completed=true;return true;}
export function canAdvance(p,act=p.campaign?.act){return !!p.campaign?.defeated.includes(`knight-${act}`);}
export function advanceCampaign(p){const c=ensureCampaign(p);if(!c||c.act>=5||!canAdvance(p))return false;c.act++;return true;}
export function campaignObjective(p,kind,act=p.campaign?.act||1){const a=actFor(act);if(p.campaign?.completed)return 'The bargain is broken. The kingdom sees dawn.';if(kind==='town')return p.quests.guideMet?`Take the Kingsroad toward ${a.stronghold}`:'Speak to Sister Maelin, then follow the Kingsroad';if(kind==='wilderness')return `Journey to ${a.stronghold}`;if(act===5&&p.campaign?.defeated.includes('king'))return 'End the Veiled Wanderer’s bargain';if(act===5&&canAdvance(p,5))return 'Confront King Vaelor, the Usurper';return canAdvance(p,act)?'The road is open. Continue toward Crownfall':`Defeat ${a.knight} and open the road`;}

// The camp and its surrounding fields are one continuous, seeded area.
export const inSanctuary=(d,p)=>!!d.townBounds&&p.x>d.townBounds.x1&&p.x<d.townBounds.x2&&p.y>d.townBounds.y1&&p.y<d.townBounds.y2;
export function generateWilderness(seed,act=1,player={quests:{}}){
 const rng=random(seed),size=96,tiles=Array.from({length:size},()=>Array(size).fill(0)),start=act===1?{x:48,y:50.5}:{x:17.5,y:77.5},portal={x:76.5,y:18.5},props=[],enemies=[],roads=new Set(),water=new Set();
 const townBounds=act===1?{x1:37,y1:39,x2:61,y2:64}:null;
 // A broad, irregular landmass. Ponds, groves and ruins interrupt the field rather
 // than reducing it to a single corridor; roads are always guaranteed walkable.
 for(let y=3;y<size-3;y++)for(let x=3;x<size-3;x++){
   const edge=Math.hypot((x-48)/47,(y-48)/46),ripples=Math.sin(x*.22)*.028+Math.cos(y*.29)*.026;
   if(edge<.99+ripples)tiles[y][x]=1;
 }
 const carve=(x,y,r,road=false)=>{for(let yy=Math.max(2,Math.floor(y-r));yy<Math.min(size-2,y+r);yy++)for(let xx=Math.max(2,Math.floor(x-r));xx<Math.min(size-2,x+r);xx++)if(Math.hypot(xx+.5-x,yy+.5-y)<r){tiles[yy][xx]=1;if(road&&Math.hypot(xx+.5-x,yy+.5-y)<1.4)roads.add(yy*size+xx);}};
 const lakes=[{x:23,y:24,rx:7,ry:4},{x:73,y:64,rx:5,ry:8},{x:28,y:64,rx:4,ry:5}];
 for(const lake of lakes)for(let y=3;y<size-3;y++)for(let x=3;x<size-3;x++)if(((x-lake.x)/lake.rx)**2+((y-lake.y)/lake.ry)**2<1+Math.sin(x*2+y)*.12){tiles[y][x]=0;water.add(y*size+x);}
 const route=[start,{x:48.5,y:37.5},{x:56.5,y:30.5},{x:67.5,y:27.5},portal];
 const paths=[route,[start,{x:35.5,y:51.5},{x:18.5,y:45.5}],[start,{x:48.5,y:68.5},{x:57.5,y:80.5}],[start,{x:64.5,y:51.5},{x:80.5,y:42.5}]];
 for(const path of paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.ceil(distance(a,b)*2);for(let j=0;j<=steps;j++){const t=j/steps;carve(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,2.8,true);}}
 const rooms=route.map(p=>({x:p.x-3,y:p.y-3,w:6,h:6}));
 if(act===1){
   for(let y=39;y<=64;y++)for(let x=37;x<=61;x++)tiles[y][x]=1;
   const town=generateTown(player),shift=p=>({...p,x:p.x+16,y:p.y+18});
   for(const p of town.props.filter(p=>!p.exit&&!(p.type==='building'&&p.sprite===7)))props.push(shift(p));
   for(const b of props.filter(p=>p.type==='building'&&!p.stash)){const r=b.sprite===12?.4:1.2;for(let y=Math.floor(b.y-r);y<=b.y+r;y++)for(let x=Math.floor(b.x-r);x<=b.x+r;x++)tiles[y][x]=0;}
   for(let x=37;x<=61;x++)for(const y of [39,64])if(Math.abs(x-48.5)>2.7){tiles[y][x]=0;props.push({type:'palisade',axis:'x',x:x+.5,y:y+.5});}
   for(let y=40;y<64;y++)for(const x of [37,61])if(Math.abs(y-51.5)>2.7){tiles[y][x]=0;props.push({type:'palisade',axis:'y',x:x+.5,y:y+.5});}
 }
 let id=1;
 for(let y=8;y<89;y+=5)for(let x=8;x<89;x+=5){const at={x:x+rng()*3,y:y+rng()*3};if(!isWalkable({tiles},at.x,at.y)||townBounds&&at.x>31&&at.x<67&&at.y>33&&at.y<70||distance(at,start)<9||distance(at,portal)<4)continue;if(rng()<.5)enemies.push(makeEnemy(id++,at.x,at.y,rng()<.22?'wraith':rng()<.4?'crawler':'skeleton',1+(act-1)*.65,rng()<.075));}
 // Preserve several routes through each grove. Decorative trees never block a road.
 for(let y=4;y<size-4;y++)for(let x=4;x<size-4;x++)if(tiles[y][x]&&!roads.has(y*size+x)&&!(townBounds&&x>34&&x<65&&y>36&&y<68)){
   const n=rng();if(n<.018)props.push({x:x+.5,y:y+.5,type:'building',sprite:7,width:110+rng()*55,height:135+rng()*45});else if(n<.027)props.push({x:x+.5,y:y+.5,type:'bones',variant:1});
 }
 props.push({type:'building',sprite:15,x:portal.x,y:portal.y-1,width:225,height:230,exit:true});
 const waypoint={x:56.5,y:30.5},supplies={x:67.5,y:27.5};carve(waypoint.x,waypoint.y,2);carve(supplies.x,supplies.y,2);carve(portal.x,portal.y,3);
 const d={seed,size,tiles,rooms,start,portal,enemies,props,roads,water,depth:act,seen:new Set(),bossDead:false,outdoor:true,act,kind:'wilderness',waypoint,supplies,exitReady:true,townBounds,npcs:[]};
 if(act===1){d.npcs=generateTown(player).npcs.map(n=>({...n,x:n.x+16,y:n.y+18}));d.townWaypoint={x:49,y:52};for(let y=37;y<67;y++)for(let x=35;x<64;x++)d.seen.add(y*size+x);}
 return d;
}
export function generateStronghold(seed,act=1){
 const d=generateDungeon(seed,1+(act-1)*.65),boss=d.enemies.find(e=>e.type==='warden');
 d.act=act;d.kind='stronghold';d.returnGate={x:d.start.x,y:d.start.y-1};d.waypoint={x:d.start.x+2,y:d.start.y+1};
 Object.assign(boss,{name:actFor(act).knight,bossId:`knight-${act}`,phaseType:['thorns','flood','fire','frost','oath'][act-1],tint:actFor(act).color});
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
