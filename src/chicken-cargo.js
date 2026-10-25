import {ensurePets,petName} from './chicken-pets.js';
import {addToContainer,arrange,itemSize,transferIdentity} from './settlement.js';
import {appraisal} from './economy.js';
export const CHICKEN_CARGO={width:6,height:4};
export const COURIER_SECONDS=30;
export const cargoOf=c=>c.cargo??=[];
const result=(ok,message)=>({ok,message});
export function transferCargo(p,petId,itemId,toChicken){
 const c=ensurePets(p).roster.find(c=>c.id===petId);if(!c)return result(false,'Choose a chicken.');if(c.trip)return result(false,'Your chicken is away on a selling trip.');
 const source=toChicken?p.inventory:cargoOf(c),target=toChicken?cargoOf(c):p.inventory,item=source.find(i=>i.id===itemId);if(!item)return result(false,'That item is no longer here.');
 if(toChicken&&(item.quest||item.favorite))return result(false,'Quest items and keepsakes stay with you.');
 if(!addToContainer(target,transferIdentity(p,item,target),toChicken?CHICKEN_CARGO:undefined))return result(false,toChicken?'The saddlebags are full.':'Your pack is full.');
 source.splice(source.indexOf(item),1);arrange(source,toChicken?undefined:CHICKEN_CARGO);return result(true,toChicken?'Packed for '+petName(c)+'.':'Returned to your pack.');
}
export function cargoQuote(c){const items=cargoOf(c);return {count:items.length,gold:items.reduce((n,i)=>n+appraisal(i),0),blocked:items.some(i=>i.quest||i.favorite),cells:items.reduce((n,i)=>{const s=itemSize(i);return n+s.w*s.h;},0)};}
export function sendChickenToTown(p,petId,now=Date.now()){
 const c=ensurePets(p).roster.find(c=>c.id===petId);if(!c||c.trip)return result(false,'That chicken is unavailable.');const quote=cargoQuote(c);if(!quote.count)return result(false,'Put items in the saddlebags first.');if(quote.blocked)return result(false,'Remove protected items before selling.');
 c.trip={departedAt:now,returnAt:now+COURIER_SECONDS*1000,gold:quote.gold,items:cargoOf(c).map(i=>({...i,price:appraisal(i)}))};c.cargo=[];return result(true,petName(c)+' is taking '+quote.count+' items to Orrin. Back in '+COURIER_SECONDS+' seconds.');
}
// Delete the persisted trip before crediting it: repeated ticks/reloads cannot pay twice.
export function finishChickenTrips(p,now=Date.now()){
 const returned=[];for(const c of ensurePets(p).roster){const trip=c.trip;if(!trip||now<trip.returnAt)continue;delete c.trip;p.gold=(p.gold||0)+trip.gold;p.buyback=[...(trip.items||[]).reverse(),...(p.buyback||[])].slice(0,8);returned.push({id:c.id,name:petName(c),gold:trip.gold});}return returned;
}
