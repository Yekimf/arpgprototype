// Artwork rows describe combat roles rather than tinting one body for every enemy.
export const ENEMY_FAMILIES=[
 {id:'spearman',name:'Undead spearman',row:0,size:126,shadow:13},
 {id:'ravager',name:'Feral raider',row:1,size:96,shadow:14},
 {id:'crossbowman',name:'Undead crossbowman',row:2,size:98,shadow:13},
 {id:'butcher',name:'Levy butcher',row:3,size:112,shadow:18},
 {id:'chanter',name:'Thorn chanter',row:4,size:108,shadow:13},
 {id:'bombardier',name:'Powder bombardier',row:5,size:100,shadow:16},
];
const BY_ID=Object.fromEntries(ENEMY_FAMILIES.map(f=>[f.id,f]));
export function enemyFamily(enemy){
 if(enemy.type==='warden'||enemy.bossId)return null;
 const name=enemy.name||'';
 if(enemy.questId==='tithe-enforcers'||/butcher/i.test(name))return BY_ID.butcher;
 if(/chanter|cantor|confessor|rootbound voice/i.test(name))return BY_ID.chanter;
 const id=({guard:'spearman',brute:'butcher',lunge:'ravager',venom:'ravager',archer:'crossbowman',hexer:'chanter',bomber:'bombardier'})[enemy.role]||({skeleton:'spearman',crawler:'ravager',wraith:'chanter'})[enemy.type]||'spearman';return BY_ID[id];
}
export function enemyPose(enemy,facing,gait,moving){
 const attacking=enemy.attackAnim>0||enemy.windup>0||!!enemy.rangedWindup||!!enemy.charge&&enemy.charge.delay<=0;
 return {frame:attacking?3:moving?[0,1,0,2][Math.floor(gait)%4]:0,back:facing.x+facing.y<0,flip:facing.x-facing.y<0,action:attacking?'attack':moving?'walk':'idle'};
}
