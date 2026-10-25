import {findSpace,itemSize} from './settlement.js';
export const VENDOR_GRID={width:10,height:10};
export const VENDOR_SUPPLIES=[
 {id:'supply-flask',name:'Life Flask Refill',slot:'supply',supply:'flask',art:14,rarity:'normal',identified:true,width:1,height:2,price:8,description:'Restores 20 charges to your life flask. Applied immediately.'},
 {id:'supply-scroll',name:'Scroll of Insight',slot:'scroll',supply:'scroll',consumable:'identify',quantity:1,rarity:'normal',identified:true,width:1,height:1,price:12,description:'Right click the purchased scroll, then choose an unidentified item.'},
 {id:'supply-crate',name:'Wooden Crate',slot:'supply',supply:'crate',consumable:'chicken-crate',rarity:'normal',identified:true,width:2,height:2,price:18}
];
// Pack copies only: browsing a merchant never changes inventory coordinates or IDs.
export function vendorPages(items,dimensions=VENDOR_GRID){const pages=[[]];for(const item of items){const size=itemSize(item);if(size.w>dimensions.width||size.h>dimensions.height)throw Error('Vendor item exceeds page size');let page=pages.find(p=>findSpace(p,item,dimensions));if(!page){page=[];pages.push(page);}const at=findSpace(page,item,dimensions);page.push({...item,bagX:at.x,bagY:at.y});}return pages;}
