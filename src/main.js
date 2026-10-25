import {finishBoot} from './boot-screen.js';
import {Storyteller} from './story-ui.js';
import {ensureStory,readStoryRecord} from './story-state.js';
import {dressStoryArea,storyRecordById} from './story-world.js';
import {handleQuestBookClick} from './quest-book.js';
import './story.css';
import {firstWallTime,projectileContacts} from './combat-geometry.js';
import {bufferCombatAction,takeBufferedAction,hitReaction,skillContactTiming} from './combat-feel.js';
import {CONTROL_ACTIONS,defaultControls,activeBindings,bindingError,keyLabel,eventCode,movementVector,isMovementCode,controlsMarkup} from './controls.js';
import {OfflineSupport} from './offline-support.js';
import {LocalSavesMenu} from './local-saves-menu.js';
import './online-menus.css';
import {Friends} from './network/friends.js';
import {LanClient} from './lan-client.js';
import {chanceToHit,enemyCombatStats,rollWeaponHit,weaponAttack} from './defense.js';
import {effectiveAttributes} from './gear-requirements.js';
import './equipment-rules.css';
import './death-remains.css';
import './glass-and-gold.css';
import {leaveCorpse,scatterRemains,remainsKind} from './death-remains.js';
import './stash-pages.css';
import {CharacterSaves} from './character-saves.js';
import {recordActOneKill,actOneObjective} from './act-one.js';
import {assignSkill,boundSkill,primaryRange} from './skill-bindings.js';
import {rollSetItem} from './set-items.js';
import {checkAchievements,recordFeat,meetChicken,selectHonorific} from './achievements.js';
import {renderChronicle,announceAchievements} from './chronicle-ui.js';
import {seedChickens,updateChickens,nearChicken,chickenDamage,chickenRegen} from './chickens.js';
import {lootLabelAt} from './loot-labels.js';
import './font-assets.js';
import {fontFamily} from './font-choices.js';
import {activateFountain,fountainKey} from './waypoint-fountains.js';
import {bossRelic,BOSS_ARMS} from './boss-relics.js';
import {attackTiming} from './weapon-rig.js';
import {testingMarkup} from './testing-ui.js';
import {zoomAtlas} from './passive-ui.js';
import {allocatePassive,refundPassive} from './passive-tree.js';
import {skillProfile,chooseSpecialization,specialization} from './skill-system.js';
import {sandboxDefaults,outgoingMultiplier,manaCapacity,queueLeech,restoreLeech,dungeonSeed,queueEffect} from './combat-rules.js';
import {updateFlock} from './forest-life.js';
import {questRelic} from './quest-objects.js';
import {MELEE,BOSS_MELEE,hostileAim,bossCadence} from './combat-balance.js';
import {renderProgression} from './progression-ui.js';
import './progression.css';
import {openingObjective,recordHerdKill,recoverProvisions} from './opening-quests.js';
import {WALK_FRAMES,STRIDE_DISTANCE} from './locomotion.js';
import {CursorCapture} from './cursor-capture.js';
import './cursor-capture.css';
import {planWalk} from './navigation.js';
import {bossPlan,bossSweepHits,bossWaveHits} from './boss-abilities.js';
import {CHAPTERS,chapterFor,lastChapter} from './campaign-content.js';
import {DEFAULTS,loadSettings,saveSettings,sanitizeSettings,optionsMarkup} from './settings.js';
import {collectGold,goldReward} from './economy.js';
import {itemArt} from './item-art.js';
import {skillIcon} from './skill-icons.js';
import {ensureManaFlask,refillManaFlask,drinkManaFlask,tickManaFlask,ensureFlask,refillFlask,drinkFlask,tickFlask,combatFlaskCharges,FLASK} from './flasks.js';
import {togglePyre,tickPyre,pyreStats} from './devotion.js';
import {appearanceOf} from './itemization.js';
import './style.css';
import './town.css';
import './hud.css';
import './front-end.css';
import './retro.css';
import './classic-inventory.css';
import './desktop.css';
import './gothic.css';
import './menu-art.css';
import './service-panels.css';
import './chronicle.css';
import './quest-book.css';
import './kingdom.css';
import './presentation.css';
import './interface-refinements.css';
import './painted-menus.css';
import './inventory-polish.css';
import './collections.css';
import './skill-bindings.css';
import './act-one.css';
import './controls.css';
import {GLOBE_FRAME_ART,SET_MODELS_ART,SET_ITEMS_ART,EQUIPMENT_ETCHINGS_ART,SKILL_PAINTINGS_ART,EQUIPMENT_RELIEF_ART,MENU_CREST_ART} from './assets.js';
import {NPCDialogue} from './npc-dialogue.js';
import {FOLIO_FRAME_ART,SKILL_FRAME_ART,STORY_ART,LEATHER_ART,MAP_ART,GUARD_ART,STONE_ART} from './assets.js';
import {FrontEnd} from './front-end.js';
import {actOneLevel,encounterXP,actOneLootLevel} from './act-one-balance.js';
import {ACTS,actFor,createCampaign,ensureCampaign,discoverLocation,attuneWaypoint,canTravel,locationId,defeatCampaignBoss,chapterOf,captainId,fieldKey,completeField,nextChapter,campaignObjective,generateWilderness,generateStronghold,inSanctuary} from './campaign.js';
import {renderCampaignPanel} from './campaign-ui.js';
import {generateDungeon,makeEnemy,grantExperience,spendAttribute,skillLevel,ORIGINS,random,distance,moveEntity,isWalkable,findPath,createPlayer,playerStats,mitigateDamage,MASTERIES,ALL_SKILLS,getSkill,rankOf,masteryPoints,learnSkill,canLearn,clamp,xpNeeded,generateItem} from './game.js';
import {Renderer} from './renderer.js';
import {migratePlayer,generateTown,generateStock,addToContainer,itemName} from './settlement.js';
import {TownUI,HUD_PANELS} from './town-ui.js';

const $=id=>document.getElementById(id);
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [name,url] of [['--globe-frame',GLOBE_FRAME_ART],['--set-models',SET_MODELS_ART],['--set-items',SET_ITEMS_ART],['--equipment-etchings',EQUIPMENT_ETCHINGS_ART],['--skill-paintings',SKILL_PAINTINGS_ART],['--equipment-relief',EQUIPMENT_RELIEF_ART],['--menu-crest',MENU_CREST_ART]])document.documentElement.style.setProperty(name,`url("${url}")`);
for(const [slot,id] of [['basic','basic'],['potion','potion'],['mana-potion','potion'],['dodge','evade'],['portal','portal']])$(slot+'-slot').querySelector('.ability-art').innerHTML=skillIcon(id);
let settings={...DEFAULTS,controls:defaultControls()};try{settings=loadSettings(localStorage);}catch{}
let characterStorage=null;try{localStorage.getItem('forgotten-kingdom-characters-v1');characterStorage=localStorage;}catch{}
const characterSaves=new CharacterSaves(characterStorage);
const renderer=new Renderer($('world'),$('minimap'));
const saved=characterSaves.active?.save||null;
const validSave=!!saved;
let lastSaveError='';
const player=migratePlayer(validSave?{...createPlayer(),...saved.player,progressionVersion:saved.player.progressionVersion??1,passiveVersion:saved.player.passiveVersion??0,attributes:saved.player.attributes??{might:0,vitality:0,will:0,dexterity:0},attributePoints:saved.player.attributePoints??Math.max(0,((saved.player.level||1)-1)*5)}:createPlayer());
ensureCampaign(player);ensureStory(player);
for(const [key,url] of Object.entries({'--folio-frame':FOLIO_FRAME_ART,'--skill-frame':SKILL_FRAME_ART,'--guard-art':GUARD_ART,'--inventory-stone':STONE_ART,'--story-art':STORY_ART,'--leather-texture':LEATHER_ART,'--map-art':MAP_ART}))document.documentElement.style.setProperty(key,`url("${url}")`);
let lan=null;let offlineSupport=null;let storyteller=null;
const game={characterSaves,sandbox:sandboxDefaults(),auras:{},actionRecovery:0,castCounts:{},player,stats:playerStats(player),dungeon:null,loot:[],projectiles:[],effects:[],floaters:[],cooldowns:{},attackCooldown:0,attackAnim:0,dodgeCooldown:0,dodgeTime:0,hurtFlash:0,moving:false,paused:false,panel:null,time:0,showLoot:false,largeMap:false,depth:validSave?saved.depth:1,seed:validSave?saved.seed:Math.floor(Math.random()*1e9),flow:null,flowTimer:0,aim:{x:player.x+1,y:player.y},target:null,mouseDown:false,lastMove:{x:1,y:0},sound:false,selectedMastery:'iron',selectedItem:null};
let keys=new Set(),toastTimer,saveTimer=0,audioCtx,mouseScreen=null;
const cursor=new CursorCapture($('app'),{onMove:p=>{mouseScreen={x:p.x,y:p.y};game.pointerOverWorld=p.target?.id==='world';game.aim=aimPoint();},onRelease:()=>{keys.clear();clearAttackOrder();game.mouseDown=false;},notify:message=>toast(message,4000)});
const cursorCss=window.getComputedStyle(document.documentElement).getPropertyValue('--game-cursor'),cursorArt=cursorCss.slice(0,cursorCss.lastIndexOf(')')+1);document.documentElement.style.setProperty('--captured-cursor-art',cursorArt);
game.settings=settings;game.sound=settings.sound;renderer.configure(settings);
const townUI=new TownUI(game,{save,toast,openPanel,closePanel,enterDungeon,sound});
const dialogue=new NPCDialogue(game,{project:(x,y)=>renderer.screen(x,y),openPanel,save:()=>{save();setZoneUI();},toast});
storyteller=new Storyteller(game,{save});
let pendingBinding=null;
Object.assign(game,{pendingAction:null,combo:0,primaryHeld:false,secondaryHeld:false,primaryMode:null,combatTarget:null,attackPending:false,walkPhase:0,facing:{x:1,y:0},actionFacing:{x:1,y:0},castLock:0,pointerOverWorld:false,hudWidth:0,moveRefresh:0,combatRefresh:0,act:player.campaign?.act||1,chapter:saved?.chapter??chapterOf(player,saved?.act||1),areas:new Map(),frontScreen:true,supplyKills:-1,playerSlow:0});

function setZoneUI(){
  const town=game.zone==='town';
  if(player.campaign){setCampaignZoneUI();return;}
  $('floor-label').textContent=town?'SANCTUARY':`DEPTH ${String(game.depth).padStart(2,'0')}`;
  $('map-depth').textContent=town?'⌂':String(game.depth);
  $('location').textContent=town?'Emberfall Encampment':game.depth===1?'The Hollow Crypt':game.depth<4?'The Sunken Ossuary':'The Endless Hollow';
  document.querySelector('.chapter>.eyebrow').textContent=town?'ACT I · THE LAST LIGHT':'ACT I · THE FORSAKEN DEPTHS';
  document.querySelector('.map-heading>span').textContent=town?'EMBERFALL':'THE HOLLOW CRYPT';
  document.querySelector('.map-caption').innerHTML=`<span class="map-dot"></span>${town?' SAFE HAVEN ':' UNCHARTED TERRITORY '}<span class="key-cap">M</span>`;
  $('objective').textContent=town?!player.quests.guideMet?'Speak to Sister Maelin':player.quests.wardenDefeated&&!player.quests.guideRewarded?'Return to Maelin for your reward':player.quests.scholarRescued?'Visit Edrin to identify your relics':'Rescue the archivist beneath the monastery':game.dungeon.bossDead?'Enter the rift to descend deeper':'Find and defeat the Hollow Warden';
  $('quest-progress').textContent=town?'Trade · Rest · Reforge · Prepare':`Explore the crypt · Depth ${game.depth}`;
  $('journey-button').textContent=town?'Enter the crypt →':`Town portal · ${keyLabel(activeBindings(settings.controls).portal)}`;
  $('town-services').classList.toggle('hidden',!town);
  document.querySelector('[data-npc="scholar"]').disabled=!player.quests.scholarRescued;
  document.querySelector('[data-npc="scholar"] small').textContent=player.quests.scholarRescued?'IDENTIFY RELICS':'ARCHIVIST · MISSING';
  $('seed-label').textContent=town?'EMBERFALL · SAFE HAVEN':`SEED ${game.seed.toString(16).toUpperCase()}`;
  document.querySelector('.zone-intro h1').textContent=$('location').textContent;
  document.querySelector('.zone-intro .eyebrow').textContent=town?'WHERE THE LAST LANTERNS BURN':'BENEATH THE OLD MONASTERY';
  document.querySelector('.zone-intro>div').textContent=town?'A small light against a gathering dark.':'Let the forgotten remember your name.';
}
function enterTown(initial=false){
  cancelPendingCombat();
  if(player.campaign){
    if(!initial){rememberArea();if(!inSanctuary(game.dungeon,player))game.expedition={kind:game.dungeon.kind,act:game.act,chapter:game.chapter};}
    enterCampaignArea('wilderness',1,false,true,0);const at=game.dungeon.start;player.x=at.x;player.y=at.y;game.zone='town';game.target=null;game.path=null;game.channel=null;
    // The rescued archivist joins the existing camp without regenerating its field.
    if(player.quests.scholarRescued&&!game.dungeon.npcs.some(n=>n.id==='scholar')){const n=generateTown(player).npcs.find(n=>n.id==='scholar');game.dungeon.npcs.push({...n,x:n.x+16,y:n.y+18});renderer.cachedDungeon=null;}
    player.shopStock??=generateStock(player.level,game.seed);renderer.camera={...renderer.iso(player.x,player.y)};setZoneUI();reveal();buildFlow();if(!initial){save();toast('EMBERFALL · The last friendly fire.');}return;
  }
  if(player.campaign&&!initial){rememberArea();if(game.zone!=='town')game.expedition={kind:game.dungeon.kind,act:game.act,chapter:game.chapter};}
  if(!player.campaign&&!initial&&game.zone==='dungeon')game.expedition={dungeon:game.dungeon,loot:game.loot,position:{x:player.x,y:player.y},depth:game.depth,seed:game.seed};
  clearAttackOrder();game.zone='town';game.pyre=null;game.auras={};game.dungeon=generateTown(player);game.loot=[];game.projectiles=[];game.rangedShot=null;game.effects=[];game.floaters=[];game.target=null;game.path=null;game.channel=null;game.interactTarget=null;game.mouseDown=false;
  if(player.campaign){game.dungeon.waypoint={x:33,y:34};game.dungeon.act=player.campaign.act;game.act=player.campaign.act;}
  player.x=game.dungeon.start.x;player.y=game.dungeon.start.y;
  player.shopStock??=generateStock(player.level,game.seed);
  renderer.camera={...renderer.iso(player.x,player.y)};buildFlow();setZoneUI();prepareArea();
  if(!initial){save();toast('EMBERFALL · You are safe here.');}
}
function enterDungeon(){
  cancelPendingCombat();
  if(player.campaign){const dest=game.expedition||{kind:'wilderness',act:player.campaign.act,chapter:chapterOf(player)};game.expedition=null;enterCampaignArea(dest.kind,dest.act,false,false,dest.chapter||0);return;}
  if(game.expedition){
    const expedition=game.expedition;clearAttackOrder();game.zone='dungeon';game.dungeon=expedition.dungeon;game.loot=expedition.loot;game.depth=expedition.depth;game.seed=expedition.seed;player.x=expedition.position.x;player.y=expedition.position.y;game.expedition=null;game.target=null;game.path=null;game.interactTarget=null;game.channel=null;game.projectiles=[];game.rangedShot=null;game.effects=[];game.floaters=[];renderer.camera={...renderer.iso(player.x,player.y)};buildFlow();setZoneUI();prepareArea();
  }else newFloor(game.depth,game.seed);
  save();toast('The Hollow Crypt · Press T to return to town.');
}
function townPortal(){
  clearAttackOrder();
  if(game.paused||game.loading)return;if(game.zone==='town'){openPanel('departure');return;}
  if(game.channel)return;cancelPendingCombat();game.target=null;game.path=null;game.channel={remaining:3};game.mouseDown=false;
  toast('Opening a town portal · Hold still for 3 seconds',3100);effect('ring',player.x,player.y,3,{radius:1.3,color:'#a8bbd0'});
}

function newFloor(depth,seed){
  cancelPendingCombat();
  clearAttackOrder();game.zone='dungeon';game.path=null;game.channel=null;game.interactTarget=null;
  game.depth=depth;game.seed=seed;game.dungeon=generateDungeon(seed,depth);game.loot=[];game.effects=[];game.projectiles=[];game.rangedShot=null;game.floaters=[];game.target=null;
  const start=game.dungeon.start;player.x=start.x;player.y=start.y;game.aim={x:player.x+2,y:player.y};game.flowTimer=0;
  renderer.camera={...renderer.iso(player.x,player.y)};
  setZoneUI();reveal();buildFlow();prepareArea();
}
if(player.campaign){const expedition=saved?.expedition||(saved?.zone&&saved.zone!=='town'?{kind:saved.zone==='wilderness'?'wilderness':'stronghold',act:saved.act||1,chapter:saved.chapter||0}:null);if(expedition&&(expedition.act||1)<=ACTS.length)game.expedition={...expedition};}
enterTown(true);
player.hp=clamp(player.hp||game.stats.maxHp,1,game.stats.maxHp);player.mana=clamp(player.mana,0,game.stats.maxMana);

