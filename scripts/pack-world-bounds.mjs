import sharp from 'sharp';import{writeFile}from'node:fs/promises';
const art=sharp('src/art/runtime/world-atlas.webp'),{width,height}=await art.metadata(),bounds={};
for(let i=7;i<16;i++){const left=Math.round(i%4*width/4),top=Math.round(Math.floor(i/4)*height/4),w=Math.round((i%4+1)*width/4)-left,h=Math.round((Math.floor(i/4)+1)*height/4)-top;const{data,info}=await art.clone().extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let bottom=0;for(let y=0;y<h;y++){let solid=0;for(let x=0;x<w;x++)if(data[(y*w+x)*info.channels+3]>100)solid++;if(solid>w*.025)bottom=y;}bounds[i]=+(1-(bottom+1)/h).toFixed(5);}
await writeFile('src/world-bounds.js','export const WORLD_FOOT_OFFSETS='+JSON.stringify(bounds)+';\n');console.log(bounds);
