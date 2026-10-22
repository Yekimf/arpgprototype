import sharp from 'sharp';
const source='src/art/chronicle-outline.png',{width,height}=await sharp(source).metadata();
for(let i=0;i<6;i++){const x=Math.round((i%2)*width/2),y=Math.round(Math.floor(i/2)*height/3),right=Math.round((i%2+1)*width/2),bottom=Math.round((Math.floor(i/2)+1)*height/3);await sharp(source).extract({left:x+6,top:y+5,width:right-x-12,height:bottom-y-10}).webp({lossless:true,effort:6}).toFile(`src/art/runtime/outline-${i+1}.webp`);}
