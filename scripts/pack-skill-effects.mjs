import sharp from 'sharp';
import {stat} from 'node:fs/promises';
import {SKILL_ANIMATIONS,SKILL_CELL as cell} from '../src/skill-animation.js';
// Register each row at one scale. Floor contact and missile tips stay fixed as
// the independently painted poses change; no per-frame stretching or trimming.
for(const name of ['elements','forces','wards']){
 const {data,info}=await sharp(`src/art/skill-${name}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const mids={elements:[200,405,620,787,998],forces:[220,446,614,860,1000],wards:[180,343,500,704,795]}[name];
 const cuts=Array.from({length:6},(_,col)=>[0,...mids.map(mid=>{let best=mid,score=Infinity;for(let y=mid-10;y<=mid+10;y++){let count=0;for(let x=Math.floor(col*info.width/6);x<Math.floor((col+1)*info.width/6);x++)if(data[(y*info.width+x)*4+3]>40)count++;const value=count*20+Math.abs(y-mid);if(value<score){score=value;best=y;}}return best;}),info.height]);
 const parts=[];
 for(let row=0;row<6;row++){
  const spec=Object.values(SKILL_ANIMATIONS).find(s=>s.sheet===name&&s.row===row),frames=[];
  for(let col=0;col<6;col++){
   const x0=Math.floor(col*info.width/6),y0=cuts[col][row],width=Math.floor((col+1)*info.width/6)-x0,height=cuts[col][row+1]-y0;
   const rgba=Buffer.alloc(width*height*4);let x1=width,y1=height,x2=-1,y2=-1;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const si=((y+y0)*info.width+x+x0)*4,di=(y*width+x)*4;
    const edge=Math.min(x,y,width-x-1,height-y-1),alpha=data[si+3]*Math.min(1,edge/4);
    rgba[di]=data[si];rgba[di+1]=data[si+1];rgba[di+2]=data[si+2];rgba[di+3]=alpha<4?0:Math.round(alpha);
    if(alpha>40){x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y);}
   }
   if(x2<0)throw Error(`Empty skill pose ${name}/${row}/${col}`);
   frames.push({rgba,width,height,x1,y1,x2,y2});
  }
  const maxW=Math.max(...frames.map(f=>f.x2-f.x1+1)),maxH=Math.max(...frames.map(f=>f.y2-f.y1+1)),scale=Math.min((cell-16)/maxW,(cell-16)/maxH);
  for(let col=0;col<6;col++){
   const f=frames[col],width=Math.round(f.width*scale),height=Math.round(f.height*scale),center=(f.x1+f.x2)/2*scale;
   let left=spec.anchor==='tip'?cell-10-f.x2*scale:cell/2-center,top=spec.anchor==='floor'?cell-10-f.y2*scale:cell/2-(f.y1+f.y2)/2*scale;
   // Composite to a padded cell first; sharp safely clips the transparent overhang.
   const image=await sharp(f.rgba,{raw:{width:f.width,height:f.height,channels:4}}).resize(width,height).png().toBuffer();
   const padded=await sharp({create:{width:cell+512,height:cell+512,channels:4,background:'#00000000'}}).composite([{input:image,left:Math.round(left)+256,top:Math.round(top)+256}]).png().toBuffer();
   const local=await sharp(padded).extract({left:256,top:256,width:cell,height:cell}).png().toBuffer();
   parts.push({input:local,left:col*cell,top:row*cell});
  }
 }
 const output=`src/art/runtime/skill-${name}.webp`;
 await sharp({create:{width:cell*6,height:cell*6,channels:4,background:'#00000000'}}).composite(parts).webp({quality:82,alphaQuality:92,effort:6}).toFile(output);
 console.log(`${name}: 36 registered poses, ${Math.round((await stat(output)).size/1024)} KiB`);
}
