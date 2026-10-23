import sharp from 'sharp';
const input='src/art/equipment-materials.png',{width,height}=await sharp(input).metadata(),tiles=[];
for(let i=0;i<9;i++){
 const left=Math.round(i%3*width/3),top=Math.round(Math.floor(i/3)*height/3),right=Math.round((i%3+1)*width/3),bottom=Math.round((Math.floor(i/3)+1)*height/3);
 const cell=await sharp(input).extract({left,top,width:right-left,height:bottom-top}).png().toBuffer();
 const image=await sharp(cell).trim({threshold:4}).resize(240,240,{fit:'contain',background:'#00000000'}).png().toBuffer();tiles.push({input:image,left:i%3*256+8,top:Math.floor(i/3)*256+8});
}
await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite(tiles).webp({quality:88}).toFile('src/art/runtime/equipment-materials.webp');
