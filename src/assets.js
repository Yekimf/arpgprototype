import leather from './art/leather.svg?inline';
import world from './art/runtime/world-atlas.webp?inline';
import items from './art/runtime/items-atlas.webp?inline';
import campaign from './art/runtime/campaign-atlas.webp?inline';
import worldmap from './art/runtime/world-map.webp?inline';
import prologue from './art/runtime/prologue.webp?inline';
// Blob URLs keep atlas references short enough for CSS custom properties while
// retaining all image bytes inside the offline build.
function localAsset(source){
  if(!source.startsWith('data:'))return source;
  const binary=atob(source.slice(source.indexOf(',')+1)),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes],{type:source.slice(5,source.indexOf(';'))}));
}
export const WORLD_ART=localAsset(world);
export const ITEM_ART=localAsset(items);

export const STORY_ART=localAsset(prologue);
export const LEATHER_ART=leather;
export const CAMPAIGN_ART=localAsset(campaign);
export const MAP_ART=localAsset(worldmap);

import soldier from './art/runtime/soldier.webp?inline';
export const SOLDIER_ART=localAsset(soldier);
