import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
// Unpack connected sprite islands: attack weapons cross the nominal row lines.
// Keep one scale per family across both views and anchor every frame at its feet.
const frames={};
for(const side of ['front','back']){
 const {data,info}=await sharp(`src/art/enemies-${side}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true}),w=info.width,h=info.height,cellWidth=w/4,cellHeight=h/6;
 frames[side]=Array.from({length:6},()=>[]);
 const labels=new Int32Array(w*h),components=[];let id=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const start=y*w+x;if(labels[start]||data[start*4+3]<8)continue;
  id++;labels[start]=id;const queue=[start],c={id,n:0,left:x,right:x,top:y,bottom:y,sx:0,sy:0};
  for(let k=0;k<queue.length;k++){
   const at=queue[k],px=at%w,py=Math.floor(at/w);c.n++;c.sx+=px;c.sy+=py;c.left=Math.min(c.left,px);c.right=Math.max(c.right,px);c.top=Math.min(c.top,py);c.bottom=Math.max(c.bottom,py);
   for(const[nx,ny]of [[px-1,py],[px+1,py],[px,py-1],[px,py+1]])if(nx>=0&&nx<w&&ny>=0&&ny<h){const next=ny*w+nx;if(!labels[next]&&data[next*4+3]>=8){labels[next]=id;queue.push(next);}}
  }components.push(c);
 }
 const bodies=components.sort((a,b)=>b.n-a.n).slice(0,24);if(bodies.length!==24||bodies.some(c=>c.n<5000))throw Error(`Incomplete ${side} sheet`);
 for(const c of bodies){
  const col=Math.min(3,Math.floor(c.sx/c.n/cellWidth)),row=Math.min(5,Math.floor(c.sy/c.n/cellHeight));if(frames[side][row][col])throw Error(`Merged or misplaced ${side}/${row}/${col}`);
  const width=c.right-c.left+1,height=c.bottom-c.top+1,pixels=Buffer.alloc(width*height*4);
  for(let y=c.top;y<=c.bottom;y++)for(let x=c.left;x<=c.right;x++)if(labels[y*w+x]===c.id){const from=(y*w+x)*4,to=((y-c.top)*width+x-c.left)*4;data.copy(pixels,to,from,from+4);}
  frames[side][row][col]={pixels,width,height,left:c.left-col*cellWidth,center:cellWidth/2};
 }
}

const scales=Array.from({length:6},(_,row)=>Math.min(...['front','back'].flatMap(side=>frames[side][row].map(f=>Math.min(112/f.height,56/Math.max(f.center-f.left,f.left+f.width-f.center)))))),bases={};
for(const side of ['front','back']){
 const tiles=[];bases[side]=[];
 for(let row=0;row<6;row++){bases[side][row]=[];for(let col=0;col<4;col++){
  const f=frames[side][row][col],scale=scales[row],width=Math.round(f.width*scale),height=Math.round(f.height*scale),left=Math.round(64+(f.left-f.center)*scale),top=120-height;
  if(left<0||left+width>128||top<0)throw Error(`Sprite exceeds ${side}/${row}/${col}`);
  const sprite=await sharp(f.pixels,{raw:{width:f.width,height:f.height,channels:4}}).resize(width,height).png().toBuffer();
  const tile=await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([{input:sprite,left,top}]).png().toBuffer();
  const {data}=await sharp(tile).raw().toBuffer({resolveWithObject:true});let foot=119;for(let y=127;y>=0;y--){let n=0;for(let x=0;x<128;x++)if(data[(y*128+x)*4+3]>100)n++;if(n>2){foot=y;break;}}
  bases[side][row][col]=+(1-(foot+1)/128).toFixed(5);tiles.push({input:tile,left:col*128,top:row*128});
 }}
 await sharp({create:{width:512,height:768,channels:4,background:'#00000000'}}).composite(tiles).webp({quality:87,alphaQuality:100,effort:6}).toFile(`src/art/runtime/enemies-${side}.webp`);
}
await writeFile('src/enemy-baselines.js','export const ENEMY_BASELINES='+JSON.stringify(bases)+';\n');
console.log('Packed 48 directional frames, preserving weapons, family scale and foot anchors.');