function persistSettings(){try{saveSettings(localStorage,settings);}catch{}}
function applySettings(){Object.assign(settings,sanitizeSettings(settings));document.documentElement.dataset.menuFont=settings.menuFont;document.documentElement.style.setProperty('--chosen-font',fontFamily(settings.menuFont));game.sound=settings.sound;game.showLoot=settings.lootLabels;$('world').setAttribute('aria-label',`Isometric game. ${settings.controls.movement==='wasd'?'WASD or click':'Click'} to move. Aim with the cursor. Click skill boxes to assign abilities. Customize keys in Options. I inventory.`);renderer.configure(settings);document.documentElement.classList.toggle('reduced-motion',settings.reducedMotion);$('map-overlay').style.opacity=settings.mapOpacity/100;document.querySelector('.map-panel').style.opacity=settings.mapOpacity/100;$('sound').setAttribute('aria-label',game.sound?'Mute sound':'Enable sound');persistSettings();}
applySettings();
function save(){
  if(!validSave&&!player.campaign)return false;
  announceAchievements(checkAchievements(player));
  const expedition=player.campaign?(game.zone!=='town'&&game.dungeon?.kind?{kind:game.dungeon.kind,act:game.act,chapter:game.chapter}:game.expedition?{kind:game.expedition.kind,act:game.expedition.act,chapter:game.expedition.chapter}:null):null;const target=game.onlineSession?.archive||characterSaves;const ok=target.save({version:1,player,depth:game.depth,seed:lan?.active?game.lanReturn?.seed||game.seed:game.seed,zone:game.zone,act:game.act,chapter:game.chapter,expedition:lan?.active?game.lanReturn?.expedition||null:expedition});if(!ok&&target.error!==lastSaveError){lastSaveError=target.error;toast(lastSaveError,7000);}if(ok)lastSaveError='';return ok&&target.persistent;
}
function toast(text,duration=2700){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.remove('hidden');toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),duration);}
function sound(freq=200,length=.08,type='triangle',volume=.035){
  if(!game.sound)return;
  try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.4,audioCtx.currentTime+length);g.gain.setValueAtTime(volume*settings.volume/100,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+length);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+length);}catch{}
}
function effect(type,x,y,life=.5,extra={}){queueEffect(game,{type,x,y,life,maxLife:life,...extra});}
function floater(text,x,y,color,crit=false){if(!settings.damageNumbers&&/^[−+\-]?\d+$/.test(String(text)))return;if(game.floaters.length>=120)game.floaters.shift();game.floaters.push({text:String(text),x,y,life:1.4,color,crit});}
function nearestEnemy(range=8,point=player){return game.dungeon.enemies.filter(e=>!e.dead&&distance(e,player)<range).sort((a,b)=>distance(a,point)-distance(b,point))[0];}
function enemyUnderPointer(){
  if(!mouseScreen||!game.pointerOverWorld)return null;
  return game.dungeon.enemies.filter(e=>!e.dead&&Math.abs(e.x-player.x)<20&&Math.abs(e.y-player.y)<20&&game.dungeon.seen.has(Math.floor(e.y)*game.dungeon.size+Math.floor(e.x))).sort((a,b)=>(b.x+b.y)-(a.x+a.y)).find(e=>{
    const at=renderer.screen(e.x,e.y),height=(e.type==='warden'?144:82)*renderer.zoom,width=(e.type==='warden'?49:31)*renderer.zoom;
    return Math.abs(mouseScreen.x-at.x)<width&&mouseScreen.y>=at.y-height&&mouseScreen.y<=at.y+7;
  })||null;
}
function aimPoint(id='basic'){
  const enemy=enemyUnderPointer();if(enemy)return {x:enemy.x,y:enemy.y};
  return mouseScreen?renderer.unproject(mouseScreen.x,mouseScreen.y,['meteor','vortex','cataclysm','judgment'].includes(id)?0:24):game.aim;
}
function facePoint(point){const dx=point.x-player.x,dy=point.y-player.y,length=Math.hypot(dx,dy);if(length<.0001)return;game.actionFacing={x:dx/length,y:dy/length};game.facing={...game.actionFacing};}
function clearAttackOrder(){game.queuedSkill=null;game.combatTarget=null;game.attackPending=false;game.primaryHeld=false;game.secondaryHeld=false;game.primaryMode=null;game.lootTarget=null;}
function confirmedHit(e,damage,element,critical,from=player){
  e.hitReaction=hitReaction(e,damage,{from,critical,element});
  const material=remainsKind(e)==='bone'?'bone':e.type==='warden'?'metal':'flesh';
  effect('hit-impact',e.x,e.y,.28,{...e.hitReaction,material,element,critical,seed:(e.id||0)*31+game.combo});
  if(game.time>=(game.lastHitSound||0)){game.lastHitSound=game.time+.065;sound(material==='bone'?250:material==='metal'?360:135,.075,'triangle',critical?.04:.025);}
}
function cancelPendingCombat(){game.pendingAction=null;game.melee=null;game.rangedShot=null;}
function damageEnemy(e,base,element='physical',allowCrit=true,source=null,from=player){
  if(e.dead)return false;
  if(!lan?.active&&weaponAttack(element,source,allowCrit)&&!rollWeaponHit(game.stats,enemyCombatStats(e,game.depth))){floater('Miss',e.x,e.y,'#a8997d');return false;}
  let damage=chickenDamage(game.chickenNearby,base)*game.stats.bonus*outgoingMultiplier(game.sandbox)*(element==='physical'?game.stats.physical:game.stats.spell*(element==='fire'?game.stats.fire:element==='cold'||element==='aether'?game.stats.cold:game.stats.lightning));
  if(game.auras.focus&&element!=='physical')damage*=1+(15+Math.max(0,rankOf(player,'focus')+Math.min(4,game.stats.skillRanks||0)-1)*5)/100;
  if(e.slow>0)damage*=1+game.stats.chilledDamage/100;if(e.shock>0)damage*=1+(e.shockPower||.1);if(!allowCrit&&element==='fire')damage*=1+game.stats.burnDamage/100;
  const crit=allowCrit&&Math.random()*100<game.stats.crit;if(crit)damage*=game.stats.critMultiplier;
  if(e.hp/e.maxHp<.35)damage*=1+rankOf(player,'execution')*.15;
  damage=Math.max(1,Math.round(damage*(.9+Math.random()*.2)));const actualDamage=Math.min(e.hp,damage);if(lan?.active){lan.hit({enemyId:e.id,damage,element,crit,skill:source,direct:allowCrit});return true;}e.hp-=damage;
  if(allowCrit){queueLeech(game,actualDamage,element,source?specialization(player,source):{});if(element==='lightning'){e.shock=3*(game.stats.shockDuration||1);e.shockPower=Math.min(.4,.10+game.stats.shockEffect/100);}if(element==='physical'&&game.stats.bleed>0){e.bleed=3;e.bleedPower=base*game.stats.bleed/100/3;}}if(allowCrit){e.hit=.16;confirmedHit(e,actualDamage,element,crit,from);}e.aggro=true;
  floater(damage,e.x,e.y,crit?'#f0d28a':element==='fire'?'#eab184':element==='cold'?'#b7dde0':'#d7dbbf',crit);
  if(allowCrit&&element==='physical'&&rankOf(player,'blood'))player.hp=Math.min(game.stats.maxHp,player.hp+rankOf(player,'blood')*2);
  if(e.hp<=0)kill(e);else if(allowCrit)scatterRemains(game.dungeon,e,player,{time:game.time});return true;
}
function kill(e,credit=true){
  if(e.dead&&(!lan?.active||!credit||e.lanRewarded))return;
  if(!e.dead)leaveCorpse(game.dungeon,e,player,{time:game.time});
  e.dead=true;e.hp=0;storyteller?.bossDeath(e);if(!credit)return;combatFlaskCharges(player,game.stats,{elite:e.elite,boss:e.type==='warden'});if(lan?.active)e.lanRewarded=true;player.kills++;const questReward=recordActOneKill(player,e);if(questReward){toast(questReward.message,3500);setZoneUI();save();}if(game.act!==1&&recordHerdKill(player,e)){toast(openingObjective(player)||'The herd is safe · return to Maelin');save();setZoneUI();}const boss=e.type==='warden';if(boss)recordFeat(player,'bossKills');if(!game.stats.weapon)recordFeat(player,'unarmedKills');
  const xp=encounterXP(e,player.level)+(questReward?.xp||0);const levels=grantExperience(player,xp);
  if(boss)effect('impact',e.x,e.y,.5,{color:'#d1b971'});
  if(!lan?.active)game.loot.push({x:e.x+.2,y:e.y,gold:goldReward(game.depth,{boss,elite:e.elite})});
  const rng=random(Math.floor(Math.random()*1e9));
  if(!lan?.active&&(boss||e.elite||rng()<.3))game.loot.push({x:e.x-.3,y:e.y+.3,item:rollSetItem(rng,actOneLootLevel(game.depth),{boss,elite:e.elite})||generateItem(rng,actOneLootLevel(game.depth),boss)});
  if(boss&&player.campaign){campaignBossKilled(e);}else if(boss){game.dungeon.bossDead=true;player.quests.wardenDefeated=true;player.quests.scholarRescued=true;player.points+=2;refillFlask(player,40);$('objective').textContent='Return to Maelin · or descend deeper';$('quest-progress').textContent='Archivist rescued · +2 mastery points';toast('EDRIN IS FREE · The archivist awaits you in Emberfall. Press T.',5500);sound(560,.7,'sine');}
  player.hp=Math.min(game.stats.maxHp,player.hp+rankOf(player,'phoenix')*6+game.stats.lifeOnKill);player.mana=Math.min(manaCapacity(game.stats,game.auras),player.mana+rankOf(player,'phoenix')*3+game.stats.manaOnKill);
  if(levels){game.stats=playerStats(player);effect('ring',player.x,player.y,1.2,{radius:3,color:'#cbd69c'});toast(`LEVEL ${player.level} · +${levels} mastery · +${levels} passive · +${levels*5} attributes · K / C`,4500);sound(680,.45,'sine');document.querySelectorAll('.level-up-notice').forEach(n=>n.remove());const notice=document.createElement('div');notice.className='level-up-notice';notice.innerHTML=`<strong>LEVEL ${player.level}</strong><span>+${levels} MASTERY · +${levels} PASSIVE · +${levels*5} ATTRIBUTES</span>`;document.getElementById('app').append(notice);setTimeout(()=>notice.remove(),4100);}

}
function hurt(amount,element='physical',source=null,selfBurn=false,attack=true){
  if(game.sandbox.god||game.zone==='town'||(!selfBurn&&game.dodgeTime>0)||player.hp<=0)return;
  if(!selfBurn&&game.channel){game.channel=null;toast('Portal interrupted by damage.',1300);}
  let reduction=player.mana>game.stats.maxMana*.5?rankOf(player,'ash')*.05:0;if(game.auras.bulwark)reduction+=Math.min(.35,(8+Math.max(0,rankOf(player,'bulwark')+Math.min(4,game.stats.skillRanks||0)-1)*3)/100);
  if(!selfBurn&&attack&&element==='physical'&&!rollWeaponHit(enemyCombatStats(source,game.depth),game.stats)){floater('Miss',player.x,player.y,'#b4b9a3');return;}
  if(attack&&element==='physical'&&Math.random()*100<game.stats.block){floater('Block',player.x,player.y,'#c1b895');sound(210,.1);return;}
  if(!selfBurn)for(const item of Object.values(player.equipment).filter(Boolean))item.durability=Math.max(0,(item.durability??100)-.35);
  const damage=selfBurn?amount*(1-clamp(game.stats.fireResist||0,0,75)/100):mitigateDamage(amount,game.stats,element,reduction);
  player.hp-=damage;if(!selfBurn&&player.hp>0)scatterRemains(game.dungeon,player,source,{kind:'blood',time:game.time});if(!selfBurn){game.hurtFlash=.8;floater(`−${damage}`,player.x,player.y,'#df8e78');sound(95,.1,'sawtooth',.018);}
  if(player.hp<=0){leaveCorpse(game.dungeon,player,source,{player:true,time:game.time});game.pyre=null;game.whirl=null;cancelPendingCombat();player.hp=0;player.deaths++;clearAttackOrder();game.target=null;game.path=null;game.moving=false;game.mouseDown=false;openPanel('death');save();}
}
function basicAttack(target=null,quiet=false){
  if(game.zone==='town'||game.channel||game.paused||player.hp<=0)return false;
  if(game.dodgeTime>0||game.attackCooldown>0||game.actionRecovery>0){bufferCombatAction(game,'basic',target||aimPoint(),quiet);return false;}
  if(game.stats.weapon)game.stats.weapon.durability=Math.max(0,(game.stats.weapon.durability??100)-.12);
  const unarmed=!game.stats.weapon,timing=attackTiming(game.stats.weapon,game.stats.attackSpeed);game.combo=(game.combo+1)%2;game.attackStyle=unarmed?'punch':'strike';game.animationMode='attack';game.castColor=null;game.attackCooldown=timing.recovery;game.actionRecovery=timing.recovery;game.attackDuration=timing.duration;game.attackAnim=timing.duration;game.castLock=timing.impact;const aim=target||aimPoint();facePoint(aim);const gap=distance(aim,player),ax=gap>.05?aim.x-player.x:game.facing.x,ay=gap>.05?aim.y-player.y:game.facing.y,len=Math.hypot(ax,ay)||1;
  if(game.stats.weapon?.ranged){const element=game.stats.weapon.ranged;game.rangedShot={remaining:timing.impact,shot:{skill:'basic',x:player.x,y:player.y,dx:ax/len,dy:ay/len,speed:13,life:game.stats.reach/13,damage:element==='physical'?game.stats.damage:game.stats.spellPower,kind:element==='physical'?'blade':element,element,hits:new Set(),hostile:false,pierce:1}};return true;}
  game.melee={remaining:timing.impact,ax:ax/len,ay:ay/len,unarmed};
  return true;
}
function primaryAttack(target=null,quiet=false){
  if(player.primarySkill==='basic')return basicAttack(target,quiet);
  if(target)facePoint(target);
  return castSkill(player.primarySkill,quiet,target);
}
function cast(slot){return castSkill(player.slots[slot]);}
function castSkill(id,quiet=false,target=null){
  if(id==='basic')return basicAttack(target,quiet);
  if(!id)return;
  if(game.paused||player.hp<=0)return;
  if(game.zone==='town'){if(!quiet)toast('Emberfall is a sanctuary. Save your strength for the crypt.',1700);return;}
  if(game.channel){game.channel=null;toast('Portal interrupted.',1000);}
  const skill=getSkill(id),rank=rankOf(player,id);
  if(!game.stats.weapon&&['cleave','whirl','procession'].includes(id)){if(!quiet)toast('Equip a weapon to use this technique.',1600);return;}
  if(!skill||!rank)return toast('Learn and equip an ability in Masteries · K');
  const profile=skillProfile(player,skill,game.stats);
  if(skill.toggle){
    if(quiet||(game.cooldowns[id]||0)>0)return;
    const was=id==='inferno'?!!game.pyre:!!game.auras[id];
    if(was){if(id==='inferno')game.pyre=null;else game.auras[id]=false;game.cooldowns[id]=2*game.stats.cdr;toast(skill.name+' extinguished.',1200);return true;}
    if(!game.sandbox.infiniteMana&&player.mana<profile.cost)return toast('Not enough mana',1200);
    if(id==='inferno'){if(!togglePyre(game))return false;}else game.auras[id]=true;
    player.mana=Math.min(manaCapacity(game.stats,game.auras),player.mana-(game.sandbox.infiniteMana?0:profile.cost));effect('sigil',player.x,player.y,.8,{radius:1.5,element:id==='inferno'?'fire':'aether'});return true;
  }
  if(game.actionRecovery>0||game.dodgeTime>0||(game.cooldowns[id]||0)>0){bufferCombatAction(game,id,target||aimPoint(id),quiet);return;}
  if(!game.sandbox.infiniteMana&&player.mana<profile.cost){if(!quiet){toast('Not enough mana',1200);sound(100,.08);}return;}
  if(!game.sandbox.infiniteMana)player.mana-=profile.cost;game.castCounts[id]=(game.castCounts[id]||0)+1;
  const meleeSkill=['cleave','quake','whirl','rend','procession'].includes(id),power=(meleeSkill?game.stats.damage:game.stats.spellPower)*profile.power,aim=target||aimPoint(id),timing=skillContactTiming(profile,attackTiming(game.stats.weapon,game.stats.attackSpeed),meleeSkill);facePoint(aim);game.combo=(game.combo+1)%2;game.animationMode=meleeSkill?'attack':'cast';game.attackStyle=game.stats.weapon?'strike':'punch';game.actionRecovery=timing.recovery;game.attackDuration=timing.duration;game.attackAnim=timing.duration;game.castLock=timing.impact;game.castColor=meleeSkill?null:['bolt','meteor','cataclysm'].includes(id)?'#d79a5e':['rime','nova'].includes(id)?'#a8c4c6':'#adaac6';let dx=aim.x-player.x,dy=aim.y-player.y,len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
  effect('cast-motes',player.x,player.y,.5,{dx,dy,element:skill.element||(['bolt','meteor'].includes(id)?'fire':'aether'),radius:profile.area});
  const range=7,point={x:player.x+dx*Math.min(len,range),y:player.y+dy*Math.min(len,range)};
  game.pendingAction={remaining:timing.impact,id,power,profile,aim:{...aim},point,dx,dy};
  return true;
}
function releaseSkill(action){
  const {id,power,profile,aim,point,dx,dy}=action;if(lan?.active)lan.cast(id,aim);
  if(id==='procession'){
    game.effects=game.effects.filter(e=>e.type!=='blade-procession');effect('blade-procession',player.x,player.y,4*profile.duration,{radius:3.5*profile.area,damage:power,tick:0,skill:id});sound(160,.4,'triangle');
  }else if(id==='cataclysm'||id==='judgment'){
    const count=id==='cataclysm'?profile.projectiles:Math.max(8,profile.projectiles);
    for(let i=0;i<count;i++){const a=i*2.399,r=id==='cataclysm'?(count>1?2:0):Math.sqrt(i/count)*3.5,at={x:point.x+Math.cos(a)*r,y:point.y+Math.sin(a)*r};effect('ruin-mark',at.x,at.y,id==='cataclysm'?1+i*.18:.22+i*.11,{radius:(id==='cataclysm'?3.6:1.8)*profile.area,damage:power,pending:true,element:id==='cataclysm'?'fire':'lightning',skill:id});}sound(id==='cataclysm'?90:640,.5,'triangle');
  }else if(id==='cleave'){
    effect('melee-trail',player.x,player.y,.24,{dx,dy,radius:2.7*profile.area*(1+game.stats.meleeArea/100),weapon:game.stats.weapon?.look,combo:game.combo,heavy:!!game.stats.weapon?.twoHanded});
    for(const e of game.dungeon.enemies)if(!e.dead&&distance(e,player)<2.7*profile.area*(1+game.stats.meleeArea/100)&&((e.x-player.x)*dx+(e.y-player.y)*dy)/(distance(e,player)||1)>.35)damageEnemy(e,power,'physical',true,id);
    sound(150,.12,'triangle',.02);
  }else if(['bolt','lance','rime','tempest'].includes(id)){
    const element=id==='bolt'?'fire':id==='rime'?'cold':id==='tempest'?'lightning':'aether',angle=Math.atan2(dy,dx);
    for(let i=0;i<profile.projectiles;i++){const a=angle+(i-(profile.projectiles-1)/2)*.17;game.projectiles.push({x:player.x,y:player.y,dx:Math.cos(a),dy:Math.sin(a),speed:id==='tempest'?15:12,life:1.05*profile.travel,damage:power,kind:element,element,skill:id,burnMultiplier:profile.burn,area:profile.area,duration:profile.duration,hits:new Set(),pierce:id==='rime'?3:id==='lance'?3:1,hostile:false});}sound(440,.2,'sawtooth',.015);
  }else if(id==='rend'){
    effect('rend',player.x,player.y,.5,{dx,dy,radius:game.stats.reach*profile.area});
    for(const e of game.dungeon.enemies)if(!e.dead&&distance(e,player)<game.stats.reach*profile.area&&((e.x-player.x)*dx+(e.y-player.y)*dy)/(distance(e,player)||1)>.65){if(!damageEnemy(e,power,'physical',true,id))continue;e.bleed=3*profile.duration;e.bleedPower=power*.20;}
  }else if(id==='nova'||id==='quake'){
    const radius=id==='quake'?3.2:id==='nova'?3.6:4.5;elementBurst(id,player.x,player.y,radius*profile.area,power);sound(id==='nova'?620:130,.4,'triangle');
  }else if(id==='meteor'){
    effect('meteor-warning',point.x,point.y,.45,{radius:2.15*profile.area,pending:true,damage:power,playerGround:true,duration:profile.duration});sound(180,.6,'sine');
  }else if(id==='chain'){
    const targets=game.dungeon.enemies.filter(e=>!e.dead&&distance(e,player)<8).sort((a,b)=>distance(a,aim)-distance(b,aim)).slice(0,profile.chains);
    let source=player;for(const e of targets){effect('lightning',source.x,source.y,.35,{tx:e.x,ty:e.y});damageEnemy(e,power*(1+game.stats.chainDamage/100),'lightning',true,id);source=e;}if(!targets.length)effect('lightning',player.x,player.y,.3,{tx:point.x,ty:point.y});sound(730,.2,'sawtooth',.02);
  }else if(id==='whirl'){
    game.whirl={remaining:1.2,tick:0,damage:power,radius:2.4*profile.area};effect('whirl',player.x,player.y,1.2,{radius:2.4*profile.area});sound(160,.3);
  }else if(id==='vortex'){
    effect('vortex',point.x,point.y,4*profile.duration,{radius:3*profile.area,damage:power,tick:.5});sound(220,.4,'sine');
  }
  return true;
}
function elementBurst(id,x,y,radius,power){
  const element=id==='nova'?'cold':id==='quake'?'physical':'fire';effect(id,x,y,.8,{radius,color:element==='cold'?'#95cfd0':element==='fire'?'#e2a56e':'#b3aa79'});
  for(const e of game.dungeon.enemies)if(!e.dead&&distance(e,{x,y})<radius){damageEnemy(e,power,element,true,id);if(id==='nova'||id==='quake')e.slow=3;if(id==='inferno'){e.burn=4;e.burnPower=power*.15;}}
}
function manaPotion(){
 if(game.paused||player.hp<=0)return;
 if(!drinkManaFlask(player,game.stats,manaCapacity(game.stats,game.auras)))return toast(player.mana>=manaCapacity(game.stats,game.auras)?'Your mana is already full':'Mana flask needs 20 charges',1400);
 effect('heal',player.x,player.y,.5,{color:'#7da3c5'});floater('Recovering mana',player.x,player.y,'#91b4d0');sound(480,.2,'sine');save();
}
function dodge(){
  if(game.paused||game.dodgeCooldown>0||player.hp<=0)return;
  const aim=aimPoint(),held=movement(),direction=settings.controls.movement==='wasd'&&Math.hypot(held.x,held.y)>.05?held:{x:aim.x-player.x,y:aim.y-player.y};let dx=direction.x,dy=direction.y,len=Math.hypot(dx,dy)||1;
  clearAttackOrder();cancelPendingCombat();game.actionRecovery=Math.min(game.actionRecovery,.28);game.attackCooldown=Math.min(game.attackCooldown,.28);game.path=null;game.attackAnim=0;game.facing={x:dx/len,y:dy/len};game.dodgeVector={x:dx/len,y:dy/len};game.dodgeTime=.28;game.dodgeCooldown=2.2*game.stats.cdr;effect('evade-dust',player.x,player.y,.32,{dx:dx/len,dy:dy/len,radius:.8});player.mana=Math.min(game.stats.maxMana,player.mana+rankOf(player,'ward')*6);game.target=null;sound(140,.09,'triangle',.02);
}
function potion(){
  if(game.paused||player.hp<=0)return;
  if(player.hp>=game.stats.maxHp)return toast('Your life is already full',1200);
  if(!drinkFlask(player,game.stats))return toast('Flask needs 20 charges · Combat and time restore it.',1800);
  recordFeat(player,'flasks');effect('heal',player.x,player.y,.65);floater('Recovering life',player.x,player.y,'#b4b28b');sound(330,.22,'sine');save();
}

