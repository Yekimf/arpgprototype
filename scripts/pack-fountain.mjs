import sharp from 'sharp';
await sharp('src/art/waypoint-fountain.png').trim({threshold:8}).resize(240,340,{fit:'inside'}).webp({quality:88,alphaQuality:100,effort:6}).toFile('src/art/runtime/waypoint-fountain.webp');
