import {makeEnemy,isWalkable} from './game.js';

export const ACT_ONE_QUESTS=[
 {id:'last-herd',title:'The Last Herd',area:'Elin’s Pasture',chapter:0,art:0,required:6,story:'Elin’s sheep feed the families hiding in Emberfall. Six soldiers wearing Alaric’s old colours have broken into her pasture, but they no longer answer their own names. Hadrin ordered the dead to slaughter livestock and starve any village sheltering loyalists. Follow the southern pasture lane and put the attackers to rest before Emberfall loses its last food source.',after:'The sheep are safe. Under a soldier’s ruined tabard you recognise the old royal badge, nailed through with the usurper’s levy seal. These were your comrades, raised to punish the people they once protected. Maelin names the officer responsible: Captain Hadrin at Marchgate.'},
 {id:'marchgate',title:'Ruined Marchgate',area:'Ruined Marchgate',chapter:0,art:2,boss:'captain-1-0',story:'Captain Hadrin commanded your old regiment. He swore his oath to Vaelor and now sends reanimated comrades to destroy the villages that still honour Alaric. Fight through his barbican and stop the starvation raids at their source. His dying confession sends you east, after the prison convoy.',after:'Hadrin admits that Edrin was taken east. The grain levy feeds the same garrison that carries the prisoners.'},
 {id:'tithe-enforcers',title:'Break the Levy',area:'Widow’s Fields',chapter:1,art:1,leaders:['The Famine Collector','The Empty Sickle','The Widowmaker'],story:'Beyond Marchgate, the royal levy has taken the seed grain as well as the harvest. Oswen’s three enforcers burn any farm that refuses to surrender its winter stores, feeding Aldren’s prison garrison while the countryside starves. Hunt down their warbands before the fields become another graveyard.',after:'The enforcers are dead. Farmers leave their hiding places and turn toward the granary.'},
 {id:'tithe-granary',title:'The Tithe Granary',area:'The Tithe Granary',chapter:1,art:3,boss:'captain-1-1',story:'Reeve Oswen once counted the old king’s harvests. The stranger’s bargain has made hunger his weapon: he withholds grain from the villages and trades food for prisoners to serve Aldren. He has turned the winter grain store into a killing yard. Cross the occupied wheat fields and defeat him. The prisoners need an open road, not another ledger.',after:'Oswen falls among the stolen grain. Freed captives reveal a trail into Blackthorn Hollow, where Aldren binds the prisoners to his garrison.'},
 {id:'hollow-chanters',title:'Silence the Thorn Choir',area:'Blackthorn Hollow',chapter:2,art:4,leaders:['Cantor of the Briar','The Hollow Confessor','The Rootbound Voice'],story:'The captives spared at Oswen’s yard are being marched into the hollow to replace the soldiers you have slain. Three chanters drain their lives to keep the dead bound to Aldren. The voices you hear belong to people still trapped inside the ritual. Break their armed circles and silence the ritual before another patrol rises.',after:'The voices die away. The hollow’s thorns slacken, and the captives can hear the road again.'},
 {id:'thornbound',title:'The First Fallen Knight',area:'Aldren’s Redoubt',chapter:2,art:5,boss:'knight-1',story:'Sir Aldren once held Alaric’s right flank; you marched beneath his banner. Vaelor’s bargain has grown black thorns through his armour and bound him to the stranger. Edrin witnessed the first binding, and Aldren keeps him alive to extract the names of other loyalists. Defeat the first corrupted knight and free Edrin from the redoubt. No stolen document can do this for you.',after:'Aldren finally releases his sword. Edrin is free, the first binding is broken, and Emberfall can shelter its people again. This ends Act I.'},
];
export function migrateActOne(p){
 const c=p.campaign;if(!c||c.actOneVersion===3)return;
 if(c.actOneVersion===2){
  c.records=Array.isArray(c.records)?c.records:[];c.actOneKills??={};
  const marks=(p.quests.herdKills||[]).map(id=>Number(String(id).split('-')[1])).filter(n=>Number.isInteger(n)&&n>=0&&n<6);
  c.actOneKills['last-herd']=[...new Set([...(c.actOneKills['last-herd']||[]),...marks])];
  if((p.quests.herdRewarded||c.actOneKills['last-herd'].length>=6)&&!c.records.includes('field-1-0'))c.records.push('field-1-0');c.actOneVersion=3;return;
 }
 c.chapters??={};c.chapters[1]=Math.min(2,Number(c.chapters[1])||0);c.records=(Array.isArray(c.records)?c.records:[]).filter(id=>!/^field-1-/.test(id));c.actOneKills??={};
 p.inventory=(p.inventory||[]).filter(i=>!/^quest-1-|^quest-winter-provisions$/.test(i.id||''));
 for(const key of ['waypoints','visited'])c[key]=(Array.isArray(c[key])?c[key]:[]).map(id=>id==='act-1-wilderness-4'?'act-1-wilderness-3':id==='act-1-stronghold-4'?'act-1-stronghold-3':id);
 if(c.defeated?.includes('knight-1'))for(let ch=0;ch<3;ch++)c.records.push(`field-1-${ch}`);
 c.actOneVersion=3;
}
export function seedActOneEncounters(d,p,chapter){
 d.field=null;d.provisions=null;
 if(chapter!==0)d.enemies=d.enemies.filter(e=>!e.herdId);const c=p.campaign||{records:[],actOneKills:{}};const quest=ACT_ONE_QUESTS[chapter*2];if(!quest)return d;
 if(c.records.includes(`field-1-${chapter}`)){d.enemies=d.enemies.filter(e=>!e.herdId);return d;}
 if(chapter===0){for(const e of d.enemies.filter(e=>e.herdId)){const mark=Number(e.herdId.split('-')[1]);Object.assign(e,{questId:quest.id,questMark:mark,role:mark%2?'brute':'guard'});}return d;}
 for(const sign of d.signs||[]){if(/provision|wagon|orders/i.test(sign.name+' '+sign.text))sign.text='KINGSROAD — Marchgate to the north-east. The toll is currently payable in bruises. Complaints may be addressed to Captain Hadrin.';}
 const anchors=[d.paths[0][2],d.paths[0][4],d.paths[0][6]];
 for(let i=0;i<3;i++){
  if(c.actOneKills?.[quest.id]?.includes(i))continue;
  const a=anchors[i];if(!a)continue;
  for(let j=0;j<3;j++){const at={x:a.x+(j-1)*1.1,y:a.y+(j%2)*1.2};if(!isWalkable(d,at.x,at.y,.23))continue;
   const e=makeEnemy(5000+chapter*100+i*3+j,at.x,at.y,j===1&&chapter>0?'wraith':'skeleton',1+chapter*2,j===1);
   Object.assign(e,{name:j===1?quest.leaders[i]:chapter===2?'Thornbound Retainer':chapter===1?'Levy Butcher':'Dead Kingsroad Guard',faction:1,role:j===1&&chapter>0?'hexer':'guard',speed:2+chapter*.12,level:1+chapter*4});
   if(j===1){e.questId=quest.id;e.questMark=i;e.hp=e.maxHp=110+chapter*130;e.damage=16+chapter*5;}d.enemies.push(e);
  }
 }
 d.questEncounters=quest.id;return d;
}
export function recordActOneKill(p,e){
 if(!p.campaign||!e.questId)return null;const quest=ACT_ONE_QUESTS.find(q=>q.id===e.questId);if(!quest)return null;
 p.campaign.actOneKills??={};const marks=p.campaign.actOneKills[e.questId]??=[];if(marks.includes(e.questMark))return null;marks.push(e.questMark);
 const required=quest.required||3;if(marks.length<required)return {message:`${quest.title} · ${marks.length} / ${required} ${quest.id==='last-herd'?'pasture attackers':'leaders'} defeated`,xp:0};
 if(quest.id==='last-herd'){p.quests.herdRewarded=true;p.quests.herdKills=Array.from({length:6},(_,i)=>'herd-'+i);}
 const key=`field-1-${quest.chapter}`;if(p.campaign.records.includes(key))return null;p.campaign.records.push(key);const gold=65+quest.chapter*45;p.gold+=gold;
 return {message:`${quest.title} complete · +${gold} gold`,xp:150+quest.chapter*100};
}
export function actOneQuests(p){return ACT_ONE_QUESTS.map(q=>{const done=q.boss?p.campaign.defeated.includes(q.boss):p.campaign.records.includes(`field-1-${q.chapter}`),count=p.campaign.actOneKills?.[q.id]?.length||0;return {...q,done,status:done?'complete':q.chapter<=(p.campaign.chapters[1]||0)?'active':'locked',objective:q.id==='last-herd'?`Protect Elin’s sheep · ${count} / 6 risen soldiers defeated. Follow the southern pasture lane.`:q.boss?`Defeat ${q.chapter===0?'Captain Hadrin':q.chapter===1?'Reeve Oswen':'Sir Aldren'} in ${q.area}.`:`Defeat the three warband leaders in ${q.area} · ${count} / 3.`,aftermath:done?q.after:''};});}
export function actOneObjective(p,chapter=0){const q=actOneQuests(p).filter(q=>q.chapter===chapter);return q.find(q=>!q.done)?.objective||'The road is open. Continue at the stronghold exit.';}
