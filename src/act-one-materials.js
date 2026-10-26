// Cached floor materials. Pattern, joints and surface wear differ by location;
// the source stone grain keeps them in the same painted world as the scenery.
export function floorMaterial(d,x,y){
 if(d.tileset==='marchgate')return d.courts?.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)?'march-court':'march-slate';
 if(d.tileset==='redoubt')return d.rooms.some(r=>r.kind==='sanctum'&&x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)?'crypt-inlay':'crypt-slab';
 if(d.tileset==='blackthorn')return d.roads?.has(y*d.size+x)?'briar-road':'briar-earth';
 if(d.tileset==='granary')return d.barnFloors.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)?'barn-boards':d.roads.has(y*d.size+x)?'wagon-ruts':'harvest-stubble';
 return null;
}
const COLORS={
 'march-court':['#625a4b','#766b58','#3c372f'], 'march-slate':['#414442','#545650','#292d2c'],
 'crypt-slab':['#555149','#6b6558','#302c27'], 'crypt-inlay':['#4c3530','#685047','#281e1b'],
 'barn-boards':['#51402e','#756047','#292016'], 'harvest-stubble':['#514b42','#6b6254','#35312b'],
 'wagon-ruts':['#4d4030','#5f503b','#31291e'], 'briar-earth':['#30352e','#484c39','#232720'], 'briar-road':['#414137','#595747','#2c2d27']
};
export function makeFloorMaterial(art,theme,variant,granaryArt=null){
 let seed=theme.split('').reduce((a,c)=>a+c.charCodeAt(0)*13,731)+variant*7919;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const square=document.createElement('canvas');square.width=square.height=136;const c=square.getContext('2d'),[base,light,dark]=COLORS[theme];
 c.fillStyle=base;c.fillRect(0,0,136,136);
 if(['barn-boards','harvest-stubble','wagon-ruts'].includes(theme)&&granaryArt?.complete&&granaryArt.naturalWidth){const cell=granaryArt.naturalWidth/2,index=theme==='barn-boards'?2:theme==='wagon-ruts'?1:variant%3===0?3:0;c.drawImage(granaryArt,index%2*cell,Math.floor(index/2)*cell,cell,cell,0,0,136,136);const tile=document.createElement('canvas');tile.width=136;tile.height=68;const t=tile.getContext('2d');t.translate(68,0);t.transform(.5,.25,-.5,.25,0,0);t.drawImage(square,0,0);return tile;}

 if(art.complete&&art.naturalWidth){const cell=art.naturalWidth/4;c.globalAlpha=.2;c.drawImage(art,3*cell,0,cell,cell,0,0,136,136);c.globalAlpha=1;}
 if(theme.startsWith('march')||theme.startsWith('crypt')){
  const slab=theme==='march-court'?34:theme==='crypt-slab'?68:theme==='crypt-inlay'?34:17;
  for(let y=0;y<136;y+=slab)for(let x=-slab;x<136;x+=slab){const offset=(y/slab%2)*slab/2;c.fillStyle=rnd()<.5?light:base;c.globalAlpha=.3+rnd()*.25;c.fillRect(x+offset+1,y+1,slab-2,slab-2);c.globalAlpha=1;c.strokeStyle=dark;c.lineWidth=1.6;c.strokeRect(x+offset,y,slab,slab);c.strokeStyle='#b4a68c25';c.lineWidth=.6;c.strokeRect(x+offset+2,y+2,slab-4,slab-4);}
  for(let i=0;i<9;i++){const x=rnd()*136,y=rnd()*136;c.beginPath();c.moveTo(x,y);c.lineTo(x+5-rnd()*10,y+4);c.lineTo(x+8-rnd()*16,y+11);c.strokeStyle=dark;c.lineWidth=.7;c.stroke();}
  if(theme==='crypt-inlay'){c.strokeStyle='#93704666';c.lineWidth=1;c.strokeRect(12,12,112,112);c.strokeRect(17,17,102,102);}
 }else if(theme==='barn-boards'){
  for(let x=0;x<136;x+=17){c.fillStyle=rnd()<.5?light:base;c.globalAlpha=.4;c.fillRect(x,0,16,136);c.globalAlpha=1;c.fillStyle=dark;c.fillRect(x,0,1.5,136);for(let i=0;i<8;i++){c.fillStyle=rnd()<.5?'#a88c5d28':'#1b140f66';c.fillRect(x+2+rnd()*13,rnd()*136,.5,10+rnd()*35);}for(const y of [12,122]){c.fillStyle='#1e1710';c.fillRect(x+3,y,1.5,1.5);}}
 }else if(theme==='wagon-ruts'){
  for(const x of [30,96]){c.fillStyle='#211d1770';c.fillRect(x,0,7,136);c.fillStyle='#8a74562e';c.fillRect(x+7,0,2,136);}
 }else{
  const stubble=theme==='harvest-stubble';for(let i=0;i<(stubble?140:65);i++){const x=rnd()*136,y=rnd()*136;c.strokeStyle=stubble?(rnd()<.5?'#a18a4c77':'#75653c99'):light;c.lineWidth=.5+rnd();c.beginPath();c.moveTo(x,y);c.lineTo(x-2+rnd()*4,y-(stubble?2:4)-rnd()*5);c.stroke();}
  if(theme.startsWith('briar'))for(let i=0;i<6;i++){let x=rnd()*136,y=rnd()*136;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+6,y-10,x-8,y-14,x+3,y-24);c.strokeStyle='#191c1688';c.lineWidth=1.5;c.stroke();}
 }
 // Fine mottling breaks clean vector lines, with deterministic tile variants.
 for(let i=0;i<4600;i++){c.fillStyle=rnd()<.5?'#000000':'#c4b594';c.globalAlpha=.025+rnd()*.065;c.fillRect(rnd()*136,rnd()*136,.5+rnd()*1.7,.5+rnd()*1.7);}c.globalAlpha=1;
 const tile=document.createElement('canvas');tile.width=136;tile.height=68;const t=tile.getContext('2d');t.translate(68,0);t.transform(.5,.25,-.5,.25,0,0);t.drawImage(square,0,0);return tile;
}
