import sharp from 'sharp';
import {mkdir,stat} from 'node:fs/promises';
await mkdir('src/art/runtime',{recursive:true});
for(const name of ['world-atlas','items-atlas','campaign-atlas','world-map']){
 const size=['world-map'].includes(name)?1536:name==='orb-frame'?640:1536;
 await sharp(`src/art/${name}.png`).resize({width:size,withoutEnlargement:true}).webp({quality:name==='prologue'?86:81,alphaQuality:90,effort:6}).toFile(`src/art/runtime/${name}.webp`);
 console.log(name,Math.round((await stat(`src/art/runtime/${name}.webp`)).size/1024)+' KiB');
}
