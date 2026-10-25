import {CHICKEN_BREEDS_ART,CHICKEN_TREASURES_ART} from './assets.js';
import {breedOf,HATS} from './chicken-pets.js';
let serial=0;
export function poultryIcon(index,treasure=false,classes=''){
 const x=index%4*256,y=Math.floor(index/4)*256,id='poultry-'+(++serial);
 return `<svg class="poultry-art ${classes}" viewBox="${x} ${y} 256 256" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="256" height="256"/></clipPath></defs><image clip-path="url(#${id})" href="${treasure?CHICKEN_TREASURES_ART:CHICKEN_BREEDS_ART}" width="1024" height="768"/></svg>`;
}
export function chickenPortrait(c,classes=''){const hat=HATS.find(h=>h.id===c.hat);return `<span class="poultry-portrait ${classes}" data-breed="${breedOf(c).id}">${poultryIcon(breedOf(c).art)}${hat?`<span class="chicken-hat">${poultryIcon(hat.art,true)}</span>`:''}</span>`;}
