import {generateDungeon,makeEnemy,random,distance,isWalkable} from './game.js';

export const ACTS=[
 {id:1,title:'The Broken Oath',wilds:'Kingsroad Wilds',stronghold:'Ruined Marchgate',knight:'Sir Aldren, the Thornbound',epithet:'FIRST SEAT OF THE ROUND TABLE',god:'Solenne, Lady of Dawn',color:'#a1aa70',level:1,quote:'I sent you home to your family. Do not mistake your absence for betrayal. Find my knights. Set their souls free.',boon:'The Lady of Dawn restores your flasks at her shrines.'},
 {id:2,title:'The Drowned Covenant',wilds:'Mourning Fen',stronghold:'The Sunken Chapel',knight:'Sir Morcant, the Drowned',epithet:'KEEPER OF THE SECOND SEAT',god:'Neris, Keeper of Waters',color:'#76b1b0',level:4,quote:'Morcant once carried the drowning from the flood. Now the mire carries his victims. Remember the man beneath the curse.',boon:'The Keeper blesses the road with spirit and shelter.'},
 {id:3,title:'Ashes of the Round',wilds:'Cinderfields',stronghold:'Red Watch Keep',knight:'Sir Gareth, the Iron Pyre',epithet:'THE KING’S ONCE-FAITHFUL BLADE',god:'Orun, the Eternal Forge',color:'#d69660',level:7,quote:'Gareth kept the border for thirty winters. The Wanderer has made his honour a furnace. Quench it.',boon:'The Eternal Forge tempers the resolve of the living.'},
 {id:4,title:'The Silent Choir',wilds:'Frostwold',stronghold:'Cathedral of Thorns',knight:'Dame Yseld, the Hollow Saint',epithet:'VOICE OF THE ROUND TABLE',god:'Veyra, Witness of Souls',color:'#a5a8d7',level:10,quote:'Yseld prayed for every soldier she could not save. Her prayers are screams now. Let her hear silence once more.',boon:'The Witness reveals the souls the darkness cannot consume.'},
 {id:5,title:'The Usurper’s Crown',wilds:'Crownfall Approach',stronghold:'Throne of Black Glass',knight:'Sir Brennan, the Last Oath',epithet:'LAST KNIGHT OF THE FALLEN TABLE',god:'The Concord of the Old Gods',color:'#ceac65',level:13,quote:'My son chose a crown over a father. I ask no vengeance for myself. Break the bargain. Give our people their dawn.',boon:'All the old gods stand with you at the gates of Crownfall.'},
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
export function campaignObjective(p,kind,act=p.campaign?.act||1){const a=actFor(act);if(p.campaign?.completed)return 'The bargain is broken. The kingdom sees dawn.';if(kind==='town')return p.quests.guideMet?`Follow the king’s spirit into ${a.wilds}`:'Speak to Sister Maelin, then follow the Kingsroad';if(kind==='wilderness')return `Journey to ${a.stronghold}`;if(act===5&&p.campaign?.defeated.includes('king'))return 'End the Veiled Wanderer’s bargain';if(act===5&&canAdvance(p,5))return 'Confront King Vaelor, the Usurper';return canAdvance(p,act)?'Speak to King Alaric’s spirit and continue':`Release ${a.knight} from the curse`;}

export function generateWilderness(seed,act=1){
 const rng=random(seed),size=64,tiles=Array.from({length:size},()=>Array(size).fill(0)),start={x:13.5,y:48.5},portal={x:49.5,y:14.5},props=[],enemies=[];
 const route=[start,{x:18.5,y:39.5},{x:30.5,y:38.5},{x:34.5,y:28.5},{x:43.5,y:26.5},portal];
 const carve=(x,y,r)=>{for(let yy=Math.max(1,Math.floor(y-r));yy<Math.min(size-1,y+r);yy++)for(let xx=Math.max(1,Math.floor(x-r));xx<Math.min(size-1,x+r);xx++)if(Math.hypot(xx+.5-x,yy+.5-y)<r)tiles[yy][xx]=1;};
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],len=distance(a,b);for(let j=0;j<=Math.ceil(len*2);j++){const t=j/Math.ceil(len*2);carve(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,4.2+rng()*1.6);}}
 const rooms=route.map(p=>({x:p.x-3,y:p.y-3,w:6,h:6}));let id=1;
 for(let i=1;i<route.length;i++)for(let j=0;j<4+i%2;j++){const p=route[i],x=p.x-2+rng()*4,y=p.y-2+rng()*4;if(distance({x,y},start)>6&&isWalkable({tiles},x,y))enemies.push(makeEnemy(id++,x,y,rng()<.22?'wraith':rng()<.45?'crawler':'skeleton',1+(act-1)*.65,j===0&&i>2));}
 for(let y=2;y<size-2;y++)for(let x=2;x<size-2;x++)if(tiles[y][x]){const n=rng();if(n<.035&&distance({x,y},start)>3)props.push({x:x+.5,y:y+.5,type:'building',sprite:7,width:100+rng()*65,height:130+rng()*50});else if(n<.06)props.push({x:x+.5,y:y+.5,type:'bones',variant:1});}
 props.push({type:'building',sprite:15,x:portal.x,y:portal.y-1,width:225,height:230,exit:true});
 const waypoint={x:17.5,y:43.5};carve(waypoint.x,waypoint.y,2);
 const shrine={x:32.5,y:36.5};carve(shrine.x,shrine.y,2);
 return {seed,size,tiles,rooms,start,portal,enemies,props,depth:act,seen:new Set(),bossDead:false,outdoor:true,act,kind:'wilderness',waypoint,shrine,spirit:{x:15.5,y:46.5},exitReady:true};
}
export function generateStronghold(seed,act=1){
 const d=generateDungeon(seed,1+(act-1)*.65),boss=d.enemies.find(e=>e.type==='warden');
 d.act=act;d.kind='stronghold';d.waypoint={x:d.start.x+2,y:d.start.y+1};d.spirit={x:d.start.x-1.5,y:d.start.y};
 Object.assign(boss,{name:actFor(act).knight,bossId:`knight-${act}`,phaseType:['thorns','flood','fire','frost','oath'][act-1],tint:actFor(act).color});
 d.shrine={x:d.start.x-2,y:d.start.y+2};return d;
}
export const PROLOGUE=[
 {title:'A kingdom worth defending',text:'King Alaric was beloved by his people. One winter night, a hooded stranger came to his court, offering riches and power beyond imagining. Alaric heard the corruption beneath the promise. He refused.',image:0},
 {title:'A son’s hunger',text:'Prince Vaelor heard the bargain from the shadows. Blinded by greed, he conspired with the visitor. Before dawn, the king lay dead. His son wore the crown—and accepted the bargain.',image:1},
 {title:'The price of a crown',text:'The Wanderer’s magic flowed through the royal army. The knights of the Round Table became monstrous vessels for it. Harvests failed. Roads emptied. The kingdom sank into despair.',image:2},
 {title:'The soldier who returned',text:'You served in Alaric’s royal guard. By his leave, you had gone home to visit your family. You returned to a stolen throne and a country that no longer knew the light.',image:3},
 {title:'An oath beyond death',text:'But the old king’s soul endured. With the blessing of the forgotten gods, his spirit found you. “Free my knights. Break my son’s bargain. Let our people see another dawn.”',image:4},
 {title:'The road to Crownfall',text:'Beyond Emberfall lie the Kingsroad wilds and the sealed gates of the kingdom. Each fallen knight holds a road forward. At the end waits the mad king—and the shadow that bought his soul.',image:5},
];
