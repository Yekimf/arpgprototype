import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
// Authored atlas has generous, nonuniform gutters. Trim each isolated sprite,
// normalize its cell, and retain its proportions for rendering at game scale.
const boxes=[
 [8,5,320,292],[345,5,300,292],[730,5,245,292],[1020,5,270,292],
 [90,300,175,295],[390,300,190,295],[675,355,310,230],[1030,300,280,295],
 [25,600,320,285],[355,600,310,285],[680,610,335,275],[1065,590,220,300],
 [15,905,335,250],[365,890,295,275],[700,885,275,290],[1025,885,287,300],
 [806,134,64,158],[740,72,230,60]
];
const layers=[],sizes=[];
for(let i=0;i<boxes.length;i++){
 const [left,top,width,height]=boxes[i],crop=await sharp('src/art/forest-life-atlas.png').extract({left,top,width,height}).toBuffer(),decoded=await sharp(crop).raw().toBuffer({resolveWithObject:true});
 // Normalize nearly transparent RGB before resampling/compression. Such pixels
 // contain arbitrary matte colours and otherwise bleed into small sprite edges.
 for(let at=0;at<decoded.data.length;at+=4)if(decoded.data[at+3]<=4)decoded.data.fill(0,at,at+4);
 const clean=await sharp(decoded.data,{raw:decoded.info}).png().toBuffer(),source=await sharp(clean).trim({threshold:12}).toBuffer();
 const meta=await sharp(source).metadata();sizes.push([meta.width,meta.height]);
 layers.push({input:await sharp(source).resize(256,256,{fit:'fill'}).png().toBuffer(),left:i%4*256,top:Math.floor(i/4)*256});
}
await sharp({create:{width:1024,height:Math.ceil(boxes.length/4)*256,channels:4,background:'#00000000'}}).composite(layers).webp({quality:90,alphaQuality:100,effort:6}).toFile('src/art/runtime/forest-life.webp');
await writeFile('src/art/forest-life-sizes.json',JSON.stringify(sizes));
console.log('Packed weathered forest props, grass and sheep.');
await sharp('src/art/forest-ground.png').resize(1024,1024).webp({quality:90,effort:6}).toFile('src/art/runtime/forest-ground.webp');
