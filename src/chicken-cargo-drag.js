// Pointer events also work with the game's virtual cursor while pointer lock is active.
export class ChickenCargoDrag{
 constructor(root,onTransfer){this.root=root;this.onTransfer=onTransfer;this.suppressUntil=0;
  root.addEventListener('pointerdown',e=>this.down(e));
  document.addEventListener('pointermove',e=>this.move(e));
  document.addEventListener('pointerup',e=>this.up(e));
  document.addEventListener('pointercancel',()=>this.clear());
 }
 down(e){const item=e.target.closest('[data-cargo-item]');if(e.button!==0||!item||item.disabled||!this.root.contains(item))return;this.clear();this.drag={id:item.dataset.cargoItem,toChicken:item.dataset.toChicken==='true',pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,item,active:false};}
 destination(e,d){const grid=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-bag-grid="pack"]');return !d.toChicken&&grid&&document.getElementById('modal')?.contains(grid)?grid:null;}
 move(e){const d=this.drag;if(!d||e.pointerId!==d.pointerId)return;if(!d.active){if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<7)return;d.active=true;d.ghost=d.item.cloneNode(true);d.ghost.removeAttribute('data-cargo-item');d.ghost.className='courier-drag-ghost';d.ghost.setAttribute('aria-hidden','true');document.body.append(d.ghost);d.item.classList.add('courier-drag-source');}
  d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';const grid=this.destination(e,d);if(this.hover!==grid){this.hover?.classList.remove('courier-drop-target');this.hover=grid;}this.hover?.classList.add('courier-drop-target');e.preventDefault();}
 up(e){const d=this.drag;if(!d||e.pointerId!==d.pointerId)return;if(d.active){const grid=this.destination(e,d);this.suppressUntil=performance.now()+350;e.preventDefault();this.clear();if(grid)this.onTransfer(d.id,false);}else this.clear();}
 clear(){this.hover?.classList.remove('courier-drop-target');this.hover=null;this.drag?.item?.classList.remove('courier-drag-source');this.drag?.ghost?.remove();this.drag=null;}
 suppressClick(){return performance.now()<this.suppressUntil;}
}
