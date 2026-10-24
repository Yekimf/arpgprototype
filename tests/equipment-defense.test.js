import test from 'node:test';
import assert from 'node:assert/strict';
import {chanceToHit,rollWeaponHit,weaponAttack} from '../src/defense.js';
import {gearRequirements,canUseGear,effectiveAttributes} from '../src/gear-requirements.js';
import {BASES,createRelic,appearanceOf} from '../src/itemization.js';
import {createPlayer,playerStats,random} from '../src/game.js';
import {migratePlayer,equipItem,addToContainer,reforgeItem} from '../src/settlement.js';
import {makeSetItem} from '../src/set-items.js';
import {bossRelic} from '../src/boss-relics.js';

test('D2 hit chance uses attack rating, defense, both levels and the 5–95% limits',()=>{
 assert.equal(chanceToHit(100,100,10,10),.5);assert.equal(chanceToHit(100,100,20,10),2/3);assert.equal(chanceToHit(100,100,10,20),1/3);
 assert.equal(chanceToHit(100000,0),.95);assert.equal(chanceToHit(0,100000),.05);assert.equal(chanceToHit(0,0),.05);
 const a={level:10,attackRating:100},d={level:10,defense:100};assert.equal(rollWeaponHit(a,d,()=>.49),true);assert.equal(rollWeaponHit(a,d,()=>.51),false);
 assert.equal(weaponAttack('physical','cleave'),true);assert.equal(weaponAttack('physical','quake'),false);assert.equal(weaponAttack('physical',null,false),false);assert.equal(weaponAttack('fire',null),false);assert.equal(weaponAttack('aether','basic'),true);
});
test('every gear family, set piece and boss trophy has level and attribute requirements',()=>{
 for(const b of BASES){const r=gearRequirements({...b,level:4});assert.ok(r.level>=4);assert.ok(Object.keys(r.stats).length);assert.ok(Object.values(r.stats).every(n=>n>=10));}
 assert.ok(makeSetItem('ashen',1).requiredStats.might>10);assert.ok(bossRelic({phaseType:'oath',bossId:'captain-1-0'},2).requiredLevel>=3);
 for(const origin of ['vanguard','templar','outrider']){const p=createPlayer({origin});assert.ok(canUseGear(p,p.equipment.weapon));assert.ok(canUseGear(p,p.equipment.shield));}
 assert.equal(gearRequirements({slot:'scroll'}),null);
});
test('unmet requirements reject a swap atomically; allocated points enable it',()=>{
 const p=migratePlayer(createPlayer()),item={id:'mail',name:'Mail Hauberk',slot:'armor',look:'chain',rarity:'normal',level:3,armor:10};addToContainer(p.inventory,item);
 let before=JSON.stringify(p);assert.equal(equipItem(p,item.id).ok,false);assert.equal(JSON.stringify(p),before);p.level=3;
 before=JSON.stringify(p);assert.match(equipItem(p,item.id).message,/Might/);assert.equal(JSON.stringify(p),before);p.attributes.might=12;
 assert.ok(equipItem(p,item.id).ok);assert.equal(p.equipment.armor,item);assert.ok(playerStats(p).defense>15);assert.equal(effectiveAttributes(p).might,22);
});
test('ineligible saved equipment remains recoverable but grants no stats or model layers',()=>{
 const p=createPlayer();p.equipment.armor={id:'old',name:'Iron Cuirass',slot:'armor',look:'plate',rarity:'normal',level:12,armor:999,life:999,manaRegen:20};migratePlayer(p);
 const stats=playerStats(p);assert.equal(p.equipment.armor.id,'old');assert.equal(appearanceOf(p).armor,'none');assert.ok(stats.maxHp<999);assert.ok(stats.regen<20);
 p.level=20;p.attributes.might=50;p.attributes.vitality=30;assert.equal(appearanceOf(p).armor,'plate');assert.ok(playerStats(p).maxHp>999);
});
test('magic items roll a prefix and suffix, regeneration suffixes remain fractional, and commons have no affixes',()=>{
 const seen=new Set();for(let i=0;i<5000;i++){const item=createRelic(random(i),6);assert.ok(item.requiredLevel>=6);if(item.rarity==='normal')assert.equal(item.affixes.length,0);if(item.rarity==='magic'){assert.equal(item.affixes.filter(a=>a.kind==='prefix').length,1);assert.equal(item.affixes.filter(a=>a.kind==='suffix').length,1);}assert.equal(new Set(item.affixes.map(a=>a.stat)).size,item.affixes.length);for(const a of item.affixes)if(a.kind==='suffix')seen.add(a.stat);}
 for(const stat of ['lifeRegen','manaRegen','lifeRegenPercent','manaRegenPercent','manaOnKill'])assert.ok(seen.has(stat),stat);
 const p=migratePlayer(createPlayer());p.gold=1000;p.shards=10;const item={id:'regen',name:'Ring of Meditation',slot:'ring',rarity:'magic',identified:true,level:1,manaRegen:.55,affixes:[{stat:'manaRegen',value:.35,min:.35,max:.8,tier:1,kind:'suffix'}]};addToContainer(p.inventory,item);assert.ok(reforgeItem(p,item.id,'manaRegen',()=>.7).ok);assert.equal(Math.round((item.manaRegen-item.affixes[0].value)*100),20);
});
