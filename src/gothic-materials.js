import * as T from 'three';

const COLORS={skin:0xc0a28b,hair:0x29221d,cloth:0x5b5143,leather:0x604a35,
 mail:0x626762,steel:0x85867c,darkSteel:0x414842,gold:0x8e7850,red:0x6c282b,darkRed:0x341b20,
 wood:0x55402c,bone:0xb1aa91,black:0x181a18,blue:0x577f94,eye:0x878678};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hash=(x,y)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+59,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
function noise(x,y){const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),s),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),s),t);}
function maps(kind){
 const n=256,canvases=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=n;return c;}),contexts=canvases.map(c=>c.getContext('2d')),images=contexts.map(c=>c.createImageData(n,n));
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const grain=hash(x,y),cloud=noise(x/43,y/43)*.55+noise(x/11,y/11)*.3+noise(x/4,y/4)*.15;
  let albedo=210+cloud*36,rough=170+cloud*65,height=108+grain*24;
  if(kind==='metal'){
   const score=Math.pow(hash(x,Math.floor(y/40)),24);
   albedo=199+cloud*47-score*40;rough=90+cloud*95+score*65;height=118+grain*9-score*38;
  }else if(kind==='cloth'){
   const warp=(x%3===0?1:0)+(y%3===0?1:0);
   albedo=192+cloud*51-warp*7;rough=225+grain*25;height=90+warp*23+grain*15;
  }else if(kind==='leather'){
   const pores=Math.pow(noise(x/2,y/2),4),scar=Math.pow(noise(x/1.7,y/19),11);
   albedo=181+cloud*58-pores*23;rough=138+cloud*86;height=107+grain*10-pores*45-scar*100;
  }else if(kind==='skin'){
   albedo=225+cloud*22;rough=174+grain*30;height=122+grain*10;
  }else if(kind==='hair'){
   const strand=noise(x/1.5,y/58);
   albedo=156+strand*92;rough=150+strand*70;height=80+strand*96;
  }else if(kind==='wood'){
   const streak=noise(x/5+Math.sin(y/43),y/75);
   albedo=175+streak*75;rough=160+cloud*70;height=85+streak*70;
  }else if(kind==='mail'){
   const row=Math.floor(y/13),u=(x+(row%2)*7)%14-7,v=y%13-6.5,r=Math.sqrt((u/5.5)**2+(v/4.3)**2),wire=Math.exp(-((r-1)**2)/.035);
   albedo=97+wire*120+grain*12;rough=125+wire*55;height=65+wire*143;
  }
  const i=(y*n+x)*4;
  for(let k=0;k<3;k++){images[k].data[i]=images[k].data[i+1]=images[k].data[i+2]=Math.round(clamp([albedo,rough,height][k],0,255));images[k].data[i+3]=255;}
 }
 return canvases.map((canvas,i)=>{contexts[i].putImageData(images[i],0,0);const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=i===0?T.SRGBColorSpace:T.NoColorSpace;return texture;});
}

export class GothicMaterials{
 constructor(){this.maps=new Map();}
 make(){
  return Object.fromEntries(Object.entries(COLORS).map(([name,color])=>{
   const metal=['steel','darkSteel','gold'].includes(name),kind=metal?'metal':name==='skin'||name==='hair'||name==='mail'||name==='wood'||name==='leather'?name:'cloth';
   if(!this.maps.has(kind))this.maps.set(kind,maps(kind));
   const [map,roughnessMap,bumpMap]=this.maps.get(kind);
   const m=new T.MeshStandardMaterial({name,color,map,roughnessMap,bumpMap,bumpScale:kind==='mail'?.006:kind==='skin'?.0007:kind==='cloth'?.0025:.0018,roughness:metal?.68:.92,metalness:metal?.82:name==='mail'?.55:0,vertexColors:true});
   if(name==='red'||name==='darkRed'||name==='cloth')m.side=T.DoubleSide;
   return [name,m];
  }));
 }
 dispose(){for(const maps of this.maps.values())maps.forEach(t=>t.dispose());this.maps.clear();}
}
