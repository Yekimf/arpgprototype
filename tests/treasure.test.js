import test from 'node:test';
import assert from 'node:assert/strict';
import {random,createPlayer,playerStats,itemDescription} from '../src/game.js';
import {BASES} from '../src/itemization.js';
import {treasureClass,noDropChance,rollMonsterLoot,rollTreasureItem,rollTreasureQuality,effectiveMagicFind,nearbyLootPopulation,BASE_TREASURE_LEVELS,matchingSets} from '../src/treasure.js';

test('regular no-drop starts at 62.5% and scales with player count and nearby party members',()=>{
 assert.deepEqual([1,3,5,7,8].map(players=>noDropChance({players})),[.625,.625**2,.625**3,.625**4,.625**4]);
 assert.equal(noDropChance({players:2,nearbyParty:1}),.625**2);
 assert.equal(noDropChance({players:8,nearbyParty:7}),.625**8);
 assert.equal(noDropChance({boss:true}),0);
 let empty=0,gold=0,items=0;const rng=random(651);for(let i=0;i<30000;i++){const drops=rollMonsterLoot(rng,{x:0,y:0,level:1,type:'skeleton'});empty+=!drops.length;gold+=drops.some(d=>d.gold);items+=drops.some(d=>d.item);}
 assert.ok(Math.abs(empty/30000-.625)<.012);assert.ok(gold>3000&&items>6000);assert.equal(empty+gold+items,30000);
});
test('every base has an explicit treasure level, and high tiers cannot escape their monster-level gate',()=>{
 for(const b of BASES)assert.ok(BASE_TREASURE_LEVELS[b.id],b.id);
 for(const level of [1,3,5,9,11,12,23,24,40]){const tc=treasureClass(level);for(const entry of tc.entries)assert.ok(entry.requiredLevel<=level);for(let seed=1;seed<=250;seed++){const i=rollTreasureItem(random(seed),{monsterLevel:level,magicFind:10000});assert.ok(i.baseTreasureLevel<=level);if(level<12){assert.equal(i.baseTier,'standard');assert.notEqual(i.rarity,'legendary');}if(level<24)assert.notEqual(i.baseTier,'elite');}}
 assert.ok(treasureClass(12).entries.some(e=>e.tier==='exceptional'));assert.ok(treasureClass(24).entries.some(e=>e.tier==='elite'));
 assert.equal(treasureClass(1).entries.some(e=>['plate','chain','greatsword','kite'].includes(e.base.id)),false);
});
test('MF changes quality without changing no-drop, currency, slot, base or base tier',()=>{
 let plain=0,found=0,legendary=0;for(let seed=1;seed<=6000;seed++){const enemy={x:2,y:2,level:25,type:'skeleton'},a=rollMonsterLoot(random(seed),enemy),b=rollMonsterLoot(random(seed),enemy,{magicFind:300});
 assert.deepEqual(a.map(d=>({gold:d.gold,base:d.item?.base,tier:d.item?.baseTier})),b.map(d=>({gold:d.gold,base:d.item?.base,tier:d.item?.baseTier})));
 plain+=a.some(d=>d.item&&d.item.rarity!=='normal');found+=b.some(d=>d.item&&d.item.rarity!=='normal');legendary+=b.some(d=>d.item?.rarity==='legendary');}
 assert.ok(found>plain*1.3);assert.ok(legendary<30);
 assert.equal(effectiveMagicFind(250,'magic'),250);assert.equal(effectiveMagicFind(250,'legendary'),125);
 for(const category of ['rune','charm'])for(let seed=1;seed<100;seed++)assert.equal(rollTreasureQuality(random(seed),{level:30,category}),rollTreasureQuality(random(seed),{level:30,category,magicFind:1000}));
});
test('set quality retains the selected base silhouette and respects set-level gates',()=>{
 let count=0;for(let seed=1;seed<5000;seed++){const i=rollTreasureItem(random(seed),{monsterLevel:20,magicFind:1000});if(i.rarity!=='set')continue;count++;const base=BASES.find(b=>b.id===i.base);assert.equal(i.look,base.look);assert.equal(i.slot,base.slot);assert.ok(matchingSets({base},20).some(s=>s.id===i.setId));}assert.ok(count>10);
});
test('population counts living local players and only nearby members of the recipient party',()=>{
 const session=(x,party='a',area='field',hp=100)=>({pos:{x,y:0},party,area,player:{hp}}),a=session(0),b=session(2),far=session(40),stranger=session(1,'b'),dead=session(1,'a','field',0),away=session(1,'a','town');
 assert.deepEqual(nearbyLootPopulation([a,b,far,stranger,dead,away],a,{x:0,y:0}),{players:4,nearbyParty:1});
});
test('Magic Find is supplied only by identified usable equipped gear and appears in item details',()=>{
 const p=createPlayer();p.equipment.helm={id:'lucky',slot:'helm',look:'hood',level:1,rarity:'magic',identified:true,magicFind:25};assert.equal(playerStats(p).magicFind,25);assert.match(itemDescription(p.equipment.helm).join(' '),/25 % Magic Find/);
 p.equipment.helm.identified=false;assert.equal(playerStats(p).magicFind,0);p.equipment.helm.identified=true;p.equipment.helm.requiredLevel=90;assert.equal(playerStats(p).magicFind,0);
});
