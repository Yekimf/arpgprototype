import {test,expect} from '@playwright/test';

test('3D equipment stays on actual hand joints across male/female facings and attacks',async({page})=>{
 test.setTimeout(120000);await page.goto('/');
 const result=await page.evaluate(async()=>{
  const [{Character3D},{createPlayer},{BASES,weaponIconIndex},{Vector3}]=await Promise.all([import('/src/character-3d.js'),import('/src/game.js'),import('/src/itemization.js'),import('/node_modules/three/build/three.module.js')]);
  const renderer=new Character3D(),failures=[],hashes=new Set();let checked=0;
  const output=document.createElement('canvas');output.width=384;output.height=352;const c=output.getContext('2d');
  for(const sex of ['male','female'])for(const base of BASES.filter(b=>b.slot==='weapon'))for(const facing of [{x:1,y:1},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1}])for(const action of ['idle','walk','attack']){
   const player=createPlayer({sex});player.level=100;player.attributes={might:999,dexterity:999,vitality:999,will:999};player.equipment.shield=null;player.equipment.helm=null;
   player.equipment.weapon={...base,weaponIcon:weaponIconIndex(base),rarity:'normal',identified:true};
   const frame=renderer.render({player,facing,actionFacing:facing,moving:action==='walk',walkPhase:4,attackAnim:action==='attack'?.20:0,attackDuration:.5});
   if(!frame)return {failures:['WebGL did not initialize'],checked};
   const model=renderer.current,hand=model.arms[base.look==='bow'?1:0].wrist.getWorldPosition(new Vector3()),anchor=model.weapon.getWorldPosition(new Vector3());
   const label=`${sex}/${base.id}/${JSON.stringify(facing)}/${action}`;
   if(hand.distanceTo(anchor)>1e-6)failures.push([label,'weapon detached']);
   if(base.twoHanded&&base.look!=='bow'){
    const point=base.look==='crossbow'?new Vector3(0,.10,.19):new Vector3(0,base.look==='greatsword'?.13:.25,0);
    const grip=model.weapon.localToWorld(point),support=model.arms[1].wrist.getWorldPosition(new Vector3());
    if(grip.distanceTo(support)>.006)failures.push([label,'support hand detached',grip.distanceTo(support)]);
   }
   if(action==='idle'){
    c.clearRect(0,0,384,352);c.drawImage(frame.canvas,0,0);const pixels=c.getImageData(0,0,384,352).data;let opaque=0,hash=2166136261;
    for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]>100)opaque++;hash=Math.imul(hash^pixels[i],16777619);}
    if(opaque<900)failures.push([label,'empty or incomplete render',opaque]);hashes.add(hash>>>0);
   }
   checked++;
  }
  const count=renderer.renders;renderer.render({player:createPlayer(),facing:{x:1,y:1},moving:false,attackAnim:0});
  const next=renderer.renders;renderer.render({player:createPlayer(),facing:{x:1,y:1},moving:false,attackAnim:0});
  const cached=next===renderer.renders,armorHashes=[];
  for(const look of ['none','leather','chain','plate','robe']){
   const player=createPlayer();player.level=100;player.attributes={might:999,dexterity:999,vitality:999,will:999};player.equipment.armor=look==='none'?null:{id:'armor-test',slot:'armor',look,rarity:'normal',identified:true};
   const frame=renderer.render({player,facing:{x:1,y:1},moving:false,attackAnim:0});c.clearRect(0,0,384,352);c.drawImage(frame.canvas,0,0);let hash=2166136261;
   for(const value of c.getImageData(0,0,384,352).data)hash=Math.imul(hash^value,16777619);armorHashes.push(hash>>>0);
  }
  renderer.dispose();return {failures,checked,unique:hashes.size,cached,count,armorLooks:new Set(armorHashes).size};
 });
 expect(result.failures,JSON.stringify(result)).toEqual([]);expect(result.checked).toBe(384);expect(result.unique).toBeGreaterThan(80);expect(result.cached).toBe(true);expect(result.armorLooks).toBe(5);
});

