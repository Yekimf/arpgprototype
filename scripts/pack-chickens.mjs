import sharp from 'sharp';
await sharp('src/art/chickens.png').resize(512,256,{fit:'fill'}).webp({quality:86,alphaQuality:100,effort:6}).toFile('src/art/runtime/chickens.webp');
