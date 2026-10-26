import sharp from 'sharp';
const image=sharp('src/art/ui-ornaments.png'),meta=await image.metadata(),sx=meta.width/1536,sy=meta.height/1024;
for(const [name,x,y,w,h,width]of [['crown',0,180,1060,340,800],['guardian',1070,0,420,610,300],['divider',0,650,1060,300,800],['raven',1070,600,460,424,320]])await image.clone().extract({left:Math.round(x*sx),top:Math.round(y*sy),width:Math.round(w*sx),height:Math.round(h*sy)}).resize({width}).webp({quality:85}).toFile('src/art/runtime/ui-'+name+'.webp');