test('3D is playable and the character style switch persists',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.locator('[data-front=create]').click();await page.locator('#character-name').fill('3D Loyalist');await page.locator('input[name=sex][value=female]').check();
 await page.locator('#creation-form button[type=submit]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);
 await expect.poll(()=>page.evaluate(()=>window.__reliquary.snapshot().animation.style)).toBe('3d-guard');
 const before=await page.evaluate(()=>window.__reliquary.snapshot().position);await page.keyboard.down('ArrowRight');
 await page.waitForFunction(p=>{const s=window.__reliquary.snapshot();return s.animation.action==='walk'&&Math.hypot(s.position.x-p.x,s.position.y-p.y)>.2;},before);await page.keyboard.up('ArrowRight');
 await page.keyboard.press('Escape');await page.locator('[data-action=options]').click();await page.locator('[data-option=characterModel]').selectOption('painted');
 await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__reliquary.snapshot().animation.style)).toBe('layered-guard');
 await page.reload();expect(await page.evaluate(()=>window.__reliquary.snapshot().settings.characterModel)).toBe('painted');expect(errors).toEqual([]);
});

test('unsupported WebGL falls back to the complete painted model',async({page})=>{
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args);};});
 await page.goto('/');await page.locator('[data-front=create]').click();await page.locator('#character-name').fill('Fallback');await page.locator('#creation-form button[type=submit]').click();await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.__reliquary.snapshot().loading);await expect.poll(()=>page.evaluate(()=>window.__reliquary.snapshot().animation.style)).toBe('layered-guard');
});

test('real mesh depth hides rear weapons behind the body and keeps front weapons visible',async({page})=>{
 await page.goto('/');
 const failures=await page.evaluate(async()=>{
  const [{Character3D},{createPlayer},{BASES,weaponIconIndex}]=await Promise.all([import('/src/character-3d.js'),import('/src/game.js'),import('/src/itemization.js')]);
  const renderer=new Character3D(),canvas=document.createElement('canvas');canvas.width=384;canvas.height=352;const c=canvas.getContext('2d'),failures=[];
  const pixels=game=>{renderer.stamp=null;const frame=renderer.render(game);c.clearRect(0,0,384,352);c.drawImage(frame.canvas,0,0);return c.getImageData(0,0,384,352).data;};
  for(const sex of ['male','female'])for(const rear of [false,true]){
   const player=createPlayer({sex});player.level=100;player.attributes={might:999,dexterity:999,vitality:999,will:999};player.equipment.shield=null;player.equipment.helm=null;
   const base=BASES.find(b=>b.id==='greatsword');player.equipment.weapon={...base,weaponIcon:weaponIconIndex(base),rarity:'normal',identified:true};
   const game={player,facing:rear?{x:-1,y:-1}:{x:1,y:1},moving:false,attackAnim:0},full=pixels(game),model=renderer.current;
   model.weapon.visible=false;const body=pixels(game);model.weapon.visible=true;
   const itemMeshes=new Set();model.weapon.traverse(o=>{if(o.isMesh)itemMeshes.add(o);});
   model.root.traverse(o=>{if(o.isMesh&&!itemMeshes.has(o))o.visible=false;});const item=pixels(game);
   model.root.traverse(o=>o.visible=true);
   let overlap=0,changes=0;
   for(let y=2;y<350;y++)for(let x=2;x<382;x++){
    const i=(y*384+x)*4;if(item[i+3]<220)continue;
    if(![-2,0,2].every(dy=>[-2,0,2].every(dx=>body[((y+dy)*384+x+dx)*4+3]===255)))continue;
    overlap++;if([0,1,2].some(k=>Math.abs(full[i+k]-body[i+k])>2))changes++;
   }
   if(overlap<20||rear&&changes>0||!rear&&changes<20)failures.push({sex,rear,overlap,changes});
  }
  renderer.dispose();return failures;
 });
 expect(failures).toEqual([]);
});
