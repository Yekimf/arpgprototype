import test from 'node:test';import assert from 'node:assert/strict';
import {createPlayer,distance,isWalkable} from '../src/game.js';
import {createCampaign,generateWilderness,generateStronghold} from '../src/campaign.js';
import {capturePortalOrigin,createPortalLink,visibleTownPortals,portalLanding} from '../src/town-portals.js';
import {acceptActOneQuest,claimActOneQuest,recordActOneKill,actOneQuests,ensureQuestFlow,questGiverCue} from '../src/act-one.js';

test('town portal endpoints remain distinct on the same wilderness map and keep the exact field return point',()=>{
 const p=createPlayer();p.campaign=createCampaign();const area=generateWilderness(42817,1,p);p.x=area.townExit.x+1;p.y=area.townExit.y;
 const game={player:p,dungeon:area,loot:[{gold:9}],act:1,chapter:0,depth:1,seed:17};const origin=capturePortalOrigin(game);game.portalLink=createPortalLink(origin,area);
 const ends=visibleTownPortals(game);assert.equal(ends.length,2);assert.deepEqual(ends[0].x,p.x);assert.equal(origin.loot,game.loot);assert.equal(origin.area,area);
 for(const end of ends){const landing=portalLanding(area,end);assert.ok(isWalkable(area,landing.x,landing.y,.28));assert.ok(distance(landing,end)<2);}
 const dungeon=generateStronghold(17,1);game.dungeon=dungeon;assert.equal(visibleTownPortals(game).length,0);
 game.dungeon=origin.area;assert.equal(visibleTownPortals(game).length,2);
});
test('only the current accepted quest can pay, and clearing future targets early cannot skip or block a quest',()=>{
 const p=createPlayer();p.campaign=createCampaign();const before={gold:p.gold,xp:p.xp};
 assert.equal(acceptActOneQuest(p,'marchgate'),false);p.campaign.defeated.push('captain-1-0');
 assert.equal(claimActOneQuest(p,'marchgate'),null);assert.equal(actOneQuests(p)[1].status,'locked');assert.ok(acceptActOneQuest(p,'last-herd'));
 for(let mark=0;mark<6;mark++)recordActOneKill(p,{questId:'last-herd',questMark:mark});
 assert.equal(p.gold,before.gold);assert.equal(p.xp,before.xp);assert.equal(actOneQuests(p).filter(q=>['active','ready'].includes(q.status)).length,1);
 const reward=claimActOneQuest(p,'last-herd');assert.equal(reward.gold,65);const paid=p.gold;assert.equal(claimActOneQuest(p,'last-herd'),null);assert.equal(p.gold,paid);
 assert.ok(acceptActOneQuest(p,'marchgate'));assert.equal(actOneQuests(p)[1].status,'ready');assert.ok(claimActOneQuest(p,'marchgate'));
 const saved=JSON.parse(JSON.stringify(p));assert.equal(ensureQuestFlow(saved).claimed.length,2);
});
test('legacy immediately-paid quests migrate without paying a second time',()=>{
 const p=createPlayer();p.campaign={...createCampaign(),records:['field-1-0'],defeated:['captain-1-0']};delete p.campaign.questFlow;const gold=p.gold;
 assert.deepEqual(ensureQuestFlow(p).claimed,['last-herd','marchgate']);assert.equal(claimActOneQuest(p,'last-herd'),null);assert.equal(p.gold,gold);
});

test('quest markers follow the current giver and distinguish an offer from a hand-in',()=>{
 const p=createPlayer();p.campaign=createCampaign();assert.equal(questGiverCue(p).mark,'!');acceptActOneQuest(p,'last-herd');assert.equal(questGiverCue(p),null);
 p.campaign.records.push('field-1-0');assert.deepEqual(questGiverCue(p),{npc:'guide',mark:'?',quest:'last-herd'});claimActOneQuest(p,'last-herd');acceptActOneQuest(p,'marchgate');p.campaign.defeated.push('captain-1-0');claimActOneQuest(p,'marchgate');
 assert.deepEqual(questGiverCue(p),{npc:'merchant',mark:'!',quest:'tithe-enforcers'});
 p.campaign.questFlow.claimed=['last-herd','marchgate','tithe-enforcers','tithe-granary'];assert.equal(questGiverCue(p).npc,'smith');
});
