import {chickenHatPlacement} from './chicken-hats.js';
import {CHICKEN_BREEDS_ART,CHICKEN_TREASURES_ART} from './assets.js';
import {breedOf,HATS} from './chicken-pets.js';
let serial=0;
export function poultryIcon(index,treasure=false,classes=''){
 const x=index%4*256,y=Math.floor(index/4)*256,id='poultry-'+(++serial);
 return `<svg class="poultry-art ${classes}" viewBox="${x} ${y} 256 256" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="256" height="256"/></clipPath></defs><image clip-path="url(#${id})" href="${treasure?CHICKEN_TREASURES_ART:CHICKEN_BREEDS_ART}" width="1024" height="768"/></svg>`;
}
export function chickenPortrait(c,classes=''){const hat=HATS.find(h=>h.id===c.hat),pos=chickenHatPlacement(hat),clip='hat-'+(++serial);return `<span class="poultry-portrait ${classes}" data-breed="${breedOf(c).id}">${poultryIcon(breedOf(c).art)}${pos?`<span class="chicken-hat" style="left:${(pos.x+20)/40*100}%;top:${(pos.y+31)/40*100}%;width:${pos.width/40*100}%;height:${pos.height/40*100}%"><svg class="poultry-art" viewBox="${pos.sx} ${pos.sy} ${pos.sw} ${pos.sh}" aria-hidden="true"><defs><clipPath id="${clip}"><rect x="${pos.sx}" y="${pos.sy}" width="${pos.sw}" height="${pos.sh}"/></clipPath></defs><image clip-path="url(#${clip})" href="${CHICKEN_TREASURES_ART}" width="1024" height="768"/></svg></span>`:''}</span>`;}
