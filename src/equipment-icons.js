// Stone impressions distinguish empty sockets from the colored, equipped item art.
const slots=['helm','charm','weapon','armor','shield','gloves','belt','ring','boots'];
export function equipmentEtching(slot){const i=Math.max(0,slots.indexOf(slot==='ring2'?'ring':slot));return `<span class="socket-etching etched-equipment" data-empty-slot="${slots[i]}" style="--etch-x:${i%3*50}%;--etch-y:${Math.floor(i/3)*50}%" aria-hidden="true"></span>`;}
