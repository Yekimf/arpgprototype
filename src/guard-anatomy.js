import * as T from 'three';
import anatomy from './art/runtime/guard-anatomy.json';

const UP=new T.Vector3(0,1,0),vec=a=>new T.Vector3(...a);
export const anatomyEyes=sex=>(anatomy.headEyes[sex==='female'?'female':'male']).map(p=>p.map((n,i)=>n-anatomy.bones[1].a[i]));

// The hm08 asset supplies anatomical topology, not primitive stand-ins. Linear
// blend skinning joins shoulders, elbows, wrists and knees into one continuous
// surface while the equipment sockets keep their existing combat contract.
export class GuardAnatomy{
 constructor(model){
  this.model=model;this.group=new T.Group();this.group.name='Anatomical skin rig';model.root.add(this.group);
  const geometry=new T.BufferGeometry(),positions=Float32Array.from(anatomy.positions),colors=[];
  const female=model.look.sex==='female',head=vec(anatomy.bones[1].a);
  for(const [index,x,y,z]of anatomy.headMorphs[female?'female':'male']){positions[index*3]+=x;positions[index*3+1]+=y;positions[index*3+2]+=z;}
  for(let i=0;i<positions.length;i+=3){
   const y=positions[i+1],x=positions[i],z=positions[i+2];
   if(y>1.13&&y<1.49&&z>.095){
    const blend=Math.exp(-Math.pow((y-1.32)/.16,8));positions[i+2]=z+( .095+(z-.095)*(female?.45:.24)-z)*blend;
   }
   if(y>1.60){
    const jaw=Math.exp(-Math.pow((y-1.655)/.05,2));
    positions[i]*=female?1:1+.02*jaw;
    if(!female&&z>.08)positions[i+2]+=.004*Math.exp(-Math.pow((y-1.71)/.025,2));
   }
   const color=new T.Color(y>1.53&&y<1.60?0xb69b86:0xffffff);
   if(y>1.60){
    let shade=1;
    for(const eye of anatomy.headEyes[female?'female':'male'])shade-=.20*Math.exp(-Math.pow((x-eye[0])/.023,2)-Math.pow((y-eye[1])/.018,2))*Math.max(0,z/.12);
    shade-=.14*Math.exp(-Math.pow((y-1.625)/.017,2));
    color.setRGB(shade,shade*.97,shade*.94);
    const lips=Math.exp(-Math.pow(x/.028,4)-Math.pow((y-1.658)/.008,2))*Math.max(0,Math.min(1,(z-.09)/.035));
    color.lerp(new T.Color(0x8a5d51),lips*.45);
    if(!female&&y<1.68&&z>.09)color.multiplyScalar(.86+.10*Math.sin(x*1500+y*700)**2);
   }
   colors.push(color.r,color.g,color.b);
  }
  for(const [index,r,g,b]of anatomy.faceColors[female?'female':'male']){colors[index*3]=r;colors[index*3+1]=g;colors[index*3+2]=b;}
  const faceMaterial=model.m.skin.clone();faceMaterial.name='Baked gothic face';faceMaterial.color.setHex(0xffffff);faceMaterial.map=null;
  geometry.setAttribute('position',new T.BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(anatomy.uv,2));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(anatomy.skinIndices,4));
  geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(anatomy.skinWeights,4));
  const indices=[];
  for(const [material,part]of anatomy.indices.entries()){
   const visible=[];
   for(let i=0;i<part.length;i+=3){
    const tri=part.slice(i,i+3);
    // Standard body occlusion under a closed cuirass prevents the shirt surface
    // from piercing plate armor, without cutting articulated limbs or the neck.
    const underArmor=material===0&&model.look.armor!=='none'&&tri.every(j=>positions[j*3+1]>1.02&&positions[j*3+1]<1.45&&Math.abs(positions[j*3])<.19);
    if(!underArmor)visible.push(...tri);
   }
   geometry.addGroup(indices.length,visible.length,material);indices.push(...visible);
  }
  geometry.setIndex(indices);geometry.computeVertexNormals();
  this.bones=anatomy.bones.map(spec=>{
   const b=new T.Bone();b.name=spec.name;b.position.copy(vec(spec.a));b.quaternion.setFromUnitVectors(UP,vec(spec.b).sub(vec(spec.a)).normalize());this.group.add(b);return b;
  });
  this.group.updateMatrixWorld(true);this.skeleton=new T.Skeleton(this.bones);this.skeleton.calculateInverses();
  this.mesh=new T.SkinnedMesh(geometry,[model.m.cloth,faceMaterial,model.look.gloves==='none'?model.m.skin:model.look.gloves==='steel'?model.m.steel:model.m.leather]);
  this.mesh.name='Continuous anatomical body';this.mesh.frustumCulled=false;this.mesh.castShadow=this.mesh.receiveShadow=true;model.root.add(this.mesh);this.mesh.bind(this.skeleton);
  const hairGeometry=geometry.clone(),hairIndices=[];
  for(let i=0;i<anatomy.indices[1].length;i+=3){
   const tri=anatomy.indices[1].slice(i,i+3),p=tri.map(index=>vec([positions[index*3],positions[index*3+1],positions[index*3+2]]));
   if(p.every(v=>v.y>1.744||v.z<.025&&v.y>1.665||Math.abs(v.x)>.079&&v.y>1.714))hairIndices.push(...tri);
  }
  hairGeometry.clearGroups();hairGeometry.setIndex(hairIndices);
  const normal=geometry.getAttribute('normal'),hair=hairGeometry.getAttribute('position');
  for(let i=0;i<hair.count;i++)hair.setXYZ(i,hair.getX(i)+normal.getX(i)*.003,hair.getY(i)+normal.getY(i)*.003,hair.getZ(i)+normal.getZ(i)*.003);
  this.hair=new T.SkinnedMesh(hairGeometry,model.m.hair);this.hair.name='Fitted scalp';this.hair.frustumCulled=false;this.hair.castShadow=true;model.root.add(this.hair);this.hair.bind(this.skeleton);
  this.inverseRoot=new T.Matrix4();this.targets=new Map();
 }
 update(){
  const m=this.model;this.inverseRoot.copy(m.root.matrixWorld).invert();
  const point=b=>b.getWorldPosition(new T.Vector3()).applyMatrix4(this.inverseRoot);
  const rootQuaternion=m.root.getWorldQuaternion(new T.Quaternion()).invert();
  const orientation=b=>rootQuaternion.clone().multiply(b.getWorldQuaternion(new T.Quaternion()));
  const bodyOrigin=point(m.pelvis),bodyTop=point(m.head);
  this.fit(0,bodyOrigin.clone().add(new T.Vector3(0,.95,0)),bodyTop,1);
  this.fit(1,bodyTop,bodyTop.clone().add(new T.Vector3(0,.163,0)),1);
  for(let arm=0;arm<2;arm++){
   const a=m.arms[arm],index=2+arm*3,grip=point(a.wrist),held=m.look.weapon!=='none'&&(m.look.twoHanded||arm===0);
   const q=orientation(a.wrist).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),held?(arm?Math.PI/2:-Math.PI/2):Math.PI));
   const center=held?grip.clone().add(new T.Vector3(0,-.04,-.035).applyQuaternion(q)):grip;
   const wrist=center.clone().add(new T.Vector3(0,-.055,0).applyQuaternion(q));
   this.fit(index,point(a.shoulder),point(a.elbow));this.fit(index+1,point(a.elbow),wrist);
   this.bones[index+2].position.copy(center);this.bones[index+2].quaternion.copy(q);this.bones[index+2].scale.set(1,1,1);
   const forearm=a.elbow.worldToLocal(wrist.clone().applyMatrix4(m.root.matrixWorld));
   a.lower.position.copy(forearm).multiplyScalar(.5);a.lower.scale.y=forearm.length();a.lower.quaternion.setFromUnitVectors(UP,forearm.normalize());
  }
  for(let leg=0;leg<2;leg++){
   const l=m.legs[leg],index=8+leg*3,ankle=point(l.ankle);
   this.fit(index,point(l.hip),point(l.knee));this.fit(index+1,point(l.knee),ankle);
   this.fit(index+2,ankle,ankle.clone().add(new T.Vector3(0,-.065,.17).applyQuaternion(orientation(l.ankle))));
  }
  this.group.updateMatrixWorld(true);this.skeleton.update();
 }
 fit(index,a,b,width=1){
  const bone=this.bones[index],length=vec(anatomy.bones[index].b).distanceTo(vec(anatomy.bones[index].a)),delta=b.clone().sub(a);
  bone.position.copy(a);bone.quaternion.setFromUnitVectors(UP,delta.clone().normalize());bone.scale.set(width,delta.length()/length,width);
 }
 dispose(){this.skeleton.dispose();}
}
