import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const boxes=[[45,0,270,315],[365,0,270,340],[700,0,245,315],[1000,0,266,315],[40,295,285,330],[365,300,265,320],[680,300,290,320],[990,285,276,335],[30,590,290,350],[345,595,290,355],[700,590,250,345],[1005,590,261,345],[75,880,240,355],[345,925,330,310],[690,875,285,360],[1025,895,241,340]];
const layers=[],bounds=[];
for(let index=0;index<boxes.length;index++){
 const [left,top,width,height]=boxes[index],{data,info}=await sharp('src/art/weapons-atlas.png').extract({left,top,width,height}).raw().toBuffer({resolveWithObject:true}),labels=new Int32Array(width*height),queue=new Int32Array(width*height);let serial=0,largest=0,best=0;
 // Isolate the principal item from adjacent-cell tips. Normalize invisible matte
 // pixels before resampling so discarded RGB cannot create coloured fringes.
 for(let i=0;i<labels.length;i++){if(labels[i]||data[i*4+3]<8)continue;serial++;let head=0,tail=1;queue[0]=i;labels[i]=serial;while(head<tail){const at=queue[head++],x=at%width,y=Math.floor(at/width);for(const n of [x>0?at-1:-1,x+1<width?at+1:-1,y>0?at-width:-1,y+1<height?at+width:-1])if(n>=0&&!labels[n]&&data[n*4+3]>=8){labels[n]=serial;queue[tail++]=n;}}if(tail>best){best=tail;largest=serial;}}
 for(let i=0;i<labels.length;i++)if(labels[i]!==largest)data.fill(0,i*4,i*4+4);
 const clean=await sharp(data,{raw:info}).png().toBuffer(),trimmed=await sharp(clean).trim({threshold:8}).png().toBuffer(),sprite=await sharp(trimmed).resize(240,240,{fit:'inside'}).toBuffer(),meta=await sharp(sprite).metadata(),x=index%4*256+Math.floor((256-meta.width)/2),y=Math.floor(index/4)*256+Math.floor((256-meta.height)/2);
 layers.push({input:sprite,left:x,top:y});bounds.push([x,y,meta.width,meta.height]);
}
await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(layers).webp({quality:90,alphaQuality:100,effort:6}).toFile('src/art/runtime/weapons.webp');
await writeFile('src/art/weapon-bounds.json',JSON.stringify(bounds));
console.log('Packed 16 distinct weapon inventory paintings.');
