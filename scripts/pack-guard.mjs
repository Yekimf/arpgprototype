import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
await sharp('src/art/guard-equipment.png').resize({width:1280}).webp({quality:89,alphaQuality:100,effort:6}).toFile('src/art/runtime/guard-equipment.webp');
await sharp('src/art/hero-animation.png').resize({width:1280}).webp({quality:87,alphaQuality:100,effort:6}).toFile('src/art/runtime/guard-combat.webp');
const {width}=await sharp('src/art/items-atlas.png').metadata(),cell=Math.floor(width/4);
await sharp('src/art/inventory-marble.png').resize(768,768).webp({quality:88,effort:6}).toFile('src/art/runtime/inventory-stone.webp');
for(let i=1;i<=6;i++)await sharp(`src/art/chronicle/scene-${i}.png`).resize({width:1920,withoutEnlargement:true}).webp({quality:88,effort:6}).toFile(`src/art/runtime/scene-${i}.webp`);
const bounds={};for(let index=4;index<16;index++){const {data,info}=await sharp('src/art/items-atlas.png').ensureAlpha().extract({left:index%4*cell+6,top:Math.floor(index/4)*cell+6,width:cell-12,height:cell-12}).raw().toBuffer({resolveWithObject:true});let minX=info.width,minY=info.height,maxX=0,maxY=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){if(data[(y*info.width+x)*4+3]>150){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}bounds[index]=[index%4*256+(minX+6)/cell*256,Math.floor(index/4)*256+(minY+6)/cell*256,(maxX-minX+1)/cell*256,(maxY-minY+1)/cell*256].map(n=>+n.toFixed(2));}
await writeFile('src/item-bounds.js','export const ITEM_BOUNDS='+JSON.stringify(bounds)+';\n');console.log('Packed guard layers, combat atlas, stone texture and icon bounds.');
