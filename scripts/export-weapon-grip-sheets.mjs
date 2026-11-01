// Export the actual layered guard renderer as transparent, editable PNG sheets.
// Run: node scripts/export-weapon-grip-sheets.mjs [output-directory]
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createServer} from 'vite';
import {chromium} from '@playwright/test';

const output=resolve(process.argv[2]||'docs/previews/weapon-grip-sheets');
await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false}});
let browser;
try{
 await server.listen();
 const port=server.httpServer.address().port;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.goto(`http://127.0.0.1:${port}/`);
 const weapons=await page.evaluate(async()=>{
  const [{GuardSprites},{BASES,weaponIconIndex,appearanceOf},{createPlayer},{facingPose},{weaponMode}]=await Promise.all([
   import('/src/guard-sprites.js'),import('/src/itemization.js'),import('/src/game.js'),import('/src/locomotion.js'),import('/src/player-animation.js')]);
  const guard=new GuardSprites();
  await Promise.all([guard.art,guard.femaleArt,guard.setArt,guard.femaleSetArt,guard.weapons,guard.items,guard.original].map(image=>image.decode()));
  const weapons=BASES.filter(base=>base.slot==='weapon').sort((a,b)=>weaponIconIndex(a)-weaponIconIndex(b));
  window.__gripExport={guard,weapons,weaponIconIndex,appearanceOf,createPlayer,facingPose,weaponMode};
  return weapons.map(base=>({id:base.id,name:base.name,icon:weaponIconIndex(base),look:base.look,twoHanded:!!base.twoHanded,ranged:!!base.ranged}));
 });
 const manifest={version:1,description:'Actual in-game male and female guard composites, with leather armor and no shield.',frameSize:{width:192,height:176},sheetSize:{width:1728,height:2816},layout:'16 direction rows (north clockwise); 9 columns: idle, attack frames 0 through 7',directions:Array.from({length:16},(_,index)=>({index,screenAngleDegrees:index*22.5})),columns:[{index:0,action:'idle',frame:0},...Array.from({length:8},(_,frame)=>({index:frame+1,action:'attack',frame}))],weapons,sheets:[]};
 for(const sex of ['male','female'])for(const weapon of weapons){
  const data=await page.evaluate(({sex,weaponId})=>{
   const {guard,weapons,weaponIconIndex,appearanceOf,createPlayer,facingPose,weaponMode}=window.__gripExport;
   const base=weapons.find(item=>item.id===weaponId),player=createPlayer({sex});
   player.level=100;player.attributes={might:999,dexterity:999,vitality:999,will:999};
   player.equipment.armor={id:'export-leather',slot:'armor',look:'leather',rarity:'normal',identified:true,requiredLevel:1,requiredStats:{might:0}};
   player.equipment.shield=null;
   player.equipment.weapon={...base,id:base.id,weaponIcon:weaponIconIndex(base),rarity:'normal',identified:true,requiredLevel:1,requiredStats:{might:0}};
   const look=appearanceOf(player),canvas=document.createElement('canvas');canvas.width=9*192;canvas.height=16*176;
   const c=canvas.getContext('2d'),grips=[];
   for(let row=0;row<16;row++){
    const angle=row*Math.PI/8,direction=facingPose({x:Math.sin(angle)-2*Math.cos(angle),y:-Math.sin(angle)-2*Math.cos(angle)});
    for(let column=0;column<9;column++){
     const action=column?'attack':'idle',frame=column?column-1:0,state={action,frame,count:column?8:1,mode:weaponMode(look)};
     const sprite=guard.frame(player,direction.back,column?17+frame:0,direction.forward,direction,state);
     c.drawImage(sprite,column*192,row*176);
     const rig=sprite.composition,point=hand=>({x:Math.round(32+.4*(160+direction.profile*(hand.x-160))),y:Math.round(20+.4*hand.y)});
     grips.push({row,column,weaponHand:rig.weapon.hand,primary:point(rig.hands[0].center),offhand:point(rig.hands[1].center),weaponAnchor:point(rig.weapon.anchor)});
    }
   }
   return {png:canvas.toDataURL('image/png').split(',')[1],grips};
  },{sex,weaponId:weapon.id});
  const filename=`${sex}-${String(weapon.icon).padStart(2,'0')}-${weapon.id}.png`;
  await writeFile(join(output,filename),Buffer.from(data.png,'base64'));
  manifest.sheets.push({file:filename,sex,weaponId:weapon.id,icon:weapon.icon,grips:data.grips});
  console.log(`Exported ${filename}`);
 }
 await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await writeFile(join(output,'README.txt'),`The Forgotten Kingdom — editable weapon grip sprite sheets\n\n32 transparent PNGs: one for each of 16 weapons and two character models.\nEvery sheet is 1728 × 2816 pixels, arranged as 16 direction rows and 9 animation columns.\nEach cell is 192 × 176 pixels. Row 0 faces north (rear); row 8 faces south (front).\nColumn 0 is idle. Columns 1–8 are the eight attack frames.\nmanifest.json gives the weapon names and exact hand and hilt anchors in each cell.\nThe two weapon-models comparison images show the front and rear idle poses.\n\nThese are exports of the current layered renderer. Editing a PNG does not yet change the game automatically; send back the edited sheets or cells to integrate them. The original source atlases are also included.\n`);
 for(const name of ['guard-equipment.png','guard-female.png','weapons-atlas.png','weapon-bounds.json'])await copyFile(resolve('src/art',name),join(output,name));
 for(const sex of ['male','female'])await copyFile(resolve('docs/previews',`weapon-models-${sex}.png`),join(output,`weapon-models-${sex}.png`));
}finally{if(browser)await browser.close();await server.close();}
