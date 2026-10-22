import {createPlayer} from '../src/game.js';
// Established equipped character for combat, repairs and equipment regressions.
export function createEquippedPlayer(options={}){
 const p=createPlayer(options);
 Object.assign(p.equipment,{
  armor:{id:'starter-armor',name:'Weathered Hauberk',slot:'armor',rarity:'normal',level:1,armor:3},
  helm:{id:'starter-helm',name:'Worn Sallet',slot:'helm',rarity:'normal',level:1,armor:1,look:'sallet'},
  boots:{id:'starter-greaves',name:'Worn Greaves',slot:'boots',rarity:'normal',level:1,look:'steel'},
  gloves:{id:'starter-gauntlets',name:'Worn Gauntlets',slot:'gloves',rarity:'normal',level:1,look:'steel'}
 });return p;
}
