import {animationState,poseFrame,layerOrder,weaponMode} from './player-animation.js';
import {weaponPlacement,WEAPON_GRIPS} from './weapon-rig.js';
import weaponBounds from './art/weapon-bounds.json';
import {WEAPON_ART} from './assets.js';
import {SET_MODELS_ART,GUARD_ART,ITEM_ART,ORIGINAL_ART} from './assets.js';
import {appearanceOf} from './itemization.js';
import {facingPose,walkingLeg,WALK_FRAMES} from './locomotion.js';
import {joint,point,fitGrips} from './animation-rig.js';
const FACE={
 front:{head:[.46,0,.25,.235],hand:[.30,.535],offHand:[.80,.55],shield:[.805,.50],arm:[.38,.28],offArm:[.70,.28],elbow:[.32,.405],offElbow:[.77,.41],body:[[.39,.22],[.66,.22],[.75,.34],[.69,.54],[.72,.67],[.63,.72],[.53,.65],[.36,.72],[.32,.62],[.36,.45]],arms:[[[.36,.24],[.46,.28],[.42,.41],[.30,.44],[.27,.39],[.30,.30]],[[.66,.24],[.75,.26],[.82,.40],[.73,.45],[.68,.38]]],forearms:[[[.30,.38],[.42,.40],[.37,.50],[.34,.56],[.27,.57],[.26,.50]],[[.73,.38],[.82,.38],[.87,.54],[.83,.59],[.76,.56],[.72,.48]]],legs:[{hip:[.52,.60],knee:[.535,.79],ankle:[.52,.945],thigh:[[.43,.59],[.61,.60],[.63,.81],[.44,.83]],shin:[[.44,.77],[.63,.77],[.64,.94],[.43,.96]],foot:[[.43,.92],[.64,.92],[.64,.97],[.52,.999],[.42,.97]]},{hip:[.67,.60],knee:[.70,.76],ankle:[.73,.91],thigh:[[.60,.59],[.75,.59],[.79,.79],[.62,.80]],shin:[[.62,.75],[.79,.75],[.81,.91],[.64,.93]],foot:[[.64,.89],[.81,.88],[.82,.93],[.74,.97],[.64,.94]]}]},
 back:{head:[.45,0,.25,.23],hand:[.80,.54],offHand:[.29,.54],shield:[.33,.47],arm:[.70,.28],offArm:[.37,.28],elbow:[.76,.40],offElbow:[.30,.40],body:[[.38,.22],[.66,.21],[.72,.31],[.72,.51],[.79,.72],[.65,.78],[.50,.73],[.34,.67],[.35,.46]],arms:[[[.68,.25],[.76,.28],[.82,.40],[.72,.44],[.66,.34]],[[.37,.25],[.30,.28],[.23,.40],[.32,.44],[.40,.34]]],forearms:[[[.72,.38],[.82,.38],[.86,.52],[.85,.57],[.77,.58],[.72,.47]],[[.23,.38],[.33,.38],[.35,.49],[.32,.57],[.25,.57],[.22,.48]]],legs:[{hip:[.52,.68],knee:[.52,.83],ankle:[.51,.96],thigh:[[.40,.67],[.60,.68],[.62,.86],[.42,.86]],shin:[[.42,.81],[.62,.81],[.62,.96],[.42,.98]],foot:[[.42,.93],[.62,.93],[.63,.98],[.51,.999],[.41,.98]]},{hip:[.68,.67],knee:[.71,.82],ankle:[.74,.95],thigh:[[.61,.66],[.77,.66],[.81,.85],[.60,.86]],shin:[[.61,.80],[.81,.80],[.83,.95],[.64,.98]],foot:[[.64,.93],[.82,.92],[.84,.97],[.75,.999],[.63,.97]]}]}
};
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
  const pose=poseFrame(face,look,state,heading),armed=look.weapon!=='none',posed=[];
  if(look.twoHanded&&pose.gripDistance!==null){const roots=[point(face.arm),point(face.offArm)],elbows=[point(face.elbow),point(face.offElbow)],hands=[point(face.hand),point(face.offHand)],lengths=roots.map((r,i)=>Math.hypot(r.x-elbows[i].x,r.y-elbows[i].y)+Math.hypot(hands[i].x-elbows[i].x,hands[i].y-elbows[i].y));Object.assign(pose,fitGrips(roots,lengths,pose.primary,{x:Math.cos(pose.angle)*pose.gripDistance,y:Math.sin(pose.angle)*pose.gripDistance}));}
  for(let arm=0;arm<2;arm++){
   const shoulder=point(arm?face.offArm:face.arm),elbow=point(arm?face.offElbow:face.elbow),hand=point(arm?face.offHand:face.hand);
   let goal=arm?pose.support:pose.primary;

   posed.push(joint(shoulder,goal,Math.hypot(elbow.x-shoulder.x,elbow.y-shoulder.y),Math.hypot(hand.x-elbow.x,hand.y-elbow.y),arm?(back?1:-1):(back?-1:1)));
  }
  const armLayer=arm=>{this.skin=look.setParts.armor;const shoulder=point(arm?face.offArm:face.arm),elbow=point(arm?face.offElbow:face.elbow),hand=point(arm?face.offHand:face.hand),chain=posed[arm];
   // Each arm has its own source masks. Reusing and flipping the sword arm
   // previously cut away the shield arm and detached its glove.
   this.skin=null;this.bone(c,2+offset,face.arms[arm],shoulder,elbow,shoulder,chain.knee);this.bone(c,2+offset,face.forearms[arm],elbow,hand,chain.knee,chain.end);this.skin=look.setParts.armor;
   this.bone(c,body+offset,face.arms[arm],shoulder,elbow,shoulder,chain.knee);
   this.bone(c,body+offset,face.forearms[arm],elbow,hand,chain.knee,chain.end);
  };
  const handLayer=arm=>{const source=point(arm?face.offHand:face.hand),target=posed[arm].end;this.skin=look.setParts.gloves;c.save();c.translate(target.x-source.x,target.y-source.y);this.hand(c,look.gloves,back,arm,face,armed&&(arm===0||look.twoHanded)||state.action==='punch'&&arm===0);c.restore();};
  const layers={
   legs:()=>{const index=(look.boots==='steel'?0:look.boots==='leather'?4:2)+offset;this.skin=look.setParts.boots;
    const phase=state.action==='walk'?state.frame/WALK_FRAMES*Math.PI*2:0;
    const legs=face.legs.map((part,leg)=>({part,leg,step:state.action==='walk'?walkingLeg(phase,leg,face):null})).sort((a,b)=>(a.step?.heel.y??a.part.ankle[1]*S)-(b.step?.heel.y??b.part.ankle[1]*S));
    for(const {part,leg,step}of legs){c.save();if(step)c.translate(step.x,step.y);this.skin=look.setParts.armor;this.clipTile(c,body+offset,part.thigh);this.skin=look.setParts.boots;this.clipTile(c,index,part.shin);c.restore();c.save();if(step){const boot=face.legs[1];c.translate(step.heel.x,step.heel.y);c.scale(leg===0?-1:1,1);c.translate(-boot.ankle[0]*S,-boot.ankle[1]*S);this.clipTile(c,index,boot.foot);}else this.clipTile(c,index,part.foot);c.restore();}
   },
   torso:()=>{this.skin=null;this.clipTile(c,2+offset,face.body);this.skin=look.setParts.armor;this.clipTile(c,body+offset,face.body,look.shield==='none'?null:face.shield);},
   head:()=>{this.skin=look.setParts.helm;const head=look.helm==='none'?2:look.helm==='hood'?14:look.helm==='greathelm'?12:0,[x,y,w,h]=face.head;c.save();c.beginPath();c.rect(x*S,y*S,w*S,h*S);c.clip();this.tile(c,head+offset);c.restore();},
   accessories:()=>this.accessories(c,look,back),
   primaryArm:()=>armLayer(0),offArm:()=>armLayer(1),primaryHand:()=>handLayer(0),offHand:()=>handLayer(1),
   weapon:()=>{if(!armed)return;this.skin=null;const hand=posed[pose.weaponHand==='off'?1:0].end;this.weapon(c,look.weapon,back,[hand.x/S,hand.y/S],look.weaponIcon,pose.angle);},
   shield:()=>{if(look.shield==='none'||look.twoHanded)return;this.skin=look.setParts.shield;c.save();const source=point(face.offHand),target=posed[1].end;c.translate(target.x-source.x,target.y-source.y);this.shield(c,look.shield,back,face.shield);c.restore();},
  };
  for(const name of layerOrder(direction,state.mode))layers[name]();
  if(look.surcoat==='iron'){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='#8d99951a';c.fillRect(0,0,S,S);c.restore();}
  this.skin=null;this.cache.set(key,canvas);while(this.cache.size*W*H*4>32*1024*1024)this.cache.delete(this.cache.keys().next().value);return canvas;
 }
 bone(c,index,mask,fromA,fromB,toA,toB,width=1){const source=Math.atan2(fromB.y-fromA.y,fromB.x-fromA.x),target=Math.atan2(toB.y-toA.y,toB.x-toA.x),length=Math.hypot(toB.x-toA.x,toB.y-toA.y)/Math.hypot(fromB.x-fromA.x,fromB.y-fromA.y);c.save();c.translate(toA.x,toA.y);c.rotate(target);c.scale(length,width);c.rotate(-source);c.translate(-fromA.x,-fromA.y);this.clipTile(c,index,mask);c.restore();}
 hand(c,gloves,back,arm,face,closed=false){
  const h=arm===0?face.hand:face.offHand,x=h[0],y=h[1],source=gloves==='none'?(back?[.84,.56]:[.28,.56]):back?[.80,.54]:[.323,.51],sx=source[0],sy=source[1],mask=[[sx-.035,sy-.045],[sx+.03,sy-.04],[sx+.033,sy+.035],[sx+.015,sy+.055],[sx-.03,sy+.042]];
  c.save();c.translate(x*S,y*S);if(arm===1)c.scale(-1,1);c.translate(-sx*S,-sy*S);this.clipTile(c,(gloves==='steel'?0:gloves==='leather'?4:2)+(back?1:0),mask);c.restore();
  if(closed){c.save();c.translate(x*S,y*S);this.fist(c,gloves);c.restore();}
  if(gloves!=='none'){const px=x*S,py=y*S;c.save();c.strokeStyle=gloves==='steel'?'#b4ac9688':'#8b684888';c.lineWidth=1.3;c.beginPath();c.moveTo(px-9,py-10);c.lineTo(px+8,py-8);if(gloves==='steel')for(let i=0;i<3;i++){c.moveTo(px-5+i*4,py);c.lineTo(px-6+i*4,py+6);}c.stroke();c.restore();}
 }
 fist(c,gloves){const skin=gloves==='none',metal=gloves==='steel';const shade=c.createLinearGradient(-8,-9,10,8);shade.addColorStop(0,skin?'#a78767':metal?'#858577':'#705237');shade.addColorStop(.5,skin?'#87674d':metal?'#595d54':'#503b28');shade.addColorStop(1,skin?'#503a2b':metal?'#30372f':'#31291e');c.fillStyle=shade;c.strokeStyle=skin?'#503a2b':'#25231c';c.lineWidth=1.4;c.beginPath();c.moveTo(-9,-9);c.lineTo(5,-12);c.lineTo(12,-6);c.lineTo(14,4);c.lineTo(8,10);c.lineTo(-7,8);c.lineTo(-11,2);c.closePath();c.fill();c.stroke();c.strokeStyle=skin?'#bd967077':metal?'#bbb29a99':'#9e7b4b88';for(let i=0;i<3;i++){c.beginPath();c.moveTo(i*5-5,-5);c.lineTo(i*5-3,3);c.stroke();}}
 weapon(c,look,back,hand,weaponIcon=0,angle=back?1:2.12){
  if(!this.weapons.complete||!this.weapons.naturalWidth)return;
  const b=weaponBounds[weaponIcon]||weaponBounds[0],h=(WEAPON_GRIPS[weaponIcon]||WEAPON_GRIPS[0])[4],w=h*b[2]/b[3],place=weaponPlacement(weaponIcon,w,h,angle);
  c.save();c.translate(hand[0]*S,hand[1]*S);c.rotate(place.rotation);c.drawImage(this.weapons,...b,place.x,place.y,w,h);c.restore();
 }

 shield(c,look,back,center){const x=center[0]*S,y=center[1]*S;c.save();c.beginPath();if(look==='kite'){c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();}else c.ellipse(x,y,49,71,back?-.12:.12,0,Math.PI*2);c.clip();if(look==='kite'){c.fillStyle='#3d3023';c.fillRect(x-55,y-80,110,165);}this.tile(c,back?1:0);c.restore();if(look==='kite'){c.strokeStyle='#8c7855';c.lineWidth=2;c.beginPath();c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();c.stroke();}}
 accessories(c,look,back){if(back)return;const gold=look.beltRarity==='legendary'?'#c1a45e':'#9c8051';if(look.belt!=='none'){c.fillStyle='#34291d';c.fillRect(151,164,59,8);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(171,161,14,12);}if(look.charm!=='none'){c.strokeStyle='#a78c5a';c.lineWidth=1.5;c.beginPath();c.moveTo(171,83);c.lineTo(188,115);c.lineTo(208,89);c.stroke();c.fillStyle='#b2924f';c.beginPath();c.ellipse(188,116,5,7,0,0,Math.PI*2);c.fill();}if(look.ring!=='none'){c.fillStyle='#bb9f55';c.fillRect(99,159,6,3);}if(look.ring2!=='none'){c.fillStyle='#c1a565';c.fillRect(251,174,6,3);}if(look.armorRarity==='legendary'){c.fillStyle='#bd914b';c.fillRect(177,113,4,23);c.fillRect(171,118,16,3);}}
 draw(c,game){
  const look=appearanceOf(game.player),state=animationState(game,look),vector=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove||{x:1,y:1},direction=facingPose(vector);
  const frame=this.frame(game.player,direction.back,state.action==='walk'?state.frame+1:state.action==='idle'?0:WALK_FRAMES+1+state.frame,direction.forward,direction,state);if(!frame)return null;
  c.save();if(game.dodgeTime>0)c.globalAlpha*=.7;c.drawImage(frame,-GUARD_FRAME.anchorX*.75,-GUARD_FRAME.anchorY*.75,W*.75,H*.75);c.restore();
  return {row:direction.index,directions:16,column:state.action==='walk'?state.frame+1:state.action==='idle'?0:WALK_FRAMES+1+state.frame,frame:state.frame,clip:state.mode,action:game.dodgeTime>0?'evade':state.action,style:'layered-guard',layers:layerOrder(direction,state.mode),cacheBytes:this.cache.size*W*H*4};
 }
}
