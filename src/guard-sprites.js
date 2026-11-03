import {animationState,poseFrame,layerOrder,weaponMode} from './player-animation.js';
import {weaponPlacement,weaponPointOffset,BOW_TIPS,weaponRenderHeight} from './weapon-rig.js';
import weaponBounds from './art/weapon-bounds.json';
import {WEAPON_ART} from './assets.js';
import {SET_MODELS_ART,FEMALE_SET_MODELS_ART,GUARD_ART,FEMALE_GUARD_ART,ITEM_ART,ORIGINAL_ART} from './assets.js';
import {appearanceOf} from './itemization.js';
import {facingPose,walkingLeg,WALK_FRAMES} from './locomotion.js';
import {solveEquipmentRig} from './equipment-rig.js';
import {paintLimb,paintHand} from './player-limbs.js';
import {paintGripPalm,paintGripFingers} from './weapon-grip-art.js';
import {GUARD_LAYOUT as FACE,FEMALE_GUARD_FACE} from './guard-layout.js';
const W=192,H=176,S=320,RASTER=2,CACHE_LIMIT=96*1024*1024;
export const GUARD_FRAME={width:W,height:H,anchorX:96,anchorY:148,scale:.75,rasterScale:RASTER};
const poly=(c,points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*S,y*S):c.moveTo(x*S,y*S));c.closePath();};
export class GuardSprites{
 constructor(){this.setArt=new Image();this.setArt.src=SET_MODELS_ART;this.femaleSetArt=new Image();this.femaleSetArt.src=FEMALE_SET_MODELS_ART;this.weapons=new Image();this.weapons.src=WEAPON_ART;this.art=new Image();this.art.src=GUARD_ART;this.femaleArt=new Image();this.femaleArt.src=FEMALE_GUARD_ART;this.items=new Image();this.items.src=ITEM_ART;this.original=new Image();this.original.src=ORIGINAL_ART;this.cache=new Map();}
 get ready(){return [this.setArt,this.femaleSetArt,this.weapons,this.art,this.femaleArt,this.items,this.original].every(a=>a.complete&&a.naturalWidth>0);}
 tile(c,index){if(Number.isInteger(this.skin)&&this.skin>=0){const i=this.skin*2+index%2,art=this.sex==='female'?this.femaleSetArt:this.setArt,s=art.naturalWidth/4;c.drawImage(art,i%4*s,Math.floor(i/4)*s,s,s,0,0,S,S);return;}const art=this.sex==='female'?this.femaleArt:this.art,s=art.naturalWidth/4;c.drawImage(art,index%4*s,Math.floor(index/4)*s,s,s,0,0,S,S);}
 clipTile(c,index,points,exclude=null){c.save();poly(c,points);c.clip();if(exclude){c.beginPath();c.rect(0,0,S,S);c.ellipse(exclude[0]*S,exclude[1]*S,50,72,0,0,Math.PI*2);c.clip('evenodd');}this.tile(c,index);c.restore();}
 frame(p,back,column,heading={x:.9,y:back?-.4:.4},direction=null,state=null){
  const look=appearanceOf(p);direction??=facingPose(back?{x:-1,y:-1}:{x:1,y:1});
  state??={action:column>WALK_FRAMES?look.weapon==='none'?'punch':'attack':column?'walk':'idle',frame:column>WALK_FRAMES?column-WALK_FRAMES-1:Math.max(0,column-1),count:look.weapon==='none'?6:8,mode:weaponMode(look)};
  const key=JSON.stringify(look)+'/'+direction.index+'/'+state.action+'/'+state.mode+'/'+state.frame+'/'+(Number.isInteger(state.locomotionFrame)?state.locomotionFrame:'-');
  if(this.cache.has(key)){const frame=this.cache.get(key);this.cache.delete(key);this.cache.set(key,frame);return frame;}if(!this.ready)return null;
  // Keep the logical frame and world size fixed, but rasterize source paintings
  // at twice their former resolution before the final canvas downsample.
  const canvas=document.createElement('canvas');canvas.width=W*RASTER;canvas.height=H*RASTER;const c=canvas.getContext('2d');c.translate(32*RASTER,20*RASTER);c.scale(.4*RASTER,.4*RASTER);
  // Every piece uses one projection. There is no final whole-character flip:
  // the right-hand weapon and left-hand shield retain their anatomical sides.
  const center=160;c.translate(center,0);c.scale(direction.profile,1);c.translate(-center,0);
  this.sex=look.sex;const face=look.sex==='female'?FEMALE_GUARD_FACE[back?'back':'front']:FACE[back?'back':'front'],offset=back?1:0,body=look.sex==='female'&&look.armor==='leather'?2:({none:2,original:0,leather:4,chain:6,plate:8,robe:10})[look.armor]??0;
  const pose=poseFrame(face,look,state,heading),armed=look.weapon!=='none',rig=solveEquipmentRig(face,look,pose,weaponBounds);
  const armLayer=(arm,part)=>{this.skin=look.setParts.armor;const hand=rig.hands[arm];paintLimb(c,this,{from:part==='upper'?hand.shoulder:hand.elbow,to:part==='upper'?hand.elbow:hand.wrist,part,look:look.armor,back,arm,gloves:part==='upper'?'none':look.gloves});};
  const handLayer=arm=>{this.skin=look.setParts.gloves;const hand=rig.hands[arm],held=hand.wrap?{...hand,grip:hand.wrap}:hand,options={hand:held,gloves:look.gloves,back,arm,closed:armed||state.action==='punch'};if(held.grip)paintGripFingers(c,this,options);else paintHand(c,this,options);};
  const palmLayer=arm=>{this.skin=look.setParts.gloves;const hand=rig.hands[arm],held=hand.wrap?{...hand,grip:hand.wrap}:hand;paintGripPalm(c,this,{hand:held,gloves:look.gloves,back});};
  const layers={
   legs:()=>{const index=(look.boots==='steel'?0:look.boots==='leather'&&look.sex!=='female'?4:2)+offset;this.skin=look.setParts.boots;
    const walking=state.action==='walk'||Number.isInteger(state.locomotionFrame),cycle=state.action==='walk'?state.frame:state.locomotionFrame,phase=walking?cycle/WALK_FRAMES*Math.PI*2:0;
    const legs=face.legs.map((part,leg)=>({part,leg,step:walking?walkingLeg(phase,leg,face):null})).sort((a,b)=>(a.step?.heel.y??a.part.ankle[1]*S)-(b.step?.heel.y??b.part.ankle[1]*S));
    for(const {part,leg,step}of legs){
     // The source boots sit almost together in the front painting. Spread the
     // stance from the hip down, retaining the painted thigh and boot shapes.
     const spread=(back?5:look.sex==='female'?16:20)*(leg===0?-1:1),hipY=part.hip[1]*S,ankleY=part.ankle[1]*S;
     c.save();if(step)c.translate(step.x,step.y);c.translate(0,hipY);c.transform(1,0,spread/(ankleY-hipY),1,0,0);c.translate(0,-hipY);
     this.skin=look.setParts.armor;this.clipTile(c,body+offset,part.thigh);this.skin=look.setParts.boots;this.clipTile(c,index,part.shin);c.restore();
     c.save();c.translate(spread,0);if(step){const boot=face.legs[1];c.translate(step.heel.x,step.heel.y);c.scale(leg===0?-1:1,1);c.translate(-boot.ankle[0]*S,-boot.ankle[1]*S);this.clipTile(c,index,boot.foot);}else this.clipTile(c,index,part.foot);c.restore();
    }
   },
   torso:()=>{const mask=look.sex==='female'?(back?FACE.femaleBack:FACE.femaleFront):(back&&rig.grip?face.bodyGrip:face.body);this.skin=null;this.clipTile(c,2+offset,mask);this.skin=look.setParts.armor;this.clipTile(c,body+offset,mask,look.sex==='female'&&body===2?null:face.shield);},
   head:()=>{this.skin=look.setParts.helm;const head=look.helm==='none'?2:look.helm==='hood'?14:look.helm==='greathelm'?12:0,[x,y,w,h]=face.head;c.save();c.beginPath();c.rect(x*S,y*S,w*S,h*S);c.clip();this.tile(c,head+offset);c.restore();},
   accessories:()=>this.accessories(c,look,back),
   primaryPalm:()=>palmLayer(0),offPalm:()=>palmLayer(1),primaryArm:()=>armLayer(0,'upper'),offArm:()=>armLayer(1,'upper'),primaryForearm:()=>armLayer(0,'lower'),offForearm:()=>armLayer(1,'lower'),primaryHand:()=>handLayer(0),offHand:()=>handLayer(1),
   weapon:()=>{if(!armed)return;this.skin=null;const hand=rig.weapon.anchor;this.weapon(c,look.weapon,back,[hand.x/S,hand.y/S],look.weaponIcon,pose.angle,state.action);if(rig.string){c.strokeStyle='#c2af8599';c.lineWidth=1.2;c.beginPath();c.moveTo(rig.string[0].x,rig.string[0].y);if(state.action==='attack')c.lineTo(rig.hands[0].center.x,rig.hands[0].center.y);c.lineTo(rig.string[1].x,rig.string[1].y);c.stroke();}},
   shield:()=>{if(look.shield==='none'||look.twoHanded)return;this.skin=look.setParts.shield;const center=rig.hands[1].center;this.shield(c,look.shield,back,[center.x/S,center.y/S]);},
  };
  for(const name of layerOrder(direction))layers[name]();
  if(look.surcoat==='iron'){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='#8d99951a';c.fillRect(0,0,S,S);c.restore();}
  canvas.composition=rig;this.skin=null;this.cache.set(key,canvas);while(this.cache.size*W*H*4*RASTER*RASTER>CACHE_LIMIT)this.cache.delete(this.cache.keys().next().value);return canvas;
 }
 weapon(c,look,back,hand,weaponIcon=0,angle=back?1:2.12,action='idle'){
  if(!this.weapons.complete||!this.weapons.naturalWidth)return;
  const b=weaponBounds[weaponIcon]||weaponBounds[0],h=weaponIcon===6&&action!=='attack'?72:weaponRenderHeight(weaponIcon,back),w=h*b[2]/b[3],place=weaponPlacement(weaponIcon,w,h,angle);
  c.save();c.translate(hand[0]*S,hand[1]*S);c.rotate(place.rotation);if(look==='bow'){if(!this.bow){this.bow=document.createElement('canvas');this.bow.width=b[2];this.bow.height=b[3];const bc=this.bow.getContext('2d');bc.drawImage(this.weapons,...b,0,0,b[2],b[3]);bc.globalCompositeOperation='destination-out';bc.lineWidth=3.5;bc.beginPath();bc.moveTo(BOW_TIPS[0][0]*b[2],BOW_TIPS[0][1]*b[3]);bc.lineTo(BOW_TIPS[1][0]*b[2],BOW_TIPS[1][1]*b[3]);bc.stroke();}c.drawImage(this.bow,place.x,place.y,w,h);}else if(weaponIcon===6&&action!=='attack'){
   // The painted flail is one atlas image. Keep its handle on the hand, but
   // suspend the original spiked head below the ring instead of rotating the
   // entire chain into a rigid pole when the character turns around.
   if(!this.flailHandle){this.flailHandle=document.createElement('canvas');this.flailHandle.width=b[2];this.flailHandle.height=b[3];const fc=this.flailHandle.getContext('2d');fc.drawImage(this.weapons,...b,0,0,b[2],b[3]);fc.globalCompositeOperation='destination-in';fc.fillStyle='#fff';fc.beginPath();fc.moveTo(0,b[3]);fc.lineTo(0,b[3]*.73);fc.lineTo(b[2]*.47,b[3]*.08);fc.lineTo(b[2]*.52,0);fc.lineTo(b[2]*.66,0);fc.lineTo(b[2]*.61,b[3]*.12);fc.lineTo(b[2]*.09,b[3]);fc.closePath();fc.fill();}
   c.drawImage(this.flailHandle,place.x,place.y,w,h);
  }else c.drawImage(this.weapons,...b,place.x,place.y,w,h);c.restore();
  if(weaponIcon===6&&action!=='attack'){
   const ring=weaponPointOffset(6,w,h,angle,[.56,.05]),x=hand[0]*S+ring.x,y=hand[1]*S+ring.y;
   // A short carried hilt keeps the chain close to the hip; its own length
   // reaches the shin without making the entire weapon a rigid diagonal.
   const length=110,ballW=w*.55,ballH=h*.54,ballX=x+(back?6:-6),ballY=y+length-3;
   // Reuse the painted links from the weapon itself. Reflect the chain for a
   // front view so it falls toward the spiked head on the outer side.
   c.save();c.translate(x,y);if(!back)c.scale(-1,1);
   c.drawImage(this.weapons,b[0]+b[2]*.54,b[1]+b[3]*.08,b[2]*.30,b[3]*.48,-4,0,20,length);
   c.restore();c.drawImage(this.weapons,b[0]+b[2]*.58,b[1]+b[3]*.54,b[2]*.42,b[3]*.43,ballX-ballW/2,ballY,ballW,ballH);
  }
 }