function interact(){
  if(game.paused||game.loading)return;
  const dropped=game.loot.filter(l=>l.manual&&distance(l,player)<2.8);if(dropped.length){dropped.forEach(pickup);return;}
  if(player.campaign){const target=campaignTargets().filter(t=>distance(t,player)<2.8).sort((a,b)=>distance(a,player)-distance(b,player))[0];if(target){performInteraction(target.interaction);return;}}
  if(game.zone==='town'){
    const npc=game.dungeon.npcs.filter(n=>distance(n,player)<3).sort((a,b)=>distance(a,player)-distance(b,player))[0];
    if(npc){performInteraction(npc.id);return;}
    const stash=game.dungeon.props.find(p=>p.stash);if(distance(stash,player)<2.5){openPanel('stash');return;}
    if(distance(game.dungeon.portal,player)<2.7){openPanel('departure');return;}
    toast('Click a townsfolk, the stash, or the crypt gate to approach.',1900);return;
  }
  if(game.dungeon.bossDead&&distance(player,game.dungeon.portal)<2.7){descend();return;}
  const nearby=game.loot.filter(l=>distance(l,player)<3.5);if(nearby.length)nearby.forEach(pickup);else toast('Move close to loot or an open rift',1400);
}
function descend(){
  if(player.campaign){if(game.zone==='wilderness')enterCampaignArea('stronghold',game.act);else if(game.dungeon.bossDead)openPanel(game.chapter<lastChapter(game.act)?'chaptercomplete':'actcomplete');return;}
  player.hp=game.stats.maxHp;player.mana=game.stats.maxMana;refillFlask(player,20);
  newFloor(game.depth+1,Math.floor(Math.random()*1e9));save();toast(`DEPTH ${game.depth} · The darkness grows stronger`,3500);
  const intro=$('zone-intro');intro.querySelector('h1').textContent=$('location').textContent;intro.style.animation='none';void intro.offsetWidth;intro.style.animation='intro 9s forwards';
}
function pickup(loot){
  if(lan?.active){lan.pickup(loot).catch(e=>lan.error(e));return;}
  if(!game.loot.includes(loot))return;
  if(loot.item){if(!addToContainer(player.inventory,loot.item)){if(!loot.warned){toast('Your pack is full · Return to town to trade or store gear.');loot.warned=true;}return;}toast(`Acquired ${itemName(loot.item)}`,1800);sound(760,.15,'sine');}
  else{player.gold+=loot.gold;player.goldEarned=(player.goldEarned||0)+loot.gold;floater(`+${loot.gold} gold`,loot.x,loot.y,'#c8b477');sound(840,.07,'sine',.015);}
  game.loot.splice(game.loot.indexOf(loot),1);if(loot.item&&HUD_PANELS.includes(game.panel)){townUI.hud.hideTooltip();townUI.render(game.panel);}save();
}
function reveal(){const d=game.dungeon,r=12.5;for(let y=Math.floor(player.y-r);y<=player.y+r;y++)for(let x=Math.floor(player.x-r);x<=player.x+r;x++)if(x>=0&&y>=0&&x<d.size&&y<d.size&&Math.hypot(x-player.x,y-player.y)<r)d.seen.add(y*d.size+x);}
function buildFlow(){
  const d=game.dungeon,flow=Array.from({length:d.size},()=>Array(d.size).fill(Infinity)),queue=[[Math.floor(player.x),Math.floor(player.y)]];
  flow[queue[0][1]][queue[0][0]]=0;
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(d.tiles[ny]?.[nx]&&flow[ny][nx]===Infinity&&Math.abs(nx-player.x)<23&&Math.abs(ny-player.y)<23){flow[ny][nx]=flow[y][x]+1;queue.push([nx,ny]);}}}
  game.flow=flow;game.flowTimer=.65;
}
function movement(){return game.panel?{x:0,y:0}:movementVector(keys,settings.controls);}
function update(dt){
  game.time+=dt;if((game.paused&&!lan?.active)||game.loading||player.hp<=0||lan?.leaving||lan?.active&&!lan.connected)return;
  updateFlock(game.dungeon,dt);updateChickens(game.dungeon,dt);game.chickenNearby=nearChicken(game.dungeon,player);if(game.chickenNearby){const hen=game.dungeon.chickens.find(c=>distance(c,player)<=6);if(hen)meetChicken(player,game.dungeon.seed+':'+hen.id);}game.actionRecovery=Math.max(0,game.actionRecovery-dt);restoreLeech(game,dt);if(game.sandbox.infiniteMana)player.mana=manaCapacity(game.stats,game.auras);if(game.sandbox.god)player.hp=game.stats.maxHp;
  game.playerSlow=Math.max(0,game.playerSlow-dt);for(const enemy of game.dungeon.enemies)if(enemy.hitReaction)enemy.hitReaction.remaining=Math.max(0,enemy.hitReaction.remaining-dt);
  if(game.rangedShot){game.rangedShot.remaining-=dt;if(game.rangedShot.remaining<=0){game.projectiles.push(game.rangedShot.shot);game.rangedShot=null;}}
  if(game.pendingAction){game.pendingAction.remaining-=dt;if(game.pendingAction.remaining<=0){const action=game.pendingAction;game.pendingAction=null;releaseSkill(action);}}
  if(game.melee){game.melee.remaining-=dt;if(game.melee.remaining<=0){const {ax,ay,unarmed}=game.melee;game.melee=null;if(!unarmed)effect('melee-trail',player.x,player.y,.23,{dx:ax,dy:ay,radius:game.stats.reach,weapon:game.stats.weapon?.look,combo:game.combo,heavy:!!game.stats.weapon?.twoHanded});let hit=false;for(const e of game.dungeon.enemies){const range=distance(e,player);if(e.dead||range>game.stats.reach)continue;const dot=((e.x-player.x)*ax+(e.y-player.y)*ay)/(range||1);if(range<.45||dot>.35){if(damageEnemy(e,game.stats.damage,'physical',true,'basic'))hit=true;if(unarmed)break;}}if(!hit)sound(120,.06,'triangle',.016);}}

  if(mouseScreen)game.aim=aimPoint();
  game.hoverEnemyId=enemyUnderPointer()?.id??null;$('world').classList.toggle('is-hostile',game.hoverEnemyId!==null);
  game.castLock=Math.max(0,game.castLock-dt);game.moveRefresh-=dt;game.combatRefresh-=dt;
  game.statsTimer=(game.statsTimer||0)-dt;if(game.statsTimer<=0){game.stats=playerStats(player);game.statsTimer=.18;}game.attackCooldown=Math.max(0,game.attackCooldown-dt);game.attackAnim=Math.max(0,game.attackAnim-dt);game.dodgeCooldown=Math.max(0,game.dodgeCooldown-dt);game.hurtFlash=Math.max(0,game.hurtFlash-dt*2);
  for(const id in game.cooldowns)game.cooldowns[id]=Math.max(0,game.cooldowns[id]-dt);
  const buffered=takeBufferedAction(game,dt);if(buffered)castSkill(buffered.id,false,buffered.target);
  player.mana=Math.min(manaCapacity(game.stats,game.auras),player.mana+chickenRegen(game.chickenNearby,game.stats.regen)*(game.auras.focus?1.2:1)*dt);
  tickFlask(player,game.stats,dt,game.zone==='town');tickManaFlask(player,game.stats,dt,game.zone==='town',manaCapacity(game.stats,game.auras));if(player.hp>0)player.hp=Math.min(game.stats.maxHp,player.hp+dt*game.stats.lifeRegen);
  let m=lan?.trading?{x:0,y:0}:movement(),stepLimit=Infinity;const manual=Math.hypot(m.x,m.y)>.05;
  if(manual){if(game.primaryHeld&&game.primaryMode==='attack')game.primaryMode='force';game.lootTarget=null;game.target=null;game.path=null;game.interactTarget=null;game.combatTarget=null;game.attackPending=false;}
  if(game.primaryHeld&&game.primaryMode==='move'&&mouseScreen&&game.moveRefresh<=0&&game.pointerOverWorld&&!manual){
    game.moveRefresh=.16;walkTo(renderer.unproject(mouseScreen.x,mouseScreen.y),false);
  }
  if(game.combatTarget?.dead){game.combatTarget=null;game.attackPending=false;game.target=null;game.path=null;if(game.primaryHeld)game.primaryMode='force';}
  if(game.combatTarget){
    if(distance(game.combatTarget,player)>primaryRange(player,game.stats)){if(game.combatRefresh<=0){setMoveTarget(game.combatTarget);game.combatRefresh=.3;}}
    else{game.target=null;game.path=null;if(game.attackPending||game.primaryHeld){if(primaryAttack(game.combatTarget,true)){game.attackPending=false;if(!game.primaryHeld)game.combatTarget=null;}}}
  }
  if(game.lootTarget){if(!game.loot.includes(game.lootTarget)){game.lootTarget=null;game.target=null;game.path=null;}else if(distance(player,game.lootTarget)<1.35){const drop=game.lootTarget;game.lootTarget=null;game.target=null;game.path=null;pickup(drop);}}
  if(!manual&&game.target){
    if(game.target.dead){game.target=null;game.path=null;}
    while(game.path?.length&&distance(player,game.path[0])<.08)game.path.shift();
    const waypoint=game.path?.[0]||game.target||player;
    const dx=waypoint.x-player.x,dy=waypoint.y-player.y,len=Math.hypot(dx,dy);
    if(len>.035){m={x:dx/len,y:dy/len};stepLimit=len;}else game.target=null;
  }
  const beforeMove={x:player.x,y:player.y};
  if(game.dodgeTime>0){game.dodgeTime=Math.max(0,game.dodgeTime-dt);m=game.dodgeVector;moveEntity(game.dungeon,player,m.x*13*dt,m.y*13*dt);}
  else if(game.castLock<=0){const step=Math.min(stepLimit,game.stats.speed*dt*(game.playerSlow>0?.6:1));moveEntity(game.dungeon,player,m.x*step,m.y*step);}
  recordFeat(player,'distance',distance(beforeMove,player));game.moving=distance(beforeMove,player)>.0001;if(game.moving){game.lastMove={...m};game.walkPhase+=distance(beforeMove,player)*WALK_FRAMES/STRIDE_DISTANCE;if(game.attackAnim<=0)game.facing={...m};}

  if(game.moving)dialogue.close();
  if(player.campaign&&game.dungeon.outdoor&&game.dungeon.kind==='wilderness'){const nextZone=inSanctuary(game.dungeon,player)?'town':'wilderness';if(nextZone!==game.zone){game.zone=nextZone;setZoneUI();if(nextZone==='wilderness'){discoverLocation(player,'wilderness',game.act);toast(chapterFor(game.act,game.chapter).wilds+' · '+chapterFor(game.act,game.chapter).task,2500);}else toast('Emberfall · Sanctuary',2000);}}
  game.stepTimer=(game.stepTimer||0)-dt;
  if(game.moving&&game.stepTimer<=0){game.stepTimer=.22;effect('dust',beforeMove.x,beforeMove.y,.4);}
  if(game.channel){
    if(game.moving){game.channel=null;toast('Portal interrupted by movement.',1300);}
    else{game.channel.remaining-=dt;if(game.channel.remaining<=0){enterTown();return;}}
  }
  if(game.interactTarget&&distance(player,game.interactTarget)<(game.interactTarget.reach||1.5)){const target=game.interactTarget;game.interactTarget=null;game.target=null;game.path=null;performInteraction(target.interaction);return;}
  if(game.zone==='town'){game.pyre=null;game.whirl=null;player.hp=Math.min(game.stats.maxHp,player.hp+dt*6);}
  if(game.mouseDown||game.primaryHeld&&game.primaryMode==='force')primaryAttack(null,true);
  if(game.zone!=='town'){
    if(game.secondaryHeld)castSkill(player.mouseSkill,true);
    if(!game.panel){const bindings=activeBindings(settings.controls);for(let slot=0;slot<4;slot++)if(bindings['skill'+slot]&&keys.has(bindings['skill'+slot]))castSkill(player.slots[slot],true);
      if(bindings.primary&&keys.has(bindings.primary))primaryAttack(null,true);
      if(bindings.secondary&&keys.has(bindings.secondary))castSkill(player.mouseSkill,true);}
  }
  tickPyre(game,dt,(e,damage)=>damageEnemy(e,damage/(game.stats.fire*game.stats.bonus*game.stats.spell),'fire',false),damage=>hurt(damage,'fire',player,true));
  if(game.whirl){game.whirl.remaining-=dt;game.whirl.tick-=dt;if(game.whirl.tick<=0){game.whirl.tick+=.24;game.animationMode='attack';game.attackDuration=.3;game.attackAnim=.3;for(const e of game.dungeon.enemies)if(!e.dead&&distance(e,player)<game.whirl.radius)damageEnemy(e,game.whirl.damage,'physical',true,'whirl');}if(game.whirl.remaining<=0)game.whirl=null;}
  const gathered=lan?.active?0:collectGold(player,game.loot);if(gathered){floater(`+${gathered} gold`,player.x,player.y,'#c6ab71');save();}
  reveal();game.flowTimer-=dt;if(game.flowTimer<=0)buildFlow();
  const nearbyEnemies=lan?.active?[]:game.dungeon.enemies.filter(e=>!e.dead&&Math.abs(e.x-player.x)<19&&Math.abs(e.y-player.y)<19);
  const buckets=new Map();for(const e of nearbyEnemies){const key=Math.floor(e.x)+','+Math.floor(e.y);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e);}
  for(const e of nearbyEnemies){
    if(e.dead)continue;e.pyreGlow=Math.max(0,(e.pyreGlow||0)-dt);e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);e.shock=Math.max(0,(e.shock||0)-dt);if(e.bleed>0){e.bleed-=dt;e.bleedTick=(e.bleedTick||0)-dt;if(e.bleedTick<=0){e.bleedTick=.5;damageEnemy(e,e.bleedPower*.5,'physical',false);}}e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);e.cooldown-=dt;e.phase+=dt;e.moveTimer=Math.max(0,(e.moveTimer||0)-dt);
    if(e.burn>0){e.burn-=dt;e.burnTick=(e.burnTick||0)-dt;if(e.burnTick<=0){e.burnTick=.7;if(e.burnPower>0)damageEnemy(e,e.burnPower*.7,'fire',false);}}
    if(e.dead)continue;
    const dist=distance(e,player),boss=e.type==='warden';
    if(boss&&game.zone!=='town'&&dist<12){e.special=(e.special??2.2)-dt;if(e.special<=0&&!e.charge&&e.windup<=0&&!(e.castRecovery>0)){bossSpecial(e);e.special=bossCadence(e);}}
    if(e.castRecovery>0){e.castRecovery=Math.max(0,e.castRecovery-dt);if(!e.charge)continue;}
    if(game.zone==='town')continue;if(dist<(boss?12:8.5))e.aggro=true;if(!e.aggro||dist>18)continue;
    if(e.rangedWindup){e.rangedWindup.remaining-=dt;if(e.rangedWindup.remaining<=0){const shot=e.rangedWindup;e.rangedWindup=null;game.projectiles.push({x:e.x,y:e.y,dx:shot.dx,dy:shot.dy,speed:7,life:2,damage:e.damage,kind:e.role==='archer'?'blade':'aether',element:e.role==='archer'?'physical':e.faction===4?'cold':'aether',attackerLevel:e.level,attackRating:enemyCombatStats(e,game.depth).attackRating,hostile:true});}continue;}
    if(e.charge){e.charge.delay-=dt;if(e.charge.delay<=0){e.charge.remaining-=dt;moveEntity(game.dungeon,e,e.charge.dx*7*dt,e.charge.dy*7*dt);if(dist<1.3&&!e.charge.hit){hurt(e.damage*1.3,'physical',e);e.charge.hit=true;}if(e.charge.remaining<=0)e.charge=null;}continue;}
    if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.attackDuration=.3;e.attackAnim=.3;if(boss){effect('quake',e.x,e.y,.65,{radius:2.6,color:'#b7a579'});if(dist<BOSS_MELEE.hitReach){hurt(e.damage*1.6,e.phaseType==='frost'?'cold':e.phaseType==='fire'?'fire':'physical',e);if(e.phaseType==='frost'||e.phaseType==='flood')game.playerSlow=2;}e.cooldown=BOSS_MELEE.recovery;}else{if(dist<MELEE.hitReach)hurt(e.damage,'physical',e);e.cooldown=MELEE.recovery;}}continue;}
    if(boss&&dist<BOSS_MELEE.reach&&e.cooldown<=0){e.windup=BOSS_MELEE.windup;continue;}
    if(e.role&&e.cooldown<=0){
      if(e.role==='bomber'&&dist<7){e.attackDuration=.65;e.attackAnim=.65;effect('meteor-warning',player.x,player.y,1.2,{radius:1.3,pending:true,damage:e.damage,hostile:true,element:'fire',color:e.tint});e.cooldown=4;continue;}
      if(['archer','hexer','venom'].includes(e.role)&&dist<8){const velocity=game.moving?{x:game.lastMove.x*game.stats.speed,y:game.lastMove.y*game.stats.speed}:{x:0,y:0},aim=hostileAim(e,player,velocity,7);e.rangedWindup={remaining:.4,...aim};e.attackAnim=.4;e.cooldown=e.role==='venom'?2.6:1.9;continue;}
      if(e.role==='lunge'&&dist>2&&dist<5){e.charge={delay:.65,remaining:.4,dx:(player.x-e.x)/dist,dy:(player.y-e.y)/dist};e.cooldown=4;effect('ring',e.x,e.y,.65,{radius:.8,color:e.tint});continue;}
    }
    if(!e.role&&e.type==='wraith'&&dist<6&&e.cooldown<=0){e.attackDuration=.35;e.attackAnim=.35;const dx=player.x-e.x,dy=player.y-e.y;game.projectiles.push({x:e.x,y:e.y,dx:dx/dist,dy:dy/dist,speed:3.4,life:2.8,damage:e.damage,kind:'aether',hostile:true});e.cooldown=2.5;continue;}
    if(dist<MELEE.reach){if(e.cooldown<=0)e.windup=MELEE.windup;continue;}
    if(e.type==='wraith'&&dist<3)continue;
    let dx=(player.x-e.x)/dist,dy=(player.y-e.y)/dist;
    const clear=isWalkable(game.dungeon,e.x+dx*.7,e.y+dy*.7);
    if(!clear||dist>5){const tx=Math.floor(e.x),ty=Math.floor(e.y);let best={value:game.flow[ty]?.[tx]??Infinity,x:tx,y:ty};
      for(const[ox,oy]of[[1,0],[-1,0],[0,1],[0,-1]]){const value=game.flow[ty+oy]?.[tx+ox]??Infinity;if(value<best.value)best={value,x:tx+ox,y:ty+oy};}
      const vx=best.x+.5-e.x,vy=best.y+.5-e.y,l=Math.hypot(vx,vy)||1;dx=vx/l;dy=vy/l;
    }
    const speed=e.speed*(e.slow>0?.4:1);
    // Local separation prevents a pack collapsing into one sprite.
    let repelX=0,repelY=0;for(let by=-1;by<=1;by++)for(let bx=-1;bx<=1;bx++)for(const other of buckets.get((Math.floor(e.x)+bx)+','+(Math.floor(e.y)+by))||[]){if(other===e||other.dead)continue;const len=distance(e,other);if(len<.55&&len>.01){repelX+=(e.x-other.x)/len*.4;repelY+=(e.y-other.y)/len*.4;}}
    const old={x:e.x,y:e.y};moveEntity(game.dungeon,e,(dx+repelX)*speed*dt,(dy+repelY)*speed*dt);if(inSanctuary(game.dungeon,e)){e.x=old.x;e.y=old.y;}
  }
  for(const b of game.projectiles){
    const step=Math.min(dt,Math.max(0,b.life));if(step<=0)continue;
    const from={x:b.x,y:b.y},to={x:b.x+b.dx*b.speed*step,y:b.y+b.dy*b.speed*step},wall=firstWallTime(from,to,(x,y,r)=>isWalkable(game.dungeon,x,y,r));
    b.life-=dt;let stopped=false;
    const contacts=projectileContacts(from,to,b.hostile?[player]:game.dungeon.enemies,{hitIds:b.hits,radius:b.hostile?.55:.65,before:wall??Infinity});
    for(const {enemy:e,t} of contacts){
      b.x=from.x+(to.x-from.x)*t;b.y=from.y+(to.y-from.y)*t;
      if(b.hostile){hurt(b.damage,b.element||(b.kind==='fire'?'fire':'aether'),{x:b.x-b.dx,y:b.y-b.dy,level:b.attackerLevel||game.depth,attackRating:b.attackRating});b.life=0;stopped=true;effect('hit-impact',b.x,b.y,.22,{element:b.element||'aether',dx:b.dx,dy:b.dy,strength:.25,material:'metal'});break;}
      b.hits.add(e.id);const element=b.element||(b.kind==='blade'?'physical':b.kind==='aether'?'aether':'fire'),chilled=e.slow>0,landed=damageEnemy(e,b.damage,element,true,b.skill,{x:e.x-b.dx,y:e.y-b.dy});
      if(landed&&element==='cold'){e.slow=3*(1+game.stats.chillEffect/100);if(b.skill==='rime'&&chilled){effect('frost-shatter',e.x,e.y,.5,{radius:1.2*(b.area||1)});for(const other of game.dungeon.enemies)if(other!==e&&!other.dead&&distance(other,e)<1.2*(b.area||1))damageEnemy(other,b.damage*.4,'cold',false);}}
      if(landed&&b.skill==='tempest'){effect('frost-shatter',e.x,e.y,.4,{radius:1.1*(b.area||1),element:'lightning'});for(const other of game.dungeon.enemies)if(other!==e&&!other.dead&&distance(other,e)<1.1*(b.area||1)){damageEnemy(other,b.damage*.35,'lightning',false);other.shock=2;other.shockPower=.1;}}
      if(landed&&b.kind==='fire'){e.burn=3*(b.duration||1);e.burnPower=b.damage*.12*(b.burnMultiplier||1);}
      b.pierce=(b.pierce??1)-1;if(b.pierce<=0){b.life=0;stopped=true;break;}
    }
    if(!stopped){const t=wall??1;b.x=from.x+(to.x-from.x)*t;b.y=from.y+(to.y-from.y)*t;if(wall!==null){b.life=0;effect('hit-impact',b.x,b.y,.2,{element:b.element||'physical',material:'metal',strength:.15,dx:-b.dx,dy:-b.dy});}}
  }
  game.projectiles=game.projectiles.filter(b=>b.life>0);
  for(const e of game.effects){
    e.life-=dt;if(e.lanVisual)continue;if(e.type==='whirl'){e.x=player.x;e.y=player.y;}
    if(e.type==='ruin-mark'&&e.life<=0&&e.pending){e.pending=false;effect('ruin-impact',e.x,e.y,.8,{radius:e.radius,element:e.element,skill:e.skill});for(const enemy of game.dungeon.enemies)if(!enemy.dead&&distance(enemy,e)<e.radius)damageEnemy(enemy,e.damage,e.element,true,e.skill);}
    if(e.type==='blade-procession'){e.x=player.x;e.y=player.y;e.tick-=dt;if(e.tick<=0){e.tick=.25;for(const enemy of game.dungeon.enemies)if(!enemy.dead&&distance(enemy,e)<e.radius)damageEnemy(enemy,e.damage*.25,'physical',true,e.skill);}}
    if(e.type==='meteor-warning'&&e.life<=0&&e.pending){e.pending=false;if(e.playerGround){effect('ground-fire',e.x,e.y,5*(e.duration||1),{radius:e.radius,damage:e.damage,tick:0});}else if(e.hostile){if(e.hazard)effect('hostile-ground',e.x,e.y,e.hazard,{radius:e.radius,damage:e.damage,element:e.element,tick:.7});effect('boss-impact',e.x,e.y,.65,{radius:e.radius,theme:e.theme,element:e.element});if(distance(player,e)<e.radius)hurt(e.damage,e.element||'physical',e,false,false);}else elementBurst('inferno',e.x,e.y,e.radius,e.damage);}
    if(e.type==='hostile-ground'){e.tick-=dt;if(e.tick<=0){e.tick=.7;if(distance(player,e)<e.radius)hurt(e.damage,e.element,e,false,false);}}
    if(e.type==='boss-sweep-warning'&&e.life<=0&&e.pending){e.pending=false;if(bossSweepHits(e,player))hurt(e.damage,e.element,e,false,false);effect('boss-sweep',e.x,e.y,.45,{radius:e.radius,dx:e.dx,dy:e.dy,arc:e.arc,element:e.element});}
    if(e.type==='boss-wave-warning'&&e.life<=0&&e.pending){e.pending=false;effect('boss-wave',e.x,e.y,1.25,{radius:e.radius,damage:e.damage,element:e.element,hit:false});}
    if(e.type==='boss-wave'&&!e.hit){if(bossWaveHits(e,player,1-e.life/e.maxLife)){e.hit=true;hurt(e.damage,e.element,e,false,false);}}
    if(e.type==='ground-fire'){e.tick-=dt;if(e.tick<=0){e.tick=.4;for(const enemy of game.dungeon.enemies)if(!enemy.dead&&distance(enemy,e)<e.radius){damageEnemy(enemy,e.damage*.4,'fire',false);enemy.pyreGlow=.5;}}}
    if(e.type==='vortex'){
      e.tick-=dt;
      for(const enemy of game.dungeon.enemies)if(!enemy.dead&&distance(enemy,e)<(e.radius||3)*1.17){const dx=e.x-enemy.x,dy=e.y-enemy.y;moveEntity(game.dungeon,enemy,dx*dt*.9,dy*dt*.9);enemy.slow=.2;if(e.tick<=0)damageEnemy(enemy,e.damage*.5,'aether');}
      if(e.tick<=0)e.tick=.5;
    }
  }
  game.effects=game.effects.filter(e=>e.life>0);for(const f of game.floaters)f.life-=dt;game.floaters=game.floaters.filter(f=>f.life>0);

  saveTimer+=dt;if(saveTimer>5){save();saveTimer=0;}
}

