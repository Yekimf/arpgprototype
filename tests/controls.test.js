import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultControls,sanitizeControls,activeBindings,bindingError,eventCode,movementVector} from '../src/controls.js';
import {loadSettings,saveSettings,SETTINGS_KEY} from '../src/settings.js';

test('existing settings retain click/QWER controls; WASD has nonconflicting independent defaults',()=>{
  const old=loadSettings({getItem:()=>JSON.stringify({brightness:110})});
  assert.equal(old.brightness,110);assert.equal(old.controls.movement,'click');
  assert.deepEqual([0,1,2,3].map(i=>activeBindings(old.controls)['skill'+i]),['KeyQ','KeyW','KeyE','KeyR']);
  const controls=defaultControls();controls.profiles.click.skill0='KeyZ';controls.movement='wasd';
  assert.deepEqual([0,1,2,3].map(i=>activeBindings(controls)['skill'+i]),['KeyQ','KeyE','KeyR','KeyF']);
  assert.equal(controls.profiles.click.skill0,'KeyZ');
});
test('bindings reject movement, menu and duplicate keys without modifying either profile',()=>{
  const controls=defaultControls();controls.movement='wasd';const before=JSON.stringify(controls);
  for(const code of ['KeyW','KeyA','KeyS','KeyD','KeyI','KeyP','ArrowUp','Enter','Tab','Escape','ControlLeft'])assert.ok(bindingError(controls,'skill0',code));
  assert.match(bindingError(controls,'skill0','KeyE'),/already assigned/);
  assert.equal(bindingError(controls,'skill0','KeyZ'),'');assert.equal(bindingError(controls,'primary',null),'');
  assert.equal(JSON.stringify(controls),before);
});
test('corrupt/duplicate saved keys never take over menu or movement keys; intentional unbinds survive',()=>{
  const controls=defaultControls();controls.movement='wasd';Object.assign(controls.profiles.wasd,{skill0:'KeyW',skill1:'KeyZ',skill2:'KeyZ',skill3:'Escape',primary:null});
  const clean=sanitizeControls(controls);
  assert.deepEqual([clean.profiles.wasd.skill0,clean.profiles.wasd.skill1,clean.profiles.wasd.skill2,clean.profiles.wasd.skill3],[null,'KeyZ',null,null]);
  assert.equal(clean.profiles.wasd.primary,null);assert.deepEqual(sanitizeControls(null),defaultControls());
});
test('controls persist locally and denied storage does not share mutable defaults',()=>{
  const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
  const settings=loadSettings(storage);settings.controls.movement='wasd';settings.controls.profiles.wasd.secondary='KeyV';saveSettings(storage,settings);
  assert.ok(memory.has(SETTINGS_KEY));assert.deepEqual(loadSettings(storage).controls,settings.controls);
  const denied={getItem(){throw Error('denied');}},a=loadSettings(denied),b=loadSettings(denied);a.controls.profiles.click.skill0='KeyZ';assert.equal(b.controls.profiles.click.skill0,'KeyQ');
});
test('WASD follows screen directions with equal world speed, respects opposites and preserves arrow movement',()=>{
  const c=defaultControls();assert.deepEqual(movementVector(new Set(['KeyW']),c),{x:0,y:0});c.movement='wasd';
  for(const [codes,sx,sy] of [[['KeyW'],0,-1],[['KeyA'],-1,0],[['KeyS'],0,1],[['KeyD'],1,0],[['KeyW','KeyD'],1,-1],[['KeyS','KeyA'],-1,1]]){
    const v=movementVector(new Set(codes),c),projected={x:(v.x-v.y)*34,y:(v.x+v.y)*17};
    assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-10);assert.equal(Math.sign(projected.x),sx);assert.equal(Math.sign(projected.y),sy);
    if(sx&&sy)assert.ok(Math.abs(Math.abs(projected.x)-Math.abs(projected.y))<1e-10);
  }
  assert.deepEqual(movementVector(new Set(['KeyW','KeyS','KeyA','KeyD']),c),{x:0,y:0});
  assert.deepEqual(movementVector(new Set(['ArrowDown','ArrowRight']),defaultControls()),{x:1,y:0});
  assert.deepEqual(movementVector(new Set(['ArrowUp']),defaultControls()),movementVector(new Set(['KeyW']),c));
  assert.deepEqual(movementVector(new Set(['KeyD','ArrowRight']),c),movementVector(new Set(['KeyD']),c));
});
test('physical skill keys remain stable with Shift and synthetic arrow events still work',()=>{
  assert.equal(eventCode({code:'KeyZ',key:'Z',shiftKey:true}),'KeyZ');
  assert.equal(eventCode({key:'ArrowUp'}),'ArrowUp');assert.equal(eventCode({key:'w'}),'KeyW');
});
