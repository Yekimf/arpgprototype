import {test,expect} from '@playwright/test';

test('female painted arm segments have no transparent cuts between their joints',async({page})=>{
 await page.goto('/');
 await page.waitForFunction(()=>window.__reliquary?.snapshot().artLoaded);
 const failures=await page.evaluate(async()=>{
  const [{GuardSprites},{paintLimb}]=await Promise.all([import('/src/guard-sprites.js'),import('/src/player-limbs.js')]);
  const guard=new GuardSprites();await guard.femaleArt.decode();guard.sex='female';guard.skin=null;
  const failures=[];
  for(const back of [false,true])for(const arm of [0,1])for(const part of ['upper','lower']){
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;const c=canvas.getContext('2d');
   // Isolate the limb: an opaque cloak, hand or weapon must not conceal a hole.
   paintLimb(c,guard,{from:{x:160,y:80},to:{x:160,y:180},part,look:'leather',back,arm});
   const data=c.getImageData(0,0,320,320).data;
   for(let y=85;y<=175;y+=5){
    let solid=0;for(let x=157;x<=163;x++)if(data[(y*320+x)*4+3]>220)solid++;
    if(solid<3)failures.push({back,arm,part,y,solid});
   }
  }
  return failures;
 });
 expect(failures,'every sleeve/bracer must cover the corridor between its own joints').toEqual([]);
});

test('female wrists and both legs remain connected to the body during carries, walking and attacks',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/');
 await page.waitForFunction(()=>window.__reliquary?.snapshot().artLoaded);
 const result=await page.evaluate(async()=>{
  const [{GuardSprites},{FEMALE_GUARD_FACE},{createPlayer},{BASES,weaponIconIndex,appearanceOf},{facingPose,walkingLeg},{weaponMode}]=await Promise.all([
   import('/src/guard-sprites.js'),import('/src/guard-layout.js'),import('/src/game.js'),import('/src/itemization.js'),import('/src/locomotion.js'),import('/src/player-animation.js'),
  ]);
  const guard=new GuardSprites();await Promise.all([guard.art,guard.femaleArt,guard.setArt,guard.femaleSetArt,guard.weapons,guard.items,guard.original].map(image=>image.decode()));
  const failures=[];let checked=0;
  const equipment=[null,...['sword','greatsword','staff','bow'].map(id=>BASES.find(base=>base.id===id))];
  for(const base of equipment)for(const row of [0,3,5,8,11,13])for(const [action,frame,count]of [['idle',0,1],['walk',4,16],['walk',12,16],['attack',3,8]]){
   const player=createPlayer({sex:'female'});player.level=100;player.attributes={might:999,dexterity:999,vitality:999,will:999};
   player.equipment.armor={id:'continuity-leather',slot:'armor',look:'leather',rarity:'normal',identified:true,requiredLevel:1,requiredStats:{might:0}};
   player.equipment.shield=null;player.equipment.helm=null;player.equipment.gloves=null;
   player.equipment.weapon=base?{...base,id:base.id,weaponIcon:weaponIconIndex(base),rarity:'normal',identified:true,requiredLevel:1,requiredStats:{might:0}}:null;
   const angle=row*Math.PI/8,direction=facingPose({x:Math.sin(angle)-2*Math.cos(angle),y:-Math.sin(angle)-2*Math.cos(angle)}),back=direction.back,face=FEMALE_GUARD_FACE[back?'back':'front'];
   const state={action:!base&&action==='attack'?'punch':action,frame,count:!base&&action==='attack'?6:count,mode:weaponMode(appearanceOf(player))};
   const canvas=guard.frame(player,back,action==='idle'?0:action==='walk'?frame+1:frame+17,direction.forward,direction,state),width=canvas.width,height=canvas.height,data=canvas.getContext('2d').getImageData(0,0,width,height).data;
   const project=point=>({x:Math.round(64+.8*(160+direction.profile*(point.x-160))),y:Math.round(40+.8*point.y)});
   const near=(point,radius=3)=>{const p=project(point),out=[];for(let y=p.y-radius;y<=p.y+radius;y++)for(let x=p.x-radius;x<=p.x+radius;x++)if(x>=0&&x<width&&y>=0&&y<height&&data[(y*width+x)*4+3]>100)out.push(y*width+x);return out;};
   const root=near({x:180,y:145}),seen=new Uint8Array(width*height),queue=[];
   if(root.length){seen[root[0]]=1;queue.push(root[0]);}
   // A connected alpha silhouette rejects detached boots, disappearing shins,
   // and floating hands without comparing against the compositor's clip masks.
   for(let index=0;index<queue.length;index++){
    const point=queue[index],x=point%width,y=Math.floor(point/width);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const nx=x+dx,ny=y+dy,next=ny*width+nx;
     if(nx<0||nx>=width||ny<0||ny>=height||seen[next]||data[next*4+3]<=100)continue;
     seen[next]=1;queue.push(next);
    }
   }
   const targets=canvas.composition.hands.flatMap((hand,index)=>[[`arm ${index} elbow`,hand.elbow],[`arm ${index} wrist`,hand.wrist]]);
   for(let leg=0;leg<2;leg++){
    const part=face.legs[leg],step=action==='walk'?walkingLeg(frame/16*Math.PI*2,leg,face):null,spread=(back?5:16)*(leg===0?-1:1),hipY=part.hip[1]*320,ankleY=part.ankle[1]*320;
    for(const joint of ['knee','ankle']){const [x,y]=part[joint].map(n=>n*320);targets.push([`leg ${leg} ${joint}`,{x:x+spread*(y-hipY)/(ankleY-hipY)+(step?.x||0),y:y+(step?.y||0)}]);}
   }
   const label=`${base?.id||'unarmed'} direction ${row} ${state.action}/${frame}`;
   // Landmarks measured on the source painting, including cloth that the old
   // male-derived masks cut away. They are independent of the current polygons.
   for(const [part,x,y]of back?[['hair/scarf',141,70]]:[['shoulder/scarf',141,80],['skirt edge',132,174],['left cloth tail',119,223]]){
    if(!near({x,y},1).length)failures.push({label,part:'cut out '+part,point:{x,y}});
   }
   if(!root.length)failures.push({label,part:'torso missing'});
   for(const [part,point]of targets){const pixels=near(point);if(!pixels.length||!pixels.some(pixel=>seen[pixel]))failures.push({label,part,point,opaquePixels:pixels.length});}
   checked++;
  }
  return {failures,checked};
 });
 expect(result.failures).toEqual([]);
 expect(result.checked).toBe(120);
});
