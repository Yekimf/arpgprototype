import {ENEMY_FRONT_ART,ENEMY_BACK_ART} from './assets.js';
import {enemyFamily,enemyPose} from './enemy-appearance.js';
import {ENEMY_BASELINES} from './enemy-baselines.js';

export class EnemySprites{
 constructor(){this.front=new Image();this.front.src=ENEMY_FRONT_ART;this.back=new Image();this.back.src=ENEMY_BACK_ART;this.tracks=new WeakMap();this.cache=new Map();}
 get images(){return [this.front,this.back];}
 get ready(){return this.images.every(i=>i.complete&&i.naturalWidth>0);}
 draw(ctx,e,player,time){
  const family=enemyFamily(e);if(!family||!this.ready)return false;
  let state=this.tracks.get(e);if(!state){state={x:e.x,y:e.y,time,gait:0,facing:{x:1,y:0}};this.tracks.set(e,state);}
  const dx=e.x-state.x,dy=e.y-state.y,travel=Math.hypot(dx,dy),moving=travel>.0001&&travel<2&&time-state.time<.3;
  if(moving){state.facing={x:dx,y:dy};state.gait+=travel*4/1.3;}
  if(e.attackAnim>0||e.windup>0||e.rangedWindup)state.facing={x:player.x-e.x,y:player.y-e.y};
  const pose=enemyPose(e,state.facing,state.gait,moving);state.x=e.x;state.y=e.y;state.time=time;
  const side=pose.back?'back':'front',key=`${family.id}:${side}:${pose.frame}`,size=family.size*(e.elite?1.1:1);let tile=this.cache.get(key);
  if(!tile){tile=document.createElement('canvas');tile.width=tile.height=128;tile.getContext('2d').drawImage(pose.back?this.back:this.front,pose.frame*128,family.row*128,128,128,0,0,128,128);this.cache.set(key,tile);}
  const base=ENEMY_BASELINES[side][family.row][pose.frame];
  ctx.save();if(pose.flip)ctx.scale(-1,1);ctx.drawImage(tile,-size/2,-size+size*base,size,size);ctx.restore();
  e.visual={family:family.id,frame:pose.frame,back:pose.back,flip:pose.flip,action:pose.action};return true;
 }
}
