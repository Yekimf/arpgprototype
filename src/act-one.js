import {makeEnemy,isWalkable} from './game.js';

export const ACT_ONE_QUESTS=[
 {id:'kingsroad-patrols',title:'The Dead on the Kingsroad',area:'Kingsroad Wilds',chapter:0,art:0,leaders:['The Toll of Bones','The Hanged Sergeant','The King’s Hound'],story:'Hadrin has sent three dead patrols to close the road around Emberfall. Break their officers and leave the survivors a way out.',after:'The patrols fall apart without their officers. Refugees can reach Emberfall again.'},
 {id:'marchgate',title:'Ruined Marchgate',area:'Ruined Marchgate',chapter:0,art:2,boss:'captain-1-0',story:'Captain Hadrin holds the outer wall for the usurper. Fight through his barbican and end his command. His dying confession sends you east, after the prison convoy.',after:'Hadrin admits that Edrin was taken east. The grain levy feeds the same garrison that carries the prisoners.'},
 {id:'tithe-enforcers',title:'Break the Levy',area:'Widow’s Fields',chapter:1,art:1,leaders:['The Famine Collector','The Empty Sickle','The Widowmaker'],story:'Three levy enforcers are burning the farms and driving families into the ditches. Hunt down their warbands before the fields become another graveyard.',after:'The enforcers are dead. Farmers leave their hiding places and turn toward the granary.'},
 {id:'tithe-granary',title:'The Tithe Granary',area:'The Tithe Granary',chapter:1,art:3,boss:'captain-1-1',story:'Reeve Oswen has turned the winter grain store into a killing yard. Cross the occupied wheat fields and defeat him. The prisoners need an open road, not another ledger.',after:'Oswen falls among the stolen grain. Freed captives reveal a trail into Blackthorn Hollow, where Aldren binds the prisoners to his garrison.'},
 {id:'hollow-chanters',title:'Silence the Thorn Choir',area:'Blackthorn Hollow',chapter:2,art:4,leaders:['Cantor of the Briar','The Hollow Confessor','The Rootbound Voice'],story:'Three chanters keep the hollow’s dead soldiers bound to Aldren. Break their armed circles and silence the ritual before another patrol rises.',after:'The voices die away. The hollow’s thorns slacken, and the captives can hear the road again.'},
 {id:'thornbound',title:'The First Fallen Knight',area:'Aldren’s Redoubt',chapter:2,art:5,boss:'knight-1',story:'Aldren guards the hollow in armour grown through with black thorns. Defeat the first corrupted knight and free Edrin from the redoubt. No stolen document can do this for you.',after:'Aldren finally releases his sword. Edrin is free, the first binding is broken, and the road toward the drowned province lies open.'},
];
export function migrateActOne(p){
 const c=p.campaign;if(!c||c.actOneVersion===2)return;
 c.chapters??={};c.chapters[1]=Math.min(2,Number(c.chapters[1])||0);c.records=(Array.isArray(c.records)?c.records:[]).filter(id=>!/^field-1-/.test(id));c.actOneKills??={};
 p.inventory=(p.inventory||[]).filter(i=>!/^quest-1-|^quest-winter-provisions$/.test(i.id||''));
 for(const key of ['waypoints','visited'])c[key]=(Array.isArray(c[key])?c[key]:[]).map(id=>id==='act-1-wilderness-4'?'act-1-wilderness-3':id==='act-1-stronghold-4'?'act-1-stronghold-3':id);
 if(c.defeated?.includes('knight-1'))for(let ch=0;ch<3;ch++)c.records.push(`field-1-${ch}`);
 c.actOneVersion=2;
}
export function seedActOneEncounters(d,p,chapter){
 d.field=null;d.provisions=null;
 d.enemies=d.enemies.filter(e=>!e.herdId);const c=p.campaign||{records:[],actOneKills:{}};const quest=ACT_ONE_QUESTS[chapter*2];if(!quest||c.records.includes(`field-1-${chapter}`))return d;
 for(const sign of d.signs||[]){if(/provision|wagon|orders/i.test(sign.name+' '+sign.text))sign.text='KINGSROAD — Marchgate to the north-east. The toll is currently payable in bruises. Complaints may be addressed to Captain Hadrin.';}
 const anchors=chapter===0?[d.paths[0][2],d.paths[0][4],d.paths[0][6]]:[{x:35.5,y:51.5},{x:48.5,y:30.5},{x:67.5,y:27.5}];
 for(let i=0;i<3;i++){
  if(c.actOneKills?.[quest.id]?.includes(i))continue;
  const a=anchors[i];if(!a)continue;
  for(let j=0;j<3;j++){const at={x:a.x+(j-1)*1.1,y:a.y+(j%2)*1.2};if(!isWalkable(d,at.x,at.y,.23))continue;
   const e=makeEnemy(5000+chapter*100+i*3+j,at.x,at.y,j===1&&chapter>0?'wraith':'skeleton',1+chapter*2,j===1);
   Object.assign(e,{name:j===1?quest.leaders[i]:chapter===2?'Thornbound Retainer':chapter===1?'Levy Butcher':'Dead Kingsroad Guard',faction:1,role:j===1&&chapter>0?'hexer':'guard',speed:2+chapter*.12});
   if(j===1){e.questId=quest.id;e.questMark=i;e.hp=e.maxHp=110+chapter*130;e.damage=16+chapter*5;}d.enemies.push(e);
  }
 }
 d.questEncounters=quest.id;return d;
}
export function recordActOneKill(p,e){
 if(!p.campaign||!e.questId)return null;const quest=ACT_ONE_QUESTS.find(q=>q.id===e.questId);if(!quest)return null;
 p.campaign.actOneKills??={};const marks=p.campaign.actOneKills[e.questId]??=[];if(marks.includes(e.questMark))return null;marks.push(e.questMark);
 if(marks.length<3)return {message:`${quest.title} · ${marks.length} / 3 leaders defeated`,xp:0};
 const key=`field-1-${quest.chapter}`;if(p.campaign.records.includes(key))return null;p.campaign.records.push(key);const gold=65+quest.chapter*45;p.gold+=gold;
 return {message:`${quest.title} complete · +${gold} gold`,xp:150+quest.chapter*100};
}
export function actOneQuests(p){return ACT_ONE_QUESTS.map(q=>{const done=q.boss?p.campaign.defeated.includes(q.boss):p.campaign.records.includes(`field-1-${q.chapter}`),count=p.campaign.actOneKills?.[q.id]?.length||0;return {...q,done,status:done?'complete':q.chapter<=(p.campaign.chapters[1]||0)?'active':'locked',objective:q.boss?`Defeat ${q.chapter===0?'Captain Hadrin':q.chapter===1?'Reeve Oswen':'Sir Aldren'} in ${q.area}.`:`Defeat the three warband leaders in ${q.area} · ${count} / 3.`,aftermath:done?q.after:''};});}
export function actOneObjective(p,chapter=0){const q=actOneQuests(p).filter(q=>q.chapter===chapter);return q.find(q=>!q.done)?.objective||'The road is open. Continue at the stronghold exit.';}
