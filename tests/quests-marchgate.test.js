import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,findPath,distance,isWalkable} from '../src/game.js';
import {createCampaign,generateStronghold,generateWilderness,completeField,defeatCampaignBoss} from '../src/campaign.js';
import {actQuests} from '../src/quests.js';
test('Marchgate has a long connected fortress route, broad courts and accessible side barracks',()=>{
 for(const seed of [17,809,42921]){const d=generateStronghold(seed,1),path=findPath(d,d.start,d.portal,{smooth:false});assert.equal(d.size,144);assert.equal(d.rooms.length,16);assert.equal(d.returnGate.x,d.start.x);assert.ok(d.returnGate.y>d.start.y);assert.equal(d.courts.length,3);assert.ok(path.length>100);assert.ok(findPath(d,d.returnGate,d.portal,{smooth:false}).length>120);assert.ok(distance(d.returnGate,d.portal)>120);assert.deepEqual(d.entryFacing,{x:0,y:-1});for(const r of d.rooms)assert.ok(findPath(d,d.start,{x:r.x+r.w/2,y:r.y+r.h/2}).length,r.name);for(const e of d.enemies)assert.ok(isWalkable(d,e.x,e.y,.23));for(const at of [d.returnGate,d.supplies,d.waypoint])assert.ok(findPath(d,d.start,at).length);}
 const outside=generateWilderness(42817,1);assert.ok(outside.props.find(p=>p.type==='kingdom-gate').width>=1000);assert.deepEqual(outside.props.filter(p=>p.type!=='kingdom-gate'&&p.x>=60&&p.x<=94&&p.y>=17&&p.y<=38),[]);assert.ok(findPath(outside,outside.start,outside.portal).length);assert.equal(findPath(outside,outside.start,{x:76.5,y:16.5}).length,0);
});
test('six quest seals track acceptance, field accounts and garrison completion across acts',()=>{
 const p=createPlayer();p.campaign=createCampaign();assert.deepEqual(actQuests(p,1).map(q=>q.status),['active','locked','locked','locked','locked','locked']);p.quests.guideMet=true;assert.equal(actQuests(p,1)[1].status,'active');completeField(p,1,0);assert.equal(actQuests(p,1)[2].status,'active');assert.match(actQuests(p,1)[2].story,/Vaelor/);defeatCampaignBoss(p,'captain-1-0');assert.equal(actQuests(p,1)[2].status,'complete');assert.match(actQuests(p,1)[2].aftermath,/Hadrin dies/);assert.equal(actQuests(p,1)[3].status,'active');for(let act=1;act<=5;act++){const q=actQuests(p,act);assert.equal(q.length,6);assert.equal(new Set(q.map(e=>e.id)).size,6);assert.ok(q.every(e=>e.title&&e.objective&&e.story));}
});