let hudTimer=0;
function updateHud(dt){
  hudTimer+=dt;if(hudTimer<.08)return;hudTimer=0;
  const s=game.stats,bindings=activeBindings(settings.controls);
  for(const [id,action,label] of [['potion-slot','heal','Life flask'],['mana-potion-slot','mana','Mana flask'],['dodge-slot','dodge','Evade'],['portal-slot','portal','Town portal']]){const button=$(id),key=keyLabel(bindings[action]);button.querySelector('kbd').textContent=bindings[action]?key:'—';button.setAttribute('aria-label',label+' · '+key);if(action==='dodge'||action==='portal')button.title=label+' · '+key;}
  $('channel-progress').classList.toggle('hidden',!game.channel);
  if(game.channel)$('channel-progress').querySelector('b').style.width=`${(1-game.channel.remaining/3)*100}%`;
  const npc=game.zone==='town'?game.dungeon.npcs.filter(n=>distance(n,player)<3).sort((a,b)=>distance(a,player)-distance(b,player))[0]:null;
  const nearbyStash=game.zone==='town'&&distance(game.dungeon.props.find(o=>o.stash),player)<2.5;
  const nearGate=game.zone==='town'&&distance(game.dungeon.portal,player)<2.7;
  const specialTarget=player.campaign?campaignTargets().filter(t=>distance(t,player)<2.8).sort((a,b)=>distance(a,player)-distance(b,player))[0]:null;
  $('interact-button').classList.toggle('hidden',!npc&&!nearbyStash&&!nearGate&&!specialTarget);
  $('interact-label').textContent=specialTarget?specialTarget.label:npc?`Speak to ${npc.name}`:nearbyStash?'Open personal stash':'Enter the crypt';
  document.querySelector('.health-orb').classList.toggle('self-burning',!!game.pyre);
  $('health-text').textContent=`${Math.ceil(player.hp)} / ${Math.round(s.maxHp)}`;$('mana-text').textContent=`${Math.floor(player.mana)} / ${manaCapacity(s,game.auras)}`;
  $('mana-text').title=`Mana · ${manaCapacity(s,game.auras)} available / ${s.maxMana} total${game.auras.focus||game.auras.bulwark?' · aura reservation active':''}`;
  $('health-liquid').style.height=`${player.hp/s.maxHp*100}%`;$('mana-liquid').style.height=`${player.mana/s.maxMana*100}%`;
  $('level-text').textContent=`${player.name||'THE LOYALIST'} · LV. ${player.level}`;
  $('xp-caption').textContent=`${Math.floor(player.xp)} / ${xpNeeded(player.level)} XP`;$('gold-text').textContent=`◈ ${player.gold.toLocaleString()}`;
  $('xp-fill').style.width=`${player.xp/xpNeeded(player.level)*100}%`;$('skill-badge').textContent=player.points+(player.passivePoints||0);$('skill-badge').title=`${player.points} mastery · ${player.passivePoints||0} passive points`;$('skill-badge').classList.toggle('hidden',!(player.points+(player.passivePoints||0)));
  const mf=ensureManaFlask(player);$('mana-potion-text').textContent=`${Math.floor(mf.charges)} / 100`;$('mana-potion-slot').title=`Mana flask · ${Math.floor(mf.charges)} / 100 charges · 20 per use · Key ${keyLabel(bindings.mana)}`;$('mana-potion-slot').classList.toggle('recovering',mf.remaining>0);$('mana-potion-slot').classList.toggle('empty-flask',mf.charges<20);
  const flask=ensureFlask(player);$('potion-text').textContent=`${Math.floor(flask.charges)} / 100`;$('potion-slot').title=`Life flask · ${Math.floor(flask.charges)} / 100 charges · 20 per use · Recovers over 3 seconds · No cooldown`;$('potion-slot').style.setProperty('--flask-level',flask.charges+'%');$('potion-slot').classList.toggle('recovering',flask.remaining>0);$('potion-slot').classList.toggle('empty-flask',flask.charges<FLASK.cost);
  document.querySelectorAll('[data-slot]').forEach(button=>{
    const slot=Number(button.dataset.slot),id=player.slots[slot],skill=getSkill(id),cd=game.cooldowns[id]||0;button.querySelector('kbd').textContent=bindings['skill'+slot]?keyLabel(bindings['skill'+slot]):'—';button.setAttribute('aria-label',`Skill slot ${slot+1} · ${skill?.name||'Unlearned'} · ${keyLabel(bindings['skill'+slot])}`);
    button.classList.toggle('empty-skill',!skill);button.classList.toggle('mana-starved',!!skill&&!skill.toggle&&player.mana<skillProfile(player,skill,game.stats).cost);button.classList.toggle('sustained-active',id==='inferno'?!!game.pyre:!!game.auras[id]);const skillArt=button.querySelector('.ability-art');if(skillArt.dataset.skill!==(id||'empty')){skillArt.dataset.skill=id||'empty';skillArt.innerHTML=skillIcon(id||'empty');}button.querySelector('.ability-name').textContent=skill?.name||'Unlearned';button.title=skill?`${skill.name} · ${skillProfile(player,skill,game.stats).cost} mana · ${skill.toggle?'toggle · 2s after deactivation':'no cooldown'}`:'Assign an ability in Masteries';
    if(id==='inferno'){const pyre=pyreStats(player,s);button.title=`Martyr’s Pyre · Toggle · ${pyre.dps.toFixed(0)} fire damage / sec · ${pyre.selfDps.toFixed(1)} self fire damage / sec (after resistance)`; }const overlay=button.querySelector('i');overlay.style.display=cd>0&&!skill?.toggle?'flex':'none';overlay.textContent=cd.toFixed(1);button.style.opacity=skill&&player.mana<skill.cost?'.5':'1';
  });
  const basicId=game.stats.weapon?'basic':'punch',basicName=game.stats.weapon?'Strike':'Punch';
  for(const [buttonId,id,label] of [['basic-slot',player.primarySkill,'Left'],['mouse-slot',player.mouseSkill,'Right']]){
    const button=$(buttonId),skill=getSkill(id),name=skill?.name||basicName,art=button.querySelector('.ability-art'),artId=id==='basic'?basicId:id;
    if(art.dataset.skill!==artId){art.dataset.skill=artId;art.innerHTML=skillIcon(artId);}
    button.querySelector('.ability-name').textContent=name;const alternate=bindings[buttonId==='basic-slot'?'primary':'secondary'];button.querySelector('kbd').textContent=(label==='Left'?'LMB':'RMB')+(alternate?' / '+keyLabel(alternate):'');button.title=`${label} mouse${alternate?' / '+keyLabel(alternate):''}: ${name} · Click this box to assign`;
    const cd=game.cooldowns[id]||0;button.querySelector('i').style.display=cd>0?'flex':'none';button.querySelector('i').textContent=cd.toFixed(1);
    button.classList.toggle('sustained-active',id==='inferno'?!!game.pyre:!!game.auras[id]);
    button.classList.toggle('mana-starved',!!skill&&player.mana<skillProfile(player,skill,game.stats).cost);
  }
  for(const[id,cd]of[['dodge-slot',game.dodgeCooldown]]){const overlay=$(id).querySelector('i');overlay.style.display=cd>0?'flex':'none';overlay.textContent=cd.toFixed(1);}
  const enemy=nearestEnemy(8,game.aim),boss=game.dungeon.enemies.find(e=>e.type==='warden'&&!e.dead&&distance(e,player)<9),target=boss||(enemy&&distance(enemy,game.aim)<1.4?enemy:null);
  $('enemy-health').classList.toggle('hidden',!target||target.type==='warden');
  const encounter=game.dungeon.enemies.find(e=>e.type==='warden'&&!e.dead&&(e.aggro||distance(e,player)<10));$('boss-health').classList.toggle('hidden',!encounter||game.zone==='town');if(encounter){$('boss-health').classList.toggle('enraged',encounter.hp<encounter.maxHp*.5);$('boss-name').textContent=encounter.name||'The Hollow Warden';$('boss-fill').style.width=`${clamp(encounter.hp/encounter.maxHp*100,0,100)}%`;$('boss-phase').textContent=`${encounter.castRecovery>0?'GATHERING POWER':encounter.hp/encounter.maxHp<.5?'ENRAGED':'BOUND BY THE BARGAIN'} · ${encounter.moveTimer>0?encounter.moveName||'':BOSS_ARMS[encounter.phaseType]?.name||'FALLEN KNIGHT'}`;}
  if(target){$('enemy-health').title=`Defense ${enemyCombatStats(target,game.depth).defense} · Your weapon hit chance: ${Math.round(chanceToHit(game.stats.attackRating,enemyCombatStats(target,game.depth).defense,player.level,target.level)*100)}%`; $('enemy-name').textContent=target.type==='warden'?(target.name||'The Hollow Warden'):target.name|| (target.type==='wraith'?'Sepulchral Wraith':target.type==='crawler'?'Risen Pursuer':target.elite?'Oathbound Remnant':'Restless Remnant');$('enemy-fill').style.width=`${target.hp/target.maxHp*100}%`;$('enemy-kind').textContent=target.type==='warden'?(target.bossId==='wanderer'?'THE SOURCE OF THE BARGAIN':target.bossId==='king'?'THE USURPER':target.bossId?'CORRUPTED KNIGHT · ROUND TABLE':'ANCIENT · BOSS'):target.elite?'CHAMPION · UNDEAD':'UNDEAD';}
}

