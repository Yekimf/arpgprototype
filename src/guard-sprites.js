import {animationState,poseFrame,layerOrder,weaponMode} from './player-animation.js';
import {weaponPlacement,WEAPON_GRIPS,BOW_TIPS} from './weapon-rig.js';
import weaponBounds from './art/weapon-bounds.json';
import {WEAPON_ART} from './assets.js';
import {SET_MODELS_ART,GUARD_ART,ITEM_ART,ORIGINAL_ART} from './assets.js';
import {appearanceOf} from './itemization.js';
import {facingPose,walkingLeg,WALK_FRAMES} from './locomotion.js';
import {solveEquipmentRig} from './equipment-rig.js';
import {paintLimb,paintHand} from './player-limbs.js';
import {GUARD_LAYOUT as FACE} from './guard-layout.js';
const W=192,H=176,S=320;
export const GUARD_FRAME={width:W,height:H,anchorX:96,anchorY:148,scale:.75};
const poly=(c,points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*S,y*S):c.moveTo(x*S,y*S));c.closePath();};
export class GuardSprites{
 constructor(){this.setArt=new Image();this.setArt.src=SET_MODELS_ART;this.weapons=new Image();this.weapons.src=WEAPON_ART;this.art=new Image();this.art.src=GUARD_ART;this.items=new Image();this.items.src=ITEM_ART;this.original=new Image();this.original.src=ORIGINAL_ART;this.cache=new Map();}
 get ready(){return [this.setArt,this.weapons,this.art,this.items,this.original].every(a=>a.complete&&a.naturalWidth>0);}
 tile(c,index){if(Number.isInteger(this.skin)&&this.skin>=0){const i=this.skin*2+index%2,s=this.setArt.naturalWidth/4;c.drawImage(this.setArt,i%4*s,Math.floor(i/4)*s,s,s,0,0,S,S);return;}const s=this.art.naturalWidth/4;c.drawImage(this.art,index%4*s,Math.floor(index/4)*s,s,s,0,0,S,S);}
 clipTile(c,index,points,exclude=null){c.save();poly(c,points);c.clip();if(exclude){c.beginPath();c.rect(0,0,S,S);c.ellipse(exclude[0]*S,exclude[1]*S,50,72,0,0,Math.PI*2);c.clip('evenodd');}this.tile(c,index);c.restore();}
 frame(p,back,column,heading={x:.9,y:back?-.4:.4},direction=null,state=null){
  const look=appearanceOf(p);direction??=facingPose(back?{x:-1,y:-1}:{x:1,y:1});
  state??={action:column>WALK_FRAMES?look.weapon==='none'?'punch':'attack':column?'walk':'idle',frame:column>WALK_FRAMES?column-WALK_FRAMES-1:Math.max(0,column-1),count:look.weapon==='none'?6:8,mode:weaponMode(look)};
  const key=JSON.stringify(look)+'/'+direction.index+'/'+state.action+'/'+state.mode+'/'+state.frame;
  if(this.cache.has(key)){const frame=this.cache.get(key);this.cache.delete(key);this.cache.set(key,frame);return frame;}if(!this.ready)return null;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');c.translate(32,20);c.scale(.4,.4);
  // Every piece uses one projection. There is no final whole-character flip:
  // the right-hand weapon and left-hand shield retain their anatomical sides.
  const center=160;c.translate(center,0);c.scale(direction.profile,1);c.translate(-center,0);
  const face=back?FACE.back:FACE.front,offset=back?1:0,body=({none:2,original:0,leather:4,chain:6,plate:8,robe:10})[look.armor]??0;
  const pose=poseFrame(face,look,state,heading),armed=look.weapon!=='none',rig=solveEquipmentRig(face,look,pose,weaponBounds);
  const armLayer=(arm,part)=>{this.skin=look.setParts.armor;const hand=rig.hands[arm];paintLimb(c,this,{from:part==='upper'?hand.shoulder:hand.elbow,to:part==='upper'?hand.elbow:hand.wrist,part,look:look.armor,back,gloves:part==='upper'?'none':look.gloves});};
  const handLayer=arm=>{this.skin=look.setParts.gloves;paintHand(c,this,{hand:rig.hands[arm],gloves:look.gloves,back,arm,closed:armed||state.action==='punch'});};
  const layers={
   legs:()=>{const index=(look.boots==='steel'?0:look.boots==='leather'?4:2)+offset;this.skin=look.setParts.boots;
    const phase=state.action==='walk'?state.frame/WALK_FRAMES*Math.PI*2:0;
    const legs=face.legs.map((part,leg)=>({part,leg,step:state.action==='walk'?walkingLeg(phase,leg,face):null})).sort((a,b)=>(a.step?.heel.y??a.part.ankle[1]*S)-(b.step?.heel.y??b.part.ankle[1]*S));
    for(const {part,leg,step}of legs){c.save();if(step)c.translate(step.x,step.y);this.skin=look.setParts.armor;this.clipTile(c,body+offset,part.thigh);this.skin=look.setParts.boots;this.clipTile(c,index,part.shin);c.restore();c.save();if(step){const boot=face.legs[1];c.translate(step.heel.x,step.heel.y);c.scale(leg===0?-1:1,1);c.translate(-boot.ankle[0]*S,-boot.ankle[1]*S);this.clipTile(c,index,boot.foot);}else this.clipTile(c,index,part.foot);c.restore();}
   },
   torso:()=>{this.skin=null;this.clipTile(c,2+offset,face.body);this.skin=look.setParts.armor;this.clipTile(c,body+offset,face.body,face.shield);},
   head:()=>{this.skin=look.setParts.helm;const head=look.helm==='none'?2:look.helm==='hood'?14:look.helm==='greathelm'?12:0,[x,y,w,h]=face.head;c.save();c.beginPath();c.rect(x*S,y*S,w*S,h*S);c.clip();this.tile(c,head+offset);c.restore();},
   accessories:()=>this.accessories(c,look,back),
   primaryArm:()=>armLayer(0,'upper'),offArm:()=>armLayer(1,'upper'),primaryForearm:()=>armLayer(0,'lower'),offForearm:()=>armLayer(1,'lower'),primaryHand:()=>handLayer(0),offHand:()=>handLayer(1),
   weapon:()=>{if(!armed)return;this.skin=null;const hand=rig.weapon.anchor;this.weapon(c,look.weapon,back,[hand.x/S,hand.y/S],look.weaponIcon,pose.angle);if(rig.string){c.strokeStyle='#c2af8599';c.lineWidth=1.2;c.beginPath();c.moveTo(rig.string[0].x,rig.string[0].y);c.lineTo(rig.hands[0].center.x,rig.hands[0].center.y);c.lineTo(rig.string[1].x,rig.string[1].y);c.stroke();}},
   shield:()=>{if(look.shield==='none'||look.twoHanded)return;this.skin=look.setParts.shield;const center=rig.hands[1].center;this.shield(c,look.shield,back,[center.x/S,center.y/S]);},
  };
  for(const name of layerOrder(direction,state.mode))layers[name]();
  if(look.surcoat==='iron'){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='#8d99951a';c.fillRect(0,0,S,S);c.restore();}
  canvas.composition=rig;this.skin=null;this.cache.set(key,canvas);while(this.cache.size*W*H*4>32*1024*1024)this.cache.delete(this.cache.keys().next().value);return canvas;
 }
 weapon(c,look,back,hand,weaponIcon=0,angle=back?1:2.12){
  if(!this.weapons.complete||!this.weapons.naturalWidth)return;
  const b=weaponBounds[weaponIcon]||weaponBounds[0],h=(WEAPON_GRIPS[weaponIcon]||WEAPON_GRIPS[0])[4],w=h*b[2]/b[3],place=weaponPlacement(weaponIcon,w,h,angle);
  c.save();c.translate(hand[0]*S,hand[1]*S);c.rotate(place.rotation);if(look==='bow'){if(!this.bow){this.bow=document.createElement('canvas');this.bow.width=b[2];this.bow.height=b[3];const bc=this.bow.getContext('2d');bc.drawImage(this.weapons,...b,0,0,b[2],b[3]);bc.globalCompositeOperation='destination-out';bc.lineWidth=3.5;bc.beginPath();bc.moveTo(BOW_TIPS[0][0]*b[2],BOW_TIPS[0][1]*b[3]);bc.lineTo(BOW_TIPS[1][0]*b[2],BOW_TIPS[1][1]*b[3]);bc.stroke();}c.drawImage(this.bow,place.x,place.y,w,h);}else c.drawImage(this.weapons,...b,place.x,place.y,w,h);c.restore();
 }

