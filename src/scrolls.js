let serial=0;
export const SCROLL_STACK=20;
export const isInsightScroll=item=>item?.consumable==='identify';
export const scrollQuantity=item=>Math.max(1,Math.floor(Number(item?.quantity)||1));
export const insightCount=player=>(player.inventory||[]).filter(isInsightScroll).reduce((n,i)=>n+scrollQuantity(i),0);
export function makeInsightScroll(quantity=1){return {id:'insight-'+Date.now().toString(36)+'-'+(++serial),name:'Scroll of Insight',slot:'scroll',consumable:'identify',quantity,rarity:'normal',identified:true,width:1,height:1,level:1,description:'Stacks of 20. Right click, then click an unidentified item. You can also drag this scroll onto it.'};}
export function migrateScrolls(player){
 player.inventory??=[];const count=Math.max(0,Math.floor(player.identifyScrolls||0));
 if(count)player.inventory.push({...makeInsightScroll(count),bagX:-1,bagY:-1});delete player.identifyScrolls;
 if(player.scrollInventoryVersion!==2||count)for(const items of [player.inventory,player.stash||[]]){
  const packed=[];for(const item of items){if(!isInsightScroll(item)){packed.push(item);continue;}let left=scrollQuantity(item);
   for(const stack of packed.filter(isInsightScroll)){const n=Math.min(left,SCROLL_STACK-scrollQuantity(stack));stack.quantity=scrollQuantity(stack)+n;left-=n;}
   let first=true;while(left){const n=Math.min(left,SCROLL_STACK);packed.push({...item,id:first?item.id:makeInsightScroll().id,quantity:n,bagX:first?item.bagX:-1,bagY:first?item.bagY:-1});first=false;left-=n;}
  }items.splice(0,items.length,...packed);
 }player.scrollInventoryVersion=2;
}
