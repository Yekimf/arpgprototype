// Act I follows three regions, each with an approach and a stronghold.
// Entries are [approach, stronghold, captain, field task, recovered account, aftermath].
export const CHAPTERS=[
 [
  ['Kingsroad Wilds','Ruined Marchgate','Captain Hadrin','Save Elin’s sheep from the risen soldiers','Hadrin’s watch roll calls men on Alaric’s approved leave deserters. Vaelor’s levy order is dated before the mourning seal. Edrin’s prison convoy went east with the grain wagons. The order proves preparation; Hadrin’s confession gives it a witness.','Hadrin dies clutching his old badge. You remember the officer who kept the cart road clear for fleeing families. His last words have given you a route to Edrin, and a reason to question every order issued in Vaelor’s name.'],
  ['Widow’s Fields','The Tithe Granary','Reeve Oswen','Defeat the levy enforcers','Oswen’s count puts prisoners and seed grain in the same columns. Food goes to Aldren’s garrison; families are delivered there alive. A prisoner remembers Edrin sharing water on the road into Blackthorn Hollow.','The granary doors are open. Freed families can read the ledger that turned their neighbours into a levy. There is grain to take home, but the wagons north carried people as well. Edrin was still alive when that convoy reached the hollow.'],
  ['Blackthorn Hollow','Aldren’s Redoubt',null,'Silence the Thorn Choir','The choir forces living memories into the marching count that binds Aldren’s dead. Edrin saw the first binding and refused to name other loyalists. To bring him home, silence the chanters and reach the knight inside the redoubt.','Aldren asks whether the wagons got through. You give him the answer he has been waiting for. Edrin returns with the prisoners’ names and an eyewitness account of the binding. He cannot tell you how Alaric died. He can tell you who stood beside Vaelor afterward.'],
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
