export const ATTRIBUTE_NAMES={might:'Might',dexterity:'Dexterity',vitality:'Vitality',will:'Will'};
export const GEAR_SLOTS=['weapon','armor','helm','shield','gloves','boots','belt','ring','ring2','charm'];
export const effectiveAttributes=p=>Object.fromEntries(Object.keys(ATTRIBUTE_NAMES).map(k=>[k,10+Math.max(0,Number(p.attributes?.[k])||0)]));
const profiles={
 battleaxe:[3,{might:24}], 'iron-staff':[3,{will:16,might:10}],'crystal-wand':[3,{will:16}],'ritual-scepter':[2,{will:14,might:12}],
 sword:[1,{might:10,dexterity:10}],axe:[1,{might:12}],mace:[2,{might:14}],spear:[2,{might:10,dexterity:12}],dagger:[1,{dexterity:12}],greatsword:[3,{might:22,dexterity:12}],warhammer:[4,{might:26}],flail:[2,{might:14,dexterity:12}],staff:[1,{will:12}],wand:[1,{will:12}],bow:[2,{dexterity:16}],crossbow:[3,{might:14,dexterity:16}],
 leather:[1,{might:10}],chain:[3,{might:18}],plate:[5,{might:26,vitality:12}],robe:[1,{will:12}],hood:[1,{will:10}],sallet:[2,{might:12}],greathelm:[4,{might:20}],round:[1,{might:10}],kite:[3,{might:18}],steel:[3,{might:18}],
};
export function gearRequirements(item){
 if(!item||!GEAR_SLOTS.includes(item.slot))return null;
 if(item.requiredStats&&Object.keys(item.requiredStats).length)return {level:Math.max(1,item.requiredLevel||1),stats:{...item.requiredStats}};
 let look=item.look||item.base||'';const name=(item.name||'').toLowerCase();
 if(!look){if(item.slot==='weapon')look=/wand|sceptre/.test(name)?'wand':/staff/.test(name)?'staff':/axe/.test(name)?'axe':/mace|maul/.test(name)?'mace':/spear/.test(name)?'spear':'sword';else if(item.slot==='armor')look=/plate|cuirass/.test(name)?'plate':/mail|hauberk/.test(name)?'chain':/robe|vestment/.test(name)?'robe':'leather';else if(item.slot==='helm')look=/hood/.test(name)?'hood':/great|crown/.test(name)?'greathelm':'sallet';else if(item.slot==='shield')look=/kite/.test(name)?'kite':'round';else if(/steel|iron/.test(name))look='steel';}
 if(['battleaxe','iron-staff','crystal-wand','ritual-scepter'].includes(item.base))look=item.base;
 const defaults={weapon:[1,{might:10}],armor:[1,{might:10}],helm:[1,{might:10}],shield:[1,{might:10}],gloves:[1,{dexterity:10}],boots:[1,{dexterity:10}],belt:[1,{vitality:10}],ring:[1,{dexterity:10}],ring2:[1,{dexterity:10}],charm:[1,{will:10}]};
 const profile=(['weapon','armor','helm','shield'].includes(item.slot)||look==='steel')?profiles[look]||defaults[item.slot]:defaults[item.slot];
 const growth=Math.floor(Math.max(0,(item.level||1)-1)*1.4),stats=Object.fromEntries(Object.entries(profile[1]).map(([k,v])=>[k,v+growth]));
 // The old king issued these to every origin. They remain usable at creation.
 if(/^starter-/.test(item.id||''))return {level:1,stats:{might:10}};
 return {level:Math.max(1,item.requiredLevel||item.level||1,profile[0]),stats};
}
export function withGearRequirements(item){const r=gearRequirements(item);if(r){item.requiredLevel=r.level;item.requiredStats=r.stats;item.requirementsVersion=1;}return item;}
export function requirementChecks(p,item){const r=gearRequirements(item);if(!r)return [];const a=effectiveAttributes(p);return [{key:'level',name:'Level',need:r.level,have:p.level||1,met:(p.level||1)>=r.level},...Object.entries(r.stats).map(([key,need])=>({key,name:ATTRIBUTE_NAMES[key]||key,need,have:a[key]||0,met:(a[key]||0)>=need}))];}
export const canUseGear=(p,item)=>!!gearRequirements(item)&&requirementChecks(p,item).every(r=>r.met);
export function activeEquipment(p){return Object.fromEntries(Object.entries(p.equipment||{}).map(([slot,item])=>{
 const gear=item&&!item.slot?{...item,slot:slot==='ring2'?'ring':slot}:item;
 return [slot,gear&&(gear.slot===slot||slot==='ring2'&&gear.slot==='ring')&&canUseGear(p,gear)&&!(gear.identified===false&&['magic','rare','legendary','set'].includes(gear.rarity))?item:null];
}));}
