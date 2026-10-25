import {makeEnemy,isWalkable,grantExperience} from './game.js';

export const ACT_ONE_QUESTS=[
 {id:'last-herd',title:'The Last Herd',area:'Elin’s Pasture',chapter:0,art:0,required:6,story:'Elin sent her children into Emberfall with a kettle and one blanket. Her sheep are still penned beyond the southern lane. Six risen soldiers have broken into the pasture; the scraps of royal red on their armour belong to your old regiment. Hadrin’s patrols are slaughtering livestock around every village sheltering Alaric’s people. They mean to starve the refuge. Follow the pasture lane and put those six men to rest.',after:'The flock bunches against the fence as the last soldier falls. One still carries a spoon stamped with the royal mark. You used to hear those spoons knocking on mess bowls at the third bell. The levy seal on his tabard is Hadrin’s. Maelin can tell Elin that her children will eat. The captain still has men on the road.'},
 {id:'marchgate',title:'Ruined Marchgate',area:'Ruined Marchgate',chapter:0,art:2,boss:'captain-1-0',story:'Captain Hadrin taught you to count the wagons before the men when a village fled. Now his patrols drive the refugees back. Marchgate commands the only cart road through the old border, and the last prison convoy took Edrin through its barbican in chains. Fight your way to your former commander. Until Hadrin falls, every family leaving Emberfall will meet his men.',after:'Hadrin’s last words send you east with the grain wagons, after Edrin. Then he admits what he kept from his men: Vaelor’s levy orders arrived before the king’s death bell. He dies clutching the old badge hidden beneath his new seal. The road to Widow’s Fields is open. Somebody beyond it has been feeding this garrison.'},
 {id:'tithe-enforcers',title:'Break the Levy',area:'Widow’s Fields',chapter:1,art:1,leaders:['The Famine Collector','The Empty Sickle','The Widowmaker'],story:'Alaric let the farmers keep seed through every bad winter. Oswen’s three levy warbands have emptied the bins beneath their floorboards. Families who cannot meet the count are taken to the granary in place of grain; their neighbours are forced to watch. Hunt down the three enforcers and break their armed patrols so the people in hiding can leave their houses alive.',after:'The last levy banner is down. Farm doors remain barred, but someone has left a heel of bread on a roadside stone. A few households have hidden enough seed for another sowing. Oswen still holds the grain yard and the people taken from these houses. The patrols will return unless their orders end there.'},
 {id:'tithe-granary',title:'The Tithe Granary',area:'The Tithe Granary',chapter:1,art:3,boss:'captain-1-1',story:'Reeve Oswen still calls it an emergency levy. He once marked a circle beside every family’s seed allowance. Now he counts prisoners in the same ledger as sacks of rye. The grain feeds Aldren’s garrison; the families it was taken from are sent there in chains. Reach Oswen’s counting yard and break the levy before the next convoy leaves.',after:'Oswen begs you not to burn the ledger. You leave it where the freed families can read the names. A captive remembers Edrin sharing water on the prison road; he was alive when they took him into Blackthorn Hollow. The wagons have cut a track north. The granary can feed a refuge again.'},
 {id:'hollow-chanters',title:'Silence the Thorn Choir',area:'Blackthorn Hollow',chapter:2,art:4,leaders:['Cantor of the Briar','The Hollow Confessor','The Rootbound Voice'],story:'The people who escaped the grain yard hear missing relatives in the singing: a nursery rhyme, a harvest count, names called at a gate. Three chanters turn those scraps of living memory into orders for Aldren’s dead retainers. Edrin is somewhere beyond them. Break their armed circles before the next prisoners lose their own voices.',after:'The choir ceases. For a moment you hear only the branches. The retainers still stand, but their marching chant has lost its rhythm. Aldren has been drawing the living into an order he can no longer end. The voices behind his doors are human.'},
 {id:'thornbound',title:'The First Fallen Knight',area:'Aldren’s Redoubt',chapter:2,art:5,boss:'knight-1',story:'At the old ford, Sir Aldren held his shield to the left until the last refugee wagon crossed. You were in that line. Now black thorns thread his armour and the same commands hold prisoners inside his redoubt. Edrin saw the stranger bind him and has been kept alive for the names of other loyalists. Fight through the retinue, free the archivist, and end the order Aldren cannot stop giving.',after:'At the end, Aldren asks whether the wagons got through. You tell him the road is open. Edrin can stand only with your help, but insists that the prisoners’ names come home with them. He did not see Alaric die. He saw the Wanderer bind a knight in Vaelor’s service. That testimony, and the people brought home to Emberfall, are what you have won.'},
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
 const anchors=[d.paths[0][3],d.paths[0][5],d.paths[0][2]];
 for(let i=0;i<3;i++){
  if(c.actOneKills?.[quest.id]?.includes(i))continue;
  const a=anchors[i];if(!a)continue;
  for(let j=0;j<3;j++){const at={x:a.x+(j-1)*1.1,y:a.y+(j%2)*1.2};if(!isWalkable(d,at.x,at.y,.23))continue;
   const e=makeEnemy(5000+chapter*100+i*3+j,at.x,at.y,j===1&&chapter>0?'wraith':'skeleton',1+chapter*2,j===1);
   Object.assign(e,{name:j===1?quest.leaders[i]:chapter===2?'Thornbound Retainer':chapter===1?'Levy Butcher':'Dead Kingsroad Guard',faction:1,role:j===1&&chapter>0?'hexer':'guard',speed:2+chapter*.12,level:1+chapter*4});
   if(j===1){e.questId=quest.id;e.questMark=i;e.miniBoss=true;e.questDirection=['East','North','South'][i];e.hp=e.maxHp=110+chapter*130;e.damage=16+chapter*5;}d.enemies.push(e);
  }
 }
 d.questEncounters=quest.id;return d;
}
export function recordActOneKill(p,e){
 if(!p.campaign||!e.questId)return null;ensureQuestFlow(p);const quest=ACT_ONE_QUESTS.find(q=>q.id===e.questId);if(!quest)return null;
 p.campaign.actOneKills??={};const marks=p.campaign.actOneKills[e.questId]??=[];if(marks.includes(e.questMark))return null;marks.push(e.questMark);
 const required=quest.required||3;if(marks.length<required)return {message:`${quest.title} · ${marks.length} / ${required} ${quest.id==='last-herd'?'pasture attackers':'leaders'} defeated`,xp:0};
 if(quest.id==='last-herd'){p.quests.herdRewarded=true;p.quests.herdKills=Array.from({length:6},(_,i)=>'herd-'+i);}
 const key=`field-1-${quest.chapter}`;if(p.campaign.records.includes(key))return null;p.campaign.records.push(key);
 const current=currentActOneQuest(p);return {message:current?.id===quest.id?`${quest.title} · Return to ${questGiver(quest).name} in Emberfall for your reward.`:`${quest.title} objectives cleared · Report when this quest is assigned.`,xp:0};
}
export const QUEST_GIVERS=[{id:'guide',name:'Sister Maelin'},{id:'guide',name:'Sister Maelin'},{id:'merchant',name:'Orrin'},{id:'merchant',name:'Orrin'},{id:'smith',name:'Garran'},{id:'smith',name:'Garran'}];
export const questGiver=q=>QUEST_GIVERS[ACT_ONE_QUESTS.findIndex(entry=>entry.id===(q?.id||q))]||QUEST_GIVERS[0];
export function combatQuestDone(p,q){return !!p.campaign&&(q.boss?(p.campaign.defeated||[]).includes(q.boss):(p.campaign.records||[]).includes(`field-1-${q.chapter}`));}
export function ensureQuestFlow(p){
 const c=p.campaign;if(!c)return null;
 if(!c.questFlow||typeof c.questFlow!=='object'||Array.isArray(c.questFlow)){
  // Old releases paid field rewards immediately. Preserve those completed quests.
  c.questFlow={version:1,claimed:ACT_ONE_QUESTS.filter(q=>combatQuestDone(p,q)).map(q=>q.id),accepted:null};
 }
 const f=c.questFlow;f.claimed=[...new Set((Array.isArray(f.claimed)?f.claimed:[]).filter(id=>ACT_ONE_QUESTS.some(q=>q.id===id)))];
 const next=ACT_ONE_QUESTS.find(q=>!f.claimed.includes(q.id));if(f.accepted!==next?.id)f.accepted=null;return f;
}
export function currentActOneQuest(p){const f=ensureQuestFlow(p);return f?ACT_ONE_QUESTS.find(q=>!f.claimed.includes(q.id))||null:null;}
export function acceptActOneQuest(p,id){const q=currentActOneQuest(p),f=ensureQuestFlow(p);if(!q||q.id!==id||f.accepted===id)return false;f.accepted=id;return true;}
export function claimActOneQuest(p,id){
 const q=currentActOneQuest(p),f=ensureQuestFlow(p);if(!q||q.id!==id||f.accepted!==id||!combatQuestDone(p,q))return null;
 f.claimed.push(id);f.accepted=null;const index=ACT_ONE_QUESTS.indexOf(q),gold=[65,110,110,180,155,260][index],xp=[150,220,250,360,350,500][index];p.gold+=gold;const levels=grantExperience(p,xp);return {gold,xp,levels,quest:q};
}
export function questDirections(p,q){
 if(!q.leaders)return '';
 const marks=p.campaign.actOneKills?.[q.id]||[];return q.leaders.map((name,i)=>`${marks.includes(i)?'Slain':'Hunt'}: ${name} — ${['east, beside the crossroads','north, on the upper road','south, near the approach'][i]}`).join('\n');
}
export function actOneQuests(p){
 const f=ensureQuestFlow(p),current=currentActOneQuest(p);if(!f)return [];
 return ACT_ONE_QUESTS.map(q=>{const done=f.claimed.includes(q.id),accepted=f.accepted===q.id,ready=accepted&&combatQuestDone(p,q),giver=questGiver(q),count=p.campaign.actOneKills?.[q.id]?.length||0;
 const task=q.id==='last-herd'?`Protect Elin’s sheep · ${count} / 6 risen soldiers defeated. Follow the southern pasture lane.`:q.boss?`Defeat ${q.chapter===0?'Captain Hadrin':q.chapter===1?'Reeve Oswen':'Sir Aldren'} in ${q.area}.`:`Defeat the three commanders in ${q.area} · ${count} / 3.\n${questDirections(p,q)}`;
 return {...q,done,ready,accepted,giver,status:done?'complete':current?.id!==q.id?'locked':ready?'ready':accepted?'active':'offered',objective:ready?`Return to ${giver.name} in Emberfall to receive your reward.`:accepted?task:`Speak to ${giver.name} in Emberfall about ${q.title}.`,aftermath:done?q.after:''};});
}
export function actOneObjective(p){const q=actOneQuests(p).find(q=>!q.done&&q.status!=='locked');return q?.objective||'All six quests rewarded · Speak to Edrin in Emberfall.';}

export function questGiverCue(p){
 if(!p.campaign)return !p.quests.guideMet||p.quests.wardenDefeated&&!p.quests.guideRewarded?{npc:'guide',mark:'!'}:null;
 const q=currentActOneQuest(p);if(!q)return null;const accepted=p.campaign.questFlow.accepted===q.id;
 return !accepted||combatQuestDone(p,q)?{npc:questGiver(q).id,mark:accepted?'?':'!',quest:q.id}:null;
}
