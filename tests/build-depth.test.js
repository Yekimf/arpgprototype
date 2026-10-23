import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,playerStats,grantExperience,xpNeeded,getSkill,learnSkill,random,findPath} from '../src/game.js';
import {PASSIVE_NODES,allocatePassive,refundPassive,ensurePassives} from '../src/passive-tree.js';
import {chooseSpecialization,skillProfile} from '../src/skill-system.js';
import {lootProbabilities,createRelic,BASES} from '../src/itemization.js';
import {manaCapacity,queueLeech,restoreLeech,outgoingMultiplier,dungeonSeed,queueEffect} from '../src/combat-rules.js';
import {generateStronghold} from '../src/campaign.js';
import {migratePlayer,equipItem,addToContainer} from '../src/settlement.js';

test('levels award five attributes, one mastery and one passive; old passive budgets migrate once',()=>{
 const p=createPlayer();grantExperience(p,xpNeeded(1));assert.equal(p.level,2);assert.equal(p.points,1);assert.equal(p.passivePoints,1);assert.equal(p.attributePoints,5);
 const legacy={...createPlayer(),level:19,passiveVersion:0};delete legacy.passivePoints;ensurePassives(legacy);assert.equal(legacy.passivePoints,18);legacy.passivePoints=4;ensurePassives(legacy);assert.equal(legacy.passivePoints,4);assert.equal(migratePlayer(JSON.parse(JSON.stringify(legacy))).passivePoints,4);
});
test('the 187-node graph enforces connections and preserves reachable paths during refunds',()=>{
 assert.equal(PASSIVE_NODES.length,187);assert.equal(new Set(PASSIVE_NODES.map(n=>n.id)).size,187);const p=createPlayer();p.passivePoints=50;p.gold=100;
 assert.equal(allocatePassive(p,'steel-oath'),false);assert.equal(allocatePassive(p,'steel-2-1'),false);assert.ok(allocatePassive(p,'steel-1-1'));assert.ok(allocatePassive(p,'steel-2-1'));const before=JSON.stringify(p);assert.equal(refundPassive(p,'steel-1-1'),false);assert.equal(JSON.stringify(p),before);assert.ok(refundPassive(p,'steel-2-1'));assert.ok(refundPassive(p,'steel-1-1'));assert.equal(p.passivePoints,50);assert.equal(p.gold,90);
 for(const d of ['steel','cinder','rime','storm','blood','well']){const build=createPlayer();build.passivePoints=20;for(let depth=1;depth<=10;depth++)assert.ok(allocatePassive(build,`${d}-${depth}-1`));assert.ok(allocatePassive(build,d+'-oath'));const s=playerStats(build);assert.ok(Number.isFinite(s.regen)&&Number.isFinite(s.damage));}
});
test('passive keystones and rare affixes change resources, leech and learned skill ranks',()=>{
 const p=createPlayer(),base=playerStats(p);p.passives=['well-1-1','well-2-1','well-3-1','well-oath'];p.skills.bolt=1;let s=playerStats(p);assert.ok(s.regen>base.regen);assert.ok(s.maxMana>base.maxMana);assert.equal(s.lifeLeech,0);p.equipment.ring={id:'regen',rarity:'magic',identified:true,manaRegen:1.5,manaRegenPercent:20,lifeLeech:2,skillRanks:2};s=playerStats(p);assert.ok(s.regen>base.regen+1.5);assert.equal(skillProfile(p,getSkill('bolt'),s).rank,4);assert.equal(skillProfile(p,getSkill('rime'),s).rank,0);p.equipment.ring.identified=false;assert.equal(skillProfile(p,getSkill('bolt'),playerStats(p)).rank,2);
});
test('attacks have no cooldown and specializations change real costs, projectiles and jumps',()=>{
 const p=createPlayer();for(const id of ['bolt','lance','cleave','quake','chain','nova','meteor','whirl','vortex','rime','rend','tempest'])assert.equal(getSkill(id).cooldown,0);
 p.skills.bolt=1;assert.equal(chooseSpecialization(p,'bolt','fork'),false);p.skills.bolt=2;const before=skillProfile(p,getSkill('bolt'),playerStats(p));assert.ok(chooseSpecialization(p,'bolt','fork'));const after=skillProfile(p,getSkill('bolt'),playerStats(p));assert.equal(after.projectiles,3);assert.ok(after.cost>before.cost);assert.ok(after.power<before.power);p.skills.chain=2;chooseSpecialization(p,'chain','relay');assert.equal(skillProfile(p,getSkill('chain'),playerStats(p)).chains,7);p.points=0;assert.ok(learnSkill(p,'tempest',{testing:true}));assert.equal(p.points,0);
});
test('leech is based on actual direct damage, recovers over time and respects reservation and caps',()=>{
 const p=createPlayer(),s={...playerStats(p),lifeLeech:10,manaLeech:10,manaOnHit:1},g={player:p,stats:s,auras:{bulwark:true}};p.hp=20;p.mana=0;queueLeech(g,100,'physical');assert.equal(p.hp,20);assert.equal(g.leechLife,10);assert.equal(p.mana,1);restoreLeech(g,.25);assert.ok(p.hp>20&&p.hp<30);assert.ok(p.mana>1);queueLeech(g,10000,'cold');assert.ok(g.leechLife<=s.maxHp*.25);assert.ok(g.leechMana<=s.maxMana*.25);restoreLeech(g,100);assert.ok(p.mana<=manaCapacity(s,g.auras));assert.equal(outgoingMultiplier({damageMultiplier:.1}),.1);assert.equal(outgoingMultiplier({damageMultiplier:99}),10);assert.equal(manaCapacity({maxMana:100},{bulwark:true,focus:true}),45);
});
test('loot stays mostly common/magic through early Act II, with rare utility affixes and very rare legendaries',()=>{
 assert.ok(BASES.filter(b=>b.slot==='weapon').length>=12);assert.ok(lootProbabilities(10).rare<.01);assert.ok(lootProbabilities(14).rare>=.08);assert.ok(lootProbabilities(40).legendary<.001);assert.ok(lootProbabilities(1,true).legendary<.001);
 for(const depth of [1,10,14,30]){const rng=random(402+depth),counts={normal:0,magic:0,rare:0,legendary:0};let regen=0,resist=0;for(let i=0;i<12000;i++){const item=createRelic(rng,depth);counts[item.rarity]++;if(item.rarity==='normal'){assert.equal(item.affixes.length,0);for(const key of ['manaRegen','lifeRegen','lifeLeech','manaLeech','skillRanks'])assert.equal(item[key],undefined);}if(item.manaRegen)regen++;if(item.fireResist)resist++;}assert.ok(counts.normal>6000);assert.ok(counts.legendary<36);if(depth<12)assert.ok(counts.rare<180);else assert.ok(counts.rare>700);assert.ok(regen<resist);}
});
test('dungeon geometry varies by character and revision, remains reproducible and connected',()=>{
 const seeds=[dungeonSeed(715,1,0),dungeonSeed(716,1,0),dungeonSeed(715,1,0,1)],areas=seeds.map(s=>generateStronghold(s,1,0)),signature=d=>JSON.stringify(d.rooms.map(r=>[r.x,r.y,r.w,r.h]));assert.equal(new Set(areas.map(signature)).size,3);assert.equal(signature(generateStronghold(seeds[0],1,0)),signature(areas[0]));
 for(const d of areas)for(const target of [d.portal,d.returnGate,d.waypoint,d.supplies,...d.rooms.map(r=>({x:r.x+r.w/2,y:r.y+r.h/2}))])assert.ok(findPath(d,d.start,target).length);for(let act=2;act<=5;act++){const d=generateStronghold(dungeonSeed(715,act,1,2),act,1);assert.ok(findPath(d,d.start,d.portal).length);}
});

