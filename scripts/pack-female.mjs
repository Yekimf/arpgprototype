import sharp from 'sharp';
await sharp('src/art/female-guard-equipment.png').resize({width:1280}).webp({quality:89,alphaQuality:100,effort:6}).toFile('src/art/runtime/female-guard-equipment.webp');
console.log('Packed female guard equipment atlas.');
