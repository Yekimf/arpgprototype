import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,findPath,distance} from '../src/game.js';
import {createCampaign,generateWilderness} from '../src/campaign.js';
import {migratePlayer,addToContainer,identifyItem,buySupply,sellItem,salvageItem,itemSize,acceptGuideQuest} from '../src/settlement.js';
import {makeInsightScroll,insightCount} from '../src/scrolls.js';
import {questRelic} from '../src/quest-objects.js';
import {recoverProvisions,claimProvisionsReward} from '../src/opening-quests.js';
test('the larger opening forest connects one town exit to a distant fenced herd and gate',()=>{
 for(const seed of [17,809,42817]){const p=createPlayer();p.campaign=createCampaign();const d=generateWilderness(seed,1,p),b=d.townBounds,f=d.pasture;assert.equal(d.size,224);assert.ok(distance(d.start,d.herd)>85);assert.ok(distance(d.start,d.portal)>145);assert.ok(findPath(d,d.start,d.portal,{smooth:false}).length>160);
  for(const at of [d.herd,d.provisions,d.field,d.waypoint,d.supplies,...d.npcs])assert.ok(findPath(d,d.start,at).length);assert.equal(d.livestock.length,22);assert.ok(d.livestock.every(p=>p.x>f.x1&&p.x<f.x2&&p.y>f.y1&&p.y<f.y2));assert.ok(d.props.some(p=>p.type==='signpost'));assert.ok(d.props.filter(p=>p.type==='road-lantern').length>10);
  for(let x=b.x1;x<=b.x2;x++)for(const y of [b.y1,b.y2])assert.equal(d.tiles[y][x],0);for(let y=b.y1;y<=b.y2;y++){assert.equal(d.tiles[y][b.x1],0);assert.equal(d.tiles[y][b.x2],Math.abs(y-51.5)<2.5?1:0);}
  for(let x=f.x1;x<=f.x2;x++)for(const y of [f.y1,f.y2])assert.equal(d.tiles[y][x],0);for(let y=f.y1+1;y<f.y2;y++){assert.equal(d.tiles[y][f.x2],0);assert.equal(d.tiles[y][f.x1],Math.abs(y-f.gate.y)<2?1:0);}
 }
});
test('legacy scroll counters become compact one-cell stacks without duplication or loss',()=>{
 const p=createPlayer();p.identifyScrolls=3;migratePlayer(p);assert.equal(insightCount(p),3);assert.equal(Object.hasOwn(p,'identifyScrolls'),false);for(const s of p.inventory){assert.deepEqual(itemSize(s),{w:1,h:1});assert.ok(s.bagX>=0);}const restored=migratePlayer(JSON.parse(JSON.stringify(p)));assert.equal(insightCount(restored),3);assert.equal(new Set(restored.inventory.map(i=>i.id)).size,1);
});
test('identification consumes the selected scroll only after revealing a valid item',()=>{
 const p=createPlayer(),a=makeInsightScroll(),b=makeInsightScroll(),relic={id:'unknown',slot:'ring',rarity:'magic',identified:false,name:'Hidden Signet'};for(const i of [a,b,relic])assert.ok(addToContainer(p.inventory,i));assert.equal(identifyItem(p,a.id,false,a.id).ok,false);assert.equal(insightCount(p),2);assert.ok(identifyItem(p,relic.id,false,a.id).ok);assert.equal(relic.identified,true);assert.ok(p.inventory.includes(a));assert.equal(p.inventory.includes(b),false);assert.equal(identifyItem(p,relic.id,false,a.id).ok,false);assert.equal(insightCount(p),1);
});
test('scroll purchases and guide gifts require real pack space and fail atomically',()=>{
 const p=createPlayer();p.gold=500;p.inventory=Array.from({length:40},(_,i)=>({id:'filler'+i,slot:'ring',name:'Ring',rarity:'normal',bagX:i%10,bagY:Math.floor(i/10)}));const before=JSON.stringify(p);assert.equal(buySupply(p,'scroll').ok,false);assert.equal(JSON.stringify(p),before);assert.equal(acceptGuideQuest(p).ok,false);assert.equal(JSON.stringify(p),before);p.inventory=[];assert.ok(buySupply(p,'scroll').ok);assert.equal(insightCount(p),1);assert.equal(p.gold,488);assert.ok(acceptGuideQuest(p).ok);assert.equal(insightCount(p),3);
});
test('quest objects match their tasks, take pack space, resist sale, and turn in correctly',()=>{
 const names=new Set();for(let act=1;act<=5;act++)for(let chapter=0;chapter<4;chapter++){const relic=questRelic(act,chapter);names.add(relic.name);const p=createPlayer();addToContainer(p.inventory,relic);assert.equal(sellItem(p,relic.id).ok,false);assert.equal(salvageItem(p,relic.id).ok,false);}assert.equal(names.size,20);assert.equal(questRelic(4,2).kind,'key');assert.equal(questRelic(5,2).kind,'signet');
 const p=createPlayer();p.quests.herdRewarded=true;assert.ok(recoverProvisions(p).ok);assert.equal(p.inventory[0].name,'Emberfall’s Winter Provisions');assert.deepEqual(itemSize(p.inventory[0]),{w:2,h:2});assert.ok(claimProvisionsReward(p).ok);assert.equal(p.inventory.length,0);assert.equal(claimProvisionsReward(p).ok,false);
});
