export const NEW_SKILLS={iron:[
 {id:'rend',name:'Riven Strike',max:5,req:3,active:true,cost:19,cooldown:0,base:165,step:28,element:'physical',description:'A precise weapon strike deals {v}% damage and tears a wound that bleeds for 3 seconds.'},
 {id:'bulwark',name:'Oathbound Guard',max:5,req:7,active:true,toggle:true,cost:12,reservation:25,cooldown:2,base:8,step:3,description:'Toggle a protective oath. Reserves 25% maximum mana and grants {v}% damage reduction. Two-second lockout after deactivation.'}
],ember:[{id:'focus',name:'Ember Trance',max:5,req:7,active:true,toggle:true,cost:10,reservation:30,cooldown:2,base:15,step:5,description:'Toggle a focused trance. Reserves 30% maximum mana; grants {v}% spell damage and 20% mana regeneration. Two-second lockout after deactivation.'}],aether:[
 {id:'rime',name:'Rime Lance',max:5,req:0,active:true,cost:18,cooldown:0,base:145,step:26,element:'cold',description:'A piercing lance deals {v}% cold damage, chills, and shatters chilled enemies in a small frost burst.'},
 {id:'tempest',name:'Thunder Spear',max:5,req:7,active:true,cost:32,cooldown:0,base:205,step:34,element:'lightning',description:'A fast charged spear deals {v}% lightning damage and shocks enemies, increasing damage they take.'}
]};
const rune=(id,name,description,mods)=>({id,name,description,...mods});
export const SPECIALIZATIONS={
 cleave:[rune('reaping','Reaping Arc','Wider arc; +25% area, 15% more mana.',{area:1.25,cost:1.15}),rune('duelist','Duelist','35% more damage; 25% less area.',{damage:1.35,area:.75}),rune('siphon','Blood Price','Gain 2% attack life leech; costs 20% more mana.',{leech:2,cost:1.2})],
 bolt:[rune('fork','Cinder Fan','Three embers, each at 60% damage; +30% mana cost.',{projectiles:3,damage:.6,cost:1.3}),rune('searing','Searing Brand','Burning deals 100% more damage; hits deal 15% less.',{burn:2,damage:.85}),rune('seeker','Long Wick','Projectiles travel 50% farther and hit 20% harder; +20% mana.',{travel:1.5,damage:1.2,cost:1.2})],
 lance:[rune('fork','Shard Fan','Three shards at 60% damage; +30% mana.',{projectiles:3,damage:.6,cost:1.3}),rune('lance','Long Memory','50% more travel distance and 20% more damage; +20% mana.',{travel:1.5,damage:1.2,cost:1.2}),rune('frugal','Measured Word','25% less mana cost; 12% less damage.',{cost:.75,damage:.88})],
 chain:[rune('relay','Storm Relay','Two extra jumps; 20% more mana.',{chains:2,cost:1.2}),rune('overload','Overload','35% more damage but two fewer jumps.',{damage:1.35,chains:-2}),rune('conduit','Conduit','Gain 1 mana per hit; 10% less damage.',{manaOnHit:1,damage:.9})],
 inferno:[rune('wide','Procession','30% larger radius; 15% less damage.',{area:1.3,damage:.85}),rune('penitent','Penitent Flame','25% less self-burning; 15% less aura damage.',{selfBurn:.75,damage:.85}),rune('zeal','Zealot','35% more aura damage; 25% more self-burning.',{damage:1.35,selfBurn:1.25})]
};
for(const id of ['quake','nova','meteor','whirl','vortex','rend','rime','tempest'])SPECIALIZATIONS[id]??=[rune('expanse','Expanse','25% more area; 15% more mana.',{area:1.25,cost:1.15}),rune('force','Concentrated Force','30% more damage; 20% less area.',{damage:1.3,area:.8}),rune('economy','Discipline','25% less mana cost; 12% less damage.',{cost:.75,damage:.88})];
export function specialization(p,id){return SPECIALIZATIONS[id]?.find(r=>r.id===p.skillMods?.[id])||{};}
export function skillProfile(p,skill,stats){
 const id=skill.id,r=Number(p.skills[id]||0)+(p.skills[id]?Math.min(4,stats.skillRanks||0):0),m=specialization(p,id);
 return {rank:r,cost:Math.max(0,Math.ceil(skill.cost*(m.cost||1)*Math.max(.35,1-(stats.manaCostReduction||0)/100)*(1+Math.max(0,r-1)*.045))),power:(skill.base+Math.max(0,r-1)*skill.step)/100*(m.damage||1),area:(m.area||1)*(1+(stats.area||0)/100),duration:1+(stats.duration||0)/100,projectiles:m.projectiles||1,chains:5+(m.chains||0)+(stats.extraChains||0),burn:m.burn||1,travel:m.travel||1,leech:m.leech||0,manaOnHit:m.manaOnHit||0,cadence:Math.max(.18,(id==='whirl'?1.2:id==='meteor'?.7:.44)/(stats.attackSpeed||1))};
}
export function chooseSpecialization(p,id,runeId){const option=SPECIALIZATIONS[id]?.find(r=>r.id===runeId);if(!option||(p.skills[id]||0)<2)return false;p.skillMods??={};p.skillMods[id]=runeId;return true;}
