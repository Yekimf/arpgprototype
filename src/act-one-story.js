// Authored observations and testimony, separate from quest/reward state. Reading
// an account never grants a key, opens a gate or changes a combat objective.
export function storyStage(player){
  const campaign=player?.campaign||{},quests=player?.quests||{},defeated=campaign.defeated||[],records=campaign.records||[];
  if(quests.scholarRescued||defeated.includes('knight-1'))return 'edrin-home';
  if(records.includes('field-1-2'))return 'choir-silenced';
  if(defeated.includes('captain-1-1'))return 'granary-fallen';
  if(records.includes('field-1-1'))return 'levy-broken';
  if(defeated.includes('captain-1-0'))return 'marchgate-fallen';
  if(records.includes('field-1-0')||quests.herdRewarded)return 'herd-safe';
  return 'arrival';
}

export const STORY_BEATS={
  town:{
    arrival:{id:'town-arrival',speaker:'The Loyalist',text:'Maelin’s lamp is still burning. Boiled linen, wet wool. I have come back to a field hospital.'},
    'herd-safe':{id:'town-herd-safe',speaker:'The Loyalist',text:'There is broth on the fire. Enough for tonight. Elin’s children get to be children for one more evening.'},
    'marchgate-fallen':{id:'town-marchgate-fallen',speaker:'The Loyalist',text:'The northern road is ours again. Hadrin’s name will still be on the mess roll. I do not know what to write beside it.'},
    'levy-broken':{id:'town-levy-broken',speaker:'The Loyalist',text:'I used to bring grain wagons along this road. Now I count the empty places where their drivers ought to be.'},
    'granary-fallen':{id:'town-granary-fallen',speaker:'The Loyalist',text:'There is grain behind us now, and people who can sow it. I still have names to bring home.'},
    'choir-silenced':{id:'town-choir-silenced',speaker:'The Loyalist',text:'That marching count stays in my head. Here I can count the living instead.'},
    'edrin-home':{id:'town-edrin-home',speaker:'The Loyalist',text:'I brought one witness home. The crown is still on Vaelor’s head. Tonight I will learn the names of the people we saved.'},
  },
  areas:[
    {id:'road-kingsroad',chapter:0,kind:'wilderness',speaker:'The Loyalist',text:'The same milestones. The same colours on the road. I ought to know the men beneath them.'},
    {id:'entry-marchgate',chapter:0,kind:'stronghold',speaker:'The Loyalist',text:'Hadrin used to count the wagons through this arch before he let us break ranks. There are no wagons now.'},
    {id:'road-widows',chapter:1,kind:'wilderness',speaker:'The Loyalist',text:'Alaric always left them seed for the next year. Someone has dug up even the hiding places.'},
    {id:'entry-granary',chapter:1,kind:'stronghold',speaker:'The Loyalist',text:'Grain for a whole winter. Outside, they were boiling leather. Oswen knew exactly what he was doing.'},
    {id:'road-blackthorn',chapter:2,kind:'wilderness',speaker:'The Loyalist',text:'I know that marching count. We used to sing it badly enough to make Aldren laugh.'},
    {id:'entry-redoubt',chapter:2,kind:'stronghold',speaker:'The Loyalist',text:'At the third bell he opened his left and let the families through. I will remember that man when I find him.'},
  ],
  pasture:{id:'pasture-recognition',speaker:'The Loyalist',text:'A spoon tied to his belt. We did that when the mess wagons fell behind. He was one of ours.'},
  bosses:{
    'captain-1-0':{
      engage:{id:'hadrin-engage',speaker:'Captain Hadrin',text:'You should have stayed on leave. I struck your name from the roll. Do not make me write it back.',reply:{speaker:'The Loyalist',text:'You taught us to stand between the road and the helpless.'}},
      wounded:{id:'hadrin-wounded',speaker:'Captain Hadrin',text:'I thought the oath could wait until the danger had passed.',reply:{speaker:'The Loyalist',text:'Those men in the pasture were ours.'}},
      death:{id:'hadrin-death',speaker:'Captain Hadrin',text:'Edrin... east with the grain wagons. Vaelor’s order came before the death bell. I told myself the signature made it right.',reply:{speaker:'The Loyalist',text:'Then I will find him.'}},
    },
    'captain-1-1':{
      engage:{id:'oswen-engage',speaker:'Reeve Oswen',text:'A hungry village gives up a man. A starving one gives up a list.',reply:{speaker:'The Loyalist',text:'Alaric left them seed. You took even that.'}},
      wounded:{id:'oswen-wounded',speaker:'Reeve Oswen',text:'The wagons had to keep moving. Aldren wanted them alive.',reply:{speaker:'The Loyalist',text:'You counted their children beside the grain.'}},
      death:{id:'oswen-death',speaker:'Reeve Oswen',text:'Blackthorn... the singing keeps him standing. Edrin would not give them the names.',reply:{speaker:'The Loyalist',text:'There are still people to bring home.'}},
    },
    'knight-1':{
      engage:{id:'aldren-engage',speaker:'Sir Aldren',text:'Third bell. Shields to the left. Hold... hold the line.',reply:{speaker:'The Loyalist',text:'These are the people we held it for, Aldren.'}},
      wounded:{id:'aldren-wounded',speaker:'Sir Aldren',text:'I can still hear them inside the iron. Tell them to be quiet.',reply:{speaker:'The Loyalist',text:'They are calling their names. Listen.'}},
      death:{id:'aldren-death',speaker:'Sir Aldren',text:'Are they through?',reply:{speaker:'The Loyalist',text:'The road is open. Rest, sir.'}},
    },
  },
};

