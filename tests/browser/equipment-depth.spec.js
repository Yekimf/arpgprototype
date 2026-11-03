import {test,expect} from '@playwright/test';

test('rear bodies occlude held weapons while front grips and exposed blades remain visible',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/');
 await page.waitForFunction(()=>window.__reliquary?.snapshot().artLoaded);
 const result=await page.evaluate(async()=>{
  const [{GuardSprites,GUARD_FRAME},{GUARD_LAYOUT,FEMALE_GUARD_FACE},{createPlayer},{BASES,appearanceOf,weaponIconIndex},{facingPose},{weaponMode}]=await Promise.all([
   import('/src/guard-sprites.js'),import('/src/guard-layout.js'),import('/src/game.js'),import('/src/itemization.js'),import('/src/locomotion.js'),import('/src/player-animation.js'),
  ]);
  const guard=new GuardSprites();
  await Promise.all([guard.art,guard.femaleArt,guard.setArt,guard.femaleSetArt,guard.weapons,guard.items,guard.original].map(image=>image.decode()));
  const paintWeapon=guard.weapon,failures=[],groups={},cases=[];
  const selected=['greatsword','warhammer','staff','battleaxe'].map(id=>BASES.find(base=>base.id===id));
  const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  const changed=(a,b,index)=>Math.max(...[0,1,2,3].map(channel=>Math.abs(a[index+channel]-b[index+channel])))>2;
  for(const sex of ['male','female'])for(const back of [false,true])for(const action of ['idle','attack'])for(const base of selected){
   const player=createPlayer({sex});
   player.level=100;player.attributes={might:999,dexterity:999,vitality:999,will:999};
   player.equipment.armor={id:'depth-leather',slot:'armor',look:'leather',rarity:'normal',identified:true,requiredLevel:1,requiredStats:{might:0}};
   player.equipment.shield=null;player.equipment.helm=null;player.equipment.gloves=null;
   player.equipment.weapon={...base,id:base.id,weaponIcon:weaponIconIndex(base),rarity:'normal',identified:true,requiredLevel:1,requiredStats:{might:0}};
   const look=appearanceOf(player),direction=facingPose(back?{x:-1,y:-1}:{x:1,y:1});
   const state={action,frame:action==='idle'?0:3,count:action==='idle'?1:8,mode:weaponMode(look)};
   guard.cache.clear();guard.weapon=paintWeapon;
   const frame=guard.frame(player,back,action==='idle'?0:20,direction.forward,direction,state),visible=pixels(frame),rig=frame.composition;
   guard.cache.clear();guard.weapon=()=>{};
   const without=pixels(guard.frame(player,back,action==='idle'?0:20,direction.forward,direction,state));
   guard.weapon=paintWeapon;

   // Reconstruct the painted torso's opaque coverage, not a guessed rectangle.
   // Eroding it below excludes anti-aliased cloth edges from occlusion assertions.
   const face=sex==='female'?FEMALE_GUARD_FACE[back?'back':'front']:GUARD_LAYOUT[back?'back':'front'];
   const torsoMask=sex==='female'?GUARD_LAYOUT[back?'femaleBack':'femaleFront']:face.body;
   const canvas=()=>{const image=document.createElement('canvas');image.width=frame.width;image.height=frame.height;const context=image.getContext('2d'),scale=frame.width/GUARD_FRAME.width;context.translate(32*scale,20*scale);context.scale(.4*scale,.4*scale);context.translate(160,0);context.scale(direction.profile,1);context.translate(-160,0);return {image,context};};
   const torso=canvas();guard.sex=sex;guard.skin=null;
   guard.clipTile(torso.context,back?3:2,torsoMask);
   guard.skin=look.setParts.armor;guard.clipTile(torso.context,(sex==='female'?2:4)+(back?1:0),torsoMask,sex==='female'?null:face.shield);guard.skin=null;
   const body=pixels(torso.image),weapon=canvas();
   paintWeapon.call(guard,weapon.context,look.weapon,back,[rig.weapon.anchor.x/320,rig.weapon.anchor.y/320],look.weaponIcon,rig.weapon.angle,state.action);
   const item=pixels(weapon.image),width=frame.width,height=frame.height;
   let overlap=0,coveredChanges=0,exposedChanges=0;
   for(let y=3;y<height-3;y++)for(let x=3;x<width-3;x++){
    const index=(y*width+x)*4;
    if(item[index+3]<180)continue;
    const inside=body[index+3]===255&&[-3,0,3].every(dy=>[-3,0,3].every(dx=>body[((y+dy)*width+x+dx)*4+3]===255));
    const differs=changed(visible,without,index);
    if(inside){overlap++;if(differs)coveredChanges++;}
    else if(body[index+3]===0&&differs)exposedChanges++;
   }
   const label=`${sex} ${back?'rear':'front'} ${base.id} ${action}`;
   if(back&&coveredChanges)failures.push({label,reason:'weapon paints through the opaque torso',overlap,coveredChanges});
   if(exposedChanges<8)failures.push({label,reason:'exposed weapon disappears',exposedChanges});
   const key=`${sex}/${back?'rear':'front'}/${action}`;
   groups[key]??={overlap:0,coveredChanges:0};groups[key].overlap+=overlap;groups[key].coveredChanges+=coveredChanges;
   cases.push({label,overlap,coveredChanges,exposedChanges});
  }
  for(const [label,counts]of Object.entries(groups)){
   if(counts.overlap<20)failures.push({label,reason:'no meaningful weapon/body overlap was exercised',...counts});
   if(label.includes('/front/')&&counts.coveredChanges<20)failures.push({label,reason:'front weapons are hidden by the chest',...counts});
  }
  return {failures,groups,cases};
 });
 expect(result.failures,JSON.stringify(result,null,2)).toEqual([]);
 expect(result.cases).toHaveLength(32);
});
