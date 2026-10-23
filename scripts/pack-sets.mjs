import sharp from 'sharp';
await sharp('src/art/set-models.png').resize(1280,640,{fit:'fill'}).webp({quality:89,alphaQuality:100,effort:6}).toFile('src/art/runtime/set-models.webp');
await sharp('src/art/set-items.png').resize(768,512,{fit:'fill'}).webp({quality:89,effort:6}).toFile('src/art/runtime/set-items.webp');