function openPanel(panel){
  pendingBinding=null;dialogue.close();
  if(game.frontScreen)return;
  if(player.hp<=0&&panel!=='death')return;
  if(game.panel===panel&&panel!=='death'){closePanel();return;}
  if(HUD_PANELS.includes(panel)){cancelPendingCombat();game.attackAnim=0;}
  if(panel==='inventory'){recordFeat(player,'inventoryOpens');save();}
  $('modal-backdrop').classList.toggle('death-arrival',panel==='death');
  game.panel=panel;game.paused=!HUD_PANELS.includes(panel)&&panel!=='journal';game.mouseDown=false;clearAttackOrder();game.target=null;game.path=null;game.interactTarget=null;keys.clear();$('modal-backdrop').classList.remove('hidden');$('modal').setAttribute('aria-modal',String(game.paused));$('skill-picker').classList.add('hidden');renderPanel();
  setTimeout(()=>$('modal').querySelector('button')?.focus(),0);
}
function closePanel(){if(game.panel==='death')return;pendingBinding=null;keys.clear();townUI.cancelIdentify();game.panel=null;game.paused=Boolean(game.frontScreen);game.hudWidth=0;$('modal-backdrop').classList.add('hidden');$('modal-backdrop').classList.remove('hud-mode','death-arrival');townUI.hud.hideTooltip();$('world').focus({preventScroll:true});save();}
const title=(eyebrow,name)=>`<button class="close" data-action="close" aria-label="Close panel">×</button><span class="eyebrow">${eyebrow}</span><h2 id="modal-title">${name}</h2>`;
function renderPanel(){
  const modal=$('modal');
  modal.classList.remove('expanded-modal','campaign-modal','pause-menu','options-menu','quest-book','codex-panel','chronicle-book','online-pause','online-options','controls-menu','story-accounts');
  if(townUI.render(game.panel))return;
  if(renderChronicle(game))return;
  if(renderCampaignPanel(game,game.panel))return;
  if(renderProgression(game,{attributePanel,respecCost,renderer}))return;
  if(game.panel==='help'){
    modal.innerHTML=title('YOUR JOURNEY BEGINS','The Kingsroad')+`<p>You served King Alaric. While you were on leave, his son took the crown and turned the royal army against its own people. Emberfall is sheltering those who escaped. Speak to Maelin, then follow the pasture lane to Elin’s flock: the refuge cannot survive without it. Ask the townspeople what they remember, and inspect notices along the road. Your journal (J) keeps the accounts you choose to read.</p><div class="help-grid">${[['Move',settings.controls.movement==='wasd'?'WASD / click / arrows':'Click / hold ground / arrows'],['Attack a target','Left click enemy'],['Attack in place','Shift + left click'],['Selected spell','Hold right click'],['Assign skills','Click skill / LMB / RMB boxes'],['Active abilities',[0,1,2,3].map(i=>keyLabel(activeBindings(settings.controls)['skill'+i])).join(' · ')],['Evade (invulnerable)',keyLabel(activeBindings(settings.controls).dodge)],['Healing flask',keyLabel(activeBindings(settings.controls).heal)],['Mana flask',keyLabel(activeBindings(settings.controls).mana)],['Talk / loot / use a gate','Click the character, loot label or object'],['Town portal / crypt gate',keyLabel(activeBindings(settings.controls).portal)],['Overlay automap','Tab'],['World map / waypoints','G'],['Quest journal','J'],['Achievements / set collection','N'],['Show loot labels','Hold Alt'],['Masteries / inventory','K / I'],['Character / map zoom','C / M'],['Pause / close panel','Esc'],['Release cursor','Ctrl + Esc'],['Capture cursor','⌖ button above the minimap'],['Equip / identify','Right / Alt + click item'],['Sell / transfer','Shift + click at shop / Ctrl + click at stash'],['Arrange inventory','S while inventory open'],['Close automap','Tab or Escape']].map(([n,k])=>`<p><span>${n}</span><kbd>${k}</kbd></p>`).join('')}</div><div class="modal-rule"></div><p>Begin with a basic strike. At each level earn <b>1 mastery point and 1 passive point</b> (K) and <b>5 attribute points</b> (C). Skills unlock at levels 2, 4, 8 and 12. Mix any masteries; invest 3, 7 and 12 points to unlock deeper abilities. Click the skill, LMB or RMB boxes to assign learned skills. Change movement and keys in Options → Movement &amp; key bindings. Offensive skills use mana and attack cadence, with no cooldown. Choose a specialization at invested rank 2. The Atlas of Oaths contains 469 connected nodes; explore 18 outer constellations and 12 keystones. Search, pan, zoom or jump to a discipline to plan your build. Act I has six combat quests across three regions; no quest pickups or errands block a gate. Aura reactivation locks briefly after switching off; Guard and Trance reserve mana. Practice controls and dungeon regeneration are in Options. Dodge the Warden’s marked attacks. Evading interrupts a strike or cast before contact; mana committed to an interrupted cast is still spent. A late skill press queues into your next action. Life and spirit regenerate continuously. Mana flasks recover mana over three seconds, respecting aura reservations. Both flasks cost 20 charges, recover their resource over three seconds, and have no cooldown. Combat and slow passive recovery replenish their charges.</p><p>Your character, gear, and current dungeon seed save automatically on this device. Reloading preserves your character and town services. An expedition restarts at its saved depth. Speak to Maelin for your first quest. Rescue Edrin to unlock free identification. Visit Orrin to trade and Garran to repair or reforge. No account needed.</p><div class="modal-footer"><small>Free the corrupted knights. Confront the mad king and the Wanderer in Crownfall.</small><button class="primary-button" data-action="close">Return to the journey</button></div>`;
  }else if(game.panel==='pause'){
    modal.classList.add('pause-menu');if(game.onlineSession)modal.classList.add('online-pause');modal.innerHTML=title('EMBERFALL CHRONICLES','Rest a moment')+`<p class="pause-location">${escapeText(player.name)} · Level ${player.level}<br>${escapeText($('location').textContent)} · ${player.gold.toLocaleString()} gold carried</p><div class="pause-actions"><button class="primary-button" data-action="close">Resume journey <kbd>Esc</kbd></button><button data-action="options">Options</button><button data-action="lan-menu">Friends / multiplayer</button><button data-action="chronicle">Achievements & collection</button><button data-action="help">Controls & shortcuts</button><button data-action="save-now">Save journey</button>${game.onlineSession?'<button data-action="leave-online">Save & return to lobby</button>':'<button data-action="main-menu">Return to title</button>'}</div><p class="pause-note">${lan?.active?'The company keeps moving while this menu is open.':'Combat is paused.'} ${game.onlineSession?'Your online character saves to your account. Single-player saves stay local.':characterSaves.persistent&&!characterSaves.error?'Your characters are saved in this browser.':'Saving is unavailable. Keep this tab open to retain this session.'}</p>`;save();
  }else if(game.panel==='options'){
    modal.classList.add('options-menu');if(game.onlineSession)modal.classList.add('online-options');modal.innerHTML=title('DESKTOP OPTIONS','Settings')+optionsMarkup(settings,{samples:!game.onlineSession})+(lan?.active?'<p>Practice tools are available in single player.</p>':testingMarkup(game))+`<div class="modal-footer"><button class="text-button" data-action="reset-options">Restore defaults</button><button class="primary-button" data-action="pause">Back to pause</button></div>`;
  }else if(game.panel==='controls'){
    modal.classList.add('controls-menu');modal.innerHTML=title('DESKTOP CONTROLS','Movement & key bindings')+controlsMarkup(settings.controls);
  }else if(game.panel==='death'){
    modal.innerHTML=`<div class="death-content"><span class="eyebrow">THE HOLLOW CLAIMS ANOTHER</span><h2 id="modal-title">Not yet forgotten.</h2><p>You fell in depth ${game.depth}. Your equipment and mastery progress endure.<br>Awaken in Emberfall with full life and spirit. Your expedition remains accessible.</p><p>Cost of returning: ${Math.floor(player.gold*.1)} gold</p><button class="primary-button" data-action="revive">Rise from the ashes</button></div>`;
  }else if(game.panel==='descend'){
    modal.innerHTML=title('THE WARDEN HAS FALLEN','The dark runs deeper')+`<p>A new dungeon waits beyond the rift. Descend with full life and spirit, and 20 replenished flask charges. The next Warden will be stronger.</p><div class="modal-footer"><button class="text-button" data-action="close">Stay on this floor</button><button class="primary-button" data-action="descend">Descend to depth ${game.depth+1}</button></div>`;
  }else if(game.panel==='new-confirm'){
    modal.innerHTML=title('A DIFFERENT PATH','Begin again?')+`<p>Create another character with a separate journey, equipment and personal stash. Your existing characters and shared stash pages are kept.</p><div class="modal-footer"><button class="text-button" data-action="character">Keep my chronicle</button><button class="primary-button" data-action="new-game">Start a new chronicle</button></div>`;
  }
}
function respecCost(){return Math.max(0,Object.values(player.skills).reduce((s,r)=>s+r,0)*4);}

