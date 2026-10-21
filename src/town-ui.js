import {equipmentEtching} from './equipment-icons.js';
import {playerStats,itemDescription,clamp} from './game.js';
import {WORLD_ART,ITEM_ART} from './assets.js';
import {InventoryHUD,HUD_PANELS} from './inventory-hud.js';
export {HUD_PANELS} from './inventory-hud.js';
import {BAG,STASH,EQUIPMENT,SLOT_ART,AFFIXES,itemSize,itemName,itemValue,buyPrice,arrange,cellsFree,equipItem,unequipItem,moveItem,identifyItem,identifyAll,buyItem,sellItem,buyBack,buySupply,salvageItem,reforgeCost,reforgeAffixes,reforgeItem,repairCost,repairAll,acceptGuideQuest,claimGuideReward} from './settlement.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rarity=item=>['normal','magic','rare','legendary'].includes(item?.rarity)?item.rarity:'normal';
const btn=(action,label,disabled=false,kind='small-button')=>`<button class="${kind}" data-town-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
function art(index,classes=''){return `<span class="item-art ${classes}" style="--ax:${index%4*100/3}%;--ay:${Math.floor(index/4)*100/3}%" aria-hidden="true"></span>`;}
function icon(item){return art(item.slot==='weapon'&&/axe|mace/i.test(item.name)?5:SLOT_ART[item.slot]??4);}
function header(kicker,title){return `<button class="close" data-action="close" aria-label="Close panel">×</button><div class="eyebrow">${kicker}</div><h2 id="modal-title">${title}</h2>`;}

export class TownUI {
  constructor(game,{save,toast,openPanel,closePanel,enterDungeon,sound}){
    Object.assign(this,{game,save,toast,openPanel,closePanel,enterDungeon,sound});this.selection=null;this.source='pack';this.affix='';this.shopTab='stock';
    document.documentElement.style.setProperty('--item-atlas',`url("${ITEM_ART}")`);
    document.documentElement.style.setProperty('--world-atlas',`url("${WORLD_ART}")`);
    const modal=document.getElementById('modal');
    this.hud=new InventoryHUD(this);
    modal.addEventListener('dragstart',e=>{const item=e.target.closest('[data-pack-id]');if(!item)return;e.dataTransfer.setData('text/plain',JSON.stringify({id:item.dataset.packId,source:item.dataset.container}));e.dataTransfer.effectAllowed='move';});
    modal.addEventListener('dragover',e=>{if(e.target.closest('[data-bag-grid],[data-equip-slot]')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
    modal.addEventListener('drop',e=>this.drop(e));
    modal.addEventListener('dblclick',e=>{const item=e.target.closest('[data-pack-id]');if(!item||item.dataset.container!=='pack')return;this.apply(equipItem(game.player,item.dataset.packId));});
  }
  get player(){return this.game.player;}
  get isTown(){return this.game.zone==='town';}
  get selected(){
    const p=this.player;if(this.source==='stock')return p.shopStock?.find(i=>i.id===this.selection);
    if(this.source==='buyback')return p.buyback.find(i=>i.id===this.selection);
    if(this.source==='equipped')return Object.values(p.equipment).find(i=>i?.id===this.selection);
    return (this.source==='stash'?p.stash:p.inventory).find(i=>i.id===this.selection);
  }
  wallet(){const p=this.player;return `<div class="wallet"><span>◈ <b>${p.gold.toLocaleString()}</b> gold</span><span>✦ <b>${p.shards}</b> embers</span><span>▤ <b>${p.identifyScrolls}</b> scrolls</span></div>`;}
  grid(items,container='pack'){
    const dimensions=container==='stash'?STASH:BAG;
    const used=items.filter(i=>i.bagX>=0).reduce((s,i)=>{const size=itemSize(i);return s+size.w*size.h;},0);
    return `<div class="bag-label"><span>${container==='stash'?'PERSONAL STASH':'TRAVEL PACK'}</span><span>${used} / ${dimensions.width*dimensions.height} cells</span></div><div class="spatial-bag" data-bag-grid="${container}" style="--cols:${dimensions.width};--rows:${dimensions.height}">${items.filter(i=>i.bagX>=0).map(item=>{
      const size=itemSize(item);return `<button class="bag-item ${rarity(item)} ${item.identified===false?'unidentified':''} ${item.id===this.selection?'selected':''}" data-pack-id="${escape(item.id)}" data-container="${container}" draggable="true" style="grid-column:${item.bagX+1}/span ${size.w};grid-row:${item.bagY+1}/span ${size.h}" aria-label="${escape(itemName(item))}" title="${escape(itemName(item))}">${icon(item)}${item.identified===false?'<b class="unknown-mark">?</b>':''}${item.reforges?`<small class="forge-mark">+${item.reforges}</small>`:''}</button>`;
    }).join('')}</div>${items.some(i=>i.bagX<0)?`<div class="overflow-items"><small>Legacy overflow · preserved safely. Free pack space to organize.</small>${items.filter(i=>i.bagX<0).map(i=>`<button data-pack-id="${escape(i.id)}" data-container="${container}" class="small-button">${escape(itemName(i))}</button>`).join('')}</div>`:''}`;
  }
  equipment(){const p=this.player;return `<div class="paperdoll"><div class="paperdoll-figure"></div>${Object.entries(EQUIPMENT).map(([slot,name])=>{
    const item=p.equipment[slot];return `<button class="paper-slot slot-${slot} ${rarity(item)} ${item?.id===this.selection?'selected':''}" data-equip-slot="${slot}" aria-label="${name}: ${escape(item?itemName(item):'Empty')}" title="${name}${item?' · '+escape(itemName(item)):''}">${item?icon(item):equipmentEtching(slot)}<small>${name}</small>${item&&item.durability<25?'<b class="wear-mark">!</b>':''}</button>`;
  }).join('')}</div>`;}
  detail(){
    const item=this.selected;if(!item)return `<div class="empty-detail"><span>✧</span><p>Select a relic to inspect its properties.</p><small>Drag items to rearrange. Double-click to equip.<br>On mobile, tap an item and use the action buttons.</small></div>`;
    const p=this.player,unknown=item.identified===false,equipped=p.equipment[item.slot],pack=this.source==='pack',panel=this.game.panel;
    const name=escape(itemName(item));
    let actions='';
    if(unknown&&pack)actions+=btn('identify',`Identify · 1 scroll`,!p.identifyScrolls);
    if(!unknown&&pack)actions+=btn('equip','Equip item');
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
    return `<div class="relic-heading ${rarity(item)}">${icon(item)}<div><span class="eyebrow">${escape(item.rarity.toUpperCase())} · ${EQUIPMENT[item.slot]}</span><h3>${name}</h3><small>Item level ${item.level||1}${item.reforges?' · Reforged '+item.reforges+' times':''}</small></div></div>${unknown?'<p class="unknown-description">Its true nature is concealed. Use a scroll of insight, or seek the archivist once he has been rescued.</p>':`<div class="relic-stats">${itemDescription(item).map(s=>`<div>${s}</div>`).join('')}</div><div class="durability">Durability ${Math.ceil(item.durability??100)} / 100${item.durability<=0?' · Broken: base stats halved':''}<i><b style="width:${clamp(item.durability??100,0,100)}%"></b></i></div>`}${comparison}<div class="item-actions">${actions}</div>${forge}`;
  }
  forgeControls(item){
    const affixes=reforgeAffixes(item);if(!affixes.length)return '<p class="smith-note">Only magical bonus properties can be reforged. This item has no eligible affix.</p>';
    if(!affixes.includes(this.affix))this.affix=affixes[0];const cost=reforgeCost(item);
    return `<div class="forge-controls"><div class="eyebrow">THE REFORGING FIRE</div><p>Reroll one property. The base item and all other properties remain. The result may be higher or lower.</p><label>Property<select data-forge-affix aria-label="Property to reforge">${affixes.map(a=>`<option value="${a}" ${this.affix===a?'selected':''}>${AFFIXES[a]} · currently +${item[a]}</option>`).join('')}</select></label>${btn('reforge',`Reforge · ${cost.gold} gold + ${cost.shards} embers`,this.player.gold<cost.gold||this.player.shards<cost.shards,'primary-button')}<small>Reforging also repairs the item. Each reroll raises its gold cost.</small></div>`;
  }
  render(panel){
    if(HUD_PANELS.includes(panel))return this.hud.render(panel);
    const shell=document.getElementById('modal');shell.classList.remove('hud-panel');for(const key of ['width','height','top','--panel-w','--panel-h'])shell.style.removeProperty(key);document.getElementById('modal-backdrop').classList.remove('hud-mode');this.game.hudWidth=0;this.hud.hideTooltip();
    const supported=['inventory','stash','guide','merchant','smith','scholar','departure'];if(!supported.includes(panel))return false;
    if(this.lastPanel!==panel){this.selection=null;this.source='pack';this.affix='';this.lastPanel=panel;}
    const modal=document.getElementById('modal'),p=this.player;modal.classList.add('expanded-modal');
    if(panel==='departure'&&p.campaign){modal.innerHTML=header('THE KING’S ROAD BEGINS HERE','Beyond the last lantern')+`<p>Leave Emberfall for the wilderness. Follow the Kingsroad toward the gates of Aureth, find the ancient waypoints, and seek King Alaric’s spirit. His fallen knights guard each road into the kingdom.</p><p>Your service sword is enough to begin. Gain experience in battle; earn 2 skill points and 5 attributes each level. The first abilities unlock at level 2.</p>${this.wallet()}<div class="modal-footer">${btn('depart',this.game.expedition?'Return to the road':'Journey to the wilderness',false,'primary-button')}<button class="text-button" data-action="close">Stay in Emberfall</button></div>`;return true;}
    if(panel==='departure'){
      modal.innerHTML=header('BEYOND THE LAST LANTERN','The Hollow awaits')+`<p>Leave the safety of Emberfall and enter the monastery crypt. Defeat the Hollow Warden, rescue the missing archivist, and bring back what the dead have kept.</p><p>Press T to channel a return portal. Moving or taking damage interrupts it. Your current expedition remains while you visit town.</p>${this.wallet()}<div class="modal-footer">${btn('depart',this.game.expedition?'Return to expedition':'Enter the crypt',false,'primary-button')}<button class="text-button" data-action="close">Stay in Emberfall</button></div>`;return true;
    }
    if(panel==='guide'){
      const complete=p.quests.wardenDefeated;
      modal.innerHTML=header('KEEPER OF THE LAST LIGHT','Sister Maelin')+`<div class="npc-dialog"><div class="npc-portrait portrait-guide"></div><div><p class="spoken">“${complete?'You have given the dead their peace—and brought a living soul home. Edrin has taken shelter by the old well. He will know what to make of your relics.':p.quests.guideMet?'Edrin was taken to Ruined Marchgate. Sir Aldren, once Alaric’s most trusted knight, keeps him there. Steel yourself, and remember: there is no shame in returning to the light.':'You wore the old king’s colours. Emberfall remembers, soldier. But we still have a fire, a roof, and a debt to those we lost. Will you walk beneath the monastery for us?'}”</p><div class="quest-card"><span class="eyebrow">A DEBT TO THE DEAD</span><h3>${complete?'The archivist returns':'Rescue the missing archivist'}</h3><p>Follow the Kingsroad to Ruined Marchgate. Free the first corrupted knight and rescue Edrin. The archivist will identify your relics freely.</p></div><div class="item-actions">${!p.quests.guideMet?btn('accept-quest','I will help · Accept quest'):''}${complete&&!p.quests.guideRewarded?btn('claim-reward','Claim reward · 120 gold + 3 embers'):''}${btn('heal','Restore life & spirit · Free')}${btn('guide-depart','Show me the crypt')}</div></div></div>${this.wallet()}`;return true;
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
    const inTown=['buy','sell','buyback','buy-flask','buy-scroll','repair','reforge','salvage','store','withdraw','identify-all','scholar-identify','heal','claim-reward','accept-quest','depart','guide-depart'];
    if(inTown.includes(action)&&!this.isTown){this.toast('This service is only available in Emberfall.');return true;}
    if(action==='sort'){arrange(p.inventory,BAG,true);if(this.game.panel==='stash')arrange(p.stash,STASH,true);this.refresh();}
    else if(action==='equip')this.apply(equipItem(p,this.selection));
    else if(action==='unequip'&&item)this.apply(unequipItem(p,item.slot));
    else if(action==='identify')this.apply(identifyItem(p,this.selection));
    else if(action==='store')this.apply(moveItem(p,this.selection,true));
    else if(action==='withdraw')this.apply(moveItem(p,this.selection,false));
    else if(action==='buy')this.apply(buyItem(p,p.shopStock.findIndex(i=>i.id===this.selection)));
    else if(action==='sell')this.apply(sellItem(p,this.selection));
    else if(action==='buyback')this.apply(buyBack(p,p.buyback.findIndex(i=>i.id===this.selection)));
    else if(action==='buy-flask')this.apply(buySupply(p,'flask'));
    else if(action==='buy-scroll')this.apply(buySupply(p,'scroll'));
    else if(action==='salvage')this.apply(salvageItem(p,this.selection));
    else if(action==='repair')this.apply(repairAll(p));
    else if(action==='reforge')this.apply(reforgeItem(p,this.selection,this.affix));
    else if(action==='identify-all')this.apply(identifyAll(p));
    else if(action==='scholar-identify')this.apply(identifyItem(p,this.selection,true));
    else if(action==='accept-quest')this.apply(acceptGuideQuest(p));
    else if(action==='claim-reward')this.apply(claimGuideReward(p));
    else if(action==='heal'){p.hp=this.game.stats.maxHp;p.mana=this.game.stats.maxMana;p.potions=Math.max(3,p.potions);this.toast('Maelin restores you. Your flask holds at least 3 charges.');this.refresh();}
    else if(action==='shop-stock'||action==='shop-buyback'){this.shopTab=action==='shop-stock'?'stock':'buyback';this.render('merchant');}
    else if(action==='guide-depart')this.openPanel('departure');
    else if(action==='depart'){this.closePanel();this.enterDungeon();}
    return true;
  }
  handleChange(event){if(event.target.matches('[data-forge-affix]')){this.affix=event.target.value;return true;}return false;}
  drop(event){
    const grid=event.target.closest('[data-bag-grid]'),slot=event.target.closest('[data-equip-slot]');if(!grid&&!slot)return;
    event.preventDefault();let data;try{data=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}
    if(data.source!=='pack'&&data.source!=='stash')return;
    const source=data.source==='pack'?this.player.inventory:this.player.stash,item=source.find(i=>i.id===data.id);if(!item)return;
    if(slot){if(data.source!=='pack'||slot.dataset.equipSlot!==item.slot){this.toast('That relic belongs in a different equipment slot.');return;}this.apply(equipItem(this.player,item.id));return;}
    const destination=grid.dataset.bagGrid;if(destination==='stash'&&!this.isTown)return;
    const dimensions=destination==='stash'?STASH:BAG,target=destination==='stash'?this.player.stash:this.player.inventory;
    const rect=grid.getBoundingClientRect(),x=Math.floor((event.clientX-rect.left)/rect.width*dimensions.width),y=Math.floor((event.clientY-rect.top)/rect.height*dimensions.height);
    if(!cellsFree(target,item,x,y,dimensions)){this.toast('That space is occupied, or the item will not fit.');return;}
    if(source!==target){source.splice(source.indexOf(item),1);target.push(item);}item.bagX=x;item.bagY=y;this.refresh();
  }
}
