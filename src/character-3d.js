import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {appearanceOf} from './itemization.js';
import {animationState} from './player-animation.js';
import {facingPose} from './locomotion.js';

// A shared, transparent WebGL stage is composited at the actor's existing world
// depth. Geometry, joint transforms and depth testing are genuinely three
// dimensional; the environment can keep its existing canvas renderer.
const UP=new T.Vector3(0,1,0),v=(x,y,z)=>new T.Vector3(x,y,z);
const FRAME={width:384,height:352,anchorX:96,anchorY:148};
const palette={skin:0xb88a68,hair:0x30201b,cloth:0x554333,leather:0x613b27,
 mail:0x5c6869,steel:0x89918c,darkSteel:0x414b4a,gold:0xa88449,red:0x991f25,darkRed:0x54151e,
 wood:0x684126,bone:0xc1b595,black:0x1c1918,blue:0x4299bf};
function surfaceTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
 const image=c.createImageData(128,128);let seed=19;
 for(let i=0;i<image.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=172+(seed%65);image.data.set([value,value,value,255],i);}
 c.putImageData(image,0,0);c.strokeStyle='#999';c.lineWidth=.5;
 for(let i=0;i<24;i++){c.beginPath();c.moveTo(i*13%128,i*31%128);c.lineTo(i*13%128+5,i*31%128+12);c.stroke();}
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(2,2);return texture;
}
function mesh(parent,geometry,material,position=[0,0,0],scale=[1,1,1]){
 const m=new T.Mesh(geometry,material);m.position.set(...position);m.scale.set(...scale);parent.add(m);return m;
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
function dispose(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
function batchGeometry(root,dynamic){
 const groups=[];root.traverse(o=>{if(o.isGroup||o.isBone)groups.push(o);});
 for(const parent of groups){
  const materials=new Map();
  for(const child of parent.children)if(child.isMesh&&child.visible&&!dynamic.has(child)){const list=materials.get(child.material)||[];list.push(child);materials.set(child.material,list);}
  for(const [material,children]of materials)if(children.length>1){
   const parts=children.map(child=>{child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();return g.applyMatrix4(child.matrix);});
   const combined=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
   if(combined){children.forEach(child=>{parent.remove(child);child.geometry.dispose();});mesh(parent,combined,material);}
  }
 }
}

class GuardModel{
 constructor(look){
  this.look=look;this.root=new T.Group();this.root.name='Royal guard';
  this.m=Object.fromEntries(Object.entries(palette).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:k.toLowerCase().includes('steel')?.36:.85,metalness:['steel','darkSteel','gold'].includes(k)?.72:0})]));
  this.texture=surfaceTexture();
  for(const key of ['leather','cloth','mail','steel','darkSteel','wood']){this.m[key].bumpMap=this.texture;this.m[key].bumpScale=key==='cloth'?.008:.003;this.m[key].roughnessMap=this.texture;}
  const m=this.m,female=look.sex==='female',width=female?.89:1;
  const sets=[0x46605a,0x46516c,0x716143,0x65364d],set=look.setParts?.armor;
  let armor=look.armor==='chain'?m.mail:['plate','original'].includes(look.armor)||female&&look.armor==='leather'?m.steel:look.armor==='robe'?m.cloth:m.leather;
  if(Number.isInteger(set)){armor=m.setArmor=armor.clone();armor.color.setHex(sets[set%sets.length]);}
  this.pelvis=bone(this.root,'pelvis');this.chest=bone(this.pelvis,'chest');
  const profile=[[.20,.84],[.23,.98],[.17,1.09],[.21,1.25],[.28,1.39],[.24,1.47],[.12,1.50]].map(([r,y])=>new T.Vector2(r*width,y));
  mesh(this.chest,new T.LatheGeometry(profile,20),m.cloth,[0,0,0],[1,1,.68]);
  const cuirass=mesh(this.chest,new T.LatheGeometry(profile.slice(1,6),20),armor,[0,0,.008],[1.04,1,.72]);
  if(look.armor==='none')cuirass.visible=false;
  if(look.armor==='robe')mesh(this.chest,new T.LatheGeometry([[.33,.26],[.30,.52],[.25,.80],[.17,1.05]].map(([r,y])=>new T.Vector2(r,y)),20),m.cloth,[0,0,0],[1,1,.75]);
  if(female&&look.armor!=='robe'&&look.armor!=='none'){
   for(const side of [-1,1])ball(this.chest,armor,[side*.103,1.32,.098],[.116,.135,.095]);
  }
  // Raised seams and buckles read as armor rather than a featureless capsule.
  for(const side of [-1,1])rod(this.chest,m.gold,[side*.20,1.42,.13],[side*.07,1.12,.145],.009);
  for(const side of [-1,1])for(let i=0;i<4;i++)ball(this.chest,m.gold,[side*(.18-i*.027),1.38-i*.055,.153],[.008,.008,.006]);
  box(this.chest,m.leather,[0,1.03,.005],[.42*width,.075,.30]);
  box(this.chest,m.gold,[0,1.03,.17],[.075,.062,.024]);box(this.chest,m.black,[0,1.03,.186],[.042,.034,.009]);
  for(const side of [-1,1]){
   const flap=plate(this.chest,look.armor==='robe'?m.cloth:armor,[[0,0],[.18,0],[.21,-.28],[.10,-.31],[-.015,-.25]],.025);
   flap.position.set(side<0?-.21:.02,.99,.14);flap.rotation.y=side*.18;
   box(this.chest,m.leather,[side*.22,1.0,.06],[.10,.13,.12]);
  }
  this.cape=new T.Group();this.chest.add(this.cape);
  const cloth=plate(this.cape,m.red,[[-.23,1.45],[.23,1.45],[.26,1.10],[.34,.67],[.23,.72],[.21,.60],[.10,.67],[0,.59],[-.12,.70],[-.28,.63],[-.25,.83]],.018);
  cloth.position.z=-.18;cloth.rotation.x=.13;
  for(let i=-2;i<=2;i++)rod(this.cape,m.darkRed,[i*.07,1.38,-.21],[i*.10,.76,-.28],.008);
  mesh(this.chest,new T.TorusGeometry(.145,.055,10,24),m.red,[0,1.50,0],[1,1,.8]).rotation.x=Math.PI/2;
  const scarf=plate(this.chest,m.red,[[-.13,1.5],[.14,1.5],[.09,1.37],[-.07,1.40]],.025);scarf.position.z=.16;
  rod(this.chest,m.skin,[0,1.48,0],[0,1.59,0],.067);
  this.head=bone(this.chest,'head',[0,1.65,0]);
  ball(this.head,m.skin,[0,0,.025],[female?.108:.116,.145,.10]);
  ball(this.head,m.skin,[0,-.065,.05],[.079,.068,.075]);
  ball(this.head,m.skin,[0,-.005,.123],[.023,.037,.035]);
  for(const side of [-1,1]){
   ball(this.head,m.skin,[side*.109,-.005,.02],[.023,.039,.021]);
   ball(this.head,m.bone,[side*.043,.019,.112],[.027,.011,.008]);
   ball(this.head,m.black,[side*.043,.019,.120],[.010,.010,.005]);
   rod(this.head,m.hair,[side*.020,.041,.115],[side*.068,.038,.099],.009);
  }
  rod(this.head,m.darkRed,[-.026,-.067,.112],[.026,-.067,.112],.006);
  ball(this.head,m.hair,[0,.065,-.018],[.123,.106,.106]);
  for(let i=0;i<9;i++){
   const a=i/8*Math.PI,x=Math.cos(a)*.09;
   ball(this.head,m.hair,[x,.055+Math.sin(a)*.065,.055],[.04,.045,.055]);
  }
  if(female){for(const side of [-1,1])for(let i=0;i<4;i++)ball(this.head,m.hair,[side*(.10-i*.006),-.015-i*.045,-.04-i*.007],[.035,.062,.048]);
   ball(this.head,m.hair,[0,-.12,-.12],[.061,.10,.045]);
  }else ball(this.head,m.hair,[0,-.083,.065],[.083,.047,.069]);
  if(look.helm!=='none'){
   const hood=look.helm==='hood',helmet=ball(this.head,hood?m.cloth:m.steel,[0,.049,-.015],[.14,.14,.123]);
   if(!hood){box(this.head,m.darkSteel,[0,.015,.119],[.22,.027,.035]);rod(this.head,m.gold,[0,.17,0],[0,.04,.13],.009);}
   if(look.helm==='greathelm'){box(this.head,m.steel,[0,-.03,.125],[.19,.12,.027]);for(const side of [-1,1])box(this.head,m.black,[side*.046,.008,.144],[.067,.012,.008]);}
   helmet.name='Equipped headgear';
  }
  this.legs=[];
  for(const side of [-1,1]){
   const hip=bone(this.pelvis,side<0?'right hip':'left hip',[side*.15,.88,0]),knee=bone(hip,'knee',[0,-.40,0]),ankle=bone(knee,'ankle',[0,-.37,0]);hip.rotation.z=side*.08;
   rod(hip,m.cloth,[0,0,0],[0,-.41,0],.105,.08);
   ball(knee,m.darkSteel,[0,0,.025],[.091,.092,.090]);
   const boots=look.boots==='steel'?m.steel:m.leather;
   rod(knee,boots,[0,-.045,0],[0,-.36,0],.077,.065);
   if(look.boots==='steel')ball(knee,m.steel,[0,-.19,.045],[.073,.16,.048]);
   ball(ankle,boots,[0,-.043,.075],[.089,.068,.155]);
   rod(knee,m.gold,[-.056,-.11,.06],[.056,-.11,.06],.009);
   if(look.armor!=='robe'&&look.armor!=='none')ball(hip,armor,[0,-.19,.045],[.103,.19,.068]);
   this.legs.push({hip,knee,ankle});
  }
  this.arms=[];
  for(const [index,side]of [-1,1].entries()){
   const shoulder=bone(this.chest,index?'left shoulder':'right shoulder',[side*.265*width,1.41,0]);
   const elbow=bone(shoulder,'elbow'),wrist=bone(elbow,index?'left hand':'right hand');
   const pauldron=plate(shoulder,look.armor==='robe'?m.cloth:m.darkSteel,[[-.10,.04],[.02,.095],[.12,.035],[.10,-.10],[-.09,-.10]],.10);pauldron.position.z=-.05;
   for(const edge of [-1,1])rod(shoulder,m.gold,[edge*.095,.025,.063],[edge*.085,-.09,.063],.008);
   const upper=mesh(shoulder,new T.CylinderGeometry(.074,.065,1,12),m.cloth);
   ball(elbow,m.leather,[0,0,0],[.072,.075,.072]);
   const lower=mesh(elbow,new T.CylinderGeometry(.068,.047,1,12),look.gloves==='steel'?m.steel:m.leather);
   ball(wrist,look.gloves==='none'?m.skin:look.gloves==='steel'?m.steel:m.leather,[0,0,0],[.053,.064,.045]);
   // Individual fingers wrap a narrow handle instead of an opaque hand slab.
   for(let i=0;i<4;i++)ball(wrist,look.gloves==='none'?m.skin:m.leather,[-.029+i*.019,-.022,.027],[.012,.036,.017]);
   this.arms.push({shoulder,elbow,wrist,upper,lower});
  }
  this.weapon=bone(this.arms[look.weapon==='bow'?1:0].wrist,'weapon socket');
  this.makeWeapon();
  if(look.shield!=='none'&&!look.twoHanded){
   const shield=new T.Group();shield.name='shield socket';this.arms[1].wrist.add(shield);shield.position.set(0,.08,.07);
   if(look.shield==='kite')plate(shield,m.wood,[[-.23,.30],[.23,.30],[.21,-.10],[0,-.39],[-.21,-.10]],.055);
   else mesh(shield,new T.CylinderGeometry(.255,.255,.055,24),m.wood).rotation.x=Math.PI/2;
   if(look.shield!=='kite')ring(shield,m.steel,[0,0,.035],.252,.018);
   ball(shield,m.steel,[0,0,.063],[.072,.072,.045]);
   rod(shield,m.gold,[0,-.20,.06],[0,.20,.06],.015);rod(shield,m.gold,[-.20,0,.06],[.20,0,.06],.015);
  }
  if(look.charm!=='none'){rod(this.chest,m.gold,[-.1,1.44,.15],[0,1.21,.19],.006);rod(this.chest,m.gold,[.1,1.44,.15],[0,1.21,.19],.006);ball(this.chest,m.gold,[0,1.21,.20],[.025,.035,.015]);}
  batchGeometry(this.root,new Set(this.arms.flatMap(a=>[a.upper,a.lower])));
 }
 makeWeapon(){
  const g=this.weapon,m=this.m,l=this.look,i=l.weaponIcon??0;if(l.weapon==='none')return;
  const staff=[7,8,9,14].includes(i),length=staff?1.25:i===1?1.08:i===4?1.03:.65;
  rod(g,m.wood,[0,staff?-.55:-.13,0],[0,length,0],staff?.024:.022);
  for(let j=0;j<5;j++)ring(g,m.leather,[0,j*.035-.07,0],.024,.005).rotation.x=Math.PI/2;
  if([0,1,2,7,10,11].includes(i)){
   const start=i===7?.91:i===10||i===11?.31:.18,end=i===2?.49:i===7?1.44:length;
   const blade=plate(g,i===10?m.bone:i===11?m.blue:m.steel,[[0,end],[-.042,end-.12],[-.045,start],[.045,start],[.042,end-.12]],.018);blade.position.z=-.009;
   if(i<3){rod(g,m.gold,[-.13,.17,0],[.13,.17,0],.018);ball(g,m.gold,[0,-.13,0],[.035,.042,.035]);}
  }
  if(i===3||i===14){
   for(const side of i===14?[-1,1]:[-1]){
    const head=plate(g,m.steel,[[0,.98],[side*.17,1.14],[side*.29,1.08],[side*.34,.80],[side*.20,.71],[side*.03,.88]],.045);head.position.y=i===3?-.45:0;head.position.z=-.025;
   }
  }
  if(i===4){box(g,m.darkSteel,[0,1.03,0],[.43,.24,.23]);for(const side of [-1,1])box(g,m.steel,[side*.20,1.03,0],[.07,.27,.26]);}
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
  const primary=v(-.37,1.0,.14),off=v(.37,1.0,.13),rotation=new T.Euler(0,0,1.0);
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
  this.root.updateMatrixWorld(true);
  const contacts=this.arms.map(a=>a.wrist.getWorldPosition(new T.Vector3()).toArray());
  return {row:facingPose(facing).index,directions:16,column:state.action==='walk'?state.frame+1:state.action==='idle'?0:17+state.frame,frame:state.frame,action:game.dodgeTime>0?'evade':state.action,clip:state.mode,style:'3d-guard',weapon:l.weapon,sex:l.sex,grips:contacts};
 }
 solveArm(index,target){
  const a=this.arms[index],root=a.shoulder.position,delta=target.clone().sub(root),distance=delta.length(),length=.315,d=T.MathUtils.clamp(distance,.025,length*2-.0001),axis=delta.normalize();
  // An outward/downward elbow pole chooses the anatomical side of the bend.
  const pole=v(index?.5:-.5,-.6,-.15),perp=pole.addScaledVector(axis,-pole.dot(axis)).normalize();
  const elbow=root.clone().addScaledVector(axis,d/2).addScaledVector(perp,Math.sqrt(length*length-d*d/4));
  const end=root.clone().addScaledVector(axis,d);
  a.elbow.position.copy(elbow).sub(root);a.wrist.position.copy(end).sub(elbow);
  for(const [part,vector]of [[a.upper,a.elbow.position],[a.lower,a.wrist.position]]){part.position.copy(vector).multiplyScalar(.5);part.scale.y=vector.length();part.quaternion.setFromUnitVectors(UP,vector.clone().normalize());}
 }
 dispose(){dispose(this.root);Object.values(this.m).forEach(m=>m.dispose());this.texture.dispose();}
}

