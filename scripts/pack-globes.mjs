import sharp from 'sharp';
await sharp(new URL('../src/art/globe-frame.png',import.meta.url).pathname).resize(400,400,{fit:'contain'}).webp({quality:86}).toFile(new URL('../src/art/runtime/globe-frame.webp',import.meta.url).pathname);
