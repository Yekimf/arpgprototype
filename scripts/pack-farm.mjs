import sharp from 'sharp';
await sharp('src/art/farm-atlas.png').resize({width:1280}).webp({quality:88,alphaQuality:100,effort:6}).toFile('src/art/runtime/farm-atlas.webp');
console.log('Packed Widow’s Fields and Tithe Granary art.');
