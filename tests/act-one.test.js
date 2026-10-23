import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,findPath,isWalkable} from '../src/game.js';
import {createCampaign,ensureCampaign,generateWilderness,generateStronghold,defeatCampaignBoss,nextChapter,canAdvance} from '../src/campaign.js';
import {actOneQuests,recordActOneKill} from '../src/act-one.js';
import {ensureManaFlask,drinkManaFlask,tickManaFlask,combatFlaskCharges} from '../src/flasks.js';
test('all six Act I quests complete by combat, persist, and never require a pickup',()=>{
 const p=createPlayer();p.campaign=createCampaign();
 for(let chapter=0;chapter<3;chapter++){
  const d=generateWilderness(42817+chapter*7919,1,p,chapter);assert.equal(d.field,null);assert.equal(d.provisions,null);
  const leaders=d.enemies.filter(e=>e.questId);assert.equal(leaders.length,3);for(const e of leaders){assert.ok(isWalkable(d,e.x,e.y,.23));assert.ok(findPath(d,d.start,e).length);recordActOneKill(p,e);assert.equal(recordActOneKill(p,e),null);}
  assert.equal(actOneQuests(p)[chapter*2].status,'complete');assert.equal(generateWilderness(d.seed,1,p,chapter).enemies.filter(e=>e.questId).length,0);
  const keep=generateStronghold(42921+chapter,1,chapter);const boss=keep.enemies.find(e=>e.type==='warden');assert.ok(defeatCampaignBoss(p,boss.bossId));assert.equal(actOneQuests(p)[chapter*2+1].status,'complete');if(chapter<2)assert.ok(nextChapter(p));
 }
 assert.ok(canAdvance(p));const saved=JSON.parse(JSON.stringify(p));ensureCampaign(saved);assert.equal(actOneQuests(saved).filter(q=>q.done).length,6);assert.equal(saved.inventory.length,0);
});
test('old Act I saves map to the new final region without losing the defeated knight',()=>{
 const p=createPlayer();p.campaign={act:2,chapters:{1:3,2:1},records:['field-1-0','field-2-0'],defeated:['knight-1'],waypoints:['emberfall','act-1-stronghold-4'],visited:[]};ensureCampaign(p);assert.equal(p.campaign.chapters[1],2);assert.equal(p.campaign.chapters[2],1);assert.ok(p.campaign.records.includes('field-2-0'));assert.ok(p.campaign.waypoints.includes('act-1-stronghold-3'));assert.equal(actOneQuests(p).filter(q=>q.done).length,4);const first=JSON.stringify(p.campaign);ensureCampaign(p);assert.equal(JSON.stringify(p.campaign),first);
});
test('mana flask uses charges, respects reservations, regenerates and refills from combat',()=>{
 const p=createPlayer();p.mana=0;const stats={maxMana:100,flaskGain:0};assert.equal(ensureManaFlask(p).charges,60);assert.ok(drinkManaFlask(p,stats,70));assert.equal(p.mana,6);assert.equal(p.manaFlask.charges,40);tickManaFlask(p,stats,3,false,70);assert.equal(p.mana,56);p.mana=69;drinkManaFlask(p,stats,70);tickManaFlask(p,stats,3,false,70);assert.equal(p.mana,70);assert.equal(drinkManaFlask(p,stats,70),false);const before=p.manaFlask.charges;combatFlaskCharges(p,stats);assert.equal(p.manaFlask.charges,before+6);p.manaFlask.charges=0;p.mana=0;assert.equal(drinkManaFlask(p,stats),false);tickManaFlask(p,stats,1,true);assert.equal(p.manaFlask.charges,4);
});
