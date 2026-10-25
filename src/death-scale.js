import {enemyFamily} from './enemy-appearance.js';
import {DEATH_SPRITE_METRICS as metrics} from './death-sprite-metrics.js';

// All six anatomical collapse poses share one scale. Their cell has more empty
// space than the living atlas, so using the cell-size ratio alone enlarged the
// visible body at death (most noticeably the skeletal soldiers).
export function deathSpriteLayout(body){
 const family=enemyFamily(body),boss=body.type==='warden';
 if(!family&&!boss)return null;
 let scale,foot=0,row=family?.row||0;
 if(boss){
  const index=body.bossId==='king'?5:body.bossId==='wanderer'?6:Number(body.bossId?.split('-')[1])-1;
  const live=body.bossId?(metrics.campaign[index]||metrics.campaign[0]):metrics.warden;
  scale=144*live.height/metrics.boss;
  foot=144*Math.min(0,live.foot);
 }else{
  const side=body.visual?.back?'back':'front';
  scale=family.size/128*(body.elite?1.1:1)*metrics.live[side][row]/metrics.dead[row];
 }
 const size=160*scale;
 return {size,left:-size/2,top:foot-(boss?146:138)*scale,row,boss};
}
