import {ITEM_ART} from './assets.js';
import {ITEM_BOUNDS} from './item-bounds.js';
const slots={weapon:4,armor:6,helm:7,gloves:8,boots:9,belt:10,ring:11,charm:12,shield:13};
let serial=0;
export function itemArt(item){const index=item.art??(item.slot==='weapon'&&/mace|hammer/i.test(item.name)?15:item.slot==='weapon'&&/axe/i.test(item.name)?5:slots[item.slot]??4),bounds=ITEM_BOUNDS[index]||[0,0,256,256],clip='relic-art-'+(++serial);return `<svg class="item-art natural-item-art" viewBox="${bounds.join(' ')}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><rect x="${bounds[0]}" y="${bounds[1]}" width="${bounds[2]}" height="${bounds[3]}"/></clipPath></defs><image clip-path="url(#${clip})" href="${ITEM_ART}" x="0" y="0" width="1024" height="1024"/></svg>`;}
