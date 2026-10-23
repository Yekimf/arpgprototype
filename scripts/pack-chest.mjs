import sharp from 'sharp';
await sharp('src/art/stash-chest.png').trim({threshold:8}).resize(220,180,{fit:'inside'}).webp({quality:88,alphaQuality:100,effort:6}).toFile('src/art/runtime/stash-chest.webp');
