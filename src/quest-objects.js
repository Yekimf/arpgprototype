const RELICS=[
 [['Patrol Orders','orders'],['Tithe Ledger','ledger'],['Convoy Manifest','manifest'],['Spent Signal Ember','brazier']],
 [['Ferrymen’s Chart','chart'],['Parish Death Register','register'],['Sluice Wheel Pin','wheel'],['Morcant’s Last Dispatch','dispatch']],
 [['Conscription Rolls','rolls'],['Casting Mould','mould'],['Dampened Siege Powder','powder'],['Gareth’s Scorched Oath','dispatch']],
 [['Signal Bell Clapper','bell'],['Erased Parish Names','register'],['Ossuary Passage Key','key'],['Broken Choir Tuning Seal','seal']],
 [['Sealed City Warrant','orders'],['Unpaid Soldiers’ Ledger','ledger'],['Alaric’s Broken Signet','signet'],['Broken Gate Binding','reliquary']]
];
export function questRelic(act,chapter){const [name,kind]=RELICS[act-1][chapter];return {id:`quest-${act}-${chapter}`,name,kind,slot:'quest',quest:true,rarity:'normal',identified:true,width:1,height:['wheel','mould','key','seal','signet','bell','brazier'].includes(kind)?1:2,level:1,description:'A recovered account or token of the garrison. Its history is recorded in your quest journal.'};}
export function winterProvisions(){return {id:'quest-winter-provisions',name:'Emberfall’s Winter Provisions',kind:'provisions',slot:'quest',quest:true,rarity:'normal',identified:true,width:2,height:2,level:1,description:'The stolen grain and dried meat. Return these supplies to Sister Maelin.'};}
