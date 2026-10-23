import sharp from 'sharp';
await sharp('src/art/skill-paintings.png').resize(768,768,{fit:'fill'}).webp({quality:89,effort:6}).toFile('src/art/runtime/skill-paintings.webp');
await sharp('src/art/equipment-relief.png').resize(600,450,{fit:'fill'}).webp({quality:86,effort:6}).toFile('src/art/runtime/equipment-relief.webp');
await sharp('src/art/menu-crest.png').trim({threshold:8}).resize(700,220,{fit:'inside'}).webp({quality:86,alphaQuality:100,effort:6}).toFile('src/art/runtime/menu-crest.webp');
