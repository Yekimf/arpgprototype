import {itemArt} from './item-art.js';
import {playerStats,requiresIdentification} from './game.js';
import {EQUIPMENT,itemName,buyPrice,repairCost,SLOT_ART} from './settlement.js';

export const HUD_PANELS=['inventory','stash','merchant','smith','scholar'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,text,disabled=false)=>`<button class="small-button" data-town-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
const icon=itemArt;

export class InventoryHUD {
  constructor(owner){
    this.owner=owner;this.game=owner.game;this.modal=document.getElementById('modal');this.tip=document.getElementById('item-tooltip');this.storageTab='stash';
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
    if(element.dataset.packId){const source=element.dataset.container;return {source,item:(source==='stash'?p.stash:p.inventory).find(i=>i.id===element.dataset.packId)};}
    if(element.dataset.stockId){const source=element.dataset.stockSource;return {source,item:(source==='stock'?p.shopStock:p.buyback)?.find(i=>i.id===element.dataset.stockId)};}
    return {source:'equipped',item:p.equipment[element.dataset.equipSlot||element.dataset.smithEquipped]};
  }
  detailFor(item,source){
    const o=this.owner,old={selection:o.selection,source:o.source,affix:o.affix};o.selection=item.id;o.source=source;
    const node=document.createElement('div');node.innerHTML=o.detail();Object.assign(o,old);
    node.querySelectorAll('.item-actions,.forge-controls,.smith-note').forEach(n=>n.remove());
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
    const item=this.owner.selected;
    if(!item)return '<div class="hud-selection-hint">Hover to inspect · Double-click to equip<br><span>Tap an item for details on mobile.</span></div>';
    const node=document.createElement('div');node.innerHTML=this.owner.detail();
    return `<div class="hud-selected-name ${item.rarity}">${esc(itemName(item))}</div>${node.querySelector('.item-actions')?.outerHTML||''}${node.querySelector('.forge-controls')?.outerHTML||''}${node.querySelector('.smith-note')?.outerHTML||''}`;
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
    const item=event.target.closest('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped]');
    if(item){this.select(item);return true;}
    const tab=event.target.closest('[data-storage-tab]');if(tab){this.storageTab=tab.dataset.storageTab;this.render('stash');return true;}
    return false;
  }
  fit(){
    if(!this.modal.classList.contains('hud-panel')||this.modal.offsetWidth===0)return;
    const sheet=this.modal.querySelector('.inventory-sheet');if(!sheet)return;
    const service=this.game.panel!=='inventory',mobile=innerWidth<=700,wide=innerHeight<580&&innerWidth>700,availableWidth=innerWidth-16,availableHeight=innerHeight-(wide?100:118);
    let cell,width,height;const fixed=wide?120:166;if(!service){cell=Math.max(12,Math.min(42,Math.floor((availableWidth-(wide?50:26))/(wide?20:10)),Math.floor((availableHeight-fixed)/(wide?7.5:11.5))));width=cell*(wide?20:10)+(wide?50:26);height=Math.round(cell*(wide?7.5:11.5)+fixed);}else{width=Math.min(availableWidth,wide?760:!mobile?800:440);height=Math.min(720,availableHeight);}
    sheet.classList.toggle('wide-inventory',wide);sheet.classList.toggle('narrow-service',service&&mobile);sheet.style.setProperty('--gear-cell',cell||32);
    sheet.style.width='100%';sheet.style.height='100%';sheet.style.transform='none';
    this.modal.style.width=width+'px';this.modal.style.height=height+'px';this.modal.style.setProperty('--panel-w',width+'px');this.modal.style.setProperty('--panel-h',height+'px');this.modal.style.top='8px';
    for(const section of this.modal.querySelectorAll('.hud-bag-section')){
      const grid=section.querySelector('.spatial-bag');if(!grid)continue;
      const cols=Number(grid.style.getPropertyValue('--cols'))||10,rows=Number(grid.style.getPropertyValue('--rows'))||4;
      const label=section.querySelector('.bag-label')?.offsetHeight||18,overflow=section.querySelector('.overflow-items')?.offsetHeight||0;
      const gridCell=!service?cell:Math.max(12,Math.floor(Math.min((section.clientWidth-4)/cols,(section.clientHeight-label-overflow-6)/rows)));
      const w=gridCell*cols+'px',h=gridCell*rows+'px';if(grid.style.width!==w)grid.style.width=w;if(grid.style.height!==h)grid.style.height=h;
    }
    this.game.hudWidth=innerWidth-width>380&&innerWidth>700?width+16:0;
  }

  header(name,kicker){return `<header class="hud-heading"><div><span class="eyebrow">${kicker}</span><h2 id="modal-title">${name}</h2></div><button class="close" data-action="close" aria-label="Close panel">×</button></header>`;}
  render(panel){
    const o=this.owner,p=o.player,m=this.modal;
    if(o.lastPanel!==panel){o.selection=null;o.source='pack';o.affix='';o.lastPanel=panel;this.hideTooltip();}
    m.classList.add('expanded-modal','hud-panel');document.getElementById('modal-backdrop').classList.add('hud-mode');m.dataset.hudPanel=panel;
    const title={inventory:'Inventory',stash:'Personal stash',merchant:'Orrin’s wares',smith:'Garran’s forge',scholar:'Edrin’s study'}[panel];
    const heading=this.header(title,panel==='inventory'?'EQUIPMENT & BELONGINGS':panel==='stash'?'SAFE STORAGE IN EMBERFALL':'TOWN SERVICES');
    let toolbar='',contents='';
    const pack=`<section class="hud-section hud-bag-section">${o.grid(p.inventory)}</section>`;
    if(panel==='inventory'){
      const stats=playerStats(p);
      toolbar=`<span class="inventory-inscription">THE LOYALIST’S BELONGINGS</span>${button('sort','Arrange')}${o.isTown?button('stash','Stash'):''}`;
      contents=`<div class="hud-content hud-inventory-content"><section class="hud-section hud-doll-section"><div class="hud-section-title ornate-rule">ARMS OF THE ROYAL GUARD</div>${o.equipment()}<div class="gear-readout"><span>Damage <b>${Math.round(stats.damage)}</b></span><span>Armor <b>${Math.round(stats.armor)}</b></span><span>Life <b>${stats.maxHp}</b></span></div></section>${pack}</div>`;
    }else if(panel==='stash'){
      toolbar=`<div class="storage-tabs"><button data-storage-tab="stash" class="small-button ${this.storageTab==='stash'?'active':''}">Stash</button><button data-storage-tab="pack" class="small-button ${this.storageTab==='pack'?'active':''}">Pack</button></div>${button('sort','Arrange')}${button('inventory','Equipment')}`;
      contents=`<div class="hud-content hud-stash-content" data-storage-view="${this.storageTab}"><section class="hud-section hud-bag-section stash-section">${o.grid(p.stash,'stash')}</section><section class="hud-section hud-bag-section pack-section">${o.grid(p.inventory)}</section></div>`;
    }else if(panel==='merchant'){
      toolbar=`${button('buy-flask','20 charges · 8 gold',p.gold<8||p.flask?.charges>=100)}${button('buy-scroll','Scroll · 12 gold',p.gold<12)}`;
      const stock=o.shopTab==='stock'?p.shopStock:p.buyback;
      contents=`<div class="hud-content hud-service-content"><section class="hud-section"><div class="shop-tabs">${button('shop-stock','For sale',o.shopTab==='stock')}${button('shop-buyback','Buyback',o.shopTab==='buyback')}</div><div class="shop-stock">${stock.map(i=>`<button data-stock-id="${esc(i.id)}" data-stock-source="${o.shopTab}" class="shop-item ${i.rarity} ${o.selection===i.id?'selected':''}" aria-label="${esc(itemName(i))}">${icon(i)}<span>${esc(itemName(i))}<small>${o.shopTab==='stock'?buyPrice(i):i.price} gold</small></span></button>`).join('')||'<p>No items here yet.</p>'}</div></section>${pack}</div>`;
    }else if(panel==='smith'){
      toolbar=`${button('repair',`Repair gear · ${repairCost(p)} gold`,!repairCost(p))}<span>Gold + embers reforge one affix.</span>`;
      contents=`<div class="hud-content hud-service-content"><section class="hud-section"><div class="hud-section-title">EQUIPPED · SELECT TO REFORGE</div><div class="smith-equipped">${Object.entries(p.equipment).filter(([,i])=>i).map(([s,i])=>`<button class="smith-item ${i.rarity}" data-smith-equipped="${s}" aria-label="${esc(itemName(i))}">${icon(i)}<span>${esc(itemName(i))}<small>${Math.ceil(i.durability??100)}% condition</small></span></button>`).join('')}</div><p class="hud-service-note">Salvage carried gear for embers. A reforge may improve or worsen a magical property.</p></section>${pack}</div>`;
    }else{
      toolbar=button('identify-all','Identify all · Free',!p.quests.scholarRescued||!p.inventory.some(i=>requiresIdentification(i)));
      contents=`<div class="hud-content hud-service-content"><section class="hud-section hud-scholar"><div class="service-portrait portrait-scholar"></div><h3>Every relic remembers.</h3><p>${p.quests.scholarRescued?'In gratitude for his rescue, Edrin reveals your relics freely.':'Defeat the Hollow Warden to rescue Edrin.'}</p></section>${pack}</div>`;
    }
    m.innerHTML='<div class="inventory-sheet"><i class="corner-rivet tl"></i><i class="corner-rivet tr"></i><i class="corner-rivet bl"></i><i class="corner-rivet br"></i>'+heading+`<div class="hud-toolbar">${toolbar}</div>`+contents+o.wallet()+`<footer id="hud-item-actions" class="hud-item-actions">${this.actionDock()}</footer><div class="hud-key-hint">I · INVENTORY <span>ESC · CLOSE</span></div></div>`;
    for(const el of m.querySelectorAll('[data-pack-id],[data-equip-slot],[data-stock-id]'))el.removeAttribute('title');
    m.scrollTop=0;requestAnimationFrame(()=>{this.fit();const anchor=[...m.querySelectorAll('[data-pack-id],[data-equip-slot],[data-stock-id],[data-smith-equipped]')].find(el=>this.resolve(el).item?.id===o.selection);if(anchor)this.showTooltip(anchor,matchMedia('(pointer:coarse)').matches);else this.hideTooltip();});
    return true;
  }
}