 shield(c,look,back,center){const source=back?FACE.back.shield:FACE.front.shield,x=source[0]*S,y=source[1]*S;c.save();c.translate(center[0]*S-x,center[1]*S-y);c.save();c.beginPath();if(look==='kite'){c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();}else c.ellipse(x,y,49,71,back?-.12:.12,0,Math.PI*2);c.clip();if(look==='kite'){c.fillStyle='#3d3023';c.fillRect(x-55,y-80,110,165);}this.tile(c,back?1:0);c.restore();if(look==='kite'){c.strokeStyle='#8c7855';c.lineWidth=2;c.beginPath();c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();c.stroke();}c.restore();}
 accessories(c,look,back){if(back)return;const gold=look.beltRarity==='legendary'?'#c1a45e':'#9c8051';if(look.belt!=='none'){c.fillStyle='#34291d';c.fillRect(151,164,59,8);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(171,161,14,12);}if(look.charm!=='none'){c.strokeStyle='#a78c5a';c.lineWidth=1.5;c.beginPath();c.moveTo(171,83);c.lineTo(188,115);c.lineTo(208,89);c.stroke();c.fillStyle='#b2924f';c.beginPath();c.ellipse(188,116,5,7,0,0,Math.PI*2);c.fill();}if(look.ring!=='none'){c.fillStyle='#bb9f55';c.fillRect(99,159,6,3);}if(look.ring2!=='none'){c.fillStyle='#c1a565';c.fillRect(251,174,6,3);}if(look.armorRarity==='legendary'){c.fillStyle='#bd914b';c.fillRect(177,113,4,23);c.fillRect(171,118,16,3);}}
 draw(c,game){
  const look=appearanceOf(game.player),state=animationState(game,look),vector=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove||{x:1,y:1},direction=facingPose(vector);
  const frame=this.frame(game.player,direction.back,state.action==='walk'?state.frame+1:state.action==='idle'?0:WALK_FRAMES+1+state.frame,direction.forward,direction,state);if(!frame)return null;
  c.save();if(game.dodgeTime>0)c.globalAlpha*=.7;c.drawImage(frame,-GUARD_FRAME.anchorX*.75,-GUARD_FRAME.anchorY*.75,W*.75,H*.75);c.restore();
  return {row:direction.index,directions:16,column:state.action==='walk'?state.frame+1:state.action==='idle'?0:WALK_FRAMES+1+state.frame,frame:state.frame,clip:state.mode,action:game.dodgeTime>0?'evade':state.action,style:'layered-guard',layers:layerOrder(direction,state.mode),cacheBytes:this.cache.size*W*H*4};
 }
}
