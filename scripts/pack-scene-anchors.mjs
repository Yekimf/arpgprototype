import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
async function baseline(file,index=null){
 let art=sharp(file);const {width,height}=await art.metadata();
 if(index!==null)art=art.extract({left:Math.round(index%4*width/4),top:Math.round(Math.floor(index/4)*height/4),width:Math.round(width/4),height:Math.round(height/4)});
 const {data,info}=await art.ensureAlpha().raw().toBuffer({resolveWithObject:true});let bottom=info.height-1;
 for(let y=info.height-1;y>=0;y--){let solid=0;for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*info.channels+3]>128)solid++;if(solid>info.width*.025){bottom=y;break;}}
 return +(1-(bottom+1)/info.height).toFixed(5);
}
const farm={};for(let i=4;i<16;i++)farm[i]=await baseline('src/art/runtime/farm-atlas.webp',i);
const gates={outer:await baseline('src/art/runtime/marchgate.webp'),inner:await baseline('src/art/runtime/marchgate-inner.webp'),stash:await baseline('src/art/runtime/stash-chest.webp')};
await writeFile('src/scene-anchors.js',`export const FARM_BASELINES=${JSON.stringify(farm)};\nexport const SCENE_BASELINES=${JSON.stringify(gates)};\n`);console.log({farm,gates});
