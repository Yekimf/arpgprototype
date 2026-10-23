import sharp from 'sharp';
import fs from 'node:fs/promises';
// Six independently painted anatomical poses per enemy, packed at native game scale.
const input='src/art/enemy-deaths.png',{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),cw=info.width/6;
const count=(column,y)=>{let n=0;for(let x=Math.floor(column*cw);x<Math.floor((column+1)*cw);x++)if(data[(y*info.width+x)*4+3]>40)n++;return n;};
const cuts=Array.from({length:6},(_,col)=>[0,...[248,454,660,850,1039].map(mid=>{let best=mid,score=Infinity;for(let y=mid-19;y<=mid+19;y++){const n=count(col,y)*100+Math.abs(y-mid);if(n<score){score=n;best=y;}}return best;}),info.height]);
const parts=[],composite=[];
for(let row=0;row<6;row++){
 const frames=[];
 for(let col=0;col<6;col++){
  const top=cuts[col][row],bottom=cuts[col][row+1],left=Math.floor(col*cw),right=Math.floor((col+1)*cw);let x1=right,x2=left,y1=bottom,y2=top;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>40){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}
  frames.push({left:x1,top:y1,width:x2-x1+1,height:y2-y1+1});
 }
 const scale=Math.min(112/frames[0].height,148/Math.max(...frames.map(f=>f.width)));
 for(let col=0;col<6;col++){const rect=frames[col],width=Math.round(rect.width*scale),height=Math.round(rect.height*scale),image=await sharp(input).extract(rect).resize(width,height).png().toBuffer();composite.push({input:image,left:col*160+Math.floor((160-width)/2),top:row*160+138-height});parts.push({row,col,width,height});}
}
await fs.mkdir('src/art/runtime',{recursive:true});
await sharp({create:{width:960,height:960,channels:4,background:'#00000000'}}).composite(composite).webp({quality:91,alphaQuality:100,effort:6}).toFile('src/art/runtime/enemy-deaths.webp');
console.log('Packed 36 painted enemy death frames.',parts.filter(p=>p.col===5));
const bossInput='src/art/boss-death.png',boss=await sharp(bossInput).ensureAlpha().raw().toBuffer({resolveWithObject:true}),bossRects=[];
for(let frame=0;frame<6;frame++){const left=Math.floor(frame*boss.info.width/6),right=Math.floor((frame+1)*boss.info.width/6);let x1=right,x2=left,y1=boss.info.height,y2=0;for(let y=0;y<boss.info.height;y++)for(let x=left;x<right;x++)if(boss.data[(y*boss.info.width+x)*4+3]>40){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}bossRects.push({left:x1,top:y1,width:x2-x1+1,height:y2-y1+1});}
const bossScale=Math.min(138/bossRects[0].height,154/Math.max(...bossRects.map(r=>r.width))),bossTiles=[];
for(let frame=0;frame<6;frame++){const rect=bossRects[frame],width=Math.round(rect.width*bossScale),height=Math.round(rect.height*bossScale);bossTiles.push({input:await sharp(bossInput).extract(rect).resize(width,height).png().toBuffer(),left:frame*160+Math.floor((160-width)/2),top:146-height});}
await sharp({create:{width:960,height:160,channels:4,background:'#00000000'}}).composite(bossTiles).webp({quality:91,alphaQuality:100,effort:6}).toFile('src/art/runtime/boss-death.webp');
console.log('Packed six thornbound knight death frames.');
