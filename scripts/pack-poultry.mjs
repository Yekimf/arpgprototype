import sharp from 'sharp';
for(const name of ['chicken-breeds','chicken-treasures']){
 const src='src/art/'+name+'.png',meta=await sharp(src).metadata(),cells=[];
 for(let i=0;i<12;i++){
  const x=Math.round(i%4*meta.width/4),y=Math.round(Math.floor(i/4)*meta.height/3),right=Math.round((i%4+1)*meta.width/4),bottom=Math.round((Math.floor(i/4)+1)*meta.height/3);
  let crop;
  if(name==='chicken-treasures'&&i<2){const crate='src/art/stick-crates.png',m=await sharp(crate).metadata(),left=Math.round(i*m.width/2);crop=await sharp(crate).extract({left,top:0,width:Math.round((i+1)*m.width/2)-left,height:m.height}).png().toBuffer();}
  else crop=await sharp(src).extract({left:x,top:y,width:right-x,height:bottom-y}).png().toBuffer();
  const cell=await sharp(crop).trim({threshold:8}).resize(236,236,{fit:'contain',background:'#0000'}).png().toBuffer();cells.push({input:cell,left:i%4*256+10,top:Math.floor(i/4)*256+10});
 }
 await sharp({create:{width:1024,height:768,channels:4,background:'#0000'}}).composite(cells).webp({quality:85,alphaQuality:95,effort:6}).toFile('src/art/runtime/'+name+'.webp');
}
