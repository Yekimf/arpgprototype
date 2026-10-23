import leather from './art/leather.svg?inline';
import world from './art/runtime/world-atlas.webp?inline';
import items from './art/runtime/items-atlas.webp?inline';
import campaign from './art/runtime/campaign-atlas.webp?inline';
import worldmap from './art/runtime/world-map.webp?inline';
import scene1 from './art/runtime/chronicle-1.webp?inline';
import scene2 from './art/runtime/chronicle-2.webp?inline';
import scene3 from './art/runtime/chronicle-3.webp?inline';
import scene4 from './art/runtime/chronicle-4.webp?inline';
import scene5 from './art/runtime/chronicle-5.webp?inline';
import scene6 from './art/runtime/chronicle-6.webp?inline';
// Blob URLs keep atlas references short enough for CSS custom properties while
// retaining all image bytes inside the offline build.
function localAsset(source){
  if(!source.startsWith('data:'))return source;
  const comma=source.indexOf(','),header=source.slice(5,comma);
  if(!header.includes(';base64'))return URL.createObjectURL(new Blob([decodeURIComponent(source.slice(comma+1))],{type:header.split(';')[0]}));
  const binary=atob(source.slice(comma+1)),bytes=new Uint8Array(binary.length);
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

import armorIcons from './art/runtime/armor-icons.webp?inline';
export const ARMOR_ART=localAsset(armorIcons);

import titleLandscape from './art/runtime/title-landscape.webp?inline';
import menuButton from './art/runtime/menu-button.webp?inline';
import menuButtonLit from './art/runtime/menu-button-lit.webp?inline';
export const TITLE_LANDSCAPE=localAsset(titleLandscape);
export const MENU_BUTTON=localAsset(menuButton);
export const MENU_BUTTON_LIT=localAsset(menuButtonLit);

import marchgate from './art/runtime/marchgate.webp?inline';
import questSeals from './art/runtime/quest-seals.webp?inline';
export const MARCHGATE_ART=localAsset(marchgate);
export const QUEST_ART=localAsset(questSeals);

import marchgateInner from './art/runtime/marchgate-inner.webp?inline';
export const MARCHGATE_INNER_ART=localAsset(marchgateInner);

import farm from './art/runtime/farm-atlas.webp?inline';
export const FARM_ART=localAsset(farm);

import forestLife from './art/runtime/forest-life.webp?inline';
export const FOREST_LIFE_ART=localAsset(forestLife);

import forestGround from './art/runtime/forest-ground.webp?inline';
export const FOREST_GROUND_ART=localAsset(forestGround);

import weapons from './art/runtime/weapons.webp?inline';
export const WEAPON_ART=localAsset(weapons);

import folioFrame from './art/folio-frame.svg?inline';
import skillFrame from './art/skill-frame.svg?inline';
export const FOLIO_FRAME_ART=localAsset(folioFrame);
export const SKILL_FRAME_ART=localAsset(skillFrame);
import waypointFountain from './art/runtime/waypoint-fountain.webp?inline';
export const WAYPOINT_FOUNTAIN_ART=localAsset(waypointFountain);

import stashChest from './art/runtime/stash-chest.webp?inline';
export const STASH_CHEST_ART=localAsset(stashChest);

import skillPaintings from './art/runtime/skill-paintings.webp?inline';
import equipmentRelief from './art/runtime/equipment-relief.webp?inline';
import menuCrest from './art/runtime/menu-crest.webp?inline';
export const SKILL_PAINTINGS_ART=localAsset(skillPaintings);
export const EQUIPMENT_RELIEF_ART=localAsset(equipmentRelief);
export const MENU_CREST_ART=localAsset(menuCrest);

import equipmentEtchings from './art/runtime/equipment-etchings.webp?inline';
export const EQUIPMENT_ETCHINGS_ART=localAsset(equipmentEtchings);

import chickenArt from './art/runtime/chickens.webp?inline';
export const CHICKEN_ART=localAsset(chickenArt);
