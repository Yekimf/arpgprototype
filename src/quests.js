import {chapterFor} from './campaign-content.js';
import {fieldKey,captainId,actFor} from './campaign.js';
export function actQuests(player,act){
 const c=player.campaign;if(!c)return [];const found=ch=>c.records.includes(fieldKey(act,ch)),won=ch=>c.defeated.includes(captainId(act,ch));
 const entries=[{id:'oath',title:act===1?'An oath unbroken':actFor(act).title,art:0,done:act===1?player.quests.guideMet:c.visited.some(id=>id.startsWith(`act-${act}-`)),objective:act===1?'Speak to Sister Maelin in Emberfall. Accept her request and prepare for the Kingsroad.':`Reach ${chapterFor(act,0).wilds} and discover the province’s first waypoint.`,story:act===1?'You served Alaric before the betrayal. Emberfall’s survivors need a guard, and Maelin has news of the missing archivist.':actFor(act).quote},
 {id:'orders',title:chapterFor(act,0).task,art:1,done:found(0),objective:chapterFor(act,0).task+' in '+chapterFor(act,0).wilds+'.',story:found(0)?chapterFor(act,0).account:'Search beyond the camp and read the field account. It will open the way into the first garrison.'},
 ...Array.from({length:4},(_,ch)=>{const entry=chapterFor(act,ch);return {id:`garrison-${ch}`,title:ch===3?actFor(act).knight:entry.stronghold,art:ch+2,done:won(ch),objective:found(ch)?`Enter ${entry.stronghold} and defeat ${entry.captain||actFor(act).knight}.`:entry.task+' in '+entry.wilds+' before entering '+entry.stronghold+'.',story:found(ch)?entry.account:'Recover the field account to learn what happened here.',aftermath:won(ch)?entry.aftermath:'',chapter:ch};})];
 return entries.map((q,i)=>({...q,status:q.done?'complete':i===0||entries[i-1].done?'active':'locked'}));
}
