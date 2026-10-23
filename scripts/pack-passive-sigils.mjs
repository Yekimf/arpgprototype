import sharp from 'sharp';
const cells={basic:0,steel:2,cinder:12,rime:21,storm:24,blood:6,well:26};
for(const [name,index] of Object.entries(cells))await sharp('src/art/runtime/skill-paintings.webp').extract({left:index%6*128,top:Math.floor(index/6)*128,width:128,height:128}).resize(64,64).webp({quality:84}).toFile(`src/art/runtime/passive-${name}.webp`);
