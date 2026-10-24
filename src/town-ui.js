import {requirementChecks,canUseGear} from './gear-requirements.js';
import {guideStory} from './npc-dialogue.js';
import {setDefinition,equippedSetPieces} from './set-items.js';
import {isInsightScroll,insightCount,scrollQuantity,SCROLL_STACK} from './scrolls.js';
import {ensureFlask,refillFlask} from './flasks.js';
import {BASES} from './itemization.js';
import {itemArt} from './item-art.js';
import {requiresIdentification} from './game.js';
import {equipmentEtching} from './equipment-icons.js';
import {playerStats,itemDescription,clamp} from './game.js';
import {WORLD_ART,ITEM_ART} from './assets.js';
import {InventoryHUD,HUD_PANELS} from './inventory-hud.js';
export {HUD_PANELS} from './inventory-hud.js';
import {transferIdentity,restockCost,restockShop,bankTransfer,temperItem,BAG,STASH,EQUIPMENT,SLOT_ART,AFFIXES,itemSize,itemName,itemValue,buyPrice,arrange,cellsFree,equipItem,unequipItem,moveItem,identifyItem,identifyAll,buyItem,sellItem,buyBack,buySupply,salvageItem,reforgeCost,reforgeAffixes,reforgeItem,repairCost,repairAll,acceptGuideQuest,claimGuideReward} from './settlement.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rarity=item=>['normal','magic','rare','legendary','set'].includes(item?.rarity)?item.rarity:'normal';
const btn=(action,label,disabled=false,kind='small-button')=>`<button class="${kind}" data-town-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
function art(index,classes=''){return `<span class="item-art ${classes}" style="--ax:${index%4*100/3}%;--ay:${Math.floor(index/4)*100/3}%" aria-hidden="true"></span>`;}
const icon=itemArt;
function header(kicker,title){return `<button class="close" data-action="close" aria-label="Close panel">×</button><div class="eyebrow">${kicker}</div><h2 id="modal-title">${title}</h2>`;}

export class TownUI {
  constructor(game,{save,toast,openPanel,closePanel,enterDungeon,sound}){
    Object.assign(this,{game,save,toast,openPanel,closePanel,enterDungeon,sound});this.selection=null;this.source='pack';this.affix='';this.shopTab='stock';
    document.documentElement.style.setProperty('--item-atlas',`url("${ITEM_ART}")`);
    document.documentElement.style.setProperty('--world-atlas',`url("${WORLD_ART}")`);
    const modal=document.getElementById('modal');
    this.hud=new InventoryHUD(this);
    let held=null,ghost=null;
    modal.addEventListener('contextmenu',e=>{const node=e.target.closest('[data-pack-id],[data-equip-slot]');if(!node)return;e.preventDefault();const {item,source}=this.hud.resolve(node);if(!item)return;if(source==='stash'){this.apply(moveItem(game.player,item.id,false,this.stashItems));}else if(source==='pack'){if(isInsightScroll(item))this.beginIdentify(item);else if(this.identifying)this.identifyTarget(item.id);else this.apply(equipItem(game.player,item.id));}else if(source==='equipped')this.apply(unequipItem(game.player,node.dataset.equipSlot));});
    modal.addEventListener('pointerdown',e=>{const node=e.target.closest('[data-pack-id],[data-equip-slot]');if(e.button!==0||!node||e.ctrlKey||e.shiftKey||e.altKey)return;const {item,source}=this.hud.resolve(node);if(!item)return;held={id:item.id,source,slot:node.dataset.equipSlot,x:e.clientX,y:e.clientY,node,pointer:e.pointerId};});
    window.addEventListener('pointermove',e=>{if(!held)return;if(!ghost&&Math.hypot(e.clientX-held.x,e.clientY-held.y)>6){ghost=held.node.cloneNode(true);ghost.removeAttribute('data-pack-id');ghost.className='drag-item';document.body.append(ghost);document.body.classList.add('dragging-item');this.hud.hideTooltip();}if(ghost){ghost.style.left=e.clientX+12+'px';ghost.style.top=e.clientY+12+'px';}});
    window.addEventListener('pointerup',e=>{if(!held)return;const data=held;held=null;if(ghost){const target=document.elementFromPoint(e.clientX,e.clientY);ghost.remove();ghost=null;document.body.classList.remove('dragging-item');this.suppressClick=true;this.drop({target,clientX:e.clientX,clientY:e.clientY,preventDefault(){},dataTransfer:{getData:()=>JSON.stringify(data)}});setTimeout(()=>this.suppressClick=false,0);}});
    const cancelDrag=()=>{held=null;ghost?.remove();ghost=null;document.body.classList.remove('dragging-item');};window.addEventListener('pointercancel',cancelDrag);window.addEventListener('blur',cancelDrag);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.identifying){this.cancelIdentify();e.preventDefault();e.stopImmediatePropagation();return;}if(e.key==='Escape'&&held){cancelDrag();e.preventDefault();e.stopImmediatePropagation();}});
    modal.addEventListener('dragstart',e=>{e.preventDefault();});
    modal.addEventListener('dblclick',e=>{const item=e.target.closest('[data-pack-id]');if(!item||item.dataset.container!=='pack')return;const resolved=this.hud.resolve(item);if(isInsightScroll(resolved.item)){this.beginIdentify(resolved.item);return;}if(this.identifying){this.identifyTarget(resolved.item.id);return;}this.apply(equipItem(game.player,item.dataset.packId));});
  }
  beginIdentify(item){if(this.identifying===item.id){this.cancelIdentify();return;}this.identifying=item.id;document.body.classList.add('identifying-item');this.hud.hideTooltip();const hint=document.querySelector('.inventory-controls');if(hint){this.identifyHint=hint.innerHTML;hint.textContent='Choose an unidentified item · Escape cancels';}this.toast('Choose an unidentified item · Escape cancels.');}
  cancelIdentify(){this.identifying=null;document.body.classList.remove('identifying-item');const hint=document.querySelector('.inventory-controls');if(hint&&this.identifyHint)hint.innerHTML=this.identifyHint;this.identifyHint=null;}
  identifyTarget(id){const result=identifyItem(this.player,id,false,this.identifying);if(result.ok)this.cancelIdentify();return this.apply(result);}
  get player(){return this.game.player;}
  get stashItems(){const tab=this.game.panel==='stash'?Number(this.hud.storageTab?.split('-')[1]):0;return tab?this.game.characterSaves.sharedStashes[tab-1]:this.player.stash;}
  get isTown(){return this.game.zone==='town';}
  get selected(){
    const p=this.player;if(this.source==='stock')return p.shopStock?.find(i=>i.id===this.selection);
    if(this.source==='buyback')return p.buyback.find(i=>i.id===this.selection);
    if(this.source==='equipped')return Object.values(p.equipment).find(i=>i?.id===this.selection);
    return (this.source==='stash'?this.stashItems:p.inventory).find(i=>i.id===this.selection);
  }
  wallet(){const p=this.player;return `<div class="wallet"><span>◈ <b>${p.gold.toLocaleString()}</b> gold</span><span>✦ <b>${p.shards}</b> embers</span><span>▤ <b>${insightCount(p)}</b> scrolls</span></div>`;}
  grid(items,container='pack'){
    const dimensions=container==='stash'?STASH:BAG;
    const used=items.filter(i=>i.bagX>=0).reduce((s,i)=>{const size=itemSize(i);return s+size.w*size.h;},0);
    return `<div class="bag-label"><span>${container==='stash'?'PERSONAL STASH':'TRAVEL PACK'}</span><span>${used} / ${dimensions.width*dimensions.height} cells</span></div><div class="spatial-bag" data-bag-grid="${container}" style="--cols:${dimensions.width};--rows:${dimensions.height}">${items.filter(i=>i.bagX>=0).map(item=>{
      const size=itemSize(item);return `<button class="bag-item ${rarity(item)} ${requiresIdentification(item)?'unidentified':''} ${item.id===this.selection?'selected':''}" data-pack-id="${escape(item.id)}" data-container="${container}" draggable="false" style="grid-column:${item.bagX+1}/span ${size.w};grid-row:${item.bagY+1}/span ${size.h}" aria-label="${escape(itemName(item))}" title="${escape(itemName(item))}">${icon(item)}${isInsightScroll(item)?`<b class="stack-count">${scrollQuantity(item)}</b>`:''}${item.favorite?'<b class="keepsake-mark">◆</b>':''}${requiresIdentification(item)?'<b class="unknown-mark">?</b>':''}${item.reforges?`<small class="forge-mark">+${item.reforges}</small>`:''}</button>`;
    }).join('')}</div>${items.some(i=>i.bagX<0)?`<div class="overflow-items"><small>Legacy overflow · preserved safely. Free pack space to organize.</small>${items.filter(i=>i.bagX<0).map(i=>`<button data-pack-id="${escape(i.id)}" data-container="${container}" class="small-button">${escape(itemName(i))}</button>`).join('')}</div>`:''}`;
  }
  equipment(){const p=this.player;return `<div class="paperdoll"><div class="paperdoll-figure"></div>${Object.entries(EQUIPMENT).map(([slot,name])=>{
    const item=p.equipment[slot];return `<button class="paper-slot slot-${slot} ${rarity(item)} ${item&&!canUseGear(p,item)?'gear-unusable':''} ${item?.id===this.selection?'selected':''}" data-equip-slot="${slot}" aria-label="${name}: ${escape(item?itemName(item):'Empty')}" title="${name}${item?' · '+escape(itemName(item)):''}">${item?icon(item):equipmentEtching(slot)}<small>${item?name:'Empty · '+name}</small>${item&&item.durability<25?'<b class="wear-mark">!</b>':''}</button>`;
  }).join('')}</div>`;}
  detail(){
    const item=this.selected;if(!item)return `<div class="empty-detail"><span>✧</span><p>Select a relic to inspect its properties.</p><small>Drag items to rearrange. Double-click to equip.<br>Shift-click to equip; Ctrl-click to trade or transfer.</small></div>`;
    if(item.slot==='scroll'||item.quest)return `<div class="relic-heading normal">${icon(item)}<div><span class="eyebrow">${item.quest?'QUEST ITEM':'CONSUMABLE · '+scrollQuantity(item)+' / '+SCROLL_STACK+' · ONE SPACE'}</span><h3>${escape(item.name)}</h3></div></div><p class="consumable-description">${escape(item.description||'A recovered quest item.')}</p>`;
    const p=this.player,unknown=requiresIdentification(item),equipped=p.equipment[item.slot],pack=this.source==='pack',panel=this.game.panel;
    const set=setDefinition(item.setId),count=set?equippedSetPieces(p,set.id).length:0;
    const setInfo=set?`<section class="set-tooltip"><h4>${escape(set.name)} · ${count}/6 equipped</h4><p>${escape(set.lore)}</p>${set.pieces.map((name,i)=>`<div class="${equippedSetPieces(p,set.id).includes(i)?'set-active':''}">${equippedSetPieces(p,set.id).includes(i)?'◆':'◇'} ${escape(name)}</div>`).join('')}<hr>${set.bonuses.map(b=>`<div class="${count>=b.count?'set-active':''}">(${b.count}) ${escape(b.text)}</div>`).join('')}<small>N · View your collection</small></section>`:'';
    const name=escape(itemName(item)),base=BASES.find(b=>b.id===item.base)?.name;
    let actions='';
    if(unknown&&pack)actions+=btn('identify',`Identify · 1 scroll`,!insightCount(p));
    if(!unknown&&pack)actions+=btn('equip','Equip item');if(['pack','equipped'].includes(this.source))actions+=btn('favorite',item.favorite?'Unmark keepsake':'Keep item');
    if(this.source==='equipped')actions+=btn('unequip','Unequip');
    if(this.isTown&&pack)actions+=btn('store','Store in stash');
    if(this.source==='stash')actions+=btn('withdraw','Move to pack');
    if(panel==='merchant'&&pack)actions+=btn('sell',`Sell · ${itemValue(item)} gold`);
    if(this.source==='stock')actions+=btn('buy',`Buy · ${buyPrice(item)} gold`,p.gold<buyPrice(item));
    if(this.source==='buyback')actions+=btn('buyback',`Buy back · ${item.price} gold`,p.gold<item.price);
    if(panel==='smith'&&pack)actions+=btn('salvage',`Salvage · ${item.rarity==='rare'?2:item.rarity==='legendary'?4:1} embers`);
    if(panel==='scholar'&&unknown&&pack)actions=btn('scholar-identify','Reveal relic · Free');
    const comparison=!unknown&&pack&&equipped?`<div class="comparison"><div class="eyebrow">CURRENTLY EQUIPPED</div><strong class="${rarity(equipped)}">${escape(equipped.name)}</strong><p>${itemDescription(equipped).join('<br>')}</p><div class="stat-deltas">${['damage','armor','life','spirit','crit','speed','bonus'].filter(k=>item[k]||equipped[k]).map(k=>{const delta=Math.round(((item[k]||0)-(equipped[k]||0))*100)/100;return `<span class="${delta>=0?'positive':'negative'}">${delta>=0?'+':''}${delta} ${k}</span>`;}).join('')}</div></div>`:'';
    const forge=panel==='smith'&&!unknown&&['pack','equipped'].includes(this.source)?this.forgeControls(item):'';
    return `<div class="relic-heading ${rarity(item)}">${icon(item)}<div><span class="eyebrow">${escape(item.rarity.toUpperCase())} · ${EQUIPMENT[item.slot]}</span><h3>${name}</h3><small>${base?escape(base)+' · ':''}Item level ${item.level||1}${item.quality?' · '+item.quality+'% quality':''}${item.baseTier?' · '+escape(item.baseTier):''}${item.reforges?' · Reforged '+item.reforges+' times':''}</small></div></div>${requirementChecks(p,item).length?'<div class="gear-requirements">'+requirementChecks(p,item).map(r=>'<div class="'+(r.met?'met':'unmet')+'">Requires '+escape(r.name)+' '+r.need+' <span>(you: '+r.have+')</span></div>').join('')+'</div>':''}${this.source==='equipped'&&!canUseGear(p,item)?'<p class="inactive-equipment">Inactive · meet the requirements to use this item. Its bonuses and appearance are disabled.</p>':''}${unknown?'<p class="unknown-description">Its true nature is concealed. Use a scroll of insight, or seek the archivist once he has been rescued.</p>':`${item.unique?'<div class="unique-oath">'+({"ember-vow":'The Cinderbound Oath · tempered for sacrifice',"pilgrim-vow":'The Long Vigil · a well that never sleeps',"royal-vow":'Alaric’s Remembrance · the old oath endures'}[item.unique]||'')+'</div>':''}<div class="relic-stats">${item.affixes?.length?`<small class="affix-tier">Tier ${Math.max(...item.affixes.map(a=>a.tier||1))} enchantments</small>`:''}${itemDescription(item).map(s=>`<div>${s}</div>`).join('')}</div>${item.affixes?.length?'<div class="affix-rolls">'+item.affixes.map(a=>'<div>'+escape((a.kind==='suffix'?'Suffix · ':'Prefix · ')+(a.name||AFFIXES[a.stat]||a.stat))+' <span>T'+a.tier+' · '+a.value+(a.min!==undefined?' ['+a.min+'–'+a.max+']':'')+'</span></div>').join('')+'</div>':''}${item.bossOrigin?`<p class="boss-relic-lore">${escape(item.lore||'')}<br>Claimed from ${escape(item.bossOrigin)}</p>`:''}<div class="durability">Durability ${Math.ceil(item.durability??100)} / 100${item.durability<=0?' · Broken: base stats halved':''}<i><b style="width:${clamp(item.durability??100,0,100)}%"></b></i></div>`}${setInfo}${comparison}<div class="item-actions">${actions}</div>${forge}`;
  }
  forgeControls(item){
    const temper=(item.damage||item.armor)?btn('temper',`Temper · ${18+Math.ceil(item.level||1)*8} gold + 1 ember`,(item.quality||0)>=20):'';const affixes=reforgeAffixes(item);if(!affixes.length)return temper+ '<p class="smith-note">Only magical bonus properties can be reforged. This item has no eligible affix.</p>';
    if(!affixes.includes(this.affix))this.affix=affixes[0];const cost=reforgeCost(item);
    return `${temper}<div class="forge-controls"><div class="eyebrow">THE REFORGING FIRE</div><p>Reroll one property. The base item and all other properties remain. The result may be higher or lower.</p><label>Property<select data-forge-affix aria-label="Property to reforge">${affixes.map(a=>`<option value="${a}" ${this.affix===a?'selected':''}>${AFFIXES[a]} · currently +${item.affixes?.find(r=>r.stat===a)?.value??item[a]}</option>`).join('')}</select></label>${btn('reforge',`Reforge · ${cost.gold} gold + ${cost.shards} embers`,this.player.gold<cost.gold||this.player.shards<cost.shards,'primary-button')}<small>Reforging also repairs the item. Each reroll raises its gold cost.</small></div>`;
  }
  render(panel){
    if(HUD_PANELS.includes(panel))return this.hud.render(panel);
    const shell=document.getElementById('modal');shell.classList.remove('hud-panel','dual-service','dual-stash');for(const key of ['width','height','top','left','right','--panel-w','--panel-h'])shell.style.removeProperty(key);document.getElementById('modal-backdrop').classList.remove('hud-mode');this.game.hudWidth=0;this.hud.hideTooltip();
    const supported=['inventory','stash','guide','merchant','smith','scholar','departure'];if(!supported.includes(panel))return false;
    if(this.lastPanel!==panel){this.selection=null;this.source='pack';this.affix='';this.lastPanel=panel;}
    const modal=document.getElementById('modal'),p=this.player;modal.classList.add('expanded-modal');
    if(panel==='departure'&&p.campaign){modal.innerHTML=header('THE KING’S ROAD BEGINS HERE','Beyond the last lantern')+`<p>Leave Emberfall for the wilderness. Follow the Kingsroad toward the gates of Aureth, find the ancient waypoints, and break the garrisons guarding each road into the kingdom.</p><p>Your service sword is enough to begin. Gain experience in battle; earn 1 mastery point and 5 attributes each level. The first abilities unlock at level 2.</p>${this.wallet()}<div class="modal-footer">${btn('depart',this.game.expedition?'Return to the road':'Journey to the wilderness',false,'primary-button')}<button class="text-button" data-action="close">Stay in Emberfall</button></div>`;return true;}
    if(panel==='departure'){
      modal.innerHTML=header('BEYOND THE LAST LANTERN','The Hollow awaits')+`<p>Leave the safety of Emberfall and enter the monastery crypt. Defeat the Hollow Warden, rescue the missing archivist, and bring back what the dead have kept.</p><p>Press T to channel a return portal. Moving or taking damage interrupts it. Your current expedition remains while you visit town.</p>${this.wallet()}<div class="modal-footer">${btn('depart',this.game.expedition?'Return to expedition':'Enter the crypt',false,'primary-button')}<button class="text-button" data-action="close">Stay in Emberfall</button></div>`;return true;
    }
    if(panel==='guide'){
      const complete=p.quests.wardenDefeated;
      modal.innerHTML=header('KEEPER OF THE LAST LIGHT','Sister Maelin')+`<div class="npc-dialog"><div class="npc-portrait portrait-guide"></div><div><p class="spoken">“${guideStory(p)}”</p><div class="quest-card"><span class="eyebrow">A DEBT TO THE DEAD</span><h3>${complete?'The archivist returns':p.campaign?.records?.includes('field-1-0')?'The road to Edrin':'The Last Herd'}</h3><p>Protect Elin’s sheep from the risen soldiers. Their orders lead to Hadrin at Marchgate, Oswen’s stolen grain, and the captives in Aldren’s redoubt.</p></div><div class="item-actions">${!p.quests.guideMet?btn('accept-quest','I will help · Accept quest'):''}${complete&&!p.quests.guideRewarded?btn('claim-reward','Claim reward · 120 gold + 3 embers'):''}${btn('heal','Restore life & spirit · Free')}${btn('guide-depart','Show me the road')}</div></div></div>${this.wallet()}`;return true;
    }
    return false;
  }
  refresh(){this.game.stats=playerStats(this.player);this.player.hp=Math.min(this.player.hp,this.game.stats.maxHp);this.player.mana=Math.min(this.player.mana,this.game.stats.maxMana);this.save();this.render(this.game.panel);}
  apply(result){this.toast(result.message);if(result.ok){this.sound(410,.15);this.refresh();}return result.ok;}
  handleClick(event){
    if(this.hud.handleClick(event))return true;
    const action=event.target.closest('[data-town-action]')?.dataset.townAction;if(!action)return false;
    const p=this.player,item=this.selected;
    if(['guide','merchant','smith','scholar','stash','inventory'].includes(action)){
      if(action!=='inventory'&&!this.isTown){this.toast('Visit Emberfall to use town services.');return true;}
      this.openPanel(action);return true;
    }
    const inTown=['buy','sell','buyback','buy-flask','buy-scroll','restock','repair','temper','deposit','withdraw-gold','reforge','salvage','store','withdraw','identify-all','scholar-identify','heal','claim-reward','accept-quest','depart','guide-depart'];
    if(inTown.includes(action)&&!this.isTown){this.toast('This service is only available in Emberfall.');return true;}
    if(action==='sort'){if(this.game.panel==='stash')arrange(this.stashItems,STASH,true);else arrange(p.inventory,BAG,true);this.refresh();}
    else if(action==='equip')this.apply(equipItem(p,this.selection));
    else if(action==='unequip'&&item)this.apply(unequipItem(p,Object.keys(p.equipment).find(s=>p.equipment[s]?.id===item.id)));
    else if(action==='identify')this.apply(identifyItem(p,this.selection));
    else if(action==='store')this.apply(moveItem(p,this.selection,true,this.stashItems));
    else if(action==='withdraw')this.apply(moveItem(p,this.selection,false,this.stashItems));
    else if(action==='buy')this.apply(buyItem(p,p.shopStock.findIndex(i=>i.id===this.selection)));
    else if(action==='sell')this.apply(sellItem(p,this.selection));
    else if(action==='buyback')this.apply(buyBack(p,p.buyback.findIndex(i=>i.id===this.selection)));
    else if(action==='buy-flask')this.apply(buySupply(p,'flask'));
    else if(action==='restock'){this.selection=null;this.source='pack';this.shopTab='stock';this.apply(restockShop(p));}
    else if(action==='buy-scroll')this.apply(buySupply(p,'scroll'));
    else if(action==='salvage')this.apply(salvageItem(p,this.selection));
    else if(action==='favorite'&&item){item.favorite=!item.favorite;this.refresh();}
    else if(action==='temper')this.apply(temperItem(p,this.selection));
    else if(['deposit','withdraw-gold'].includes(action))this.apply(bankTransfer(p,action==='deposit'?'deposit':'withdraw',document.getElementById('bank-amount')?.value));
    else if(action==='repair')this.apply(repairAll(p));
    else if(action==='reforge')this.apply(reforgeItem(p,this.selection,this.affix));
    else if(action==='identify-all')this.apply(identifyAll(p));
    else if(action==='scholar-identify')this.apply(identifyItem(p,this.selection,true));
    else if(action==='accept-quest')this.apply(acceptGuideQuest(p));
    else if(action==='claim-reward')this.apply(claimGuideReward(p));
    else if(action==='heal'){p.hp=this.game.stats.maxHp;p.mana=this.game.stats.maxMana;refillFlask(p,Math.max(0,60-ensureFlask(p).charges));this.toast('Maelin restores you. Your flask holds at least 60 charges.');this.refresh();}
    else if(action==='shop-stock'||action==='shop-buyback'){this.shopTab=action==='shop-stock'?'stock':'buyback';this.render('merchant');}
    else if(action==='guide-depart')this.openPanel('departure');
    else if(action==='depart'){this.closePanel();this.enterDungeon();}
    return true;
  }
  quickAction(element,event){const {item,source}=this.hud.resolve(element);if(!item)return false;this.selection=item.id;this.source=source;if(this.game.panel==='stash'&&(event.ctrlKey||event.shiftKey)&&['pack','stash'].includes(source)){this.apply(moveItem(this.player,item.id,source==='pack',this.stashItems));return true;}if(event.altKey&&source==='pack')this.apply(identifyItem(this.player,item.id));else if(event.shiftKey&&source==='pack'&&this.game.panel==='merchant')this.apply(sellItem(this.player,item.id));else if(event.shiftKey&&source==='pack')this.apply(equipItem(this.player,item.id));else if(event.shiftKey&&source==='equipped')this.apply(unequipItem(this.player,Object.keys(this.player.equipment).find(s=>this.player.equipment[s]?.id===item.id)));else if(event.ctrlKey&&source==='stock')this.apply(buyItem(this.player,this.player.shopStock.findIndex(i=>i.id===item.id)));else if(event.ctrlKey&&source==='buyback')this.apply(buyBack(this.player,this.player.buyback.findIndex(i=>i.id===item.id)));else if(event.ctrlKey&&source==='pack'&&this.game.panel==='merchant')this.apply(sellItem(this.player,item.id));else if(event.ctrlKey&&['pack','stash'].includes(source)&&this.isTown)this.apply(moveItem(this.player,item.id,source==='pack',this.stashItems));else return false;return true;}
  handleChange(event){if(event.target.matches('[data-forge-affix]')){this.affix=event.target.value;return true;}return false;}
  drop(event){
    let data;try{data=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}
    const source=data.source==='pack'?this.player.inventory:data.source==='stash'?this.stashItems:null,item=data.source==='equipped'?this.player.equipment[data.slot]:source?.find(i=>i.id===data.id);if(!item||item.id!==data.id)return;
    event.preventDefault();const element=event.target,targetItem=element?.closest('[data-pack-id]'),grid=element?.closest('[data-bag-grid]'),slot=element?.closest('[data-equip-slot]'),doll=element?.closest('.paperdoll');
    if(isInsightScroll(item)&&targetItem&&targetItem.dataset.packId!==item.id){
      const target=targetItem.dataset.container==='stash'?this.stashItems:this.player.inventory,stack=target.find(i=>i.id===targetItem.dataset.packId);
      if(isInsightScroll(stack)){const n=Math.min(scrollQuantity(item),SCROLL_STACK-scrollQuantity(stack));if(n<=0){this.toast('This stack already holds 20 scrolls.');return;}stack.quantity=scrollQuantity(stack)+n;const left=scrollQuantity(item)-n;if(left)item.quantity=left;else source.splice(source.indexOf(item),1);this.refresh();return;}
    }
    if(isInsightScroll(item)&&data.source==='pack'&&targetItem?.dataset.container==='pack'&&targetItem.dataset.packId!==item.id){const result=identifyItem(this.player,targetItem.dataset.packId,false,item.id);this.cancelIdentify();this.apply(result);return;}
    if(this.game.panel==='merchant'&&element?.closest('.service-sheet')){if(data.source==='pack')this.apply(sellItem(this.player,item.id));return;}
    if(slot||doll){if(data.source!=='pack')return;const socket=slot?.dataset.equipSlot,target=socket===item.slot||item.slot==='ring'&&socket==='ring2'?socket:undefined;this.apply(equipItem(this.player,item.id,target));return;}
    if(grid){
      const destination=grid.dataset.bagGrid;if(destination==='stash'&&!this.isTown)return;
      if(data.source==='equipped'){if(destination==='pack')this.apply(unequipItem(this.player,data.slot));return;}
      const dimensions=destination==='stash'?STASH:BAG,target=destination==='stash'?this.stashItems:this.player.inventory,rect=grid.getBoundingClientRect(),x=Math.floor((event.clientX-rect.left)/rect.width*dimensions.width),y=Math.floor((event.clientY-rect.top)/rect.height*dimensions.height);
      const transferred=source===target?item:transferIdentity(this.player,item,target);
      if(!cellsFree(target,transferred,x,y,dimensions)){this.toast('That space is occupied, or the item will not fit.');return;}
      if(source!==target){source.splice(source.indexOf(item),1);target.push(transferred);}transferred.bagX=x;transferred.bagY=y;this.refresh();return;
    }
    if(data.source!=='stash'&&(element?.id==='world'||element?.id==='modal-backdrop')){
      if(data.source==='equipped')this.player.equipment[data.slot]=null;else source.splice(source.indexOf(item),1);
      this.game.loot.push({x:this.player.x+.7,y:this.player.y+.4,item,manual:true});this.selection=null;this.toast('Dropped '+itemName(item)+' · Click its ground label to pick it up.');this.refresh();
    }
  }
}
