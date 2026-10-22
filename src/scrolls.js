let serial=0;
export const isInsightScroll=item=>item?.consumable==='identify';
export const insightCount=player=>(player.inventory||[]).filter(isInsightScroll).length;
export function makeInsightScroll(){return {id:'insight-'+Date.now().toString(36)+'-'+(++serial),name:'Scroll of Insight',slot:'scroll',consumable:'identify',rarity:'normal',identified:true,width:1,height:1,level:1,description:'Right click, then click an unidentified item. You can also drag this scroll onto it.'};}
export function migrateScrolls(player){player.inventory??=[];const count=Math.max(0,Math.floor(player.identifyScrolls||0));for(let i=0;i<count;i++)player.inventory.push({...makeInsightScroll(),bagX:-1,bagY:-1});delete player.identifyScrolls;player.scrollInventoryVersion=1;}
