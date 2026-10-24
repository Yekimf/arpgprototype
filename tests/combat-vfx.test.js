import {test} from 'node:test';
import assert from 'node:assert/strict';
import {effectSeed,particleNoise,effectBudget,debrisPoint,meleeTrail} from '../src/combat-particles.js';
import {combatEffect,combatProjectile} from '../src/combat-vfx.js';

function recorder(settings={}){
  const calls=[],stack=[],state={globalAlpha:.45};
  const ctx=new Proxy(state,{set(target,key,value){
    if(typeof value==='number'){assert.ok(Number.isFinite(value),`${key} must be finite`);if(key==='globalAlpha')assert.ok(value>=0&&value<=.45+1e-9,'effect alpha must respect parent opacity');if(key==='lineWidth')assert.ok(value>=0,'stroke width must not be negative');}
    target[key]=value;return true;
  },get(target,key){
    if(key in target)return target[key];
    if(key==='save')return()=>stack.push({...target});
    if(key==='restore')return()=>{const saved=stack.pop();assert.ok(saved,'balanced canvas save/restore');Object.assign(target,saved);};
    return(...args)=>{for(const n of args.flat())if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(key)} coordinates must be finite`);calls.push([key,...args]);};
  }});
  const r={settings,ctx,time:12.3,iso:(x,y)=>({x:(x-y)*34,y:(x+y)*17})};
  for(const op of ['line','poly','ellipse','light'])r[op]=(...args)=>{for(const n of args.flat(3))if(typeof n==='number')assert.ok(Number.isFinite(n),`${op} coordinates must be finite`);calls.push([op,...args]);};
  return{r,calls,stack};
}
test('particle topology is stable, bounded and identical for repeated effect samples',()=>{
  const seed=effectSeed({type:'hit-impact',x:1.25,y:8.7,material:'bone'});
  assert.equal(seed,effectSeed({type:'hit-impact',x:1.25,y:8.7,material:'bone'}));
  assert.notEqual(seed,effectSeed({type:'hit-impact',x:1.25,y:8.7,material:'flesh'}));
  for(let i=0;i<500;i++){const n=particleNoise(seed,i);assert.ok(n>=0&&n<1);assert.equal(n,particleNoise(seed,i));}
  assert.equal(effectBudget({quality:'performance'},50),9);assert.equal(effectBudget({quality:'high'},50),24);assert.equal(effectBudget({quality:'high',reducedMotion:true},50),7);
  const sample=debrisPoint(seed,4,.5);assert.deepEqual(sample,debrisPoint(seed,4,.5));assert.ok(Math.hypot(sample.x,sample.y)<100);
});
test('melee geometry stays in its actual world reach and reverses the alternating sweep',()=>{
  const iso=(x,y)=>({x:(x-y)*34,y:(x+y)*17}),a=meleeTrail({radius:2,dx:1,dy:0,combo:0},.1,iso),b=meleeTrail({radius:2,dx:1,dy:0,combo:1},.1,iso);
  assert.equal(a.head,-b.head);assert.equal(a.points.length,13);
  for(const point of a.points){const x=(point.outer[0]/34+(point.outer[1]+27)/17)/2,y=((point.outer[1]+27)/17-point.outer[0]/34)/2;assert.ok(Math.abs(Math.hypot(x,y)-2)<1e-10);}
  assert.equal(meleeTrail({weapon:'spear'},.1,iso).thrust,true);assert.equal(meleeTrail({weapon:'sword'},.1,iso).thrust,false);
});
test('combat effects preserve opacity, finite geometry and bounded detail through their entire lifetime',()=>{
  const types=['melee-trail','slash','hit-impact','weapon-hit','evade-dust','cast-motes','frost-shatter','nova','quake','lightning','boss-sweep-warning','boss-wave-warning','meteor-warning'];
  for(const quality of ['performance','balanced','high'])for(const reducedMotion of [false,true])for(const type of types)for(const progress of [0,.2,.55,.95,1]){
    const {r,calls,stack}=recorder({quality,reducedMotion}),e={type,x:4,y:6,tx:5,ty:8,dx:0,dy:-1,radius:2,arc:Math.PI/2,element:'cold',hostile:true,material:'bone',critical:true,heavy:true,seed:9};
    assert.equal(combatEffect(r,e,progress,{settings:r.settings}),true,`${type} should be handled`);assert.ok(calls.length<180,`${type} must stay within draw budget`);assert.equal(stack.length,0,`${type} must balance canvas state`);
  }
});
test('impact material and element change actual marks; reduced-motion and performance modes reduce work',()=>{
  const trace=(settings,material,element)=>{const {r,calls}=recorder(settings);combatEffect(r,{type:'hit-impact',material,element,critical:true,dx:1,dy:0,seed:9},.4,{settings});return calls;};
  const bone=trace({},'bone','physical'),flesh=trace({},'flesh','physical'),metal=trace({},'metal','physical'),fire=trace({},'flesh','fire');
  assert.notDeepEqual(bone,flesh);assert.notDeepEqual(flesh,metal);assert.notDeepEqual(fire,flesh);
  assert.ok(trace({quality:'performance'},'bone','physical').length<bone.length);assert.ok(trace({reducedMotion:true},'bone','physical').length<bone.length);
});
test('Thunder Spear splash uses electrical branches rather than Rime Lance ice shards',()=>{
  const cold=recorder(),shock=recorder();
  for(const [sample,element] of [[cold,'cold'],[shock,'lightning']])combatEffect(sample.r,{type:'frost-shatter',element,radius:1.1,seed:9},.4,{settings:{}});
  assert.ok(cold.calls.some(call=>call[0]==='poly'));
  assert.equal(shock.calls.some(call=>call[0]==='poly'),false);
  assert.ok(shock.calls.filter(call=>call[0]==='line').length>8);
  assert.notDeepEqual(cold.calls,shock.calls);
});
test('projectiles have stable distinct silhouettes and bounded tails with fewer marks on low settings',()=>{
  const traces=[];
  for(const element of ['physical','fire','cold','lightning','aether']){
    const {r,calls,stack}=recorder({quality:'high'});combatProjectile(r,{x:3,y:5,dx:0,dy:-1,kind:element,element});assert.ok(calls.length<40);assert.equal(stack.length,0);traces.push(calls);
    const low=recorder({quality:'performance'});combatProjectile(low.r,{x:3,y:5,dx:0,dy:-1,kind:element,element});if(['fire','cold','aether'].includes(element))assert.ok(low.calls.length<calls.length);
  }
  for(let i=1;i<traces.length;i++)assert.notDeepEqual(traces[i-1],traces[i]);
  const a=recorder({reducedMotion:true}),b=recorder({reducedMotion:true});a.r.time=3;b.r.time=90;
  for(const r of [a.r,b.r])combatProjectile(r,{x:3,y:5,dx:1,dy:0,kind:'fire',element:'fire'});assert.deepEqual(a.calls,b.calls);
});
