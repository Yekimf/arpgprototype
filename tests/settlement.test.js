import {insightCount,makeInsightScroll} from '../src/scrolls.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,playerStats,isWalkable,findPath,random} from '../src/game.js';
import {BAG,STASH,migratePlayer,generateTown,generateStock,itemSize,addToContainer,arrange,cellsFree,equipItem,unequipItem,moveItem,identifyItem,identifyAll,buyItem,buyBack,buyPrice,sellItem,buySupply,salvageItem,reforgeItem,reforgeCost,repairAll,repairCost,acceptGuideQuest,claimGuideReward} from '../src/settlement.js';

const character=()=>migratePlayer(createPlayer());
const ring=(id,extra={})=>({id,name:'Runic Signet',slot:'ring',rarity:'magic',level:1,crit:3,life:8,identified:true,durability:100,...extra});

test('spatial inventory respects item dimensions, boundaries, and occupied cells',()=>{
  const items=[],armor={...ring('armor'),slot:'armor'},weapon={...ring('weapon'),slot:'weapon',name:'Longsword'};
  assert.deepEqual(itemSize(armor),{w:2,h:3});assert.deepEqual(itemSize(weapon),{w:1,h:3});
  assert.ok(addToContainer(items,armor));assert.ok(addToContainer(items,weapon));
  assert.equal(cellsFree(items,ring('new'),armor.bagX,armor.bagY),false);
  assert.equal(cellsFree(items,armor,9,5),false);
  assert.equal(cellsFree(items,armor,-1,0),false);
  assert.equal(arrange(items,BAG,true),0);assert.equal(items.length,2);
});
test('migration preserves overflowing legacy inventory and adds equipment and service fields',()=>{
  const p=createPlayer();p.inventory=Array.from({length:24},(_,i)=>({...ring(`legacy-${i}`),slot:'armor'}));
  migratePlayer(p);assert.equal(p.inventory.length,24);assert.ok(p.inventory.some(i=>i.bagX<0));
  assert.equal(Object.keys(p.equipment).length,10);assert.deepEqual(p.stash,[]);assert.equal(p.shards,0);
  assert.equal(arrange(p.inventory),12);assert.equal(p.inventory.length,24);
});
test('failed equipment swaps, stash transfers, and purchases are atomic',()=>{
  const p=character();p.gold=1000;p.shopStock=generateStock(1,21);
  for(let i=0;i<BAG.width*BAG.height;i++)assert.ok(addToContainer(p.inventory,ring(`full-${i}`)));
  const old=JSON.stringify(p);assert.equal(buyItem(p,0).ok,false);assert.equal(JSON.stringify(p),old);
  const target=p.inventory[0];target.slot='weapon';target.width=1;target.height=1;
  const before=JSON.stringify(p);assert.equal(equipItem(p,target.id).ok,false);assert.equal(JSON.stringify(p),before);
  for(let i=0;i<STASH.width*STASH.height;i++)assert.ok(addToContainer(p.stash,ring(`stash-${i}`),STASH));
  const packed=JSON.stringify(p);assert.equal(moveItem(p,target.id,true).ok,false);assert.equal(JSON.stringify(p),packed);
});
test('identification gates equipment, consumes one scroll, and scholar service unlocks with rescue',()=>{
  const p=character(),item=ring('mystery',{identified:false});addToContainer(p.inventory,item);
  assert.equal(equipItem(p,item.id).ok,false);assert.equal(identifyItem(p,item.id).ok,false);assert.equal(identifyAll(p).ok,false);
  p.identifyScrolls=1;assert.ok(identifyItem(p,item.id).ok);assert.equal(insightCount(p),0);
  assert.ok(equipItem(p,item.id).ok);assert.ok(p.equipment.ring);assert.ok(unequipItem(p,'ring').ok);
  item.identified=false;p.quests.scholarRescued=true;assert.ok(identifyAll(p).ok);assert.equal(item.identified,true);assert.equal(insightCount(p),0);
});
test('merchant trades, buyback, supplies, and salvage have consistent costs and rewards',()=>{
  const p=character();p.gold=500;p.shopStock=generateStock(1,71);
  const price=buyPrice(p.shopStock[0]),id=p.shopStock[0].id;
  assert.ok(buyItem(p,0).ok);assert.equal(p.gold,500-price);assert.ok(p.inventory.some(i=>i.id===id));
  const afterPurchase=p.gold;assert.ok(sellItem(p,id).ok);assert.equal(p.inventory.length,0);assert.equal(p.buyback.length,1);
  assert.ok(buyBack(p,0).ok);assert.equal(p.gold,afterPurchase);assert.equal(p.buyback.length,0);
  assert.ok(buySupply(p,'scroll').ok);assert.equal(insightCount(p),1);assert.equal(p.gold,afterPurchase-12);
  p.potions=5;p.flask.charges=100;const old=p.gold;assert.equal(buySupply(p,'flask').ok,false);assert.equal(p.gold,old);
  assert.ok(salvageItem(p,id).ok);assert.ok(p.shards>0);assert.equal(p.inventory.length,1);
});
test('reforging rerolls one property and preserves identity, base power, and all other properties',()=>{
  const p=character();p.gold=1000;p.shards=20;
  const item=ring('reforge',{slot:'weapon',damage:24,bonus:5});addToContainer(p.inventory,item);
  const before={...item},cost=reforgeCost(item);
  assert.ok(reforgeItem(p,item.id,'life',random(17)).ok);
  assert.notEqual(item.life,before.life);assert.equal(item.id,before.id);assert.equal(item.name,before.name);assert.equal(item.damage,before.damage);assert.equal(item.bonus,before.bonus);assert.equal(item.crit,before.crit);
  assert.equal(p.gold,1000-cost.gold);assert.equal(p.shards,20-cost.shards);assert.equal(item.reforges,1);assert.ok(reforgeCost(item).gold>cost.gold);
  const stable=JSON.stringify(p);assert.equal(reforgeItem(p,item.id,'damage').ok,false);assert.equal(JSON.stringify(p),stable);
  p.gold=0;const poor=JSON.stringify(p);assert.equal(reforgeItem(p,item.id,'life').ok,false);assert.equal(JSON.stringify(p),poor);
});
test('repairs restore broken base stats and charge exactly once',()=>{
  const p=character(),healthy=playerStats(p);p.equipment.weapon.durability=0;
  assert.ok(playerStats(p).damage<healthy.damage);p.gold=200;
  const cost=repairCost(p);assert.ok(repairAll(p).ok);assert.equal(p.gold,200-cost);assert.equal(playerStats(p).damage,healthy.damage);
  const gold=p.gold;assert.equal(repairAll(p).ok,false);assert.equal(p.gold,gold);
});
test('reforging cannot change a ring or amulet primary stat',()=>{
  const p=character();p.gold=200;p.shards=20;
  addToContainer(p.inventory,ring('primary-ring'));addToContainer(p.inventory,{...ring('primary-charm'),slot:'charm',spirit:12});
  const before=JSON.stringify(p);assert.equal(reforgeItem(p,'primary-ring','crit').ok,false);assert.equal(reforgeItem(p,'primary-charm','spirit').ok,false);assert.equal(JSON.stringify(p),before);
});
test('guide supplies and rescued-scholar rewards cannot be claimed twice',()=>{
  const p=character();assert.ok(acceptGuideQuest(p).ok);assert.equal(p.gold,50);assert.equal(insightCount(p),2);assert.equal(p.inventory[0].identified,false);
  const gold=p.gold;assert.equal(acceptGuideQuest(p).ok,false);assert.equal(p.gold,gold);
  assert.equal(claimGuideReward(p).ok,false);p.quests.wardenDefeated=true;p.quests.scholarRescued=true;
  assert.ok(claimGuideReward(p).ok);assert.equal(p.gold,170);assert.equal(p.shards,5);assert.equal(claimGuideReward(p).ok,false);assert.equal(p.gold,170);
});
test('town has no enemies and every service, stash, and gate can be approached on foot',()=>{
  for(const rescued of [false,true]){
    const p=character();p.quests.scholarRescued=rescued;const town=generateTown(p);
    assert.equal(town.enemies.length,0);assert.equal(town.npcs.some(n=>n.id==='scholar'),rescued);
    assert.ok(isWalkable(town,town.start.x,town.start.y));
    const targets=[...town.npcs,town.portal,town.props.find(p=>p.stash)];
    for(const target of targets){assert.ok(isWalkable(town,target.x,target.y),`Blocked service: ${target.id||target.type}`);assert.ok(findPath(town,town.start,target).length>0);}
  }
});

