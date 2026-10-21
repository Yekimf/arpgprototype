import world from './art/world-atlas.png?inline';
import items from './art/items-atlas.png?inline';
import hero from './art/hero-animation.png?inline';
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
