import sharp from 'sharp';
await sharp('src/art/marchgate.png').resize({width:1280}).webp({quality:88,alphaQuality:100,effort:6}).toFile('src/art/runtime/marchgate.webp');
await sharp('src/art/quest-seals.png').resize(960,640).webp({quality:90,alphaQuality:100,effort:6}).toFile('src/art/runtime/quest-seals.webp');
