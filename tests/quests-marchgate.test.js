import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,findPath,distance,isWalkable} from '../src/game.js';
import {createCampaign,generateStronghold,generateWilderness,completeField,defeatCampaignBoss} from '../src/campaign.js';
import {actQuests} from '../src/quests.js';
test('Marchgate has a long connected fortress route, broad courts and accessible side barracks',()=>{
 for(const seed of [17,809,42921]){const d=generateStronghold(seed,1),path=findPath(d,d.start,d.portal,{smooth:false});assert.equal(d.size,144);assert.equal(d.rooms.length,16);assert.equal(d.returnGate.x,d.start.x);assert.ok(d.returnGate.y>d.start.y);assert.equal(d.courts.length,3);assert.ok(path.length>100);assert.ok(findPath(d,d.returnGate,d.portal,{smooth:false}).length>120);assert.ok(distance(d.returnGate,d.portal)>120);assert.deepEqual(d.entryFacing,{x:0,y:-1});for(const r of d.rooms)assert.ok(findPath(d,d.start,{x:r.x+r.w/2,y:r.y+r.h/2}).length,r.name);for(const e of d.enemies)assert.ok(isWalkable(d,e.x,e.y,.23));for(const at of [d.returnGate,d.supplies,d.waypoint])assert.ok(findPath(d,d.start,at).length);}
 const outside=generateWilderness(42817,1);assert.ok(outside.props.find(p=>p.type==='kingdom-gate').width>=1000);assert.deepEqual(outside.props.filter(p=>p.type!=='kingdom-gate'&&p.x>177&&p.x<213&&p.y<42),[]);assert.ok(findPath(outside,outside.start,outside.portal).length);assert.equal(findPath(outside,outside.start,{x:194.5,y:16.5}).length,0);
});
test('Act I has six combat quests and only two quests per region',()=>{
 const p=createPlayer();p.campaign=createCampaign();const q=actQuests(p,1);assert.equal(q.length,6);assert.ok(q.every(q=>!['herd','provisions','orders','oath'].includes(q.id)));for(let ch=0;ch<3;ch++)assert.equal(q.filter(q=>q.chapter===ch).length,2);assert.equal(q[0].status,'offered');assert.equal(q[2].status,'locked');defeatCampaignBoss(p,'captain-1-0');assert.equal(actQuests(p,1)[1].status,'locked');for(let act=1;act<=1;act++){const entries=actQuests(p,act);assert.equal(entries.length,6);assert.equal(new Set(entries.map(e=>e.id)).size,6);assert.ok(entries.every(e=>e.title&&e.objective&&e.story));}
});
