import leather from './art/leather.svg?inline';
import world from './art/runtime/world-atlas.webp?inline';
import items from './art/runtime/items-atlas.webp?inline';
import campaign from './art/runtime/campaign-atlas.webp?inline';
import worldmap from './art/runtime/world-map.webp?inline';
import scene1 from './art/runtime/outline-1.webp?inline';
import scene2 from './art/runtime/outline-2.webp?inline';
import scene3 from './art/runtime/outline-3.webp?inline';
import scene4 from './art/runtime/outline-4.webp?inline';
import scene5 from './art/runtime/outline-5.webp?inline';
import scene6 from './art/runtime/outline-6.webp?inline';
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

export const STORY_SCENES=[scene1,scene2,scene3,scene4,scene5,scene6].map(localAsset);
export const STORY_ART=STORY_SCENES[4];
export const LEATHER_ART=leather;
export const CAMPAIGN_ART=localAsset(campaign);
export const MAP_ART=localAsset(worldmap);

import guard from './art/runtime/guard-equipment.webp?inline';
import original from './art/runtime/guard-combat.webp?inline';
import stone from './art/runtime/inventory-stone.webp?inline';
export const GUARD_ART=localAsset(guard);
export const ORIGINAL_ART=localAsset(original);
export const STONE_ART=localAsset(stone);
