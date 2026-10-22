import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
await sharp('src/art/armor-icons.png').resize(1024,1024).webp({quality:88,alphaQuality:100,effort:6}).toFile('src/art/runtime/armor-icons.webp');
const {data}=await sharp('src/art/armor-icons.png').resize(1024,1024).ensureAlpha().raw().toBuffer({resolveWithObject:true}),bounds={};
for(let index=0;index<4;index++){const ox=index%2*512,oy=Math.floor(index/2)*512;let minX=512,minY=512,maxX=0,maxY=0;for(let y=3;y<509;y++)for(let x=3;x<509;x++)if(data[((oy+y)*1024+ox+x)*4+3]>100){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}bounds[index]=[ox+minX,oy+minY,maxX-minX+1,maxY-minY+1];}
await writeFile('src/armor-bounds.js','export const ARMOR_BOUNDS='+JSON.stringify(bounds)+';\n');
