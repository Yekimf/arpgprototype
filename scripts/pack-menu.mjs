import sharp from 'sharp';
// Crop the three isolated illustrations; preserve the artist's alpha channel.
await sharp('src/art/title-landscape.png').resize({width:1536}).webp({quality:86,effort:6}).toFile('src/art/runtime/title-landscape.webp');
for(const [name,rect,width] of [
 ['title-logo',{left:105,top:0,width:1326,height:550},1060],
 ['menu-button',{left:105,top:552,width:1326,height:220},1060],
 ['menu-button-lit',{left:105,top:774,width:1326,height:220},1060],
])await sharp('src/art/menu-artwork.png').extract(rect).resize({width}).webp({quality:90,alphaQuality:100,effort:6}).toFile(`src/art/runtime/${name}.webp`);
