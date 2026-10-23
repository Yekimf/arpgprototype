import sharp from 'sharp';
await sharp('src/art/equipment-etchings.png').resize(384,384).modulate({saturation:.25}).webp({quality:86,effort:6}).toFile('src/art/runtime/equipment-etchings.webp');
