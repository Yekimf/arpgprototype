import sharp from 'sharp';
await sharp('src/art/stone-column.png').trim({threshold:10}).resize({height:320}).webp({quality:86}).toFile('src/art/runtime/stone-column.webp');
