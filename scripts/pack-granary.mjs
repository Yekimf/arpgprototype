import sharp from 'sharp';
const source='src/art/granary-props.png',m=await sharp(source).metadata(),parts=[];
for(let n=0;n<8;n++){const x=n%4,y=Math.floor(n/4),cuts=[0,Math.floor(m.height/2),m.height],left=Math.floor(x*m.width/4),top=cuts[y],width=Math.floor((x+1)*m.width/4)-left,height=cuts[y+1]-top;const extracted=await sharp(source).extract({left,top,width,height}).toBuffer();const crop=await sharp(extracted).trim({threshold:16}).resize(240,232,{fit:'inside'}).toBuffer(),size=await sharp(crop).metadata();parts.push({input:crop,left:x*256+Math.floor((256-size.width)/2),top:y*256+244-size.height});}
await sharp({create:{width:1024,height:512,channels:4,background:'#00000000'}}).composite(parts).webp({quality:86}).toFile('src/art/runtime/granary-props.webp');
await sharp('src/art/granary-ground.png').resize(1024,1024).webp({quality:88}).toFile('src/art/runtime/granary-ground.webp');
