import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GuardAnatomy,anatomyEyes} from './guard-anatomy.js';
import {GothicMaterials} from './gothic-materials.js';
import {appearanceOf} from './itemization.js';
import {animationState} from './player-animation.js';
import {facingPose} from './locomotion.js';

// A shared, transparent WebGL stage is composited at the actor's existing world
// depth. Geometry, joint transforms and depth testing are genuinely three
// dimensional; the environment can keep its existing canvas renderer.
const UP=new T.Vector3(0,1,0),v=(x,y,z)=>new T.Vector3(x,y,z);
const FRAME={width:384,height:352,anchorX:96,anchorY:148};
function mesh(parent,geometry,material,position=[0,0,0],scale=[1,1,1]){
 if(!geometry.getAttribute('color'))geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count*3).fill(1),3));
 const m=new T.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;m.position.set(...position);m.scale.set(...scale);parent.add(m);return m;
}
function ball(parent,mat,p,s){return mesh(parent,new T.SphereGeometry(1,16,12),mat,p,s);}
function box(parent,mat,p,s){return mesh(parent,new T.BoxGeometry(1,1,1),mat,p,s);}
function rod(parent,mat,a,b,r=.025,rEnd=r){
 const start=v(...a),end=v(...b),delta=end.clone().sub(start);
 const m=mesh(parent,new T.CylinderGeometry(rEnd,r,delta.length(),12),mat);
 m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(UP,delta.normalize());return m;
}
function ring(parent,mat,p,r=.1,t=.016){return mesh(parent,new T.TorusGeometry(r,t,8,24),mat,p);}
function plate(parent,mat,points,depth=.04){
 const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
 return mesh(parent,new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:1,steps:1}),mat);
}
function bone(parent,name,p=[0,0,0]){const b=new T.Bone();b.name=name;b.position.set(...p);parent.add(b);return b;}
function drapedCloth(parent,material,{top,bottom,yTop,yBottom,z,wrap=false}){
 const positions=[],uv=[],indices=[],cols=wrap?32:20,rows=24;
 for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
  const u=col/cols,t=row/rows,width=T.MathUtils.lerp(top,bottom,t),fold=Math.sin(u*Math.PI*(wrap?16:10)+t*.6)*(.008+t*.018);
  const hem=(Math.sin(u*57)*.018+Math.sin(u*29)*.02)*t**12;
  if(wrap){const a=u*Math.PI*2;positions.push(Math.cos(a)*(width+fold),T.MathUtils.lerp(yTop,yBottom,t)+hem,Math.sin(a)*(width+fold)*.72+z);}
  else positions.push((u-.5)*2*width,T.MathUtils.lerp(yTop,yBottom,t)+hem,z-t*.13+fold);
  uv.push(u,t);
  if(row<rows&&col<cols){const i=row*(cols+1)+col;indices.push(i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(parent,g,material);
}
function bootShape(parent,material,sole=false){
 const stations=[[-.075,.049,.085],[-.02,.063,.10],[.07,.065,.06],[.145,.063,.033],[.196,.042,.022],[.207,.002,.012]],positions=[],uv=[],indices=[],segments=16;
 for(const [i,[z,w,h]]of stations.entries())for(let j=0;j<=segments;j++){
  const a=j/segments*Math.PI*2;positions.push(Math.cos(a)*w,-.072+(sole?-.006:Math.sin(a)*h/2+h/2),z);uv.push(j/segments,i/(stations.length-1));
  if(i<stations.length-1&&j<segments){const k=i*(segments+1)+j;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(parent,g,material);
}
function forgedBlade(parent,material,start,end,width=.034,curve=0){
 const profile=[[start,width,0],[end-.15,width*.94,curve*.25],[end-.055,width*.58,curve*.70],[end,.0001,curve]],positions=[],uv=[],indices=[];
 for(const [i,[y,w,center]]of profile.entries()){
  const depth=i===3?.0001:.008;
  for(const [j,[x,z]]of [[-w,0],[0,depth],[w,0],[0,-depth]].entries()){positions.push(x+center,y,z);uv.push(j/4,(y-start)/(end-start));}
  if(i<profile.length-1)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return mesh(parent,flat,material);
}
function dispose(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
export function characterLighting(game){
 const outdoor=game.dungeon?.outdoor!==false;let warm=game.pyre?2:0,angle=0,nearest=4;
 for(const p of game.dungeon?.props||[])if(['brazier','campfire','torch'].includes(p.type)){
  const dx=p.x-(game.player.x||0),dy=p.y-(game.player.y||0),distance=Math.hypot(dx,dy);
  if(distance<nearest){nearest=distance;warm=distance<1.6?2:1;angle=Math.round(Math.atan2(dx-dy,dx+dy)*2/Math.PI)*Math.PI/2;}
 }
 return {outdoor,warm,angle,key:`${outdoor?'daylight':'crypt'}:${warm}:${angle}`};
}
function batchGeometry(root,dynamic){
 const groups=[];root.traverse(o=>{if(o.isGroup||o.isBone)groups.push(o);});
 for(const parent of groups){
  const materials=new Map();
  for(const child of parent.children)if(child.isMesh&&!child.isSkinnedMesh&&child.visible&&!dynamic.has(child)){const list=materials.get(child.material)||[];list.push(child);materials.set(child.material,list);}
  for(const [material,children]of materials)if(children.length>1){
   const parts=children.map(child=>{child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();return g.applyMatrix4(child.matrix);});
   const combined=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
   if(combined){children.forEach(child=>{parent.remove(child);child.geometry.dispose();});mesh(parent,combined,material);}
  }
 }
}

class GuardModel{
 constructor(look,materials){
  this.look=look;this.root=new T.Group();this.root.name='Royal guard';this.m=materials.make();
  const m=this.m,female=look.sex==='female',width=female?.91:1;
  const sets=[0x667464,0x5b6576,0x80734f,0x754e59],set=look.setParts?.armor;
  let armor=look.armor==='chain'?m.mail:['plate','original'].includes(look.armor)||female&&look.armor==='leather'?m.steel:look.armor==='robe'?m.cloth:m.leather;
  if(Number.isInteger(set)){armor=m.setArmor=armor.clone();armor.color.setHex(sets[set%sets.length]);}
  this.pelvis=bone(this.root,'pelvis');this.chest=bone(this.pelvis,'chest');
  const profile=[[.18,.86],[.21,.98],[.168,1.09],[.186,1.23],[.235,1.36],[.232,1.42],[.18,1.47],[.10,1.50]];
  const curve=new T.CatmullRomCurve3(profile.map(([r,y])=>v(r*width,y,0)));
  const cuirass=mesh(this.chest,new T.LatheGeometry(curve.getPoints(32).map(p=>new T.Vector2(p.x,p.y)),32),armor,[0,0,0],[1,1,female?.81:.75]);
  if(look.armor==='none')cuirass.visible=false;
  if(look.armor==='robe')drapedCloth(this.chest,m.cloth,{top:.22,bottom:.34,yTop:1.08,yBottom:.25,z:-.02,wrap:true});
  // Rolled plate edges, a narrow breast ridge, riveted seams and worn straps.
  for(const side of [-1,1]){
   rod(this.chest,m.darkSteel,[side*.17,1.44,.122],[side*.09,1.09,.129],.006);
   for(let i=0;i<6;i++)ball(this.chest,m.gold,[side*(.175-i*.016),1.43-i*.054,.132],[.004,.004,.004]);
   const strap=plate(this.chest,m.leather,[[-.013,0],[.013,0],[.013,-.39],[-.013,-.39]],.008);strap.position.set(side*.13,1.44,.145);strap.rotation.z=side*.30;
   for(let i=0;i<3;i++)box(this.chest,m.gold,[side*(.145-i*.016),1.37-i*.10,.163],[.026,.016,.008]);
  }
  if(['plate','original'].includes(look.armor))rod(this.chest,m.steel,[0,1.11,.14],[0,1.40,.18],.008);
  box(this.chest,m.leather,[0,1.025,.002],[.39*width,.055,.285]);
  const buckle=ring(this.chest,m.gold,[0,1.025,.155],.024,.005);buckle.scale.x=1.25;
  rod(this.chest,m.darkSteel,[-.023,1.025,.164],[.023,1.025,.164],.003);
  for(const side of [-1,1]){
   for(let lame=0;lame<3;lame++){
    const flap=plate(this.chest,look.armor==='robe'?m.cloth:armor,[[-.085,.015],[.084,.015],[.095,-.085],[.02,-.105],[-.09,-.08]],.014);
    flap.position.set(side*.112,1.00-lame*.083,.14+lame*.014);flap.rotation.y=side*.22;flap.rotation.x=-.10;
    for(const edge of [-1,1])ball(flap,m.gold,[edge*.065,-.008,.025],[.004,.004,.004]);
   }
   const pouch=ball(this.chest,m.leather,[side*.215,.965,.05],[.053,.075,.055]);
   box(this.chest,m.gold,[side*.215,.984,.106],[.018,.020,.006]);
  }
  this.cape=new T.Group();this.chest.add(this.cape);
  drapedCloth(this.cape,m.red,{top:.205,bottom:.30,yTop:1.48,yBottom:.66,z:-.16});
  for(let fold=0;fold<3;fold++){
   const collar=mesh(this.chest,new T.TorusGeometry(.116+fold*.008,.022,8,32),m.red,[0,1.505-fold*.016,0],[1,1,.84]);collar.rotation.x=Math.PI/2;
  }
  const scarf=plate(this.chest,m.red,[[-.12,1.49],[.13,1.49],[.105,1.40],[.02,1.365],[-.075,1.40]],.012);scarf.position.z=.13;
  this.head=bone(this.chest,'head',[0,1.65,0]);
  // Small recessed eyes sit inside the anatomical eyelids, rather than painted
  // white dots on an oversized spherical face.
  for(const eye of anatomyEyes(look.sex)){
   ball(this.head,m.eye,eye,[.0125,.011,.0115]);
   ball(this.head,m.hair,[eye[0],eye[1],eye[2]+.0105],[.0055,.0055,.0025]);
   ball(this.head,m.black,[eye[0],eye[1],eye[2]+.012],[.0025,.0033,.0012]);
  }
  for(let lock=0;lock<9;lock++){
   const t=(lock-4)/4,x=t*.068,h=female?.93:1,front=female?.111:.122;
   const strand=new T.CatmullRomCurve3([v(x*.60,(.156-.03*Math.abs(t))*h,-.008),v(x*.85,(.145-.02*Math.abs(t))*h,.045),v(x,(.104-.012*Math.abs(t))*h,front-.02),v(x*.95-.012,(.065+t*.018)*h,front)]);
   mesh(this.head,new T.TubeGeometry(strand,10,.005+Math.abs(t)*.001,5,false),m.hair);
  }
  if(female)for(const side of [-1,1])for(let lock=0;lock<4;lock++){
   const x=side*(.083+lock*.004),curve=new T.CatmullRomCurve3([v(x,.11,-.035),v(x*1.05,.025,-.065),v(x*.93,-.075,-.093),v(x*.80,-.13,-.07)]);
   mesh(this.head,new T.TubeGeometry(curve,12,.011,5,false),m.hair);
  }
  if(look.helm!=='none'){
   const hood=look.helm==='hood';
   mesh(this.head,new T.SphereGeometry(1,28,18,0,Math.PI*2,0,1.65),hood?m.cloth:m.darkSteel,[0,.075,.005],[.114,.118,.106]);
   mesh(this.head,new T.SphereGeometry(1,24,12,Math.PI,Math.PI,1.15,1.15),hood?m.cloth:m.darkSteel,[0,.075,0],[.12,.13,.113]);
   if(!hood){const brim=ring(this.head,m.steel,[0,.065,.005],.111,.004);brim.rotation.x=Math.PI/2;brim.scale.z=.9;}
   if(look.helm==='greathelm'){
    const visor=plate(this.head,m.darkSteel,[[-.105,.067],[.105,.067],[.09,-.048],[0,-.074],[-.09,-.048]],.018);visor.position.z=.115;
    for(const side of [-1,1])box(this.head,m.black,[side*.048,.036,.139],[.068,.009,.008]);
    for(let i=-2;i<=2;i++)box(this.head,m.black,[i*.018,-.024,.139],[.006,.018,.006]);
    rod(this.head,m.steel,[0,.066,.143],[0,-.05,.143],.005);
   }
  }
  this.legs=[];
  for(const side of [-1,1]){
   const hip=bone(this.pelvis,side<0?'right hip':'left hip',[side*.15,.88,0]),knee=bone(hip,'knee',[0,-.40,0]),ankle=bone(knee,'ankle',[0,-.37,0]);hip.rotation.z=side*.065;
   const boots=look.boots==='steel'?m.darkSteel:m.leather;
   const shin=mesh(knee,new T.LatheGeometry([[.052,-.37],[.062,-.31],[.074,-.14],[.068,-.04]].map(([r,y])=>new T.Vector2(r,y)),20),boots,[0,0,0],[1,1,.90]);
   bootShape(ankle,boots);bootShape(ankle,m.black,true);
   ball(knee,look.armor==='none'?m.leather:m.darkSteel,[0,-.008,.045],[.073,.075,.049]);
   if(look.armor!=='robe'&&look.armor!=='none'){
    const thigh=mesh(hip,new T.SphereGeometry(1,20,14,0,Math.PI*2,0,Math.PI),armor,[0,-.19,.035],[.096,.182,.061]);
    for(let strap=0;strap<2;strap++)rod(hip,m.gold,[-.065,-.11-strap*.16,.062],[.065,-.11-strap*.16,.062],.004);
   }
   for(let strap=0;strap<3;strap++){
    const cuff=ring(knee,m.leather,[0,-.08-strap*.095,0],.070-strap*.005,.008);cuff.rotation.x=Math.PI/2;
    box(knee,m.gold,[side*.043,-.08-strap*.095,.057],[.018,.018,.007]);
   }
   this.legs.push({hip,knee,ankle});
  }
  this.arms=[];
  for(const [index,side]of [-1,1].entries()){
   const shoulder=bone(this.chest,index?'left shoulder':'right shoulder',[side*.255*width,1.415,0]);
   const elbow=bone(shoulder,'elbow'),wrist=bone(elbow,index?'left hand':'right hand');
   const metal=look.armor==='robe'?m.cloth:m.darkSteel;
   mesh(shoulder,new T.SphereGeometry(1,24,14,0,Math.PI*2,0,1.73),metal,[0,-.016,0],[.112,.085,.117]);
   for(let lame=0;lame<3;lame++){
    const band=mesh(shoulder,new T.SphereGeometry(1,24,8,0,Math.PI*2,1.18, .25),metal,[0,-.028-lame*.025,0],[.113-lame*.006,.076,.115-lame*.005]);
    for(const edge of [-1,1])ball(shoulder,m.gold,[edge*.069,-.032-lame*.025,.076],[.004,.004,.004]);
   }
   const upper=mesh(shoulder,new T.CylinderGeometry(.06,.055,1,12),m.cloth);upper.visible=false;
   const lower=mesh(elbow,new T.CylinderGeometry(.044,.057,.74,20),look.gloves==='steel'?m.darkSteel:m.leather);
   for(let strap=0;strap<2;strap++){
    const cuff=ring(lower,m.darkSteel,[0,-.22+strap*.43,0],.054-strap*.006,.008);cuff.rotation.x=Math.PI/2;
   }
   this.arms.push({shoulder,elbow,wrist,upper,lower});
  }
  this.weapon=bone(this.arms[look.weapon==='bow'?1:0].wrist,'weapon socket');this.makeWeapon();
  if(look.shield!=='none'&&!look.twoHanded){
   const shield=new T.Group();shield.name='shield socket';this.arms[1].wrist.add(shield);shield.position.set(0,.08,.07);
   if(look.shield==='kite')plate(shield,m.wood,[[-.21,.28],[.21,.28],[.19,-.10],[0,-.34],[-.19,-.10]],.034);
   else mesh(shield,new T.CylinderGeometry(.23,.23,.035,32),m.wood).rotation.x=Math.PI/2;
   if(look.shield!=='kite')ring(shield,m.darkSteel,[0,0,.027],.227,.012);
   ball(shield,m.darkSteel,[0,0,.038],[.062,.062,.039]);
   rod(shield,m.darkSteel,[0,-.19,.033],[0,.19,.033],.011);rod(shield,m.darkSteel,[-.19,0,.033],[.19,0,.033],.011);
   for(let i=0;i<12;i++){const a=i*Math.PI/6;ball(shield,m.gold,[Math.cos(a)*.21,Math.sin(a)*.21,.028],[.004,.004,.004]);}
  }
  if(look.charm!=='none'){rod(this.chest,m.gold,[-.1,1.44,.15],[0,1.21,.18],.003);rod(this.chest,m.gold,[.1,1.44,.15],[0,1.21,.18],.003);ball(this.chest,m.gold,[0,1.21,.19],[.018,.026,.007]);}
  this.anatomy=new GuardAnatomy(this);
  batchGeometry(this.root,new Set(this.arms.flatMap(a=>[a.upper,a.lower])));
 }
 makeWeapon(){
  const g=this.weapon,m=this.m,l=this.look,i=l.weaponIcon??0;if(l.weapon==='none')return;
  const staff=[7,8,9,14].includes(i),length=staff?1.25:i===1?1.08:i===4?1.03:.65;
  rod(g,i<3?m.leather:m.wood,[0,staff?-.55:-.13,0],[0,i<3?.17:length,0],staff?.022:.018);
  for(let j=0;j<6;j++)ring(g,m.leather,[0,j*.030-.07,0],.020,.003).rotation.x=Math.PI/2;
  if([0,1,2,7,10,11].includes(i)){
   const start=i===7?.91:i===10||i===11?.31:.18,end=i===2?.49:i===7?1.44:length;
   forgedBlade(g,i===10?m.bone:i===11?m.blue:m.steel,start,end,i===2?.023:.035,i===0?.035:0);
   if(i<3){
    rod(g,m.darkSteel,[-.12,.14,0],[0,.17,0],.011);rod(g,m.darkSteel,[0,.17,0],[.12,.14,0],.011);
    ball(g,m.darkSteel,[0,-.13,0],[.027,.036,.022]);
    if(i!==2)rod(g,m.darkSteel,[0,start+.03,.0081],[i===0?.007:0,end-.16,.0081],.0014);
   }
  }
  if(i===3||i===14){
   for(const side of i===14?[-1,1]:[-1]){
    const head=plate(g,m.steel,[[0,1.0],[side*.14,1.09],[side*.29,1.10],[side*.34,1.02],[side*.33,.91],[side*.25,.80],[side*.13,.76],[side*.17,.91],[0,.91]],.023);head.position.y=i===3?-.45:0;head.position.z=-.012;
   }
  }
  if(i===4){
   mesh(g,new T.CylinderGeometry(.125,.125,.40,8),m.darkSteel,[0,1.03,0]).rotation.z=Math.PI/2;
   for(const side of [-1,1])mesh(g,new T.CylinderGeometry(.13,.13,.045,8),m.steel,[side*.19,1.03,0]).rotation.z=Math.PI/2;
  }
  if(i===5){ball(g,m.darkSteel,[0,.60,0],[.10,.13,.10]);for(let j=0;j<6;j++){const a=j*Math.PI/3;rod(g,m.steel,[0,.48,0],[Math.cos(a)*.14,.70,Math.sin(a)*.14],.027);}}
  if(i===6){
   this.chain=new T.Group();g.add(this.chain);this.chain.position.y=.36;
   for(let j=0;j<7;j++){const link=ring(this.chain,m.steel,[0,-j*.064,0],.032,.009);link.rotation.y=j%2*Math.PI/2;}
   ball(this.chain,m.darkSteel,[0,-.48,0],[.10,.10,.10]);
   for(const axis of [v(1,0,0),v(-1,0,0),v(0,0,1),v(0,0,-1),v(0,-1,0)]){const spike=mesh(this.chain,new T.ConeGeometry(.035,.12,8),m.steel);spike.position.copy(v(0,-.48,0).addScaledVector(axis,.11));spike.quaternion.setFromUnitVectors(UP,axis);}
  }
  if(i===8||i===9||i===15){
   const y=i===15?.60:1.23;ring(g,m.gold,[0,y,0],i===9?.13:.105,.022);
   if(i===9)ring(g,m.steel,[.15,y+.08,0],.10,.021);
   else ball(g,m.gold,[0,y,0],[.060,.075,.05]);
  }
  if(i===12||i===13){
   // Remove the generic haft: ranged weapons have their own actual geometry.
   for(const child of [...g.children]){g.remove(child);child.traverse(o=>o.geometry?.dispose());}
   const cross=i===13,curve=new T.CatmullRomCurve3(cross?[v(-.50,.12,.40),v(-.26,.12,.52),v(0,.12,.56),v(.26,.12,.52),v(.50,.12,.40)]:[v(0,-.67,0),v(0,-.40,.14),v(0,0,0),v(0,.40,.14),v(0,.67,0)]);
   mesh(g,new T.TubeGeometry(curve,24,.021,8,false),m.wood);
   if(cross){box(g,m.wood,[0,.04,.24],[.09,.11,.88]);rod(g,m.steel,[0,.11,.08],[0,.11,.70],.013);rod(g,m.bone,[-.50,.12,.40],[.50,.12,.40],.003);}
   else{this.string=new T.Line(new T.BufferGeometry().setFromPoints([v(0,-.67,0),v(0,0,.04),v(0,.67,0)]),new T.LineBasicMaterial({color:0xcabda4}));g.add(this.string);}
  }
 }
 pose(game){
  const l=this.look,state=animationState(game,l),walking=game.moving,phase=(game.walkPhase||0)/16*Math.PI*2;
  const progress=game.attackAnim>0?T.MathUtils.clamp(1-game.attackAnim/(game.attackDuration||.4),0,1):0,strike=game.attackAnim>0?Math.sin(progress*Math.PI):0;
  const facing=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove||{x:1,y:1};
  this.root.rotation.y=Math.atan2(facing.x-facing.y,facing.x+facing.y);
  this.pelvis.position.y=walking?Math.abs(Math.sin(phase))*.027:0;
  this.chest.rotation.z=walking?Math.sin(phase)*.025:0;this.head.rotation.y=0;
  this.cape.rotation.x=walking?-.10-Math.sin(phase)*.035:0;
  for(const [index,{hip,knee,ankle}]of this.legs.entries()){
   const stride=walking?Math.sin(phase+index*Math.PI):0;hip.rotation.x=stride*.52;knee.rotation.x=Math.max(0,-stride)*.72;ankle.rotation.x=-stride*.15;
  }
  const primary=v(-.35,.95,.14),off=v(.34,.94,.10),rotation=new T.Euler(0,0,1.0);
  const two=l.twoHanded,bow=l.weapon==='bow',cross=l.weapon==='crossbow';
  if(two){primary.set(-.14,1.13,.34);rotation.z=-.58;}
  if(l.weapon==='spear')rotation.z=.23;
  if(l.weapon==='wand'||l.weapon==='mace')rotation.z=2.15;
  if(game.attackAnim>0){
   if(state.action==='cast'){primary.y+=strike*.33;primary.z+=strike*.18;rotation.z-=strike*.8;}
   else if(!bow&&!cross){primary.y+=strike*.23;primary.z+=strike*.13;rotation.z+=Math.sin(progress*Math.PI*2)*1.6;rotation.x=-strike*.75;}
  }
  if(!two&&walking){primary.z+=Math.sin(phase)*.07;off.z-=Math.sin(phase)*.07;}
  const q=new T.Quaternion().setFromEuler(rotation),support=v(0,l.weapon==='greatsword'?.13:.25,0).applyQuaternion(q);
  if(two)off.copy(primary).add(support);
  if(bow){off.set(.43,1.29,.29);primary.set(-.12,1.25,.20+strike*.24);rotation.set(0,0,-.08);}
  if(cross){primary.set(-.08,1.12,.27);rotation.set(0,-.10,0);off.copy(primary).add(v(0,.10,.19).applyEuler(rotation));}
  if(l.weapon==='none'&&game.attackAnim>0){primary.set(-.15,1.25,.24+strike*.34);off.set(.20,1.23,.18);}
  this.solveArm(0,primary);this.solveArm(1,off);
  this.arms[0].wrist.rotation.copy(l.weapon==='none'||bow?new T.Euler():rotation);
  this.arms[1].wrist.rotation.copy(two?rotation:new T.Euler());this.weapon.rotation.set(0,0,0);
  if(this.chain)this.chain.rotation.z=-Math.sin(phase)*.16-strike*.7;
  if(this.string){const draw=primary.clone().sub(off).applyQuaternion(new T.Quaternion().setFromEuler(rotation).invert()),a=this.string.geometry.attributes.position;a.setXYZ(1,draw.x,draw.y,draw.z);a.needsUpdate=true;}
  this.root.updateMatrixWorld(true);this.anatomy.update();
  const contacts=this.arms.map(a=>a.wrist.getWorldPosition(new T.Vector3()).toArray());
  return {row:facingPose(facing).index,directions:16,column:state.action==='walk'?state.frame+1:state.action==='idle'?0:17+state.frame,frame:state.frame,action:game.dodgeTime>0?'evade':state.action,clip:state.mode,style:'3d-guard',weapon:l.weapon,sex:l.sex,grips:contacts};
 }
 solveArm(index,target){
  const a=this.arms[index],root=a.shoulder.position,delta=target.clone().sub(root),distance=delta.length(),length=.315,d=T.MathUtils.clamp(distance,.025,length*2-.0001),axis=delta.normalize();
  // An outward/downward elbow pole chooses the anatomical side of the bend.
  const pole=v(index?.25:-.25,-.2,-.85),perp=pole.addScaledVector(axis,-pole.dot(axis)).normalize();
  const elbow=root.clone().addScaledVector(axis,d/2).addScaledVector(perp,Math.sqrt(length*length-d*d/4));
  const end=root.clone().addScaledVector(axis,d);
  a.elbow.position.copy(elbow).sub(root);a.wrist.position.copy(end).sub(elbow);
  for(const [part,vector]of [[a.upper,a.elbow.position],[a.lower,a.wrist.position]]){part.position.copy(vector).multiplyScalar(part===a.lower?.44:.5);part.scale.y=vector.length();part.quaternion.setFromUnitVectors(UP,vector.clone().normalize());}
 }
 dispose(){dispose(this.root);Object.values(this.m).forEach(m=>m.dispose());this.anatomy.dispose();}
}

export class Character3D{
 constructor(){this.models=new Map();this.frames=new Map();this.failed=false;this.renderer=null;this.renders=0;}
 init(){
  if(this.renderer||this.failed)return !this.failed;
  try{
   const canvas=document.createElement('canvas');
   this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
   this.renderer.setSize(FRAME.width,FRAME.height,false);this.renderer.setClearColor(0x000000,0);
   this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;
   this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
   this.scene=new T.Scene();this.ambient=new T.HemisphereLight(0xaab1a7,0x3e3327,.7);this.scene.add(this.ambient);
   this.keyLight=new T.DirectionalLight(0xe8d3b0,2.5);this.keyLight.position.set(-3,5,4);this.keyLight.target.position.set(0,1,0);this.keyLight.castShadow=true;
   Object.assign(this.keyLight.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.1,far:14});this.keyLight.shadow.mapSize.set(512,512);this.keyLight.shadow.bias=-.00025;this.keyLight.shadow.normalBias=.008;this.scene.add(this.keyLight,this.keyLight.target);
   this.rim=new T.DirectionalLight(0x8e9ca8,.45);this.rim.position.set(3,3,-4);this.scene.add(this.rim);
   this.torch=new T.PointLight(0xe48b42,0,5,2);this.scene.add(this.torch);
   const generator=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.environment=generator.fromScene(room,.06);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.24;room.dispose();generator.dispose();
   const floor=new T.Mesh(new T.PlaneGeometry(4,4),new T.ShadowMaterial({opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=.002;floor.receiveShadow=true;
   floor.material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 guardShadowPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n guardShadowPosition=(modelMatrix*vec4(position,1.0)).xyz;');
    shader.fragmentShader='varying vec3 guardShadowPosition;\n'+shader.fragmentShader.replace('opacity * ( 1.0 - getShadowMask() )','opacity * ( 1.0 - getShadowMask() ) * (1.0-smoothstep(0.7,1.5,length(guardShadowPosition.xz)))');
   };
   this.scene.add(floor);this.floor=floor;
   const h=3.2,w=h*FRAME.width/FRAME.height;this.camera=new T.OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,30);
   this.camera.position.set(0,4.72,7);this.camera.lookAt(0,1.22,0);
   canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.failed=true;});
   canvas.addEventListener('webglcontextrestored',()=>{this.failed=false;this.stamp=null;this.frames.clear();});return true;
  }catch{this.failed=true;return false;}
 }
 render(game){
  if(!this.init())return null;
  const look=appearanceOf(game.player),key=JSON.stringify(look),facing=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove,lighting=characterLighting(game);
  const stamp=JSON.stringify([key,facing,game.moving,game.walkPhase,game.attackAnim,game.attackDuration,game.animationMode,game.dodgeTime>0,lighting.key]);
  if(this.stamp===stamp)return {canvas:this.renderer.domElement,info:this.info};
  let model=this.models.get(key);
  if(!model){model=new GuardModel(look,this.materials??=new GothicMaterials());this.models.set(key,model);if(this.models.size>4){const oldest=this.models.keys().next().value;this.models.get(oldest).dispose();this.models.delete(oldest);}}
  if(this.current!==model){if(this.current)this.scene.remove(this.current.root);this.scene.add(model.root);this.current=model;}
  this.ambient.intensity=lighting.outdoor?.70:.42;this.keyLight.color.setHex(lighting.outdoor?0xe8d3b0:0xb0bbc0);this.keyLight.intensity=lighting.outdoor?3.0:1.9;this.rim.intensity=lighting.outdoor?.45:.28;
  this.scene.environmentIntensity=lighting.outdoor?.46:.22;this.torch.intensity=lighting.warm*1.6;this.torch.position.set(Math.sin(lighting.angle)*1.25,1.6,Math.cos(lighting.angle)*1.25);
  const info=model.pose(game);this.renderer.render(this.scene,this.camera);this.renders++;this.stamp=stamp;
  this.info={...info,lighting:lighting.key,meshes:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,models:this.models.size};
  return {canvas:this.renderer.domElement,info:this.info};
 }
 draw(context,game){
  if(this.failed)return null;
  const look=appearanceOf(game.player),state=animationState(game,look),facing=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove||{x:1,y:1};
  // Sample the existing animation frames, retaining 64 viewing angles. Cached
  // WebGL output avoids repeated GPU readback on software-rendered browsers.
  const angle=Math.round(Math.atan2(facing.x-facing.y,facing.x+facing.y)*32/Math.PI)*Math.PI/32;
  const direction={x:(Math.cos(angle)+Math.sin(angle))/2,y:(Math.cos(angle)-Math.sin(angle))/2};
  const sampled={...game,facing:direction,actionFacing:direction,walkPhase:Math.floor(game.walkPhase||0),attackAnim:game.attackAnim>0?(1-(state.frame+.5)/state.count)*(game.attackDuration||.4):0};
  const key=JSON.stringify([look,state.action,state.mode,state.frame,state.locomotionFrame,angle,game.dodgeTime>0,characterLighting(game).key]);
  let frame=this.frames.get(key);
  if(frame){this.frames.delete(key);this.frames.set(key,frame);}
  else{
   const rendered=this.render(sampled);if(!rendered)return null;
   const canvas=document.createElement('canvas');canvas.width=FRAME.width;canvas.height=FRAME.height;canvas.getContext('2d').drawImage(rendered.canvas,0,0);
   frame={canvas,info:rendered.info};this.frames.set(key,frame);
   while(this.frames.size>44)this.frames.delete(this.frames.keys().next().value);
  }
  context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';if(game.dodgeTime>0)context.globalAlpha*=.7;
  context.drawImage(frame.canvas,-FRAME.anchorX*.75,-FRAME.anchorY*.75,144,132);context.restore();return {...frame.info,cachedFrames:this.frames.size,renders:this.renders};
 }
 dispose(){for(const model of this.models.values())model.dispose();this.models.clear();this.frames.clear();this.materials?.dispose();this.environment?.dispose();this.renderer?.dispose();}
}
