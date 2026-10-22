import {GUARD_ART,FEMALE_GUARD_ART,ITEM_ART,ORIGINAL_ART} from './assets.js';
import {appearanceOf} from './itemization.js';
import {facingPose,walkingLeg,WALK_FRAMES} from './locomotion.js';
import {joint,point,punchPose} from './animation-rig.js';
const FACE={
 front:{head:[.46,0,.25,.235],hand:[.30,.535],offHand:[.80,.55],shield:[.805,.50],arm:[.38,.28],offArm:[.70,.28],elbow:[.32,.405],offElbow:[.77,.41],body:[[.39,.22],[.66,.22],[.75,.34],[.69,.54],[.72,.67],[.63,.72],[.53,.65],[.36,.72],[.32,.62],[.36,.45]],arms:[[[.36,.24],[.46,.28],[.42,.41],[.30,.44],[.27,.39],[.30,.30]],[[.66,.24],[.75,.26],[.82,.40],[.73,.45],[.68,.38]]],forearms:[[[.30,.38],[.42,.40],[.37,.50],[.34,.56],[.27,.57],[.26,.50]],[[.73,.38],[.82,.38],[.87,.54],[.83,.59],[.76,.56],[.72,.48]]],legs:[{hip:[.52,.60],knee:[.535,.79],ankle:[.52,.945],thigh:[[.43,.59],[.61,.60],[.63,.81],[.44,.83]],shin:[[.44,.77],[.63,.77],[.64,.94],[.43,.96]],foot:[[.43,.92],[.64,.92],[.64,.97],[.52,.999],[.42,.97]]},{hip:[.67,.60],knee:[.70,.76],ankle:[.73,.91],thigh:[[.60,.59],[.75,.59],[.79,.79],[.62,.80]],shin:[[.62,.75],[.79,.75],[.81,.91],[.64,.93]],foot:[[.64,.89],[.81,.88],[.82,.93],[.74,.97],[.64,.94]]}]},
 back:{head:[.45,0,.25,.23],hand:[.80,.54],offHand:[.29,.54],shield:[.33,.47],arm:[.70,.28],offArm:[.37,.28],elbow:[.76,.40],offElbow:[.30,.40],body:[[.38,.22],[.66,.21],[.72,.31],[.72,.51],[.79,.72],[.65,.78],[.50,.73],[.34,.67],[.35,.46]],arms:[[[.68,.25],[.76,.28],[.82,.40],[.72,.44],[.66,.34]],[[.37,.25],[.30,.28],[.23,.40],[.32,.44],[.40,.34]]],forearms:[[[.72,.38],[.82,.38],[.86,.52],[.85,.57],[.77,.58],[.72,.47]],[[.23,.38],[.33,.38],[.35,.49],[.32,.57],[.25,.57],[.22,.48]]],legs:[{hip:[.52,.68],knee:[.52,.83],ankle:[.51,.96],thigh:[[.40,.67],[.60,.68],[.62,.86],[.42,.86]],shin:[[.42,.81],[.62,.81],[.62,.96],[.42,.98]],foot:[[.42,.93],[.62,.93],[.63,.98],[.51,.999],[.41,.98]]},{hip:[.68,.67],knee:[.71,.82],ankle:[.74,.95],thigh:[[.61,.66],[.77,.66],[.81,.85],[.60,.86]],shin:[[.61,.80],[.81,.80],[.83,.95],[.64,.98]],foot:[[.64,.93],[.82,.92],[.84,.97],[.75,.999],[.63,.97]]}]}
};
const W=128,H=144,S=320;
const poly=(c,points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*S,y*S):c.moveTo(x*S,y*S));c.closePath();};
export class GuardSprites{
 constructor(){this.art=new Image();this.art.src=GUARD_ART;this.femaleArt=new Image();this.femaleArt.src=FEMALE_GUARD_ART;this.items=new Image();this.items.src=ITEM_ART;this.original=new Image();this.original.src=ORIGINAL_ART;this.cache=new Map();}
 get ready(){return [this.art,this.femaleArt,this.items,this.original].every(a=>a.complete&&a.naturalWidth>0);}
 tile(c,index){const art=this.painting||this.art,s=art.naturalWidth/4;c.drawImage(art,index%4*s,Math.floor(index/4)*s,s,s,0,0,S,S);}
 clipTile(c,index,points,exclude=null){c.save();poly(c,points);c.clip();if(exclude){c.beginPath();c.rect(0,0,S,S);c.ellipse(exclude[0]*S,exclude[1]*S,50,72,0,0,Math.PI*2);c.clip('evenodd');}this.tile(c,index);c.restore();}
 frame(p,back,column,heading={x:.9,y:back?-.4:.4},direction=null){const look=appearanceOf(p),key=JSON.stringify(look)+'/'+back+'/'+column+'/'+Math.round(heading.x*10)+'/'+Math.round(heading.y*10)+'/'+(direction?.index??'legacy');if(this.cache.has(key))return this.cache.get(key);if(!this.ready)return null;
  this.painting=p.sex==='female'?this.femaleArt:this.art;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');c.scale(W/S,128/S);c.translate(0,10);
  const face=back?FACE.back:FACE.front,offset=back?1:0,body=({none:2,original:0,leather:4,chain:6,plate:8,robe:10})[look.armor]??0,walking=column>0&&column<=WALK_FRAMES,attack=column>WALK_FRAMES,phase=walking?(column-1)/WALK_FRAMES*2*Math.PI:0,progress=attack?(column-WALK_FRAMES-1)/(look.weapon==='none'?5:3):0;
  // Preserve the idle leg paintings: a rigid vertical step, no joint posing.
  const index=look.boots==='steel'?offset:look.boots==='leather'?4+offset:2+offset;
  const poses=face.legs.map((part,leg)=>({part,leg,step:walking?walkingLeg(phase,leg,face):null}));
  poses.sort((a,b)=>(a.step?.heel.y??a.part.ankle[1]*S)-(b.step?.heel.y??b.part.ankle[1]*S));
  for(const {part,leg,step}of poses){
   c.save();if(step)c.translate(step.x,step.y);this.clipTile(c,index,part.thigh);this.clipTile(c,index,part.shin);c.restore();
   c.save();
   if(step){const boot=face.legs[1];c.translate(step.heel.x,step.heel.y);c.scale(leg===0?-1:1,1);c.translate(-boot.ankle[0]*S,-boot.ankle[1]*S);this.clipTile(c,index,boot.foot);}
   else this.clipTile(c,index,part.foot);
   c.restore();
  }
  const torsoX=(face.legs[0].hip[0]+face.legs[1].hip[0])*160;
  c.save();if(direction){c.translate(torsoX,0);c.transform(direction.profile,0,direction.turn,1,0,0);c.translate(-torsoX,0);}
  // The unarmoured underlayer is visible when equipment is removed.
  this.clipTile(c,2+offset,face.body);this.clipTile(c,body+offset,face.body,face.shield);
  if(look.armor==='plate'){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='#abb7bd13';poly(c,face.body);c.fill();c.restore();}
  // A planted attack uses the old hand-painted combat sheet for the original outfit.
  const nativeAttack=p.sex!=='female'&&attack&&look.armor==='original'&&look.helm==='sallet'&&look.weapon==='sword'&&look.shield==='round'&&look.boots==='steel'&&look.gloves==='steel';
  if(nativeAttack){c.clearRect(-10,-10,340,350);const s=this.original.naturalWidth/4;c.drawImage(this.original,(column-WALK_FRAMES-1)*s,(back?3:1)*s,s,s,0,0,S,S);this.accessories(c,look,back);c.restore();this.cache.set(key,canvas);return canvas;}
  for(let arm=1;arm>=0;arm--){
   const shoulder=point(arm===0?face.arm:face.offArm),elbow=point(arm===0?face.elbow:face.offElbow),hand=point(arm===0?face.hand:face.offHand),punch=attack&&look.weapon==='none',jab=punch?arm===0?punchPose(progress,back?-1:1):look.shield==='none'?{x:back?30:-30,y:-28}:{x:0,y:0}:null;
   const swing=attack&&arm===0?(-.7+progress*1.3)*(back?-1:1):0;
   let posedHand=hand;
   c.save();
   // The shield painting hides its arm. Reuse the exposed weapon-side arm
   // for the offhand, reflected and fitted to the shoulder/elbow/wrist chain.
   const sourceShoulder=point(face.arm),sourceElbow=point(face.elbow),sourceHand=point(face.hand),width=arm===1?-1:1;
   if(jab){const goal={x:hand.x+jab.x,y:hand.y+jab.y},pose=joint(shoulder,goal,Math.hypot(elbow.x-shoulder.x,elbow.y-shoulder.y),Math.hypot(hand.x-elbow.x,hand.y-elbow.y),arm===0?(back?-1:1):(back?1:-1));posedHand=pose.end;this.bone(c,body+offset,face.arms[0],sourceShoulder,sourceElbow,shoulder,pose.knee,width);this.bone(c,body+offset,face.forearms[0],sourceElbow,sourceHand,pose.knee,pose.end,width);c.translate(posedHand.x-hand.x,posedHand.y-hand.y);}
   else{c.translate(shoulder.x,shoulder.y);c.rotate(swing);c.translate(-shoulder.x,-shoulder.y);if(arm===1){this.bone(c,body+offset,face.arms[0],sourceShoulder,sourceElbow,shoulder,elbow,-1);this.bone(c,body+offset,face.forearms[0],sourceElbow,sourceHand,elbow,hand,-1);}else{this.clipTile(c,body+offset,face.arms[0]);this.clipTile(c,body+offset,face.forearms[0]);}}
   this.hand(c,look.gloves,back,arm,face,punch&&(arm===0||look.shield==='none'));
   if(arm===0&&look.weapon!=='none')this.weapon(c,look.weapon,back,face.hand);
   // Equipment follows its hand. The offhand glove is correctly behind a shield.
   if(arm===1&&look.shield!=='none')this.shield(c,look.shield,back,face.shield);
   c.restore();
  }
  const head=look.helm==='none'?2:look.helm==='hood'?14:look.helm==='greathelm'?12:0,[hx,hy,hw,hh]=face.head;c.save();c.beginPath();c.rect(hx*S,hy*S,hw*S,hh*S);c.clip();this.tile(c,head+offset);c.restore();
  this.accessories(c,look,back);if(look.surcoat==='iron'){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='#8d99951a';c.fillRect(0,0,S,S);c.restore();}
  c.restore();this.cache.set(key,canvas);if(this.cache.size>256)this.cache.delete(this.cache.keys().next().value);return canvas;
 }
 bone(c,index,mask,fromA,fromB,toA,toB,width=1){const source=Math.atan2(fromB.y-fromA.y,fromB.x-fromA.x),target=Math.atan2(toB.y-toA.y,toB.x-toA.x),length=Math.hypot(toB.x-toA.x,toB.y-toA.y)/Math.hypot(fromB.x-fromA.x,fromB.y-fromA.y);c.save();c.translate(toA.x,toA.y);c.rotate(target);c.scale(length,width);c.rotate(-source);c.translate(-fromA.x,-fromA.y);this.clipTile(c,index,mask);c.restore();}
 hand(c,gloves,back,arm,face,closed=false){
  const h=arm===0?face.hand:face.offHand,x=h[0],y=h[1],source=gloves==='none'?(back?[.84,.56]:[.28,.56]):back?[.80,.54]:[.323,.51],sx=source[0],sy=source[1],mask=[[sx-.035,sy-.045],[sx+.03,sy-.04],[sx+.033,sy+.035],[sx+.015,sy+.055],[sx-.03,sy+.042]];
  c.save();c.translate(x*S,y*S);if(arm===1)c.scale(-1,1);c.translate(-sx*S,-sy*S);this.clipTile(c,(gloves==='steel'?0:gloves==='leather'?4:2)+(back?1:0),mask);c.restore();
  if(closed){c.save();c.translate(x*S,y*S);this.fist(c,gloves);c.restore();}
  if(gloves!=='none'){const px=x*S,py=y*S;c.save();c.strokeStyle=gloves==='steel'?'#b4ac9688':'#8b684888';c.lineWidth=1.3;c.beginPath();c.moveTo(px-9,py-10);c.lineTo(px+8,py-8);if(gloves==='steel')for(let i=0;i<3;i++){c.moveTo(px-5+i*4,py);c.lineTo(px-6+i*4,py+6);}c.stroke();c.restore();}
 }
 fist(c,gloves){const skin=gloves==='none',metal=gloves==='steel';const shade=c.createLinearGradient(-8,-9,10,8);shade.addColorStop(0,skin?'#a78767':metal?'#858577':'#705237');shade.addColorStop(.5,skin?'#87674d':metal?'#595d54':'#503b28');shade.addColorStop(1,skin?'#503a2b':metal?'#30372f':'#31291e');c.fillStyle=shade;c.strokeStyle=skin?'#503a2b':'#25231c';c.lineWidth=1.4;c.beginPath();c.moveTo(-9,-9);c.lineTo(5,-12);c.lineTo(12,-6);c.lineTo(14,4);c.lineTo(8,10);c.lineTo(-7,8);c.lineTo(-11,2);c.closePath();c.fill();c.stroke();c.strokeStyle=skin?'#bd967077':metal?'#bbb29a99':'#9e7b4b88';for(let i=0;i<3;i++){c.beginPath();c.moveTo(i*5-5,-5);c.lineTo(i*5-3,3);c.stroke();}}
 weapon(c,look,back,hand){const x=hand[0]*S,y=hand[1]*S;
  if(look==='sword'){const points=back?[[.77,.47],[.86,.50],[.999,.88],[.96,.90],[.80,.61],[.76,.56]]:[[.29,.48],[.38,.51],[.20,.77],[.06,.91],[.09,.81],[.27,.56]];this.clipTile(c,back?1:0,points);return;}
  c.save();c.translate(x,y);c.rotate(back?2.65:-2.58);
  if(look==='spear'){c.strokeStyle='#282016';c.lineWidth=6;c.beginPath();c.moveTo(0,22);c.lineTo(0,-145);c.stroke();c.strokeStyle='#927452';c.lineWidth=2;c.stroke();c.fillStyle='#9a9c93';poly(c,[[0,-.53],[-.025,-.43],[0,-.38],[.025,-.43]]);c.fill();}
  else{const index=look==='mace'?15:5,s=this.items.naturalWidth/4;c.drawImage(this.items,index%4*s+3,Math.floor(index/4)*s+3,s-6,s-6,-42,-116,84,139);}c.restore();
 }
 shield(c,look,back,center){const x=center[0]*S,y=center[1]*S;c.save();c.beginPath();if(look==='kite'){c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();}else c.ellipse(x,y,49,71,back?-.12:.12,0,Math.PI*2);c.clip();if(look==='kite'){c.fillStyle='#3d3023';c.fillRect(x-55,y-80,110,165);}this.tile(c,back?1:0);c.restore();if(look==='kite'){c.strokeStyle='#8c7855';c.lineWidth=2;c.beginPath();c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();c.stroke();}}
 accessories(c,look,back){if(back)return;const gold=look.beltRarity==='legendary'?'#c1a45e':'#9c8051';if(look.belt!=='none'){c.fillStyle='#34291d';c.fillRect(151,164,59,8);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(171,161,14,12);}if(look.charm!=='none'){c.strokeStyle='#a78c5a';c.lineWidth=1.5;c.beginPath();c.moveTo(171,83);c.lineTo(188,115);c.lineTo(208,89);c.stroke();c.fillStyle='#b2924f';c.beginPath();c.ellipse(188,116,5,7,0,0,Math.PI*2);c.fill();}if(look.ring!=='none'){c.fillStyle='#bb9f55';c.fillRect(99,159,6,3);}if(look.ring2!=='none'){c.fillStyle='#c1a565';c.fillRect(251,174,6,3);}if(look.armorRarity==='legendary'){c.fillStyle='#bd914b';c.fillRect(177,113,4,23);c.fillRect(171,118,16,3);}}
 draw(c,game){
  const vector=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove,direction=facingPose(vector),back=direction.back,unarmed=!game.player.equipment.weapon,attack=game.attackAnim>0,mirror=unarmed&&!back?direction.screen.x>0:direction.mirror;
  const column=attack?WALK_FRAMES+1+Math.min(unarmed?5:3,Math.floor((1-game.attackAnim/(unarmed?.32:.4))*(unarmed?6:4))):game.moving?1+Math.floor(game.walkPhase)%WALK_FRAMES:0;
  // The base artwork's handedness is kept for gear. Mirroring is compensated
  // inside the directional pose so projected foot travel follows movement.
  const local={...direction,forward:{x:mirror?-direction.forward.x:direction.forward.x,y:direction.forward.y},turn:mirror?-direction.turn:direction.turn};
  const frame=this.frame(game.player,back,column,local.forward,attack?null:local);if(!frame)return null;c.save();if(mirror)c.scale(-1,1);if(game.dodgeTime>0)c.globalAlpha*=.7;c.drawImage(frame,-48,-98,96,108);c.restore();return {row:direction.index,directions:16,column,action:game.dodgeTime>0?'evade':attack&&unarmed?'punch':attack?'attack':game.moving?'walk':'idle',style:'painted-guard'};
 }
}
