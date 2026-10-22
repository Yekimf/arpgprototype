import sharp from 'sharp';
// Six independent cinema frames. Keep the prince's face and final gate silhouettes
// inside the wide crop instead of blindly centering these two illustrations.
for(let i=1;i<=6;i++){
 const source=`src/art/chronicle/scene-${i}.png`,meta=await sharp(source).metadata(),height=Math.round(meta.height*1536/meta.width);
 const top=i===2?40:i===6?50:Math.floor((height-654)/2);
 await sharp(source).resize({width:1536}).extract({left:0,top,width:1536,height:654}).webp({quality:88,effort:6}).toFile(`src/art/runtime/chronicle-${i}.webp`);
}
