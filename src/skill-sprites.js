import {SKILL_EFFECT_ART} from './assets.js';
import {SKILL_ANIMATIONS,SKILL_CELL,animationPose,animationBudget} from './skill-animation.js';

export class PaintedSkills{
 constructor(){this.sheets=Object.fromEntries(Object.entries(SKILL_EFFECT_ART).map(([key,src])=>{const image=new Image();image.src=src;return[key,image];}));this.used=0;this.painted={};this.limit=190;this.settings={};}
 get images(){return Object.values(this.sheets);}
 get ready(){return this.images.every(image=>image.complete&&image.naturalWidth>0);}
 beginFrame(settings={}){this.used=0;this.painted={};this.settings=settings;this.limit=animationBudget(settings);}
 draw(c,name,value,{x=0,y=0,width=80,height=width,alpha=1,priority=false,anchorY=null,loop=SKILL_ANIMATIONS[name]?.loop||false}={}){
  const spec=SKILL_ANIMATIONS[name];if(!spec||!this.ready)return false;
  if(this.used>=this.limit)return !priority;
  const pose=animationPose(value,{loop,reducedMotion:this.settings.reducedMotion}),ax=spec.anchor==='tip'?182/192:.5,ay=anchorY??(spec.anchor==='floor'?182/192:.5),originalAlpha=c.globalAlpha,opacity=originalAlpha*alpha;
  width=Math.max(1,Math.min(900,width));height=Math.max(1,Math.min(900,height));
  const paint=(frame,fade)=>{if(fade<.015||this.used>=this.limit)return;this.used++;this.painted[name]=(this.painted[name]||0)+1;c.globalAlpha=opacity*fade;c.drawImage(this.sheets[spec.sheet],frame*SKILL_CELL,spec.row*SKILL_CELL,SKILL_CELL,SKILL_CELL,x-width*ax,y-height*ay,width,height);};
  paint(pose.frame,1-pose.blend);paint(pose.next,pose.blend);c.globalAlpha=originalAlpha;return true;
 }
}