test('two-handed weapons move conflicting equipment into the pack atomically',()=>{const p=migratePlayer(createPlayer()),bow={id:'bow',name:'Longbow',slot:'weapon',look:'bow',rarity:'normal',twoHanded:true,width:2,height:4};addToContainer(p.inventory,bow);assert.ok(equipItem(p,'bow').ok);assert.equal(p.equipment.shield,null);assert.ok(p.inventory.some(i=>i.id==='starter-buckler'));assert.ok(equipItem(p,'starter-buckler').ok);assert.equal(p.equipment.weapon,null);assert.ok(p.inventory.some(i=>i.id==='bow'));});

test('particle budgets preserve marked attacks and damaging fields under heavy decoration',()=>{const g={effects:[]},warning={type:'meteor-warning',pending:true,damage:20},field={type:'ground-fire',damage:5};queueEffect(g,warning);queueEffect(g,field);for(let i=0;i<500;i++)queueEffect(g,{type:'cast-motes'});assert.equal(g.effects.length,180);assert.ok(g.effects.includes(warning)&&g.effects.includes(field));const crowded={effects:Array.from({length:180},()=>({pending:true,damage:1}))};assert.equal(queueEffect(crowded,{type:'impact'}),false);assert.ok(queueEffect(crowded,warning));assert.ok(crowded.effects.includes(warning));});
