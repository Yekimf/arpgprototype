import {ENEMY_DEATH_ART,BOSS_DEATH_ART} from './assets.js';
import {deathSpriteLayout} from './death-scale.js';

export function deathFrame(age,duration,reducedMotion=false){return reducedMotion?5:Math.min(5,Math.max(0,Math.floor(age/Math.max(.01,duration)*6)));}
export class DeathSprites{
 constructor(){this.art=new Image();this.art.src=ENEMY_DEATH_ART;this.boss=new Image();this.boss.src=BOSS_DEATH_ART;}
 get images(){return [this.art,this.boss];}
 get ready(){return this.images.every(i=>i.complete&&i.naturalWidth>0);}
 draw(ctx,corpse,reducedMotion=false){
  const layout=deathSpriteLayout(corpse.body);if(!layout||!this.ready)return false;
  const frame=deathFrame(corpse.age,corpse.duration,reducedMotion),{size,left,top,row,boss}=layout;
  ctx.save();if(corpse.body.visual?.flip)ctx.scale(-1,1);
  ctx.drawImage(boss?this.boss:this.art,frame*160,boss?0:row*160,160,160,left,top,size,size);ctx.restore();return true;
 }
}
