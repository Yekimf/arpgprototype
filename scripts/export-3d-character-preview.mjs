// Export actual 3D front/rear equipment renders, using the same stage as play.
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from '@playwright/test';
const server=await createServer({server:{host:'127.0.0.1',port:5174,strictPort:false}});
let browser;
try{
 await server.listen();browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
 const previews=await page.evaluate(async()=>{
  const [{Character3D},{createPlayer},{BASES,weaponIconIndex}]=await Promise.all([import('/src/character-3d.js'),import('/src/game.js'),import('/src/itemization.js')]);
  const renderer=new Character3D(),previews={};
  for(const sex of ['male','female']){
   const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=900;const c=canvas.getContext('2d');c.fillStyle='#e4e3df';c.fillRect(0,0,1280,900);
   for(const base of BASES.filter(b=>b.slot==='weapon'))for(const back of [false,true]){
    const p=createPlayer({sex});p.level=100;p.attributes={might:999,dexterity:999,vitality:999,will:999};p.equipment.helm=null;p.equipment.shield=null;
    p.equipment.armor={id:'preview-armor',slot:'armor',look:'leather',rarity:'normal',identified:true};
    p.equipment.weapon={...base,weaponIcon:weaponIconIndex(base),rarity:'normal',identified:true};
    const frame=renderer.render({player:p,facing:back?{x:-1,y:-1}:{x:1,y:1},moving:false,attackAnim:0});if(!frame)throw Error('3D preview requires WebGL');
    const sample=document.createElement('canvas');sample.width=384;sample.height=352;const sc=sample.getContext('2d');sc.drawImage(frame.canvas,0,0);const pixels=sc.getImageData(0,0,384,352).data;
    let x1=384,y1=352,x2=0,y2=0;for(let y=0;y<352;y++)for(let x=0;x<384;x++)if(pixels[(y*384+x)*4+3]>20){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}
    const index=weaponIconIndex(base),x=index%4*320+(back?160:0),y=Math.floor(index/4)*225,w=x2-x1+1,h=y2-y1+1,scale=Math.min(148/w,192/h);
    c.drawImage(sample,x1,y1,w,h,x+80-w*scale/2,y+205-h*scale,w*scale,h*scale);
    c.fillStyle='#4e4840';c.font='11px Georgia';c.textAlign='center';c.fillText(base.name,x+80,y+220);
   }
   previews[sex]=canvas.toDataURL().split(',')[1];
  }
  renderer.dispose();return previews;
 });
 await mkdir('docs/previews',{recursive:true});
 for(const [sex,png]of Object.entries(previews)){const path=`docs/previews/character-3d-${sex}.png`;await writeFile(path,Buffer.from(png,'base64'));console.log(path);}
}finally{await browser?.close();await server.close();}
