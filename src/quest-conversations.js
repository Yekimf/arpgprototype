// Spoken accounts belong to the giver; the journal keeps the soldier's account.
const speeches={
 'last-herd':{
  offer:'Elin brought her children here with one blanket between them. The sheep are still penned beyond the southern lane. Six of Hadrin’s risen men are in that pasture, slaughtering the flock. They wear your regiment’s colours. I know what I am asking. But if we lose those sheep, the children will have nothing. Take a little coin and the supplies I can spare. Put those six men to rest, then come back to me.',
  reward:'Elin counted the sheep three times before she believed it. Her children will eat tonight. Here—this is from the families who could spare something. The seal you found belongs to Captain Hadrin. Those men were following orders, and he still has more to send.'
 },
 marchgate:{
  offer:'Captain Hadrin holds Ruined Marchgate, at the far end of the Kingsroad. You knew him before all this. He was the man who counted every refugee wagon through the arch before he let his soldiers rest. Now his patrols drive those same families back. Edrin was taken through his gate in chains. Find Hadrin, stop the raids, and bring me word of the archivist.',
  reward:'An order dated before the death bell. Then Hadrin knew what was coming, and obeyed anyway. I will keep his old badge with the names of our dead. You have opened the road, and earned this. Speak to Orrin now. He knows the farms east of Marchgate and the men who collect their grain.'
 },
 'tithe-enforcers':{
  offer:'I used to buy seed from Widow’s Fields. Now Oswen takes the grain and charges the farmers for the empty sacks. Three commanders enforce his levy: the Famine Collector, the Empty Sickle, and the Widowmaker. Break their warbands so the families can leave their houses. I have marked where each patrol holds the road. Come back when their banners are down.',
  reward:'A farmer brought a cart past the old levy post this morning. No escort, no collector, no one demanding his eldest son as payment. He shook all the way to my stall. Here is your share of what we put aside. Now we can reach Oswen’s yard.'
 },
 'tithe-granary':{
  offer:'Reeve Oswen keeps the winter stores in the Tithe Granary, beyond Widow’s Fields. The grain feeds Aldren’s garrison. The families who cannot meet the levy go north in the same wagons, alive and chained. Edrin travelled that road. Get inside the grain yard and end Oswen’s orders before another convoy leaves. Bring back what you learn.',
  reward:'The survivors say Edrin shared his water on the prison road. Still himself, then. Good. This is for opening the yard; there is food to trade again. The wagons went into Blackthorn Hollow. Garran knew Aldren before the binding. Ask him about that road before you follow it.'
 },
 'hollow-chanters':{
  offer:'I know the marching count you heard. Aldren’s men sang it before the Wanderer put thorns through their armour. Three chanters keep the dead moving in Blackthorn Hollow: the Cantor of the Briar, the Hollow Confessor, and the Rootbound Voice. They are using the prisoners’ voices. Break their armed circles. Then come back—we will speak of the knight himself.',
  reward:'So the choir has stopped. I had begun to hear that count even with the forge ringing. Take this. You have loosened what holds his retainers, but Aldren is still inside the redoubt, giving the same orders. Edrin is still with him.'
 },
 thornbound:{
  offer:'At the old ford, Aldren held his shield to the left until the third bell. Children were sleeping under the sacks on the last cart. Remember that when you go into his redoubt. The Wanderer has made a prison of the man and his armour. Fight through the retinue, free Edrin, and end the order Aldren cannot stop giving. Come back to us alive.',
  reward:'Edrin is by the fire. He asked me to leave the door open. Whatever stood in that redoubt, I will remember the man who held the ford. You have earned this, and more than we can pay. The kingdom is still stolen, but tonight there are people here who would not have seen another morning. Rest. Let that be enough for tonight.'
 }
};
export function questSpeech(quest,phase='offer'){return speeches[quest.id]?.[phase]||(phase==='reward'?quest.after:quest.story);}
