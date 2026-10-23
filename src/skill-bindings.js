import {getSkill,rankOf} from './game.js';

export function boundSkill(player,target){
  return target==='primary'?player.primarySkill:target==='mouse'?player.mouseSkill:player.slots[Number(target)];
}
export function assignSkill(player,target,id){
  const mouse=target==='primary'||target==='mouse';
  if(!mouse&&!/^[0-3]$/.test(String(target)))return false;
  if(!id&&mouse)return false;
  if(id==='basic'&&!mouse)return false;
  if(id&&id!=='basic'&&(!getSkill(id)?.active||!rankOf(player,id)))return false;
  if(mouse)player[target==='primary'?'primarySkill':'mouseSkill']=id;
  else player.slots[Number(target)]=id||null;
  return true;
}
export function primaryRange(player,stats){
  if(!player.primarySkill||player.primarySkill==='basic')return Math.max(.5,stats.reach-.3);
  return ['cleave','rend','whirl','quake','nova','procession'].includes(player.primarySkill)?2.3:7;
}
