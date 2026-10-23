import {itemArt} from './item-art.js';
import {playerStats,requiresIdentification} from './game.js';
import {BAG,STASH,arrange,restockCost,EQUIPMENT,itemName,buyPrice,repairCost,SLOT_ART} from './settlement.js';

export const HUD_PANELS=['inventory','stash','merchant','smith','scholar'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,text,disabled=false)=>`<button class="small-button" data-town-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
const icon=itemArt;

export class InventoryHUD {
  constructor(owner){
    this.owner=owner;this.game=owner.game;this.modal=document.getElementById('modal');this.tip=document.getElementById('item-tooltip');this.storageTab='personal';this.pages={};
    this.observer=new ResizeObserver(()=>this.fit());this.observer.observe(this.modal);
    window.addEventListener('resize',()=>{this.fit();this.hideTooltip();});
    this.modal.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const item=e.target.closest('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped]');if(item&&!item.contains(e.relatedTarget))this.showTooltip(item);});
    this.modal.addEventListener('pointerout',e=>{const item=e.target.closest('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped]');if(item&&!item.contains(e.relatedTarget)&&!this.pinned)this.hideTooltip();});
    this.modal.addEventListener('focusin',e=>{const item=e.target.closest('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped]');if(item)this.showTooltip(item);});
    this.modal.addEventListener('dragstart',()=>this.hideTooltip());
    document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped],#item-tooltip'))this.hideTooltip();});
  }
  resolve(element){
    const p=this.owner.player;
    if(element.dataset.packId){const source=element.dataset.container;return {source,item:(source==='stash'?this.owner.stashItems:p.inventory).find(i=>i.id===element.dataset.packId)};}
    if(element.dataset.stockId){const source=element.dataset.stockSource;return {source,item:(source==='stock'?p.shopStock:p.buyback)?.find(i=>i.id===element.dataset.stockId)};}
    return {source:'equipped',item:p.equipment[element.dataset.equipSlot||element.dataset.smithEquipped]};
  }
  detailFor(item,source){
    const o=this.owner,old={selection:o.selection,source:o.source,affix:o.affix};o.selection=item.id;o.source=source;
    const node=document.createElement('div');node.innerHTML=o.detail();Object.assign(o,old);
    node.querySelectorAll('.item-actions,.forge-controls,.smith-note,button,input,select').forEach(n=>n.remove());
    return node.innerHTML;
  }
  showTooltip(element,pinned=false){
    if(!HUD_PANELS.includes(this.game.panel))return;
    const {item,source}=this.resolve(element);if(!item)return this.hideTooltip();
    const compact=matchMedia('(pointer:coarse)').matches||innerWidth<=700;
    const footer=this.modal.querySelector('#hud-item-actions')?.getBoundingClientRect();
    const heading=this.modal.querySelector('.hud-heading')?.getBoundingClientRect();
    const toolbar=this.modal.querySelector('.hud-toolbar')?.getBoundingClientRect();
    const minY=pinned&&compact?Math.max(8,(heading?.bottom||0)+8,(toolbar?.bottom||0)+8):8;
    const maxY=pinned&&compact&&footer?footer.top-8:innerHeight-8;
    this.pinned=pinned;this.tip.classList.toggle('pinned-tip',pinned);this.tip.tabIndex=pinned?0:-1;
    this.tip.style.maxHeight=Math.max(60,maxY-minY)+'px';
    this.tip.querySelector('#item-detail').innerHTML=this.detailFor(item,source);this.tip.classList.remove('hidden');this.tip.setAttribute('aria-label',itemName(item));
    // Only descriptions that need scrolling capture input. Short comparisons let
    // clicks pass through to the pack beneath them.
    this.tip.classList.toggle('scrollable-tip',pinned&&this.tip.scrollHeight>this.tip.clientHeight+1);
    const rect=element.getBoundingClientRect(),bounds=this.tip.getBoundingClientRect(),panel=this.modal.getBoundingClientRect();
    let x=panel.left-bounds.width-12,y=rect.top;
    if(x<8){x=rect.right+12;if(x+bounds.width>innerWidth-8)x=Math.max(8,rect.left-bounds.width-10);y=rect.top-bounds.height-8;}
    x=Math.max(8,Math.min(x,innerWidth-bounds.width-8));y=Math.max(minY,Math.min(y,maxY-bounds.height));
    this.tip.style.left=`${x}px`;this.tip.style.top=`${y}px`;
  }
  hideTooltip(){this.tip.classList.add('hidden');this.pinned=false;}
  actionDock(){
    if(this.game.panel==='inventory')return '';
    const item=this.owner.selected;
    if(!item)return '<div class="hud-selection-hint">Hover · Inspect & compare<br><span>Right click: equip · Shift: sell at shop · Alt: identify</span></div>';
    const node=document.createElement('div');node.innerHTML=this.owner.detail();node.querySelectorAll('[data-town-action=equip],[data-town-action=favorite],[data-town-action=unequip]').forEach(button=>button.remove());
    return `<div class="hud-selected-name ${item.rarity}">${esc(itemName(item))}</div>${node.querySelector('.item-actions')?.outerHTML||''}${node.querySelector('[data-town-action=temper]')?.outerHTML||''}${node.querySelector('.forge-controls')?.outerHTML||''}${node.querySelector('.smith-note')?.outerHTML||''}`;
  }
  updateDock(){
    const dock=this.modal.querySelector('#hud-item-actions');if(dock)dock.innerHTML=this.actionDock();this.fit();
  }
  select(element){
    const {item,source}=this.resolve(element);if(!item)return;
    this.owner.selection=item.id;this.owner.source=source;
    this.modal.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));element.classList.add('selected');this.updateDock();this.showTooltip(element,true);
  }
  handleClick(event){
    if(!HUD_PANELS.includes(this.game.panel))return false;
    if(this.owner.suppressClick)return true;
    const item=event.target.closest('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped]');
    if(item){if(this.owner.identifying){const resolved=this.resolve(item);if(resolved.source==='pack')this.owner.identifyTarget(resolved.item?.id);return true;}if((event.ctrlKey||event.shiftKey||event.altKey)&&this.owner.quickAction(item,event))return true;this.select(item);return true;}
    const page=event.target.closest('[data-service-page]');if(page){this.pages[page.dataset.pageKey]=Number(page.dataset.servicePage);this.hideTooltip();this.render(this.game.panel);this.modal.querySelector(`[data-page-key="${page.dataset.pageKey}"]:not(:disabled)`)?.focus();return true;}
    const tab=event.target.closest('[data-storage-tab]');if(tab){this.storageTab=tab.dataset.storageTab;this.owner.selection=null;this.owner.source='pack';this.hideTooltip();this.render('stash');return true;}
    return false;
  }
  fit(){
    if(!this.modal.classList.contains('hud-panel')||this.modal.offsetWidth===0)return;
    const sheet=this.modal.querySelector('.inventory-sheet');if(!sheet)return;
    if(this.modal.classList.contains('dual-stash'))return this.fitStash();
    if(this.modal.classList.contains('dual-service'))return this.fitService();
    const service=this.game.panel!=='inventory',availableWidth=innerWidth-16,availableHeight=innerHeight-108;
    let cell,width,height;
    if(!service){cell=Math.max(12,Math.min(46,Math.floor((availableWidth-32)/BAG.width),Math.floor((availableHeight-162)/12.4)));width=cell*BAG.width+32;height=Math.round(cell*12.4+162);}else{width=Math.min(availableWidth,900);height=Math.min(700,availableHeight);}
    sheet.classList.remove('wide-inventory');sheet.classList.toggle('narrow-service',service&&innerWidth<=700);sheet.style.setProperty('--gear-cell',cell||32);
    sheet.style.width='100%';sheet.style.height='100%';sheet.style.transform='none';
    this.modal.style.width=width+'px';this.modal.style.height=height+'px';this.modal.style.setProperty('--panel-w',width+'px');this.modal.style.setProperty('--panel-h',height+'px');this.modal.style.top='8px';
    for(const section of this.modal.querySelectorAll('.hud-bag-section')){
      const grid=section.querySelector('.spatial-bag');if(!grid)continue;
      const cols=Number(grid.style.getPropertyValue('--cols'))||BAG.width,rows=Number(grid.style.getPropertyValue('--rows'))||BAG.height;
      const label=section.querySelector('.bag-label')?.offsetHeight||18,overflow=section.querySelector('.overflow-items')?.offsetHeight||0;
      const gridCell=!service?cell:Math.max(12,Math.floor(Math.min((section.clientWidth-4)/cols,(section.clientHeight-label-overflow-6)/rows)));
      const w=gridCell*cols+'px',h=gridCell*rows+'px';if(grid.style.width!==w)grid.style.width=w;if(grid.style.height!==h)grid.style.height=h;
    }
    this.game.hudWidth=innerWidth-width>380&&innerWidth>700?width+16:0;
  }

  fitService(){
    // Both sheets share the exact same square equipment / backpack cell size.
    const cell=Math.max(12,Math.min(46,Math.floor((Math.min(750,innerHeight-108)-162)/12.4),Math.floor((innerWidth-96)/(BAG.width*2)))),height=Math.round(cell*12.4+162),sheetWidth=cell*BAG.width+32,width=sheetWidth*2+20;
    Object.assign(this.modal.style,{width:width+'px',height:height+'px',top:'8px'});
    this.modal.style.setProperty('--panel-w',width+'px');this.modal.style.setProperty('--panel-h',height+'px');this.modal.style.setProperty('--gear-cell',cell);
    for(const sheet of this.modal.querySelectorAll('.inventory-sheet')){sheet.style.setProperty('--gear-cell',cell);sheet.style.width=sheetWidth+'px';sheet.style.height='100%';}
    const grid=this.modal.querySelector('[data-bag-grid="pack"]');if(grid){grid.style.width=cell*BAG.width+'px';grid.style.height=cell*BAG.height+'px';}
    this.game.hudWidth=innerWidth-width>380?width+16:0;
  }
  fitStash(){
    const height=Math.min(820,innerHeight-170),cell=Math.max(12,Math.min(46,Math.floor((height-280)/10),Math.floor((height-162)/12.4),Math.floor((innerWidth-112)/(BAG.width+STASH.width))));
    Object.assign(this.modal.style,{width:innerWidth-16+'px',height:height+'px',top:'8px',left:'8px',right:'auto'});this.modal.style.setProperty('--panel-w',innerWidth-16+'px');this.modal.style.setProperty('--panel-h',height+'px');this.modal.style.setProperty('--gear-cell',cell);
    for(const sheet of this.modal.querySelectorAll('.inventory-sheet')){sheet.style.setProperty('--gear-cell',cell);sheet.style.width=((sheet.classList.contains('stash-sheet')?STASH.width:BAG.width)*cell+32)+'px';sheet.style.height=height+'px';}
    for(const [name,dimensions]of [['pack',BAG],['stash',STASH]]){const grid=this.modal.querySelector(`[data-bag-grid="${name}"]`);grid.style.width=dimensions.width*cell+'px';grid.style.height=dimensions.height*cell+'px';}
    this.game.hudWidth=0;
  }
  renderStash(){
    const o=this.owner,p=o.player,items=o.stashItems;arrange(items,STASH);const pageName=this.storageTab==='personal'?'Personal stash':'Shared stash '+this.storageTab.split('-')[1],rivets='<i class="corner-rivet tl"></i><i class="corner-rivet tr"></i><i class="corner-rivet bl"></i><i class="corner-rivet br"></i>';
    this.modal.innerHTML=`<div class="inventory-sheet stash-sheet">${rivets}${this.header('Stash','EMBERFALL STRONGBOX')}<nav class="stash-page-tabs" aria-label="Stash pages">${[['personal','Personal'],['shared-1','Shared I'],['shared-2','Shared II'],['shared-3','Shared III']].map(([id,name])=>`<button data-storage-tab="${id}" aria-pressed="${this.storageTab===id}" class="${this.storageTab===id?'active':''}">${name}</button>`).join('')}</nav><section class="hud-section hud-bag-section stash-section" aria-label="${pageName}">${o.grid(items,'stash')}</section><div class="stash-page-description">${this.storageTab==='personal'?'Belongs to '+esc(p.name)+'.':'Available to every character in this browser.'}</div><div class="stash-bank"><span>Personal gold <b>${p.bankGold.toLocaleString()}</b></span><div><input id="bank-amount" type="number" min="1" step="1" value="${Math.min(100,p.gold)||1}" aria-label="Gold amount">${button('deposit','Deposit')}${button('withdraw-gold','Withdraw')}</div></div><div class="stash-commands">${button('sort','Arrange page')}<span>Shift / Ctrl + click · Transfer<br>Drag items between grids</span></div><div class="stash-engraving" aria-hidden="true">✥</div></div><div class="inventory-sheet player-sheet">${rivets}<header class="hud-heading"><h2>Inventory</h2><button class="close" data-action="close" aria-label="Close inventory and stash">×</button></header><div class="hud-toolbar"><span class="inventory-inscription">THE LOYALIST’S BELONGINGS</span></div><div class="hud-content hud-inventory-content"><section class="hud-section hud-doll-section">${o.equipment()}</section><section class="hud-section hud-bag-section">${o.grid(p.inventory)}</section></div>${o.wallet()}<div class="inventory-trade-hint">Shift / Ctrl + click · Store in the selected page<br><span>Right click · Equip &nbsp; Drag to figure · Equip &nbsp; Esc · Close both</span></div></div>`;
    for(const el of this.modal.querySelectorAll('[title]'))el.removeAttribute('title');this.fitStash();this.hideTooltip();return true;
  }
  pagedGallery(items,key,renderItem){
    const count=Math.max(1,Math.ceil(items.length/6)),page=Math.max(0,Math.min(count-1,this.pages[key]||0));this.pages[key]=page;
    return `<div class="service-gallery" aria-label="${key==='forge'?'Equipped items':'Merchant items'}">${items.slice(page*6,page*6+6).map(renderItem).join('')||'<p class="empty-ledger">No items in this ledger.</p>'}</div><nav class="service-pagination" aria-label="Item pages"><button data-page-key="${key}" data-service-page="${page-1}" aria-label="Previous item page" ${page===0?'disabled':''}>‹</button><span aria-live="polite">Page ${page+1} / ${count} <small>· ${items.length} items</small></span><button data-page-key="${key}" data-service-page="${page+1}" aria-label="Next item page" ${page===count-1?'disabled':''}>›</button></nav>`;
  }
  renderService(panel){
    const o=this.owner,p=o.player,merchant=panel==='merchant',title=merchant?'Orrin’s wares':'Garran’s forge';
    const toolbar=merchant?`${button('buy-flask','Flask · 8 gold',p.gold<8||p.flask?.charges>=100)}${button('buy-scroll','Scroll · 12 gold',p.gold<12)}${button('restock',`Restock · ${restockCost(p)} gold`,p.gold<restockCost(p))}`:button('repair',`Repair all · ${repairCost(p)} gold`,!repairCost(p));
    const tabs=merchant?`<div class="shop-tabs">${button('shop-stock','For sale',o.shopTab==='stock')}${button('shop-buyback','Buyback',o.shopTab==='buyback')}</div>`:'<div class="forge-inscription">EQUIPPED ARMS · THE REFORGING FIRE</div>';
    const gallery=merchant?this.pagedGallery(o.shopTab==='stock'?p.shopStock:p.buyback,o.shopTab,i=>`<button data-stock-id="${esc(i.id)}" data-stock-source="${o.shopTab}" class="service-item shop-item ${i.rarity} ${o.selection===i.id?'selected':''}" aria-label="${esc(itemName(i))}"><span class="service-socket">${icon(i)}</span><span class="service-item-name">${esc(itemName(i))}</span><small>${o.shopTab==='stock'?buyPrice(i):i.price} gold</small></button>`):this.pagedGallery(Object.entries(p.equipment).filter(([,i])=>i),'forge',([slot,i])=>`<button data-smith-equipped="${slot}" class="service-item smith-item ${i.rarity} ${o.selection===i.id?'selected':''}" aria-label="${esc(itemName(i))}"><span class="service-socket">${icon(i)}</span><span class="service-item-name">${esc(itemName(i))}</span><small>${Math.ceil(i.durability??100)}% condition</small></button>`);
    const rivets='<i class="corner-rivet tl"></i><i class="corner-rivet tr"></i><i class="corner-rivet bl"></i><i class="corner-rivet br"></i>';
    this.modal.innerHTML=`<div class="inventory-sheet service-sheet" data-trade-target="sell">${rivets}${this.header(title,merchant?'TRADER OF EMBERFALL':'BLACKSMITH OF EMBERFALL')}<div class="hud-toolbar">${toolbar}</div><div class="service-ledger">${tabs}${gallery}</div><p class="service-instruction">${merchant?'Select a ware to buy. Select an item in your pack to sell.':'Select equipped or carried gear to temper, reforge or salvage.'}</p><footer id="hud-item-actions" class="hud-item-actions">${this.actionDock()}</footer></div><div class="inventory-sheet player-sheet">${rivets}<header class="hud-heading"><h2>Inventory</h2></header><div class="hud-toolbar">${button('sort','Arrange')}</div><div class="hud-content hud-inventory-content"><section class="hud-section hud-doll-section">${o.equipment()}</section><section class="hud-section hud-bag-section">${o.grid(p.inventory)}</section></div>${o.wallet()}<div class="inventory-trade-hint">${merchant?'Shift + click · Sell &nbsp; Drag to trader · Sell':'Right click · Equip / unequip'}<br><span>Hover · Inspect & compare &nbsp; Esc · Close both</span></div></div>`;
    for(const el of this.modal.querySelectorAll('[title]'))el.removeAttribute('title');
    this.modal.scrollTop=0;this.fitService();requestAnimationFrame(()=>this.hideTooltip());return true;
  }

  header(name,kicker){return `<header class="hud-heading"><div><span class="eyebrow">${kicker}</span><h2 id="modal-title">${name}</h2></div><button class="close" data-action="close" aria-label="Close panel">×</button></header>`;}
  render(panel){
    const o=this.owner,p=o.player,m=this.modal;
    if(o.lastPanel!==panel){o.selection=null;o.source='pack';o.affix='';o.lastPanel=panel;this.hideTooltip();}
    if(panel!=='stash'){m.style.removeProperty('left');m.style.removeProperty('right');}
    m.classList.toggle('dual-service',['merchant','smith','stash'].includes(panel));m.classList.toggle('dual-stash',panel==='stash');
    m.classList.add('expanded-modal','hud-panel');document.getElementById('modal-backdrop').classList.add('hud-mode');m.dataset.hudPanel=panel;
    if(panel==='stash')return this.renderStash();
    if(['merchant','smith'].includes(panel))return this.renderService(panel);
    const title={inventory:'Inventory',stash:'Personal stash',merchant:'Orrin’s wares',smith:'Garran’s forge',scholar:'Edrin’s study'}[panel];
    const heading=this.header(title,panel==='inventory'?'EQUIPMENT & BELONGINGS':panel==='stash'?'SAFE STORAGE IN EMBERFALL':'TOWN SERVICES');
    let toolbar='',contents='';
    const pack=`<section class="hud-section hud-bag-section">${o.grid(p.inventory)}</section>`;
    if(panel==='inventory'){
      const stats=playerStats(p);
      toolbar=`<span class="inventory-inscription">THE LOYALIST’S BELONGINGS</span>${button('sort','Arrange')}${o.isTown?button('stash','Stash'):''}`;
      contents=`<div class="hud-content hud-inventory-content"><section class="hud-section hud-doll-section"><div class="hud-section-title ornate-rule">ARMS OF THE ROYAL GUARD</div>${o.equipment()}<div class="gear-readout"><span>Damage <b>${Math.round(stats.damage)}</b></span><span>Armor <b>${Math.round(stats.armor)}</b></span><span>Life <b>${stats.maxHp}</b></span></div></section>${pack}</div>`;
    }else{
      toolbar=button('identify-all','Identify all · Free',!p.quests.scholarRescued||!p.inventory.some(i=>requiresIdentification(i)));
      contents=`<div class="hud-content hud-service-content"><section class="hud-section hud-scholar"><div class="service-portrait portrait-scholar"></div><h3>Every relic remembers.</h3><p>${p.quests.scholarRescued?'In gratitude for his rescue, Edrin reveals your relics freely.':'Defeat the Hollow Warden to rescue Edrin.'}</p></section>${pack}</div>`;
    }
    m.innerHTML='<div class="inventory-sheet"><i class="corner-rivet tl"></i><i class="corner-rivet tr"></i><i class="corner-rivet bl"></i><i class="corner-rivet br"></i>'+heading+`<div class="hud-toolbar">${toolbar}</div>`+contents+o.wallet()+`${panel==='inventory'?'<div class="inventory-controls">Right click · Equip &nbsp; Drag to figure · Equip<br><span>Drag outside · Drop &nbsp; Shift at trader · Sell &nbsp; S · Arrange</span></div>':`<footer id="hud-item-actions" class="hud-item-actions">${this.actionDock()}</footer>`}<div class="hud-key-hint">I · INVENTORY <span>ESC · CLOSE</span></div></div>`;
    for(const el of m.querySelectorAll('[data-pack-id],[data-equip-slot],[data-stock-id]'))el.removeAttribute('title');
    m.scrollTop=0;requestAnimationFrame(()=>{this.fit();const anchor=[...m.querySelectorAll('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped]')].find(el=>this.resolve(el).item?.id===o.selection);if(anchor)this.showTooltip(anchor,matchMedia('(pointer:coarse)').matches);else this.hideTooltip();});
    return true;
  }
}
