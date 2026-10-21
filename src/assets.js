import leather from './art/leather.svg?inline';
import world from './art/world-atlas.png?inline';
import items from './art/items-atlas.png?inline';
import campaign from './art/campaign-atlas.png?inline';
import worldmap from './art/world-map.png?inline';
import hero from './art/hero-animation.png?inline';
import walk from './art/hero-walk.png?inline';
import orb from './art/orb-frame.png?inline';
import prologue from './art/prologue.png?inline';
// Blob URLs keep atlas references short enough for CSS custom properties while
// retaining all image bytes inside the offline build.
function localAsset(source){
  if(!source.startsWith('data:'))return source;
  const binary=atob(source.slice(source.indexOf(',')+1)),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
}
export const WORLD_ART=localAsset(world);
export const ITEM_ART=localAsset(items);
export const HERO_ART=localAsset(hero);

export const WALK_ART=localAsset(walk);
export const ORB_ART=localAsset(orb);
export const STORY_ART=localAsset(prologue);
export const LEATHER_ART=leather;
export const CAMPAIGN_ART=localAsset(campaign);
export const MAP_ART=localAsset(worldmap);
