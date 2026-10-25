import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoveredAccounts,accountPage,visibleQuestNarrative} from '../src/story-book.js';

const catalog=[{id:'pasture',title:'The pasture',text:'Known road.'},{id:'gate',title:'The gate',text:'An officer’s name.'},{id:'hollow',title:'The hollow',text:'A secret witness.'}];
test('the account book reveals only discovered IDs and preserves their actual discovery order',()=>{
 const player={story:{records:['gate','unknown','pasture','gate']}};
 assert.deepEqual(discoveredAccounts(player,catalog).map(r=>r.id),['gate','pasture']);
 assert.equal(JSON.stringify(discoveredAccounts(player,catalog)).includes('secret witness'),false);
 assert.deepEqual(player.story.records,['gate','unknown','pasture','gate']);
 assert.deepEqual(discoveredAccounts({},catalog),[]);assert.deepEqual(discoveredAccounts({story:{records:'gate'}},catalog),[]);
});
test('account paging clamps stale selections without opening an undiscovered record',()=>{
 const player={story:{records:['gate','pasture']}};
 assert.equal(accountPage(player,catalog,{id:'pasture'}).index,1);
 assert.equal(accountPage(player,catalog,{id:'hollow',page:99}).record.id,'pasture');
 assert.equal(accountPage(player,catalog,{page:-5}).record.id,'gate');
 assert.equal(accountPage({},catalog,{id:'hollow',page:99}).record,null);
});
test('an unreached quest hides its identity, objective, confession and aftermath until its chapter is known',()=>{
 const quest={title:'Hidden commander',objective:'Defeat the hidden commander.',story:'The witness confesses.',aftermath:'A secret name.',status:'locked'};
 const hidden=visibleQuestNarrative(quest);assert.equal(/commander|confesses|secret name/.test(JSON.stringify(hidden)),false);
 assert.equal(visibleQuestNarrative({...quest,status:'active'}).story,quest.story);
 assert.equal(visibleQuestNarrative({...quest,status:'complete',done:true}).aftermath,quest.aftermath);
});