test('common gear equips immediately, including old saves carrying a false identification flag',()=>{
 const p=character(),common={id:'common-sword',name:'Plain Falchion',slot:'weapon',rarity:'normal',damage:17,identified:false};
 assert.ok(addToContainer(p.inventory,common));const scrolls=insightCount(p);assert.equal(identifyItem(p,common.id).ok,false);assert.equal(equipItem(p,common.id).ok,true);assert.equal(insightCount(p),scrolls);assert.equal(p.equipment.weapon.damage,17);
 const magic={...ring('still-hidden'),identified:false};assert.ok(addToContainer(p.inventory,magic));assert.equal(equipItem(p,magic.id).ok,false);
 p.stash=[{...common,id:'old-common'}];migratePlayer(p);assert.equal(p.stash[0].identified,true);assert.equal(p.equipment.weapon.identified,true);
});

test('expanded backpack holds 72 one-cell items and restores old overflow without changing placed items',()=>{
  assert.deepEqual(BAG,{width:12,height:6});const p=character();
  for(let i=0;i<72;i++)assert.ok(addToContainer(p.inventory,ring('expanded-'+i)));
  const before=JSON.stringify(p.inventory);assert.equal(addToContainer(p.inventory,ring('too-many')),false);assert.equal(JSON.stringify(p.inventory),before);
  const old=createPlayer();old.inventory=[ring('old-place',{bagX:9,bagY:3}),ring('old-overflow',{bagX:-1,bagY:-1})];migratePlayer(old);assert.deepEqual([old.inventory[0].bagX,old.inventory[0].bagY],[9,3]);assert.ok(old.inventory[1].bagX>=0);assert.equal(arrange(old.inventory),0);
});
