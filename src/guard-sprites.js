import {GUARD_ART,ITEM_ART,ORIGINAL_ART} from './assets.js';
import {appearanceOf} from './itemization.js';
import {ITEM_BOUNDS} from './item-bounds.js';
const FACE={
 front:{head:[.46,0,.25,.235],chest:[.56,.38],hand:[.323,.51],shield:[.805,.50],arm:[.38,.28],offArm:[.70,.28],body:[[.39,.22],[.66,.22],[.75,.34],[.69,.54],[.75,.72],[.64,.80],[.53,.69],[.36,.79],[.32,.65],[.36,.45]],arms:[[[.36,.24],[.46,.28],[.43,.39],[.37,.50],[.36,.54],[.29,.55],[.27,.48],[.30,.36]],[[.66,.24],[.75,.26],[.83,.43],[.76,.55],[.69,.49],[.65,.34]]],legs:[{hip:[.52,.60],poly:[[.43,.60],[.61,.61],[.64,.96],[.52,.995],[.43,.96],[.44,.83],[.44,.70]]},{hip:[.67,.60],poly:[[.60,.59],[.75,.59],[.81,.90],[.74,.96],[.64,.91],[.62,.77]]}]},
 back:{head:[.45,0,.25,.23],chest:[.55,.38],hand:[.80,.51],shield:[.33,.47],arm:[.70,.28],offArm:[.37,.28],body:[[.38,.22],[.66,.21],[.72,.31],[.72,.51],[.81,.73],[.65,.83],[.50,.77],[.34,.70],[.35,.46]],arms:[[[.68,.25],[.76,.28],[.85,.48],[.84,.56],[.77,.55],[.73,.44],[.66,.34]],[[.37,.25],[.30,.28],[.23,.46],[.28,.56],[.35,.48],[.40,.34]]],legs:[{hip:[.52,.69],poly:[[.40,.69],[.60,.70],[.62,.97],[.51,.995],[.42,.96],[.43,.84]]},{hip:[.68,.68],poly:[[.61,.68],[.77,.68],[.82,.95],[.75,.99],[.64,.96],[.60,.84]]}]}
};
const W=128,H=144,S=320;
const poly=(c,points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*S,y*S):c.moveTo(x*S,y*S));c.closePath();};
export class GuardSprites{
 constructor(){this.art=new Image();this.art.src=GUARD_ART;this.items=new Image();this.items.src=ITEM_ART;this.original=new Image();this.original.src=ORIGINAL_ART;this.cache=new Map();}
 get ready(){return [this.art,this.items,this.original].every(a=>a.complete&&a.naturalWidth>0);}
 tile(c,index){const s=this.art.naturalWidth/4;c.drawImage(this.art,index%4*s,Math.floor(index/4)*s,s,s,0,0,S,S);}
 clipTile(c,index,points,exclude=null){c.save();poly(c,points);c.clip();if(exclude){c.beginPath();c.rect(0,0,S,S);c.ellipse(exclude[0]*S,exclude[1]*S,50,72,0,0,Math.PI*2);c.clip('evenodd');}this.tile(c,index);c.restore();}
 frame(p,back,column){const look=appearanceOf(p),key=JSON.stringify(look)+'/'+back+'/'+column;if(this.cache.has(key))return this.cache.get(key);if(!this.ready)return null;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');c.scale(W/S,128/S);c.translate(0,10);
  const face=back?FACE.back:FACE.front,offset=back?1:0,body=({none:2,original:0,leather:4,chain:6,plate:8,robe:10})[look.armor]??0,walking=column>0&&column<9,attack=column>=9,phase=walking?(column-1)/8*2*Math.PI:0,progress=attack?(column-9)/3:0;
  // Rigid torso and short opposing strides retain the painted silhouette.
  for(let leg=1;leg>=0;leg--){const part=face.legs[leg],swing=walking?Math.sin(phase+leg*Math.PI):0;c.save();c.translate(part.hip[0]*S,part.hip[1]*S);c.translate(-part.hip[0]*S,-part.hip[1]*S);const length=(1-part.hip[1])*S,step=swing*(back?-1:1);c.transform(1,0,step*24/length,1+step*10/length,-part.hip[1]*S*step*24/length,-part.hip[1]*S*step*10/length);c.translate(0,Math.max(0,swing)*-3);this.clipTile(c,look.boots==='steel'?offset:look.boots==='leather'?4+offset:2+offset,part.poly);c.restore();}
  // The unarmoured underlayer is visible when equipment is removed.
  this.clipTile(c,2+offset,face.body);this.clipTile(c,body+offset,face.body,face.shield);
  if(look.armor==='plate'){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='#abb7bd13';poly(c,face.body);c.fill();c.restore();}
  // A planted attack uses the old hand-painted combat sheet for the original outfit.
  const nativeAttack=attack&&look.armor==='original'&&look.helm==='sallet'&&look.weapon==='sword'&&look.shield==='round'&&look.boots==='steel'&&look.gloves==='steel';
  if(nativeAttack){c.clearRect(-10,-10,340,350);const s=this.original.naturalWidth/4;c.drawImage(this.original,(column-9)*s,(back?3:1)*s,s,s,0,0,S,S);this.accessories(c,look,back);this.cache.set(key,canvas);return canvas;}
  for(let arm=1;arm>=0;arm--){const pivot=arm===0?face.arm:face.offArm,swing=attack&&arm===0?(-.85+progress*1.5)*(back?-1:1):walking?Math.sin(phase)*.025*(arm?-1:1):0;
   c.save();c.translate(pivot[0]*S,pivot[1]*S);if(attack&&look.weapon==='none'&&arm===0){const jab=Math.sin(Math.max(0,Math.min(1,progress))*Math.PI);c.translate((back?1:-1)*jab*37,-jab*9);c.rotate((back?1:-1)*jab*.12);}else c.rotate(swing);c.translate(-pivot[0]*S,-pivot[1]*S);this.clipTile(c,arm===1&&look.shield==='none'?2+offset:body+offset,face.arms[arm],arm===1?face.shield:null);
   if(arm===0&&look.weapon!=='none')this.weapon(c,look.weapon,back,face.hand);
   if(arm===1&&look.shield!=='none')this.shield(c,look.shield,back,face.shield);
   if(look.gloves==='steel'){const hand=arm===0?face.hand:[face.shield[0],face.shield[1]];c.save();c.translate(hand[0]*S,hand[1]*S);c.rotate(back?-.3:.3);c.fillStyle='#7f80757f';c.fillRect(-7,-8,12,13);c.strokeStyle='#b2a78a88';c.lineWidth=1;c.strokeRect(-7,-8,12,13);c.restore();}c.restore();
  }
  const head=look.helm==='none'?2:look.helm==='hood'?14:look.helm==='greathelm'?12:0,[hx,hy,hw,hh]=face.head;c.save();c.beginPath();c.rect(hx*S,hy*S,hw*S,hh*S);c.clip();this.tile(c,head+offset);c.restore();
  this.accessories(c,look,back);if(look.surcoat==='iron'){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='#8d99951a';c.fillRect(0,0,S,S);c.restore();}
  this.cache.set(key,canvas);if(this.cache.size>100)this.cache.delete(this.cache.keys().next().value);return canvas;
 }
 weapon(c,look,back,hand){const x=hand[0]*S,y=hand[1]*S;
  if(look==='sword'){const points=back?[[.77,.47],[.86,.50],[.999,.88],[.96,.90],[.80,.61],[.76,.56]]:[[.29,.48],[.38,.51],[.20,.77],[.06,.91],[.09,.81],[.27,.56]];this.clipTile(c,back?1:0,points);return;}
  c.save();c.translate(x,y);c.rotate(back?2.65:-2.58);
  if(look==='spear'){c.strokeStyle='#282016';c.lineWidth=6;c.beginPath();c.moveTo(0,22);c.lineTo(0,-145);c.stroke();c.strokeStyle='#927452';c.lineWidth=2;c.stroke();c.fillStyle='#9a9c93';poly(c,[[0,-.53],[-.025,-.43],[0,-.38],[.025,-.43]]);c.fill();}
  else{const index=look==='mace'?15:5,s=this.items.naturalWidth/4;c.drawImage(this.items,index%4*s+3,Math.floor(index/4)*s+3,s-6,s-6,-42,-116,84,139);}c.restore();
 }
 shield(c,look,back,center){const x=center[0]*S,y=center[1]*S;c.save();c.beginPath();if(look==='kite'){c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();}else c.ellipse(x,y,49,71,back?-.12:.12,0,Math.PI*2);c.clip();if(look==='kite'){c.fillStyle='#3d3023';c.fillRect(x-55,y-80,110,165);}this.tile(c,back?1:0);c.restore();if(look==='kite'){c.strokeStyle='#8c7855';c.lineWidth=2;c.beginPath();c.moveTo(x-39,y-62);c.lineTo(x+43,y-56);c.lineTo(x+38,y+25);c.lineTo(x,y+80);c.lineTo(x-38,y+27);c.closePath();c.stroke();}}
 accessories(c,look,back){if(back)return;const gold=look.beltRarity==='legendary'?'#c1a45e':'#9c8051';if(look.belt!=='none'){c.fillStyle='#34291d';c.fillRect(151,164,59,8);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(171,161,14,12);}if(look.charm!=='none'){c.strokeStyle='#a78c5a';c.lineWidth=1.5;c.beginPath();c.moveTo(171,83);c.lineTo(188,115);c.lineTo(208,89);c.stroke();c.fillStyle='#b2924f';c.beginPath();c.ellipse(188,116,5,7,0,0,Math.PI*2);c.fill();}if(look.ring!=='none'){c.fillStyle='#bb9f55';c.fillRect(99,159,6,3);}if(look.ring2!=='none'){c.fillStyle='#c1a565';c.fillRect(251,174,6,3);}if(look.armorRarity==='legendary'){c.fillStyle='#bd914b';c.fillRect(177,113,4,23);c.fillRect(171,118,16,3);}}
 draw(c,game){const direction=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove,back=direction.x+direction.y<0,screenX=direction.x-direction.y,attack=game.attackAnim>0,column=attack?9+Math.min(3,Math.floor((1-game.attackAnim/(game.player.equipment.weapon?.4:.3))*4)):game.moving?1+Math.floor(game.walkPhase)%8:0,frame=this.frame(game.player,back,column);if(!frame)return null;c.save();if(screenX<0)c.scale(-1,1);if(game.dodgeTime>0)c.globalAlpha*=.7;c.drawImage(frame,-48,-98,96,108);c.restore();return {row:(back?2:0)+(screenX<0?1:0),column,action:game.dodgeTime>0?'evade':attack&&!game.player.equipment.weapon?'punch':attack?'attack':game.moving?'walk':'idle',style:'painted-guard'};}
}
