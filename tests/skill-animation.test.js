import test from 'node:test';import assert from 'node:assert/strict';
import sharp from 'sharp';import {stat} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {SKILL_ANIMATIONS,SKILL_CELL,animationPose,animationBudget,projectilePainting} from '../src/skill-animation.js';
test('painted animation playback interpolates, loops continuously and freezes a readable pose for reduced motion',()=>{
 assert.deepEqual(animationPose(0),{frame:0,next:1,blend:0});assert.deepEqual(animationPose(1),{frame:5,next:5,blend:0});assert.equal(animationPose(.5).blend,.5);
 assert.deepEqual(animationPose(5.5,{loop:true}),{frame:5,next:0,blend:.5});assert.deepEqual(animationPose(6,{loop:true}),animationPose(0,{loop:true}));
 assert.deepEqual(animationPose(99,{loop:true,reducedMotion:true}),{frame:2,next:2,blend:0});assert.equal(animationPose(NaN).frame,0);
 assert.ok(animationBudget({quality:'performance'})<animationBudget({quality:'high'}));
 for(const [element,expected]of [['fire','firebolt'],['cold','icebolt'],['physical','arrow'],['aether','aetherbolt']])assert.equal(projectilePainting({element}),expected);
});
test('every effect row contains six different painted poses, a transparent perimeter and useful visible detail',async()=>{
 let bytes=0;for(const sheet of ['elements','forces','wards']){
  const file=`src/art/runtime/skill-${sheet}.webp`,{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});bytes+=(await stat(file)).size;
  assert.equal(info.width,SKILL_CELL*6);assert.equal(info.height,SKILL_CELL*6);
  for(const spec of Object.values(SKILL_ANIMATIONS).filter(s=>s.sheet===sheet)){
   const hashes=new Set();for(let frame=0;frame<6;frame++){
    const pixels=Buffer.alloc(SKILL_CELL*SKILL_CELL*4);let visible=0;
    for(let y=0;y<SKILL_CELL;y++)for(let x=0;x<SKILL_CELL;x++){
     const i=((spec.row*SKILL_CELL+y)*info.width+frame*SKILL_CELL+x)*4,j=(y*SKILL_CELL+x)*4;data.copy(pixels,j,i,i+4);if(data[i+3]>40)visible++;
    }
    assert.ok(visible>100,`${sheet}/${spec.row}/${frame} is empty`);assert.ok(visible<SKILL_CELL*SKILL_CELL*.95,'Opaque rectangular backgrounds must not reach the game');hashes.add(createHash('sha256').update(pixels).digest('hex'));
   }
   assert.equal(hashes.size,6,`${sheet}/${spec.row} repeats a still image`);
  }
 }
 assert.ok(bytes<1500000,'Keep the animated paintings small enough for the portable browser game');
});
