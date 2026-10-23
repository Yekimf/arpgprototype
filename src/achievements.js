import {ITEM_SETS,discoverSetItems,equippedSetPieces} from './set-items.js';
export function ensureChronicle(p){p.chronicle??={version:1,unlocked:{},stats:{},seenChickens:[],title:null};p.chronicle.unlocked??={};p.chronicle.stats??={};p.chronicle.seenChickens??=[];return p.chronicle;}
export function recordFeat(p,key,n=1){const c=ensureChronicle(p);c.stats[key]=(c.stats[key]||0)+n;}
export function meetChicken(p,id){const c=ensureChronicle(p);if(!c.seenChickens.includes(id)){c.seenChickens.push(id);recordFeat(p,'chickens');}}
const stat=(p,key)=>p.chronicle?.stats?.[key]||0,items=p=>[...(p.inventory||[]),...(p.stash||[]),...Object.values(p.equipment||{}).filter(Boolean)];
const a=(id,name,category,goal,description,title,icon,value,renown=10)=>({id,name,category,goal,description,title,icon,value,renown});
export const ACHIEVEMENTS=[
 a('inventory','Taking Inventory. Again.','Oddities',1,'Open your pack. A tradition older than the kingdom’s tax code.','Pocket Dimension Enthusiast','ward',p=>stat(p,'inventoryOpens')),
 a('listen','Hey! Listen!','Journey',1,'Speak to Maelin and accept help. The advice is mercifully unvoiced.','The Attentive','spirit',p=>+!!p.quests?.guideMet),
 a('upgrade','Getting an Upgrade','Journey',5,'Reach level 5. Stone tools were never going to settle a succession crisis.','A Promising Problem','basic',p=>p.level),
 a('veteran','The Plot Thickens','Journey',20,'Reach level 20. Your knees have filed an official complaint.','The Seasoned','vigor',p=>p.level,25),
 a('first-blood','Hostile Architecture','Combat',1,'Defeat your first enemy. The kingdom has very poor guest service.','The Uninvited','cleave',p=>p.kills||0),
 a('hundred','Rip and Tear, Politely','Combat',100,'Defeat 100 enemies. An apology is optional; the sword is not.','The Courteous Menace','rend',p=>p.kills||0,25),
 a('five-hundred','No Rest for the Wicked','Combat',500,'Defeat 500 enemies. Someone must keep the grave-diggers employed.','The Relentless','execution',p=>p.kills||0,50),
 a('fists','These Hands Are Rated E','Combat',10,'Defeat 10 enemies with no weapon equipped. Everyone gets a turn.','The Bare-Knuckled','punch',p=>stat(p,'unarmedKills'),25),
 a('boss','Gatekeeping Is a Profession','Combat',1,'Defeat a corrupted knight. Ask for the manager by name.','The Gatecrasher','quake',p=>Math.max(stat(p,'bossKills'),p.campaign?.defeated?.length||0,+!!p.quests?.wardenDefeated),25),
 a('died','You Died. Paperwork Follows.','Oddities',1,'Fall in battle once. Welcome to the prestigious learning experience.','The Inconveniently Mortal','blood',p=>p.deaths||0),
 a('act-two','You Shall Pass','Journey',2,'Reach Act II. It turns out gates can be persuaded.','The Roadbreaker','portal',p=>p.campaign?.act||1,25),
 a('act-five','The Final Round','Journey',5,'Reach Act V. The table is running out of knights.','The Last Challenger','judgment',p=>p.campaign?.act||1,50),
 a('kingbreaker','The King Is Dead. Again.','Journey',1,'Finish the campaign. This succession could have been an email.','Kingbreaker','judgment',p=>+!!p.campaign?.completed,50),
 a('waypoints','Fast Travel, Slow Paperwork','Journey',3,'Attune three waypoints. No horse, no problem.','The Wayfarer','portal',p=>p.campaign?.waypoints?.length||0),
 a('records','Lore and Order','Journey',4,'Recover four field accounts. The plot thickens in triplicate.','The Chronicler','focus',p=>p.campaign?.records?.length||0),
 a('gold','Pocket Change','Craft',1000,'Earn 1,000 gold from the fallen. Apparently pockets survive undeath.','The Solvent','precision',p=>p.goldEarned||0),
 a('bank','My Precious','Craft',1000,'Store 1,000 gold in your stash. You may stop checking it now.','The Vault-Keeper','ward',p=>p.bankGold||0),
 a('forge','Reforged, Not Refunded','Craft',1,'Reforge an item. Garran offers neither receipts nor emotional support.','The Tempered','kindling',p=>Math.max(stat(p,'reforges'),...items(p).map(i=>i.reforges||0))),
 a('identify','Stay Awhile and Appraise','Craft',10,'Identify 10 items. Edrin insists the waiting is part of the service.','The Appraiser','resonance',p=>stat(p,'identified'),25),
 a('flasks','Estus? Barely Know Us.','Oddities',10,'Drink from your life flask 10 times. Same ritual, different paperwork.','The Well-Hydrated','potion',p=>stat(p,'flasks')),
 a('passives','Passive Aggressive','Journey',20,'Allocate 20 passive nodes. An extremely active approach to being passive.','The Elaborately Prepared','convergence',p=>p.passives?.length||0,25),
 a('three-paths','Build-a-Build','Journey',3,'Learn disciplines from all three masteries. Commitment is a flexible concept.','The Eclectic','convergence',p=>new Set(Object.keys(p.skills||{}).filter(k=>p.skills[k]>0).map(k=>['cleave','vigor','precision','quake','blood','whirl','execution','rend','bulwark','procession'].includes(k)?'iron':['bolt','kindling','spirit','meteor','ash','inferno','phoenix','focus','cataclysm'].includes(k)?'ember':'aether')).size),
 a('hen','Definitely Not the Cow Level','Oddities',1,'Find a wandering chicken. No secret portal. Probably.','The Poultry Pilgrim','phoenix',p=>stat(p,'chickens')),
 a('grass','Touch Grass. Briefly.','Oddities',10000,'Travel 10,000 paces. The grass has requested that you move along.','The Footsore','evade',p=>Math.floor(stat(p,'distance')),25),
 a('first-set','It Belongs in My Inventory','Collection',1,'Discover your first set piece. A museum would only misplace it.','The Relic-Hunter','bulwark',p=>p.setCollection?.length||0),
 a('complete-set','Gotta Hoard ’Em All','Collection',1,'Discover all six pieces of any equipment set. Storage is a state of mind.','The Completionist','bulwark',p=>+ITEM_SETS.some(s=>Array.from({length:6},(_,i)=>s.id+':'+i).every(k=>p.setCollection?.includes(k))),50),
 a('wear-set','Dress for the End of the World','Collection',6,'Wear all six working, identified pieces of a set. Finally, a coordinated apocalypse.','The Fully Appointed','vigor',p=>Math.max(...ITEM_SETS.map(s=>equippedSetPieces(p,s.id).length)),50),
];
export function checkAchievements(p,now=Date.now()){const c=ensureChronicle(p);discoverSetItems(p);const fresh=[];for(const a of ACHIEVEMENTS)if(!c.unlocked[a.id]&&a.value(p)>=a.goal){c.unlocked[a.id]={at:now};fresh.push(a);}return fresh;}
export const renown=p=>ACHIEVEMENTS.filter(a=>p.chronicle?.unlocked?.[a.id]).reduce((n,a)=>n+a.renown,0);
export const honorific=p=>ACHIEVEMENTS.find(a=>a.id===p.chronicle?.title&&p.chronicle.unlocked[a.id])?.title||'';
export function selectHonorific(p,id){const c=ensureChronicle(p);if(!id){c.title=null;return true;}if(!c.unlocked[id]||!ACHIEVEMENTS.some(a=>a.id===id))return false;c.title=id;return true;}
