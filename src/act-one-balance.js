// Region strength is independent of loot tier: deeper enemies should not hand
// out weapons that erase the next region's challenge.
export const actOneLevel=(chapter=0,stronghold=false)=>1+Math.max(0,Math.min(2,chapter))*4+(stronghold?2:0);
export const actOneLootLevel=level=>Math.max(1,Math.min(5,Math.ceil(level/2)));
export function encounterXP(enemy,playerLevel){
 const level=enemy.level||1,base=enemy.type==='warden'?150+level*15:enemy.elite?25+level*2:10+level;
 // Revisiting earlier roads remains useful for gear, without power-leveling.
 return Math.max(1,Math.round(base*Math.max(.12,1-Math.max(0,playerLevel-level-1)*.18)));
}
export function balanceActOne(d,chapter,stronghold=false){
 d.areaLevel=actOneLevel(chapter,stronghold);d.lootLevel=actOneLootLevel(d.areaLevel);
 for(const e of d.enemies){
  if(e.actOneBalanced)continue;e.actOneBalanced=true;e.level=d.areaLevel;
  const boss=e.type==='warden',health=boss?[2.3,2.7,3.1][chapter]:1.12+chapter*.16;
  e.hp=e.maxHp=Math.round(e.maxHp*health);e.damage=Math.round(e.damage*(1+chapter*.09));
  if(boss){e.speed=2.7+chapter*.14;e.special=1.6;}
 }
 return d;
}
export function placeActOneVeterans(d,chapter){
 const names=[['The Armoury Gaoler','The Oathless Chaplain'],['The Threshing Master','The Burnt Orchard Watch'],['The Nameless Abbot','The Sepulchre Warden']][chapter];
 const indices=chapter===0?[8,12]:chapter===1?[2,4]:[6,10];
 indices.forEach((index,i)=>{const room=d.rooms[index];if(!room)return;const x=room.x+room.w/2,y=room.y+room.h/2,candidates=d.enemies.filter(e=>e.type!=='warden'&&!e.veteran).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)),e=candidates[0];if(!e)return;e.veteran=true;e.elite=true;e.name=names[i];e.hp=e.maxHp=Math.round(e.maxHp*2);e.damage=Math.round(e.damage*1.15);e.role=i?'hexer':'brute';e.speed=i?2.1:1.9;});
 return d;
}
