// Accounts are things this character has actually read, in discovery order.
// Unknown save IDs and duplicates never reveal another place's text.
export function discoveredAccounts(player,catalog){
 const known=new Map(catalog.map(record=>[record.id,record])),ids=Array.isArray(player.story?.records)?player.story.records:[];
 return [...new Set(ids)].map(id=>known.get(id)).filter(Boolean);
}
export function accountPage(player,catalog,{id,page=0}={}){
 const entries=discoveredAccounts(player,catalog),selected=entries.findIndex(record=>record.id===id),fallback=Number.isInteger(page)?page:0,index=entries.length?Math.max(0,Math.min(entries.length-1,selected<0?fallback:selected)):0;
 return{entries,index,record:entries[index]||null};
}
export function visibleQuestNarrative(quest){
 if(quest.status==='locked')return{title:'An unopened chapter',objective:'Follow the road beyond your current expedition.',story:'No reliable word has reached Emberfall from this part of the kingdom. The people you meet along the road will tell you what waits there.',aftermath:''};
 return{title:quest.title,objective:quest.done?'The way is open.':quest.objective,story:quest.story,aftermath:quest.aftermath||''};
}