$('modal').addEventListener('click',event=>{if(lan?.trading&&!event.target.closest('[data-action=close]'))return;
  const binding=event.target.closest('[data-bind-target]');if(binding){if(assignSkill(player,binding.dataset.bindTarget,binding.dataset.bind)){renderPanel();save();}return;}
  if(handleQuestBookClick(game,event))return;
  if(handleCampaignClick(event))return;
  const book=event.target.closest('[data-chronicle-tab]');if(book){game.chronicleTab=book.dataset.chronicleTab;renderPanel();return;}
  const af=event.target.closest('[data-achievement-filter]');if(af){game.achievementFilter=af.dataset.achievementFilter;renderPanel();return;}
  const cs=event.target.closest('[data-collection-set]');if(cs){game.collectionSet=cs.dataset.collectionSet;renderPanel();return;}
  const ht=event.target.closest('[data-honorific]');if(ht){selectHonorific(player,ht.dataset.honorific);save();renderPanel();return;}

  const attribute=event.target.closest('[data-attribute]');if(attribute){if(spendAttribute(player,attribute.dataset.attribute)){game.stats=playerStats(player);renderPanel();save();}return;}
  if(townUI.handleClick(event)){if(game.zone==='town')setZoneUI();return;}
  const progress=event.target.closest('[data-progression]');if(progress){game.progressionTab=progress.dataset.progression;renderPanel();return;}
  const detail=event.target.closest('[data-passive-detail]');if(detail){if(game.atlasDragged){game.atlasDragged=false;return;}game.selectedPassive=detail.dataset.passiveDetail;renderPanel();return;}
  const discipline=event.target.closest('[data-atlas-discipline]');if(discipline){const a=Number(discipline.dataset.atlasDiscipline)*Math.PI/3-Math.PI/2;game.passiveView={x:Math.cos(a)*950-380,y:Math.sin(a)*950-253,w:760,h:506};renderPanel();return;}
  const zoom=event.target.closest('[data-atlas-zoom]');if(zoom){zoomAtlas(game,zoom.dataset.atlasZoom);renderPanel();return;}
  const alloc=event.target.closest('[data-allocate-passive]');if(alloc){if(allocatePassive(player,alloc.dataset.allocatePassive,game.sandbox.freeBuild)){game.stats=playerStats(player);renderPanel();save();}return;}
  const refund=event.target.closest('[data-refund-passive]');if(refund){if(refundPassive(player,refund.dataset.refundPassive,game.sandbox.freeBuild)){game.stats=playerStats(player);renderPanel();save();}else toast('This node connects another oath, or you need 5 gold.');return;}
  const rune=event.target.closest('[data-skill-rune]');if(rune){const [id,choice]=rune.dataset.skillRune.split(':');if(chooseSpecialization(player,id,choice)){renderPanel();save();}return;}
  const inspection=event.target.closest('[data-skill-detail]');if(inspection){game.selectedSkill=inspection.dataset.skillDetail;renderPanel();return;}
  const mastery=event.target.closest('[data-mastery]');if(mastery){game.selectedMastery=mastery.dataset.mastery;game.selectedSkill=null;renderPanel();return;}
  const learn=event.target.closest('[data-learn]');if(learn){if(learnSkill(player,learn.dataset.learn,{testing:game.sandbox.freeBuild})){game.stats=playerStats(player);sound(550,.2,'sine');renderPanel();save();}return;}
  const questAct=event.target.closest('[data-quest-act]');if(questAct){game.questAct=Number(questAct.dataset.questAct);game.questSelection=null;renderPanel();return;}
  const quest=event.target.closest('[data-quest]');if(quest){game.questSelection=Number(quest.dataset.quest);renderPanel();return;}
  const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='close')closePanel();
  else if(action==='lan-menu'){if(lan.active)lan.openSocial();else friends.open();}
  else if(action==='leave-online'){lan.leave().then(()=>friends.open({view:'lobby'})).catch(e=>toast(e.message,6000));}
  else if(action==='main-menu'){if(lan?.active)lan.leave().then(()=>frontEnd.showTitle()).catch(e=>toast(e.message,6000));else{closePanel();frontEnd.showTitle();}}
  else if(action==='save-now'){if(game.onlineSession){save();game.onlineSession.archive.flush().then(()=>toast('Online character saved to your account.')).catch(e=>toast(e.message,6000));}else toast(save()?'Journey saved on this browser.':'This browser blocks saving. Your current journey can continue.');}
  else if(action==='regenerate-dungeons'){if(lan?.active){toast('Leave the LAN game before regenerating dungeons.');return;}player.dungeonGeneration=(player.dungeonGeneration||0)+1;for(const key of [...game.areas.keys()])if(key.includes('stronghold'))game.areas.delete(key);game.expedition=null;if(game.dungeon.kind==='stronghold'){closePanel();enterCampaignArea('stronghold',game.act,false,true,game.chapter);}else if(!player.campaign&&game.zone==='dungeon'){closePanel();newFloor(game.depth,dungeonSeed(game.seed,0,0,player.dungeonGeneration));}else renderPanel();save();toast('Dungeon layouts regenerated · character and quest progress kept.');}
  else if(action==='reset-options'){Object.assign(settings,DEFAULTS,{controls:defaultControls()});keys.clear();applySettings();renderPanel();}
  else if(action==='reset-bindings'){const mode=settings.controls.movement;settings.controls.profiles[mode]={...defaultControls().profiles[mode]};pendingBinding=null;keys.clear();applySettings();renderPanel();}
  else if(['help','character','new-confirm','options','pause','chronicle','controls'].includes(action))openPanel(action);
  else if(action==='respec'){
    const cost=respecCost();if(player.gold<cost){toast(`Respec requires ${cost} gold`);return;}
    player.gold-=cost;player.points+=Object.values(player.skills).reduce((a,b)=>a+b,0);player.skills={};player.skillMods={};game.pyre=null;game.auras={};player.slots=[null,null,null,null];player.mouseSkill='basic';player.primarySkill='basic';game.cooldowns={};game.stats=playerStats(player);player.hp=Math.min(player.hp,game.stats.maxHp);player.mana=Math.min(player.mana,game.stats.maxMana);renderPanel();save();
  }else if(action==='revive'){
    game.pyre=null;game.whirl=null;player.gold-=Math.floor(player.gold*.1);player.hp=game.stats.maxHp;player.mana=game.stats.maxMana;refillFlask(player,Math.max(0,40-ensureFlask(player).charges));player.x=game.dungeon.start.x;player.y=game.dungeon.start.y;
    game.projectiles=[];game.rangedShot=null;game.panel=null;closePanel();enterTown();save();toast('You awaken beneath the lanterns of Emberfall.');
  }else if(action==='descend'){game.panel=null;closePanel();descend();}
  else if(action==='new-game'){
    closePanel();frontEnd.creation();game.frontScreen=true;game.paused=true;
  }
});
$('modal').addEventListener('input',event=>{
 const setting=event.target.closest('[data-test-option]');if(setting){const key=setting.dataset.testOption;game.sandbox[key]=setting.type==='checkbox'?setting.checked:Number(setting.value);if(game.sandbox.god)player.hp=game.stats.maxHp;return;}
 const search=event.target.closest('[data-passive-search]');if(search){game.passiveSearch=search.value;const at=search.selectionStart;renderPanel();const input=$('modal').querySelector('[data-passive-search]');input.focus();input.setSelectionRange(at,at);}
});
let atlasDrag=null;
$('modal').addEventListener('pointerdown',e=>{const svg=e.target.closest('#passive-atlas');if(!svg||e.button!==0)return;const view=game.passiveView||{x:-450,y:-300,w:900,h:600};atlasDrag={svg,x:e.clientX,y:e.clientY,view:{...view}};game.atlasDragged=false;});
$('modal').addEventListener('pointermove',e=>{if(!atlasDrag)return;const {svg,x,y,view}=atlasDrag,dx=e.clientX-x,dy=e.clientY-y;if(Math.hypot(dx,dy)<4&&!game.atlasDragged)return;if(!game.atlasDragged)try{svg.setPointerCapture(e.pointerId);}catch{}game.atlasDragged=true;const r=svg.getBoundingClientRect(),scale=Math.max(view.w/r.width,(view.h||view.w*2/3)/r.height);game.passiveView={x:view.x-dx*scale,y:view.y-dy*scale,w:view.w,h:view.h||view.w*2/3};svg.setAttribute('viewBox',`${game.passiveView.x} ${game.passiveView.y} ${view.w} ${view.h||view.w*2/3}`);});
for(const type of ['pointerup','pointercancel'])$('modal').addEventListener(type,()=>{atlasDrag=null;setTimeout(()=>game.atlasDragged=false,0);});
$('modal').addEventListener('wheel',e=>{const svg=e.target.closest('#passive-atlas');if(!svg)return;e.preventDefault();const v=zoomAtlas(game,e.deltaY<0?'in':'out');svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h||v.w*2/3}`);},{passive:false});
$('modal').addEventListener('keydown',e=>{const node=e.target.closest('[data-passive-detail]');if(node&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
$('modal').addEventListener('input',event=>{const field=event.target.closest('[data-option]');if(!field)return;settings[field.dataset.option]=field.type==='checkbox'?field.checked:field.tagName==='SELECT'&&['quality','menuFont'].includes(field.dataset.option)?field.value:Number(field.value);const output=field.closest('label')?.querySelector('output');if(output)output.textContent=field.value+'%';applySettings();});
$('modal').addEventListener('change',event=>{
  townUI.handleChange(event);
});
$('modal-backdrop').addEventListener('click',e=>{if(e.target===$('modal-backdrop'))closePanel();});
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel)));
document.querySelectorAll('[data-slot]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();showSkillPicker(Number(b.dataset.slot));});b.addEventListener('contextmenu',e=>e.preventDefault());});
for(const [id,target] of [['basic-slot','primary'],['mouse-slot','mouse']])$(id).addEventListener('click',()=>showSkillPicker(target));
$('skill-picker').addEventListener('click',event=>{const choice=event.target.closest('[data-choose-skill]');if(choice&&assignSkill(player,game.bindingTarget,choice.dataset.chooseSkill||null)){save();$('skill-picker').classList.add('hidden');}if(event.target.closest('[data-close-picker]'))$('skill-picker').classList.add('hidden');});
$('mana-potion-slot').addEventListener('click',manaPotion);
$('portal-slot').addEventListener('click',townPortal);
$('dodge-slot').addEventListener('pointerdown',e=>{e.preventDefault();dodge();});$('potion-slot').addEventListener('pointerdown',e=>{e.preventDefault();potion();});
$('help').addEventListener('click',()=>openPanel('help'));$('pause').addEventListener('click',()=>openPanel('pause'));
$('journey-button').addEventListener('click',()=>game.zone==='town'?openPanel('departure'):townPortal());
$('interact-button').addEventListener('click',interact);
document.querySelectorAll('[data-npc]').forEach(button=>button.addEventListener('click',()=>{
  if(game.zone!=='town'||game.paused)return;
  const npc=game.dungeon.npcs.find(n=>n.id===button.dataset.npc);if(!npc)return;
  if(distance(npc,player)<3)performInteraction(npc.id);else{const target={...npc,interaction:npc.id};game.interactTarget=target;setMoveTarget(target);}
}));
$('sound').addEventListener('click',()=>{game.sound=!game.sound;settings.sound=game.sound;persistSettings();$('sound').textContent=game.sound?'♫':'♪';$('sound').title=game.sound?'Mute sound':'Enable sound';$('sound').setAttribute('aria-label',$('sound').title);toast(game.sound?'Sound enabled':'Sound muted',1200);sound(440,.2,'sine');});
function showSkillPicker(target){
  game.bindingTarget=target;keys.clear();clearAttackOrder();game.target=null;game.path=null;
  const mouse=target==='primary'||target==='mouse',label=target==='primary'?'LMB':target==='mouse'?'RMB':keyLabel(activeBindings(settings.controls)['skill'+target]),current=boundSkill(player,target);
  const choices=[{id:mouse?'basic':'',name:mouse?(game.stats.weapon?'Strike':'Punch'):'Unassigned'},...ALL_SKILLS.filter(skill=>skill.active&&rankOf(player,skill.id))];
  $('skill-picker').innerHTML=`<div class="skill-picker-title">Assign ${label}<button data-close-picker aria-label="Close skill selection">×</button></div><div class="skill-picker-options">${choices.map(skill=>{
    const profile=skill.id&&skill.id!=='basic'?skillProfile(player,skill,game.stats):null;
    return `<button data-choose-skill="${skill.id}" aria-pressed="${(current||'')===skill.id}" title="${skill.name}${profile?' · '+profile.cost+' mana':''}"><span>${skillIcon(skill.id||'empty')}</span><strong>${skill.name}</strong><small>${profile?(skill.toggle?'Toggle aura':profile.cost+' mana'):'No mana cost'}</small></button>`;
  }).join('')}</div><div class="skill-picker-hint">${mouse&&target==='primary'?'Click enemies to attack · Ground to move · Shift-click to attack in place.':'Choose a learned ability. Click any skill box to change its assignment.'}</div>`;
  $('skill-picker').classList.remove('hidden');
}
// Capture rebinding before chat/company shortcuts. A rejected key must not
// accidentally open a panel or cast a spell while the key box is listening.
window.addEventListener('keydown',event=>{
  if(game.panel!=='controls'||!pendingBinding)return;
  event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;
  if(event.key==='Escape'){finishBinding('Binding unchanged.');return;}
  if(event.ctrlKey||event.metaKey||event.altKey){$('modal').querySelector('.binding-status').textContent='Use a key without Ctrl, Alt or Meta.';return;}
  const code=['Backspace','Delete'].includes(event.key)?null:eventCode(event),error=bindingError(settings.controls,pendingBinding,code);
  if(error){$('modal').querySelector('.binding-status').textContent=error;return;}
  activeBindings(settings.controls)[pendingBinding]=code;applySettings();finishBinding('Binding saved.');
},true);
function finishBinding(message){const action=pendingBinding;pendingBinding=null;keys.clear();$('modal').innerHTML=title('DESKTOP CONTROLS','Movement & key bindings')+controlsMarkup(settings.controls,null,message);$('modal').querySelector(`[data-bind-action="${action}"]`)?.focus();}
$('modal').addEventListener('click',event=>{
  const key=event.target.closest('[data-bind-action]'),clear=event.target.closest('[data-clear-binding]');
  if(game.panel!=='controls'||!key&&!clear)return;
  keys.clear();clearAttackOrder();
  if(clear){activeBindings(settings.controls)[clear.dataset.clearBinding]=null;applySettings();pendingBinding=null;renderPanel();return;}
  pendingBinding=key.dataset.bindAction;$('modal').innerHTML=title('DESKTOP CONTROLS','Movement & key bindings')+controlsMarkup(settings.controls,pendingBinding);$('modal').querySelector(`[data-bind-action="${pendingBinding}"]`)?.focus();
});
$('modal').addEventListener('change',event=>{
  const field=event.target.closest('[data-movement-mode]');if(!field)return;
  settings.controls.movement=field.value==='wasd'?'wasd':'click';pendingBinding=null;keys.clear();clearAttackOrder();game.target=null;game.path=null;applySettings();renderPanel();
});
// A held direction must stop when a chat box, search field or native select takes focus.
document.addEventListener('focusin',event=>{if(event.target.closest('input,select,textarea,[contenteditable="true"]')){keys.clear();clearAttackOrder();game.target=null;game.path=null;}});
window.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase(),code=eventCode(event);
  if(game.frontScreen)return;if(lan?.trading&&key!=='escape')return;
  if(event.target.closest?.('input,select,textarea,[contenteditable="true"]')&&key!=='escape')return;
  if(event.ctrlKey||event.metaKey||event.altKey&&key!=='alt')return;
  if(key==='escape'){
    event.preventDefault();keys.clear();if(event.repeat)return;
    if(game.panel==='controls'){openPanel('options');return;}
    if(game.onlineSession&&game.panel==='options'){openPanel('pause');return;}
    if(game.largeMap&&!game.panel){game.largeMap=false;$('map-overlay').classList.add('hidden');return;}
    if(game.dialogue){dialogue.close();return;}
    if(!$('skill-picker').classList.contains('hidden'))$('skill-picker').classList.add('hidden');else game.panel?closePanel():openPanel('pause');return;
  }
  if(key==='tab'){
    event.preventDefault();if(event.repeat)return;
    if(!game.panel){game.largeMap=!game.largeMap;$('map-overlay').classList.toggle('hidden',!game.largeMap);}
    else{const focusable=[...$('modal').querySelectorAll('button:not(:disabled),select,input')];const index=focusable.indexOf(document.activeElement);focusable[(index+(event.shiftKey?-1:1)+focusable.length)%focusable.length]?.focus();}return;
  }
  // Pause/options key presses never leak back into movement after closing them.
  if(game.panel==='controls')return;
  if(key==='s'&&HUD_PANELS.includes(game.panel)){if(!event.repeat)townUI.handleClick({target:{closest:selector=>selector==='[data-town-action]'?{dataset:{townAction:'sort'}}:null}});return;}
  if(['i','k','c','g','j','n'].includes(key)){if(!event.repeat)openPanel({i:'inventory',k:'skills',c:'character',g:'worldmap',j:'journal',n:'chronicle'}[key]);return;}
  if(game.paused||game.panel||game.loading||!$('skill-picker').classList.contains('hidden'))return;
  const bindings=activeBindings(settings.controls),action=CONTROL_ACTIONS.find(([id])=>bindings[id]===code)?.[0],move=isMovementCode(code,settings.controls);
  if(action||move||key==='alt')event.preventDefault();
  if(event.repeat)return;
  keys.add(code);
  if(action?.startsWith('skill')){cast(Number(action.slice(5)));return;}
  if(action==='primary'){game.lootTarget=null;game.interactTarget=null;game.combatTarget=null;game.target=null;game.path=null;primaryAttack();}
  if(action==='secondary'){game.lootTarget=null;game.interactTarget=null;game.combatTarget=null;game.target=null;game.path=null;castSkill(player.mouseSkill);}
  if(move){game.lootTarget=null;game.interactTarget=null;game.combatTarget=null;game.attackPending=false;game.target=null;game.path=null;}
  if(action==='dodge')dodge();if(action==='heal')potion();if(action==='mana')manaPotion();if(action==='portal')townPortal();
  if(key==='alt')game.showLoot=true;
  if(key==='m'){game.largeMap=!game.largeMap;$('map-overlay').classList.toggle('hidden',!game.largeMap);}
});
window.addEventListener('keyup',e=>{keys.delete(eventCode(e));if(e.key==='Alt')game.showLoot=settings.lootLabels;});
window.addEventListener('blur',()=>{keys.clear();clearAttackOrder();game.mouseDown=false;save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!game.paused&&player.hp>0)openPanel('pause');});
window.addEventListener('beforeunload',save);
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('pointerenter',()=>game.pointerOverWorld=true);
$('world').addEventListener('pointerleave',()=>game.pointerOverWorld=false);
$('world').addEventListener('pointermove',e=>{if(e.pointerType!=='touch'){mouseScreen={x:e.clientX,y:e.clientY};game.pointerOverWorld=true;game.aim=aimPoint();}});
function setMoveTarget(target){const plan=planWalk(game.dungeon,player,target,findPath);if(!plan){game.target=null;game.path=null;return false;}game.target=plan.target;game.path=plan.path;return true;}
function walkTo(point,marker=true){
  const plan=planWalk(game.dungeon,player,point,findPath);if(!plan){if(marker)toast('No clear path to that ground.',1200);return false;}
  game.target=plan.target;game.path=plan.path;if(marker)effect('destination',plan.target.x,plan.target.y,.65,{radius:.35});return true;
}
$('world').addEventListener('pointerdown',e=>{
  if(game.paused||game.loading)return;dialogue.close();e.preventDefault();$('world').focus({preventScroll:true});$('skill-picker').classList.add('hidden');townUI.hud.hideTooltip();
  if(e.pointerType!=='touch'){mouseScreen={x:e.clientX,y:e.clientY};game.pointerOverWorld=true;}
  game.aim=aimPoint();
  if(e.button===2){game.lootTarget=null;game.secondaryHeld=true;game.combatTarget=null;game.target=null;game.path=null;castSkill(player.mouseSkill);return;}
  clearAttackOrder();
  if(!e.shiftKey&&!(keys.has('ShiftLeft')||keys.has('ShiftRight'))){const drop=lootLabelAt(renderer.lootLabels||[],e.clientX,e.clientY,game.loot);if(drop){drop.warned=false;game.interactTarget=null;if(distance(player,drop)<1.35)pickup(drop);else if(walkTo(drop))game.lootTarget=drop;return;}}
  if(game.zone==='town'||player.campaign){
    const targets=[...(game.dungeon.npcs||[]).map(n=>({...n,interaction:n.id,height:91,width:31})),...game.dungeon.props.filter(p=>p.stash||p.exit&&!player.campaign).map(p=>({...p,interaction:p.stash?'stash':'departure',height:p.stash?p.height+10:145,width:p.stash?p.width/2+6:65,x:p.exit?game.dungeon.portal.x:p.x,y:p.exit?game.dungeon.portal.y:p.y})),...campaignTargets()];
    const target=targets.find(t=>{const point=renderer.screen(t.x,t.y);return Math.abs(point.x-e.clientX)<t.width&&e.clientY>point.y-t.height&&e.clientY<point.y+7;});
    if(target){if(distance(target,player)<3){performInteraction(target.interaction);}else{game.interactTarget=target;setMoveTarget(target);}return;}
  }
  game.interactTarget=null;
  const portalScreen=renderer.screen(game.dungeon.portal.x,game.dungeon.portal.y,30);
  if(!player.campaign&&game.dungeon.bossDead&&Math.hypot(e.clientX-portalScreen.x,e.clientY-portalScreen.y)<65&&distance(player,game.dungeon.portal)<3){openPanel('descend');return;}
  const enemy=enemyUnderPointer();
  game.primaryHeld=true;game.primaryPointer=e.pointerId;
  if(e.shiftKey||(keys.has('ShiftLeft')||keys.has('ShiftRight'))){game.primaryMode='force';game.target=null;game.path=null;primaryAttack();return;}
  if(enemy&&getSkill(player.primarySkill)?.toggle){game.primaryMode='force';game.target=null;game.path=null;primaryAttack();return;}
  if(enemy){game.primaryMode='attack';game.combatTarget=enemy;game.attackPending=true;game.combatRefresh=0;if(distance(enemy,player)<=primaryRange(player,game.stats)&&primaryAttack(enemy))game.attackPending=false;return;}
  game.primaryMode='move';game.moveRefresh=.16;walkTo(renderer.unproject(e.clientX,e.clientY));
});
window.addEventListener('pointerup',e=>{
  if(e.button===2){game.secondaryHeld=false;return;}
  if(e.pointerId===game.primaryPointer){game.primaryHeld=false;if(!game.attackPending)game.combatTarget=null;}
  if(e.pointerId===game.attackPointer)game.mouseDown=false;
});
window.addEventListener('pointercancel',()=>{clearAttackOrder();game.mouseDown=false;});
let previous=performance.now();
function frame(now){
 const interval=now-previous;if(interval<1000/settings.frameLimit-.5){requestAnimationFrame(frame);return;}previous=now;const dt=Math.min(interval/1000,.12);lan?.tick(dt);storyteller?.tick(dt);
 if(!document.hidden&&!game.frontScreen&&!game.loading){if(!game.paused)renderer.trackFrame(interval);let remaining=dt;while(remaining>.00001){const step=Math.min(.04,remaining);update(step);remaining-=step;}
  const deathAnimating=game.panel==='death'&&game.dungeon.remains?.corpses.some(c=>c.player&&c.age<c.duration);
  if(!game.paused||lan?.active||deathAnimating||renderer.needsDraw||game.lastRenderedPanel!==game.panel){renderer.draw(game,game.paused&&!deathAnimating&&!lan?.active?0:dt);renderer.needsDraw=false;game.lastRenderedPanel=game.panel;}updateHud(dt);if(game.dialogue)dialogue.position();}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setTimeout(()=>{if(!validSave)toast('Welcome to Emberfall · Click Maelin to speak to her.',5000);},7500);

// Read-only diagnostics are useful for smoke tests without granting in-game powers.
window.__reliquary={spriteSignature:()=>{const canvas=renderer.guard.frame(player,false,0);if(!canvas)return null;let hash=2166136261;for(const value of canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data)hash=Math.imul(hash^value,16777619);return hash>>>0;},project:(x,y,z=0)=>renderer.screen(x,y,z),snapshot:()=>({story:structuredClone(player.story||{seen:[],records:[]}),storyCaption:storyteller?.snapshot()||null,storyMarkers:(game.dungeon.storyMarkers||[]).map(m=>({...m,screen:renderer.screen(m.x,m.y)})),offline:offlineSupport?{...offlineSupport.state}:null,online:!!game.onlineSession,lan:lan?.active?{id:lan.id,room:lan.room,connected:lan.connected,area:lan.area,peers:lan.peers.map(p=>({id:p.id,name:p.name,party:p.party,area:p.area,x:p.x,y:p.y})),trade:lan.trade,revision:lan.revision}:null,remains:{corpses:(game.dungeon.remains?.corpses||[]).map(c=>({x:c.x,y:c.y,kind:c.kind,age:c.age,duration:c.duration,player:c.player})),stains:game.dungeon.remains?.stains.length||0,bursts:game.dungeon.remains?.bursts.length||0},chronicle:structuredClone(player.chronicle||{}),setCollection:[...(player.setCollection||[])],cursor:{captured:cursor.active,x:cursor.x,y:cursor.y},settings:{...settings},sandbox:{...game.sandbox},passives:[...(player.passives||[])],passivePoints:player.passivePoints,skillMods:{...player.skillMods},castCounts:{...game.castCounts},combatFeedback:{pending:game.pendingAction?.id||game.melee&&'basic'||game.rangedShot&&'basic'||null,buffered:game.queuedSkill?.id||null,combo:game.combo,reactions:game.dungeon.enemies.filter(e=>e.hitReaction?.remaining>0).length},layoutSignature:game.dungeon.rooms.map(r=>[r.x,r.y,r.w,r.h].join(',')).join(';'),auras:{...game.auras},manaCapacity:manaCapacity(game.stats,game.auras),dungeonGeneration:player.dungeonGeneration,actionRecovery:game.actionRecovery,mapCenter:{x:player.x,y:player.y},goldEarned:player.goldEarned||0,bankGold:player.bankGold||0,level:player.level,hp:player.hp,mana:player.mana,points:player.points,position:{x:player.x,y:player.y},depth:game.depth,zone:game.zone,act:game.act,chapter:game.chapter,loading:!!game.loading,attackStyle:game.attackStyle,terrainPrepared:renderer.preparedDungeon===game.dungeon,biome:game.dungeon.biome||null,outdoor:!!game.dungeon.outdoor,passiveCreatures:game.dungeon.critters?.length||0,campaign:player.campaign?structuredClone(player.campaign):null,frontScreen:game.frontScreen,flask:{...ensureFlask(player)},manaFlask:{...ensureManaFlask(player)},pyre:game.pyre?pyreStats(player,game.stats):null,appearance:appearanceOf(player),combatStats:{...game.stats},attributes:{...player.attributes},attributePoints:player.attributePoints,xp:player.xp,waypoint:game.dungeon.waypoint?{...game.dungeon.waypoint,screen:renderer.screen(game.dungeon.waypoint.x,game.dungeon.waypoint.y)}:null,portal:{...game.dungeon.portal,screen:renderer.screen(game.dungeon.portal.x,game.dungeon.portal.y)},enemies:game.dungeon.enemies.filter(e=>!e.dead).length,enemyHealth:game.dungeon.enemies.reduce((sum,e)=>sum+Math.max(0,e.hp),0),loot:game.loot.length,lootLabels:(renderer.lootLabels||[]).map(b=>({name:b.name,x:b.x,y:b.y,w:b.w,h:b.h,itemId:b.loot.item?.id})),chickens:(game.dungeon.chickens||[]).map(c=>({x:c.x,y:c.y,moving:c.moving})),goldDrops:game.loot.filter(l=>!l.item&&l.gold>0).map(l=>({...l,screen:renderer.screen(l.x,l.y)})),inventory:player.inventory.length,paused:game.paused,panel:game.panel,skills:{...player.skills},slots:[...player.slots],cooldowns:{...game.cooldowns},seed:game.seed,bossDead:game.dungeon.bossDead,gold:player.gold,shards:player.shards,quests:{...player.quests},npcs:game.dungeon.npcs?.map(n=>({id:n.id,worldX:n.x,worldY:n.y,...renderer.screen(n.x,n.y)})),artLoaded:renderer.artLoaded,enemyArtLoaded:renderer.enemySprites.ready,deathArtLoaded:renderer.deaths.ready,enemySpriteCache:renderer.enemySprites.cache.size,structureShadows:renderer.contactShadows.size,characterId:characterSaves.active?.id||null,characterName:player.name,characterCount:characterSaves.characters.length,wallSegments:game.dungeon.wallSegments?.length||0,dungeonDressing:game.dungeon.props.filter(p=>['dungeon-dressing','wall-fixture'].includes(p.type)).length,entryGate:game.dungeon.entryGate?{...game.dungeon.entryGate,screen:renderer.screen(game.dungeon.entryGate.x,game.dungeon.entryGate.y)}:null,tileset:game.dungeon.tileset||null,areaLevel:game.dungeon.areaLevel||game.depth,entranceStyle:game.dungeon.entranceStyle||null,stash:game.dungeon.props.filter(p=>p.stash).map(p=>({x:p.x,y:p.y,width:p.width,height:p.height,screen:renderer.screen(p.x,p.y)})),exploredTiles:game.dungeon.seen.size,field:game.dungeon.field?{...game.dungeon.field}:null,boss:game.dungeon.enemies.filter(e=>e.type==='warden'&&!e.dead).map(e=>({name:e.name,bossId:e.bossId,moveName:e.moveName,hp:e.hp,maxHp:e.maxHp})),areaSeed:game.dungeon.seed,areaSize:game.dungeon.size,returnGate:game.dungeon.returnGate?{...game.dungeon.returnGate}:null,facing:{...game.facing},sanctuary:game.dungeon.townBounds,dialogue:game.dialogue||null,visualEffects:game.effects.map(e=>({type:e.type,theme:e.theme,element:e.element,life:e.life})),groundChunks:renderer.groundCache.size,terrainBytes:[...renderer.groundCache.values()].reduce((sum,v)=>sum+v.canvas.width*v.canvas.height*4,0),pasture:game.dungeon.pasture||null,livestock:game.dungeon.livestock?.map(s=>({x:s.x,y:s.y,moving:s.moving,heading:s.heading}))||[],signs:game.dungeon.signs?.map(s=>({...s,screen:renderer.screen(s.x,s.y)}))||[],grassClumps:game.dungeon.grassCount||0,herd:game.dungeon.herd||null,provisions:game.dungeon.provisions||null,townExit:game.dungeon.townExit||null,animation:{...renderer.heroFrame},attackAnim:game.attackAnim,moving:game.moving,aim:{...game.aim},heroScreen:renderer.screen(player.x,player.y,24),primarySkill:player.primarySkill,mouseSkill:player.mouseSkill,projectiles:game.projectiles.map(b=>({...renderer.screen(b.x,b.y,24),dx:renderer.iso(b.dx,b.dy).x,dy:renderer.iso(b.dx,b.dy).y,kind:b.kind})),visibleEnemies:game.dungeon.enemies.filter(e=>!e.dead&&Math.abs(e.x-player.x)<20&&Math.abs(e.y-player.y)<20&&game.dungeon.seen.has(Math.floor(e.y)*game.dungeon.size+Math.floor(e.x))).map(e=>({id:e.id,bossId:e.bossId,name:e.name,type:e.type,role:e.role,visual:e.visual?{...e.visual}:null,combat:enemyCombatStats(e,game.depth),hitChance:chanceToHit(game.stats.attackRating,enemyCombatStats(e,game.depth).defense,player.level,e.level),hp:e.hp,x:e.x,y:e.y,screen:renderer.screen(e.x,e.y,24)}))})};

function loadCharacter(record){
 if(!record)return false;dialogue.close();townUI.cancelIdentify();townUI.hud.hideTooltip();
 const data=record.save,next=migratePlayer({...createPlayer(),...structuredClone(data.player),progressionVersion:data.player.progressionVersion??1,passiveVersion:data.player.passiveVersion??0,attributes:data.player.attributes??{might:0,vitality:0,will:0,dexterity:0},attributePoints:data.player.attributePoints??Math.max(0,((data.player.level||1)-1)*5)});ensureCampaign(next);ensureStory(next);storyteller?.reset();
 for(const key of Object.keys(player))delete player[key];Object.assign(player,next);
 game.areas.clear();cancelPendingCombat();clearAttackOrder();keys.clear();Object.assign(game,{act:1,chapter:0,depth:data.depth||1,seed:data.seed||Math.floor(Math.random()*1e9),pyre:null,auras:{},whirl:null,expedition:null,sandbox:sandboxDefaults(),castCounts:{},actionRecovery:0,cooldowns:{},attackCooldown:0,attackAnim:0,dodgeCooldown:0,dodgeTime:0,hurtFlash:0,playerSlow:0,moving:false,channel:null,melee:null,combatTarget:null,lootTarget:null,leechLife:0,leechMana:0,storyBookTab:'quests',storyAccountId:null,storyAccountPage:0,questSelection:null,questAct:1,supplyKills:-1,frontScreen:true,paused:true,panel:null});
 game.stats=playerStats(player);player.hp=Math.min(player.hp||game.stats.maxHp,game.stats.maxHp);player.mana=Math.min(player.mana??game.stats.maxMana,game.stats.maxMana);
 const expedition=data.expedition||(data.zone&&data.zone!=='town'?{kind:data.zone==='wilderness'?'wilderness':'stronghold',act:data.act||1,chapter:data.chapter||0}:null);if(player.campaign&&expedition&&(expedition.act||1)<=ACTS.length)game.expedition={...expedition};
 townUI.selection=null;townUI.lastPanel=null;townUI.hud.storageTab='personal';enterTown(true);return true;
}
const frontEnd=new FrontEnd({player,characterSaves,onSelect:id=>{if(!characterSaves.select(id))return false;return loadCharacter(characterSaves.active);},onLan:()=>lan.openLobby(),onFriends:()=>friends.open(),onSaves:()=>localSaves.open(),onPause:()=>{if(lan?.active)lan.leave().catch(e=>toast(e.message));if(!game.frontScreen)save();cursor.release();game.frontScreen=true;game.paused=true;clearAttackOrder();keys.clear();game.target=null;game.path=null;},onPlay:()=>{if(game.zone!=='town')enterTown();if(settings.cursorCapture)cursor.request();game.frontScreen=false;game.paused=Boolean(game.panel);$('world').focus({preventScroll:true});save();},onCreate:options=>{const next=migratePlayer(createPlayer(options));next.campaign=createCampaign();const stats=playerStats(next);next.hp=stats.maxHp;next.mana=stats.maxMana;const record=characterSaves.create({version:1,player:next,depth:1,seed:Math.floor(Math.random()*1e9),zone:'town',act:1,chapter:0});return record?loadCharacter(record):false;}});



lan=new LanClient({game,renderer,characterSaves,save,toast,releaseCursor:()=>cursor.release(),stopInput:()=>{keys.clear();clearAttackOrder();game.target=null;game.path=null;game.mouseDown=false;},
 onStart:(result,record)=>{game.lanReturn={seed:record.save.seed,depth:record.save.depth,expedition:structuredClone(record.save.expedition||null)};if(record.online){game.onlineSession={archive:friends.online,localRecord:characterSaves.active?structuredClone(characterSaves.active):null};game.characterSaves=friends.online;}else characterSaves.select(record.id);loadCharacter({save:{...record.save,player:result.player}});Object.assign(player,result.player);player.campaign??=createCampaign();game.seed=result.room.seed;game.areas.clear();game.expedition=null;game.act=1;game.chapter=0;game.panel=null;$('modal-backdrop').classList.add('hidden');enterTown(true);frontEnd.stop();frontEnd.root.className='front-end hidden';game.frontScreen=false;game.paused=false;game.sandbox=sandboxDefaults();game.stats=playerStats(player);save();},
 onEnemyDeath:(enemy,credit)=>kill(enemy,credit),
 onHit:(event,e)=>{if(event.direct){const from=event.attacker===lan.id?player:lan.peers.find(p=>p.id===event.attacker);confirmedHit(e,event.damage,event.element,event.crit,from||player);}floater(event.damage,e.x,e.y,event.crit?'#ead087':'#c9bb99',event.crit);if(event.attacker===lan.id&&event.direct){queueLeech(game,event.damage,event.element,specialization(player,event.skill));if(event.element==='physical'&&rankOf(player,'blood'))player.hp=Math.min(game.stats.maxHp,player.hp+rankOf(player,'blood')*2);}if(event.direct)scatterRemains(game.dungeon,e,player,{time:game.time});},
 onMiss:e=>floater('Miss',e.x,e.y,'#a8997c'),onHurt:event=>hurt(event.amount,event.element,event.source,false,event.weapon),
 onAssets:()=>{game.stats=playerStats(player);if(HUD_PANELS.includes(game.panel))townUI.render(game.panel);},
 onLeave:()=>{if(game.onlineSession){const local=game.onlineSession.localRecord;game.onlineSession=null;game.characterSaves=characterSaves;game.lanReturn=null;loadCharacter(local||{save:{version:1,player:createPlayer(),seed:Math.floor(Math.random()*1e9),depth:1,zone:'town'}});frontEnd.showTitle();return;}game.paused=!!game.frontScreen;player.hp=game.stats.maxHp;player.mana=game.stats.maxMana;game.panel=null;$('modal-backdrop').classList.add('hidden');if(game.lanReturn){game.seed=game.lanReturn.seed;game.depth=game.lanReturn.depth;game.expedition=game.lanReturn.expedition;game.lanReturn=null;}game.effects=[];game.projectiles=[];game.areas.clear();enterTown(true);save();},onRosterChange:()=>{if(characterSaves.active)loadCharacter(characterSaves.active);frontEnd.showTitle();}
});
const friends=new Friends({lan,characterSaves,toast,frontEnd});
offlineSupport=new OfflineSupport();
const localSaves=new LocalSavesMenu({characters:characterSaves,offline:offlineSupport,frontEnd,toast,canOpen:()=>!lan.active&&!friends.joining,onImport:()=>{if(characterSaves.active)loadCharacter(characterSaves.active);frontEnd.showTitle();}});
game.lan=lan;game.onLanDrop=item=>lan.drop(item).catch(e=>lan.error(e));
finishBoot();

function attributePanel(){
 const descriptions={might:'+0.4 weapon damage',vitality:'+6 life, +0.25 defense',will:'+4 spirit, +regeneration',dexterity:'+5 attack rating, +0.4% critical chance'};
 return `<section class="attributes-panel"><h3>Attributes · ${player.attributePoints||0} points available · includes 10 base</h3>${Object.entries(descriptions).map(([key,text])=>`<div class="attribute-row"><span>${key[0].toUpperCase()+key.slice(1)}</span><small>${text}</small><strong>${effectiveAttributes(player)[key]}</strong><button data-attribute="${key}" ${!(player.attributePoints>0)?'disabled':''} aria-label="Increase ${key}">+</button></div>`).join('')}</section>`;
}
function setCampaignZoneUI(){
 const town=game.zone==='town',a=actFor(game.act),ch=chapterFor(game.act,game.chapter),wild=game.zone==='wilderness',name=town?'Emberfall Sanctuary':wild?ch.wilds:ch.stronghold;
 $('floor-label').textContent=town?'SANCTUARY':wild?'THE OUTER KINGDOM':`CORRUPTED SEAT · ACT ${game.act}`;
 $('map-depth').textContent=town?'⌂':['I','II','III','IV','V'][a.id-1];$('location').textContent=name;
 document.querySelector('.chapter>.eyebrow').textContent=`ACT ${['I','II','III','IV','V'][a.id-1]} · ${a.title.toUpperCase()}`;
 document.querySelector('.map-heading>span').textContent=name.toUpperCase();document.querySelector('.map-caption').innerHTML='<span class="map-dot"></span> TAB · AUTOMAP <span class="key-cap">G · WORLD</span>';
 document.querySelector('.quest-panel>.eyebrow').innerHTML='<span class="tiny-diamond">◆</span> AN OATH UNBROKEN';document.querySelector('.quest-panel>h2').textContent=a.title;document.querySelector('.quest-panel>p').textContent='Free the Round Table. Break the bargain.';
 $('objective').textContent=campaignObjective(player,town?'town':wild?'wilderness':'stronghold',game.act,game.chapter);$('quest-progress').textContent=(game.act===1?actOneObjective(player,game.chapter):town?'Trade · Rest · Prepare':`Chapter ${game.chapter+1} / ${lastChapter(game.act)+1} · ${wild?ch.task:ch.captain||a.knight}`);
 $('journey-button').textContent=town?game.expedition?'Return to the road →':'Journey to the Kingsroad →':`Town portal · ${keyLabel(activeBindings(settings.controls).portal)}`;$('town-services').classList.toggle('hidden',!town);
 document.querySelector('[data-npc="scholar"]').disabled=!player.quests.scholarRescued;document.querySelector('[data-npc="scholar"] small').textContent=player.quests.scholarRescued?'IDENTIFY RELICS':'ARCHIVIST · MISSING';
 $('seed-label').textContent=`AURETH · ${town?'LAST REFUGE':a.title.toUpperCase()}`;document.querySelector('.zone-intro h1').textContent=name;document.querySelector('.zone-intro .eyebrow').textContent=town?'BENEATH THE LAST FRIENDLY BANNER':`ACT ${game.act} · ${a.title.toUpperCase()}`;document.querySelector('.zone-intro>div').textContent=town?'The loyal gather where the old light burns.':wild?'Beyond these roads lies a kingdom that has forgotten the dawn.':a.knight;
}
function rememberArea(){if(!player.campaign||!game.dungeon?.kind)return;game.areas.set(locationId(game.act,game.dungeon.kind,game.chapter),{dungeon:game.dungeon,loot:game.loot,position:{x:player.x,y:player.y}});}

function enterCampaignArea(kind,act=player.campaign.act,viaWaypoint=false,initial=false,chapter=chapterOf(player,act),throughEntrance=false){
 if(!player.campaign||!['wilderness','stronghold'].includes(kind)||act>player.campaign.act||act<1||act>ACTS.length)return false;
 chapter=Math.min(chapter,lastChapter(act));storyteller?.reset();dialogue.close();
 if(!initial)rememberArea();cancelPendingCombat();clearAttackOrder();game.path=null;game.target=null;game.interactTarget=null;game.channel=null;game.mouseDown=false;game.act=act;game.chapter=chapter;game.depth=actOneLevel(chapter,kind==='stronghold');game.zone=kind==='wilderness'?'wilderness':'dungeon';
 const key=locationId(act,kind,chapter),cached=game.areas.get(key);game.dungeon=cached?.dungeon||(kind==='wilderness'?generateWilderness(game.seed+act*107+chapter*7919,act,lan?.active?{quests:{},campaign:createCampaign()}:player,chapter):generateStronghold(dungeonSeed(game.seed,act,chapter,lan?.active?0:player.dungeonGeneration||0),act,chapter));dressStoryArea(game.dungeon);game.loot=cached?.loot||[];game.projectiles=[];game.rangedShot=null;game.effects=[];game.floaters=[];game.melee=null;game.actionRecovery=0;game.leechLife=0;game.leechMana=0;
 if(!lan?.active&&!cached&&kind==='stronghold'&&player.campaign.defeated.includes(captainId(act,chapter))){
  for(const e of game.dungeon.enemies)if(e.type==='warden'){e.dead=true;e.hp=0;}
  game.dungeon.bossDead=true;
 }
 game.entryWalk=kind==='stronghold'&&!viaWaypoint&&(throughEntrance||!cached)?game.dungeon.arrival:null;const at=viaWaypoint?game.dungeon.waypoint:throughEntrance?game.dungeon.start:cached?.position||game.dungeon.start;player.x=at.x;player.y=at.y;if(game.dungeon.entryFacing&&(throughEntrance||!cached)&&!viaWaypoint){game.facing={...game.dungeon.entryFacing};game.actionFacing={...game.facing};game.lastMove={...game.facing};}if(inSanctuary(game.dungeon,player))game.zone='town';game.aim={x:player.x+2,y:player.y};renderer.camera={...renderer.iso(player.x,player.y)};discoverLocation(player,kind,act,chapter);reveal();buildFlow();setZoneUI();save();
 const intro=$('zone-intro');intro.style.animation='none';void intro.offsetWidth;intro.style.animation='intro 4s forwards';
 prepareArea();
 if(!initial)toast(`${kind==='wilderness'?chapterFor(act,chapter).wilds:chapterFor(act,chapter).stronghold} · G world map`,2500);
 return true;
}
function campaignTargets(){
 if(!player.campaign)return [];const d=game.dungeon,targets=[];
 for(const marker of d.storyMarkers||[])targets.push({...marker,interaction:'story:'+marker.id,label:'Read '+marker.title,height:marker.style==='arms'?35:100,width:36,reach:2.5});
 for(const sign of d.signs||[])targets.push({...sign,interaction:'sign:'+sign.id,label:'Read sign',height:100,width:43});
 if(d.townWaypoint)targets.push({...d.townWaypoint,interaction:'town-fountain',label:'Emberfall fountain',height:130,width:49,reach:2.5});
 if(d.returnGate)targets.push({...d.returnGate,interaction:'return-wilderness',label:'Return to the wilderness',height:70,width:40});
 if(d.waypoint)targets.push({...d.waypoint,interaction:'waypoint-fountain',label:'Awaken fountain / travel',height:130,width:49,reach:2.5});
 if(d.field&&game.act!==1)targets.push({...d.field,interaction:'field-record',height:65,width:35});
 if(d.provisions&&game.act!==1&&!player.quests.provisionsRecovered)targets.push({...d.provisions,interaction:'opening-provisions',height:65,width:35});
 if(d.supplies)targets.push({...d.supplies,interaction:'supplies',label:'Roadside provisions',height:65,width:30});
 if(game.zone==='wilderness')targets.push({...d.portal,interaction:'campaign-exit',label:`Enter ${chapterFor(game.act,game.chapter).stronghold}`,height:165,width:65});
 else if(d.bossDead)targets.push({...d.portal,interaction:game.chapter<lastChapter(game.act)?'chaptercomplete':'actcomplete',label:game.chapter<lastChapter(game.act)?'Continue to the next region':'Act I complete · return to Emberfall',height:100,width:40});
 return targets;
}
function performInteraction(action){
 if(action.startsWith('story:')){
  const id=action.slice(6),marker=game.dungeon.storyMarkers?.find(m=>m.id===id),record=storyRecordById(id);
  if(!marker||!record)return;
  if(readStoryRecord(player,id))save();
  game.storyAccountId=id;dialogue.openSign({...marker,id:'story-'+id,text:record.title+'\n\n'+record.text});
  $('npc-dialogue').classList.add('story-reading');$('npc-dialogue').setAttribute('aria-label','Field account');return;
 }
 $('npc-dialogue').classList.remove('story-reading');$('npc-dialogue').removeAttribute('aria-label');
if(action==='campaign-exit'&&distance(player,game.dungeon.portal)>.85){game.interactTarget={...game.dungeon.portal,interaction:action,reach:.85};walkTo(game.dungeon.portal,false);return;}if(action==='town-fountain'||action==='waypoint-fountain'){const town=action==='town-fountain',at=town?game.dungeon.townWaypoint:game.dungeon.waypoint;if(!at)return;if(activateFountain(player,game.dungeon,town)){game.fountainWake={id:fountainKey(game.dungeon,town),started:game.time};effect('ring',at.x,at.y,1.1,{radius:1.5,color:'#8caeaf'});toast('FOUNTAIN AWAKENED · Click again or press G to travel.',3000);save();}else openPanel('worldmap');return;}if(action.startsWith('sign:')){const sign=game.dungeon.signs?.find(s=>s.id===action.slice(5));if(sign)dialogue.openSign(sign);return;}const npc=game.dungeon.npcs?.find(n=>n.id===action);if(npc){dialogue.open(npc);return;}if(action==='return-wilderness'){enterCampaignArea('wilderness',game.act,false,false,game.chapter);const at=game.dungeon.portal;player.x=at.x;player.y=at.y+2;game.zone='wilderness';renderer.camera={...renderer.iso(player.x,player.y)};setZoneUI();return;}if(action==='opening-provisions'){const result=recoverProvisions(player);toast(result.message);if(result.ok){save();setZoneUI();}return;}if(action==='field-record'){if(!player.campaign.records.includes(fieldKey(game.act,game.chapter))&&!player.inventory.some(i=>i.id===questRelic(game.act,game.chapter).id)&&!addToContainer(player.inventory,questRelic(game.act,game.chapter))){toast('Make room in your pack for the recovered quest item.');return;}if(completeField(player,game.act,game.chapter)){grantExperience(player,120+game.depth*20);game.stats=playerStats(player);player.gold+=35+game.depth*8;toast('Field account recovered · J to read your journal',3000);save();setZoneUI();}game.questAct=game.act;game.questSelection=game.chapter+(game.act===1?0:2);openPanel('journal');return;}if(action==='campaign-exit'){enterCampaignArea('stronghold',game.act,false,false,game.chapter,true);}else openPanel(action);}
function handleCampaignClick(event){
 const map=event.target.closest('[data-map-act]');if(map){const act=Number(map.dataset.mapAct);if(player.campaign&&act<=player.campaign.act){game.mapAct=act;renderPanel();}return true;}
 const wp=event.target.closest('[data-waypoint]');if(wp){const id=wp.dataset.waypoint,near=game.zone==='town'||game.dungeon.waypoint&&distance(player,game.dungeon.waypoint)<3;
  if(!near||!canTravel(player,id))return true;closePanel();if(id==='emberfall')enterTown();else{const [,act,kind,part]=id.split('-');enterCampaignArea(kind,Number(act),true,false,part?Number(part)-1:0);}save();return true;}
 const action=event.target.closest('[data-campaign-action]')?.dataset.campaignAction;if(!action)return false;
 if(action==='next-chapter'){const chapter=game.chapter;if(chapter<lastChapter(game.act)&&player.campaign.defeated.includes(captainId(game.act,chapter))){if(chapter===chapterOf(player,game.act))nextChapter(player,game.act);closePanel();game.expedition=null;enterCampaignArea('wilderness',game.act,false,false,chapter+1);}return true;}
 if(action==='home'){closePanel();enterTown();}
 if(action==='departure'&&game.zone==='town'){openPanel('departure');return true;}
 if(action==='resupply'){
  if(game.zone==='town'||game.supplyKills!==player.kills){game.supplyKills=player.kills;player.hp=game.stats.maxHp;player.mana=game.stats.maxMana;refillFlask(player);refillManaFlask(player);effect('heal',player.x,player.y,1);toast('Bandaged, rested and resupplied.',2200);}else toast('Leave these supplies until you have cleared more of the road.',2200);closePanel();save();
 }
 return true;
}
function campaignBossKilled(e){
 player.inventory=player.inventory.filter(i=>i.id!==questRelic(game.act,game.chapter).id);
 if(!defeatCampaignBoss(player,e.bossId))return;
 if(!lan?.active)game.loot.push({x:e.x+.5,y:e.y+.4,item:bossRelic(e,actOneLootLevel(game.depth)),manual:true});
 player.shards+=2;refillFlask(player,40);
 if(game.act===1&&e.bossId==='knight-1'){player.quests.scholarRescued=true;player.quests.wardenDefeated=true;}
 game.dungeon.bossDead=true;toast(e.bossId==='knight-1'?'ACT I COMPLETE · Edrin is free. Return to Emberfall or finish the remaining warbands.':`${e.name} has fallen. Continue at the stronghold exit.`,5000);
 setZoneUI();save();sound(560,.7,'sine');
}
function bossSpecial(e){
 const plan=bossPlan(e,player,e.beat||0);e.beat=(e.beat||0)+1;e.moveName=plan.name;e.moveTimer=2;e.castRecovery=plan.recovery;e.attackDuration=plan.recovery;e.attackAnim=plan.recovery;e.weaponName=plan.weapon;
 effect('boss-cast',e.x,e.y,.8,{radius:1.8,theme:e.phaseType});
 for(const command of plan.commands){
  if(command.kind==='shot')game.projectiles.push({...command,kind:command.element,theme:e.phaseType,attackerLevel:e.level,attackRating:enemyCombatStats(e,game.depth).attackRating,hostile:true});
  if(command.kind==='mark'&&isWalkable(game.dungeon,command.x,command.y))effect('meteor-warning',command.x,command.y,command.delay,{radius:command.radius,pending:true,damage:command.damage,hostile:true,element:command.element,color:e.tint,theme:e.phaseType,hazard:command.hazard});
  if(command.kind==='sweep'||command.kind==='wave')effect('boss-'+command.kind+'-warning',command.x,command.y,command.delay,{...command,type:'boss-'+command.kind+'-warning',pending:true,theme:e.phaseType});
  if(command.kind==='charge'){e.charge={remaining:1.1,delay:.9,dx:command.dx,dy:command.dy};effect('ring',e.x,e.y,.9,{radius:1.4,color:e.tint});}
  if(command.kind==='blink'&&isWalkable(game.dungeon,command.x,command.y)){effect('ring',e.x,e.y,.4,{radius:1.4,color:e.tint});e.x=command.x;e.y=command.y;}
  if(command.kind==='summon'){e.summoned=true;for(let i=0;i<3;i++){const x=e.x+Math.cos(i*2.1)*1.2,y=e.y+Math.sin(i*2.1)*1.2;if(isWalkable(game.dungeon,x,y))game.dungeon.enemies.push(makeEnemy(1000+game.dungeon.enemies.length,x,y,'skeleton',game.depth,true));}}
 }
}

async function prepareArea(){
  seedChickens(game.dungeon);
 const token={};game.loading=token;const root=$('area-loading');root.classList.remove('hidden');root.querySelector('h2').textContent=inSanctuary(game.dungeon,player)?'Emberfall Sanctuary':player.campaign?chapterFor(game.act,game.chapter)[game.dungeon.kind==='wilderness'?'wilds':'stronghold']:game.zone==='town'?'Emberfall':'The Hollow Crypt';root.querySelector('progress').value=0;
 try{await renderer.prepareDungeon(game.dungeon,value=>{if(game.loading===token)root.querySelector('progress').value=value;});if(game.loading!==token)return;game.loading=null;root.classList.add('hidden');renderer.needsDraw=true;const arrival=game.entryWalk;game.entryWalk=null;if(arrival&&!game.frontScreen)walkTo(arrival,false);}
 catch(error){if(game.loading!==token)return;root.querySelector('p').textContent='The area could not be prepared. Reload the game to retry.';console.error(error);}
}