 shield(c,look,back,center){const source=back?FACE.back.shield:FACE.front.shield,x=source[0]*S,y=source[1]*S;c.save();c.translate(center[0]*S-x,center[1]*S-y);c.save();c.beginPath();if(look==='kite'){c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();}else c.ellipse(x,y,49,71,back?-.12:.12,0,Math.PI*2);c.clip();if(look==='kite'){c.fillStyle='#3d3023';c.fillRect(x-55,y-80,110,165);}this.tile(c,back?1:0);c.restore();if(look==='kite'){c.strokeStyle='#8c7855';c.lineWidth=2;c.beginPath();c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();c.stroke();}c.restore();}
 accessories(c,look,back){if(back)return;const gold=look.beltRarity==='legendary'?'#c1a45e':'#9c8051';if(look.belt!=='none'){c.fillStyle='#34291d';c.fillRect(151,164,59,8);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(171,161,14,12);}if(look.charm!=='none'){c.strokeStyle='#a78c5a';c.lineWidth=1.5;c.beginPath();c.moveTo(171,83);c.lineTo(188,115);c.lineTo(208,89);c.stroke();c.fillStyle='#b2924f';c.beginPath();c.ellipse(188,116,5,7,0,0,Math.PI*2);c.fill();}if(look.ring!=='none'){c.fillStyle='#bb9f55';c.fillRect(99,159,6,3);}if(look.ring2!=='none'){c.fillStyle='#c1a565';c.fillRect(251,174,6,3);}if(look.armorRarity==='legendary'){c.fillStyle='#bd914b';c.fillRect(177,113,4,23);c.fillRect(171,118,16,3);}}
 draw(c,game){
  const look=appearanceOf(game.player),state=animationState(game,look),vector=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove||{x:1,y:1},direction=facingPose(vector);
  const frame=this.frame(game.player,direction.back,state.action==='walk'?state.frame+1:state.action==='idle'?0:WALK_FRAMES+1+state.frame,direction.forward,direction,state);if(!frame)return null;
  c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(game.dodgeTime>0)c.globalAlpha*=.7;c.drawImage(frame,-GUARD_FRAME.anchorX*.75,-GUARD_FRAME.anchorY*.75,W*.75,H*.75);c.restore();
  return {row:direction.index,directions:16,column:state.action==='walk'?state.frame+1:state.action==='idle'?0:WALK_FRAMES+1+state.frame,frame:state.frame,clip:state.mode,action:game.dodgeTime>0?'evade':state.action,style:'layered-guard',layers:layerOrder(direction),cacheBytes:this.cache.size*W*H*4*RASTER*RASTER,...(Number.isInteger(state.locomotionFrame)?{locomotionFrame:state.locomotionFrame}:{})};
 }
}
