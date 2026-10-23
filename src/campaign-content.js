// Act I follows three regions, each with an approach and a stronghold.
// Entries are [approach, stronghold, captain, field task, recovered account, aftermath].
export const CHAPTERS=[
 [
  ['Kingsroad Wilds','Ruined Marchgate','Captain Hadrin','Break the dead Kingsroad patrols','A sealed order names Alaric’s loyal guards as deserters. The signature is Vaelor’s, dated the night before his father died. Edrin has been moved beyond Marchgate.','Hadrin dies with a loyalist badge hidden beneath his breastplate. Fear made an accomplice of him. The prison convoy went east.'],
  ['Widow’s Fields','The Tithe Granary','Reeve Oswen','Defeat the levy enforcers','The tithe ledger lists fields left unplanted, then fines their owners for empty wagons. A margin note diverts the seized grain to Aldren’s garrison.','The grain doors stand open. Families emerge from the drainage ditches to take back their winter stores. One points you toward the prison road.'],
  ['Blackthorn Hollow','Aldren’s Redoubt',null,'Silence the Thorn Choir','Aldren’s chanters bind dead soldiers to the hollow. End their armed circles, then break the knight’s hold on the redoubt. Edrin is still alive inside.','Aldren’s thorns loosen. You free Edrin. His testimony confirms who armed the usurper. Emberfall has its archivist back, and the first knight is at rest.'],
 ],
];
export const chapterFor=(act=1,chapter=0)=>{const entry=CHAPTERS[Math.max(0,Math.min(CHAPTERS.length-1,act-1))][Math.max(0,Math.min(CHAPTERS[Math.max(0,Math.min(CHAPTERS.length-1,act-1))].length-1,chapter))];return {wilds:entry[0],stronghold:entry[1],captain:entry[2],task:entry[3],account:entry[4],aftermath:entry[5],number:chapter+1};};
export const ENEMY_ROSTERS=[
 [{name:'Deserter Spearman',type:'skeleton',role:'guard',tint:'#817452'},{name:'Briar Ravager',type:'crawler',role:'lunge',tint:'#737b49'},{name:'Marchgate Arbalist',type:'wraith',role:'archer',tint:'#9a8060'}],
 [{name:'Drowned Levy',type:'skeleton',role:'brute',tint:'#617976'},{name:'Mirebound Raider',type:'crawler',role:'venom',tint:'#62754a'},{name:'Reed Witch',type:'wraith',role:'hexer',tint:'#7c9790'}],
 [{name:'Furnace Legionary',type:'skeleton',role:'brute',tint:'#a16b4c'},{name:'Cinder Ravager',type:'crawler',role:'lunge',tint:'#a36d42'},{name:'Ash Bombardier',type:'wraith',role:'bomber',tint:'#c28a56'}],
 [{name:'Rimebound Penitent',type:'skeleton',role:'guard',tint:'#909a9c'},{name:'Gravebound Raider',type:'crawler',role:'lunge',tint:'#7e8a93'},{name:'Hollow Cantor',type:'wraith',role:'hexer',tint:'#a6a5b5'}],
 [{name:'Blackglass Praetorian',type:'skeleton',role:'guard',tint:'#8f7967'},{name:'Crown’s Pursuer',type:'crawler',role:'venom',tint:'#85564c'},{name:'Royal Executioner',type:'wraith',role:'archer',tint:'#aa8b6d'}],
];
export function dressEnemy(enemy,act,rng=Math.random){const roster=ENEMY_ROSTERS[act-1],profile=roster[Math.floor(rng()*roster.length)];Object.assign(enemy,profile);enemy.faction=act;enemy.speed=profile.role==='brute'?1.55:profile.role==='lunge'?2.65:profile.role==='archer'?1.8:2.05;enemy.damage*=profile.role==='brute'?1.35:1;return enemy;}

export const lastChapter=act=>(CHAPTERS[act-1]?.length||4)-1;
