import sharp from 'sharp';
// Six independent full-screen parchment illustrations, with no atlas seams.
for(let i=1;i<=6;i++)await sharp(`src/art/chronicle/scene-${i}.png`).resize(1536,864,{fit:'cover',position:'centre'}).webp({quality:88,effort:6}).toFile(`src/art/runtime/chronicle-${i}.webp`);