export class Character3D{
 constructor(){this.models=new Map();this.frames=new Map();this.failed=false;this.renderer=null;this.renders=0;}
 init(){
  if(this.renderer||this.failed)return !this.failed;
  try{
   const canvas=document.createElement('canvas');
   this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
   this.renderer.setSize(FRAME.width,FRAME.height,false);this.renderer.setClearColor(0x000000,0);
   this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
   this.scene=new T.Scene();this.scene.add(new T.HemisphereLight(0xe4e9ed,0x514237,2.1));
   const key=new T.DirectionalLight(0xffe1b3,3.1);key.position.set(-3,5,4);this.scene.add(key);
   const rim=new T.DirectionalLight(0xa2bdd4,1.6);rim.position.set(3,3,-4);this.scene.add(rim);
   const h=3.2,w=h*FRAME.width/FRAME.height;this.camera=new T.OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,30);
   this.camera.position.set(0,4.72,7);this.camera.lookAt(0,1.22,0);
   canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.failed=true;});
   canvas.addEventListener('webglcontextrestored',()=>{this.failed=false;this.stamp=null;this.frames.clear();});return true;
  }catch{this.failed=true;return false;}
 }
 render(game){
  if(!this.init())return null;
  const look=appearanceOf(game.player),key=JSON.stringify(look),facing=(game.attackAnim>0?game.actionFacing:game.facing)||game.lastMove;
  const stamp=JSON.stringify([key,facing,game.moving,game.walkPhase,game.attackAnim,game.attackDuration,game.animationMode,game.dodgeTime>0]);
  if(this.stamp===stamp)return {canvas:this.renderer.domElement,info:this.info};
  let model=this.models.get(key);
  if(!model){model=new GuardModel(look);this.models.set(key,model);if(this.models.size>4){const oldest=this.models.keys().next().value;this.models.get(oldest).dispose();this.models.delete(oldest);}}
  if(this.current!==model){if(this.current)this.scene.remove(this.current.root);this.scene.add(model.root);this.current=model;}
  const info=model.pose(game);this.renderer.render(this.scene,this.camera);this.renders++;this.stamp=stamp;
  this.info={...info,meshes:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,models:this.models.size};
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
  const key=JSON.stringify([look,state.action,state.mode,state.frame,state.locomotionFrame,angle,game.dodgeTime>0]);
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
 dispose(){for(const model of this.models.values())model.dispose();this.models.clear();this.frames.clear();this.renderer?.dispose();}
}
