import {ACT_ONE_QUESTS,recordActOneKill,ensureQuestFlow} from '../act-one.js';
import {createCampaign,defeatCampaignBoss} from '../campaign.js';
// Only events in this hosted world feed the ledger. Joining never imports a
// character's old quest completions into everyone else's campaign.
export const createSharedQuests=()=>({version:1,kills:{},defeated:[]});
export function recordSharedQuest(progress,enemy){
 let changed=false;const q=ACT_ONE_QUESTS.find(q=>!q.boss&&q.id===enemy.questId);
 if(q&&Number.isInteger(enemy.questMark)&&enemy.questMark>=0&&enemy.questMark<(q.required||3)){
  const marks=progress.kills[q.id]??=[];if(!marks.includes(enemy.questMark)){marks.push(enemy.questMark);changed=true;}
 }
 if(ACT_ONE_QUESTS.some(q=>q.boss===enemy.bossId)&&enemy.bossId&&!progress.defeated.includes(enemy.bossId)){progress.defeated.push(enemy.bossId);changed=true;}
 return changed;
}
export function applySharedQuests(player,progress){
 if(progress?.version!==1)return false;
 player.campaign??=createCampaign();player.quests??={};ensureQuestFlow(player);
 let changed=false;
 for(const q of ACT_ONE_QUESTS){if(q.boss)continue;for(const mark of progress.kills?.[q.id]||[]){if(!Number.isInteger(mark)||mark<0||mark>=(q.required||3))continue;if(recordActOneKill(player,{questId:q.id,questMark:mark}))changed=true;}}
 for(const boss of progress.defeated||[]){if(!ACT_ONE_QUESTS.some(q=>q.boss===boss))continue;if(defeatCampaignBoss(player,boss))changed=true;}
 if(player.campaign.defeated.includes('knight-1'))for(const flag of ['scholarRescued','wardenDefeated'])if(!player.quests[flag]){player.quests[flag]=true;changed=true;}
 return changed;
}