export const STORY_RECORDS=[
  {id:'pasture-post',chapter:0,kind:'wilderness',area:'Elin’s Pasture',anchor:'pasture',title:'Elin’s gatepost',text:'On the inside of the pasture gate, someone has scratched a list: kettle, blanket, two children, the flock. The last words have been crossed out and written again. Below them, in a child’s uneven hand: BRING THEM HOME.'},
  {id:'marchgate-roll',chapter:0,kind:'stronghold',area:'Ruined Marchgate',anchor:'entry',title:'The duty roll',text:'“Third watch: secure granaries and detain named householders.” Signed Vaelor. The order is dated before the mourning seal stamped across it. Beside the absent royal guards, Hadrin has written one word: DESERTER. Your leave was granted by Alaric himself.'},
  {id:'widows-door',chapter:1,kind:'wilderness',area:'Widow’s Fields',anchor:'road',title:'Behind a shutter',text:'Three levy marks have been cut into the wood. Beneath them a hand has written: “We buried no one this winter. They took Tomas breathing. If he comes back in a red coat, do not let him near the children.” A folded scrap in the jamb keeps a few grains of rye dry.'},
  {id:'granary-tally',chapter:1,kind:'stronghold',area:'The Tithe Granary',anchor:'entry',title:'Oswen’s counting board',text:'Two columns: mouths fed, hands supplied. Prisoners are entered under “hands” until delivery, then their names disappear. In an older ink: “His Majesty’s instruction: leave the seed.” Someone has ruled a line through it so hard the board has split.'},
  {id:'hollow-names',chapter:2,kind:'wilderness',area:'Blackthorn Hollow',anchor:'road',title:'Names in a coat lining',text:'Names crowd the lining of a discarded coat. Each is followed by the same few words: “Tell them I am still myself.” The last entry trails into a line of neat marching strokes. One name is Edrin’s; beside it, another prisoner has sewn a small cup.'},
  {id:'aldren-brace',chapter:2,kind:'stronghold',area:'Aldren’s Redoubt',anchor:'boss',title:'Aldren’s shield brace',text:'The armourer’s mark is Garran’s. An old engraving survives beneath the thorns: “At the third bell, open the left.” You remember Aldren turning his shield as the last family cart cleared the ford. A newer instruction has been pinned beside it: “Keep them in until called.”'},
];

export const areaStoryBeat=(chapter,kind)=>STORY_BEATS.areas.find(beat=>beat.chapter===chapter&&beat.kind===kind)||null;
export const bossStoryBeat=(id,phase)=>STORY_BEATS.bosses[id]?.[phase]||null;
export const storyRecordsFor=(chapter,kind)=>STORY_RECORDS.filter(record=>record.chapter===chapter&&record.kind===kind);
