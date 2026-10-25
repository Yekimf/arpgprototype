// Town voices react to completed events, never to a quest being accepted or an
// area being entered. This also keeps skipped/out-of-order fights truthful.
export function townStoryFacts(player={}){
  const c=player.campaign,q=player.quests||{},records=c?.records||[],fallen=c?.defeated||[];
  return{campaign:!!c,herd:!!q.herdRewarded||records.includes('field-1-0'),hadrin:fallen.includes('captain-1-0'),levy:records.includes('field-1-1'),oswen:fallen.includes('captain-1-1'),choir:records.includes('field-1-2'),edrin:!!q.scholarRescued||fallen.includes('knight-1')};
}
export function guideQuestStory(player){
  const f=townStoryFacts(player);
  if(!f.campaign)return f.edrin?'Edrin is home, and his place by the fire is occupied again. Speak to him about the marks on any enchanted gear you find.':'Edrin was taken beneath the old monastery. Find the Hollow Warden and bring him home. I have kept his place by the fire.';
  if(!f.herd)return 'Elin got her children out. The flock is still inside the fence. Hadrin has sent risen soldiers to butcher the sheep that feed this refuge. Take the southern lane after the camp gate. You may know the men wearing those old colours. Do what you must, and bring the living through tonight.';
  if(!f.hadrin)return 'Elin’s children ate tonight. Thank you. The seal on those dead men belongs to Captain Hadrin, your old commander at Marchgate. He sends out the patrols. Stop him before we bury another family’s food with its soldiers.';
  if(!f.levy)return 'Hadrin is gone, but the levy still has the seed grain. Three enforcers hold Widow’s Fields for Reeve Oswen. Break their warbands. A farmer cannot eat a promise of next year’s harvest.';
  if(!f.oswen)return 'The farmers can reach their fields again. Oswen still holds the winter stores in the Tithe Granary. The prisoners’ road runs through his yard. Open it before the next convoy leaves.';
  if(!f.choir)return 'The captives from Oswen’s yard heard singing in Blackthorn Hollow. They say the voices continued when the singers stopped breathing. Break the three armed circles. There are people in that hollow who can still be brought home.';
  if(!f.edrin)return 'The choir has fallen silent. Edrin is still held in Aldren’s redoubt. You remember the knight who kept a bridge open until the third bell. Find what is left of that man, if you can. Bring Edrin back alive.';
  return 'Edrin is sleeping by a fire again. Elin is counting sheep instead of graves. We have that much because you came back. Speak to Edrin when you are ready. Today, the people here need a place to live more than another oath.';
}
export function guideQuestLabel(player){
  const f=townStoryFacts(player);
  if(!f.campaign)return f.edrin?'The road ahead':'Edrin’s rescue';
  if(!f.herd)return 'Elin’s last herd';
  if(!f.hadrin)return 'Ruined Marchgate';
  if(!f.levy)return 'Break the levy';
  if(!f.oswen)return 'The tithe granary';
  if(!f.choir)return 'The thorn choir';
  return f.edrin?'The road ahead':'Aldren’s redoubt';
}
export function npcGreeting(player,id){
  const f=townStoryFacts(player);
  if(id==='guide')return f.edrin?'Edrin asked for a blanket, then another for the man beside him. That sounded like him. Come in; there is room by the fire.':f.oswen?'There is flour in the pot today. The children keep asking what changed. I told them someone opened a door.':f.hadrin?'A few people slept through the night. Nobody has done that here for a while. How are you holding up?':f.herd?'Elin came back with mud to her knees and all her children beside her. She asked me to thank you.':'You are one of Alaric’s guard. Sit a moment. There are clean bandages here, and someone who could use your help.';
  if(id==='merchant')return f.edrin?'Edrin has already complained that I wrapped his books in a flour sack. I said the flour had the older claim. Good to see him arguing again.':f.oswen?'I have seen a sack of grain change hands without a soldier taking it. I could get used to that.':f.herd?'Elin offered me wool for the fence wire. Best bargain I have made since the crown changed hands.':'Orrin. Formerly a respectable trader. Presently the owner of everything under this damp piece of canvas. Looking or selling?';
  if(id==='smith')return f.edrin?'Someone brought in a ploughshare this morning. First thing all week that was meant to keep a person alive.':f.hadrin?'Hadrin’s men used to bring their shields here. I know the sound that metal makes when it hits the ground.':'Garran. Put the work on the bench. If it can be mended, I will tell you what it costs. If it cannot, I will tell you that too.';
  if(id==='scholar')return f.edrin?'Leave the latch open, would you? I know it is foolish. I would still prefer it open.':'It is not safe to speak of that here yet.';
  return 'What do you need?';
}
export function npcTalk(player,id){
  const f=townStoryFacts(player);
  if(id==='guide')return f.edrin?'Victory makes a great deal of noise. Afterwards there are bowls to fill and people who cannot sleep. If you want to know what you saved, stay for a meal.':f.oswen?'A woman from the fields brought her own bowl. She had carried it through all of this, though there had been nothing to put in it. She left it with us.':f.hadrin?'You may hear people call them monsters. Let them. Some of us remember the men. I will write their names when you are ready to tell me.':'The first night we counted beds. The second, blankets. Now I count the people who come back after dusk. Stay long enough and you will learn their names.';
  if(id==='merchant')return f.edrin?'The road has a little traffic again. People carrying children, mostly. They ask whether Emberfall is safe. I tell them it is open. That is a promise I can keep.':f.levy?'The farmers are bringing their own carts now. No levy escort. No one reading out how much of their hunger belongs to the crown.':f.oswen?'Oswen is dead. His patrols have not all heard the news. Tell the farmers to keep clear of the levy banners until those enforcers are dealt with.':'The crown calls this a camp of deserters. Odd sort of desertion: wounded guards, children, an old smith who will not leave his anvil. I have seen more dangerous market days.';
  if(id==='smith')return f.edrin?'I have been sharpening weapons because that is what came through the door. Bring me an axe for splitting logs when this is over. I would like to make something useful.':f.hadrin?'I repaired those shields before the men came back wrong. Same rivets. Same dents. You did not forge what was done to them. Neither did I. I keep having to remind myself of that.':'A man at the gate said I ought to make better swords. I asked whether he wanted sharper steel or a better king. He did not have the money for either.';
  if(id==='scholar')return f.edrin?'I wrote down what I could remember before I slept. Dates first. Names second. If we mistake anger for evidence, Vaelor can make liars of the people he has already hurt.':'There are things I cannot tell you without putting someone in danger.';
  return npcGreeting(player,id);
}
const topic=(id,label,text)=>({id,label,text});
export function npcTopics(player,id){
  const f=townStoryFacts(player);
  if(id==='guide')return[
    topic('alaric','What was Alaric like?','He once stopped a levy cart because it held seed grain. The reeve had a stamped order; Alaric had him unload it himself. “Leave the seed,” he said. I remember the farmer laughing when the king climbed up to help.'),
    topic('leave','I was away from the court.','You had leave to visit your family. Leave signed by the king you served. Do not let Vaelor’s men turn that into desertion. You came back when you could. There is enough work for the hands we have.'),
    topic('neighbours','Who still needs help?',guideQuestStory(player)),
  ];
  if(id==='merchant')return[
    topic('trade','How is trade holding up?',f.oswen?'A few farmers have something left to trade. I am not saying the road is safe. I am saying it leads to people again. That is a beginning.':'I sell what people can use and buy what they can carry. Ordinary gear needs no scholar’s blessing. Enchanted things are another matter: keep a scroll handy, or ask Edrin when he comes home.'),
    topic('notices','The crown calls us deserters.',f.hadrin?'Those orders Hadrin carried were dated before Alaric died. A remarkably punctual rebellion, ours. Keep that detail. Someday a man with a clean desk will ask why we did not obey.':'The notices say the roads are secure and the granaries full. I would frame one, but I have been using the paper to start fires. At last, a royal order that warms somebody.'),
    topic('staying','Why stay in Emberfall?','My wagon lost a wheel. Then someone needed the canvas for a roof, and someone else needed the boards for a bed. By the time I could have fixed it, I seemed to have opened a shop.'),
  ];
  if(id==='smith')return[
    topic('steel','Can this old steel be mended?','Usually. Repair the wear before it fails you. Tempering improves the base metal; reforging changes an enchantment, and the new mark can be worse. I can do the work. I cannot promise you will like what a stranger wrote into it.'),
    topic('knight','You remember Sir Aldren?',f.edrin?'He held that bridge until the third bell. The last cart had children sleeping beneath its sacks. Whatever stood in the redoubt, that is the man I will remember.':'At the old bridge, Aldren ordered us to leave the wagons behind. Then he saw children under the sacks. Held the crossing until the third bell. Never mentioned it when the officers handed out honours.'),
    topic('staying','Why keep the forge burning?','A cold forge takes time to wake. People come here with one pan, one knife, one bent nail they have kept all the way from home. I am not going to tell them to wait until I feel hopeful.'),
  ];
  if(id==='scholar'&&f.edrin)return[
    topic('witness','What did you actually see?',f.hadrin?'I did not see Alaric die. I saw the stranger beside Aldren after the new coronation. I saw the first binding take hold. Hadrin’s dated orders are a different piece of the account. We must keep those things separate.':'I did not see Alaric die. I saw the stranger beside Aldren after the new coronation. I saw the first binding take hold. I can testify to that much. Anything beyond it is something we still have to prove.'),
    topic('binding','What held the dead soldiers?',f.choir?'In the redoubt, each chant ended with a prisoner losing breath. A dead soldier would move again. When you broke the choir, the guards faltered. I cannot yet name the bargain. I can tell you who was made to pay for it.':'In the redoubt, each chant ended with a prisoner losing breath. A dead soldier would move again. If the choir is still singing in the hollow, those people are still paying for the army. We cannot leave them there.'),
    topic('names','Why did Aldren keep you alive?','He wanted the names of the families who hid Alaric’s guards. I recited old tax rolls instead. He knew I was lying. Each day he gave me another chance to be useful. Please let me do something useful now.'),
  ];
  return [];
}
