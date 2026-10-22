// Telegraphs and projectiles are planned in world space; the same pattern powers
// combat and the encounter description. Phase two adds pressure without hiding cues.
export const BOSS_MOVES={harvest:['Threshing sweep','Burning chaff'],thorns:['Briar volley','Root snare'],flood:['Drowning pools','Undertow'],fire:['Siege barrage','Furnace wake'],frost:['Frozen choir','Rime prison'],oath:['Spear of duty','Last charge'],king:['Royal decree','The king’s guard'],wanderer:['Blackglass orbit','The broken bargain']};
export function bossPlan(boss,target,beat=0){
 const type=boss.phaseType||'oath',phase=boss.hp/boss.maxHp<.5?2:1,angle=Math.atan2(target.y-boss.y,target.x-boss.x),commands=[];
 const shot=(a,element='physical',speed=3.3)=>commands.push({kind:'shot',x:boss.x,y:boss.y,dx:Math.cos(a),dy:Math.sin(a),element,speed,life:3,damage:boss.damage*.8});
 const mark=(x,y,radius=1.2,element='physical',delay=1)=>commands.push({kind:'mark',x,y,radius,element,delay,damage:boss.damage*(phase===2?1.3:1)});
 if(type==='thorns'){if(beat%2===0)for(let i=-phase;i<=phase;i++)shot(angle+i*.24);else{for(let i=0;i<phase+2;i++)mark(target.x+(i-1)*1.7,target.y,1.05,'physical',1.25);}}
 if(type==='harvest'){if(beat%2===0){for(let i=-phase;i<=phase;i++)shot(angle+i*.28,'physical',5.5);for(let i=1;i<=3;i++)mark(boss.x+Math.cos(angle)*i,boss.y+Math.sin(angle)*i,1.05,'physical',.75+i*.12);}else for(let i=0;i<phase+2;i++)mark(target.x+(i-1)*1.5,target.y+(i%2)*1.2,1.35,'fire',.95);}
 if(type==='flood'){if(beat%2===0){for(let i=0;i<phase+2;i++)mark(target.x+Math.cos(i*2.1)*1.4,target.y+Math.sin(i*2.1)*1.4,1.4,'cold',1.25);}else for(let i=0;i<6+phase*2;i++)shot(i*Math.PI/(3+phase),'cold',2.8);}
 if(type==='fire'){for(let i=0;i<phase+2;i++)mark(target.x+(i-1)*1.6,target.y+(i%2)*1.5,1.15,'fire',1.1);if(beat%2)for(let i=1;i<=4;i++)mark(boss.x+Math.cos(angle)*i,boss.y+Math.sin(angle)*i,.8,'fire',.7+i*.18);}
 if(type==='frost'){if(beat%2===0)for(let i=0;i<8+phase*2;i++)shot(i*2*Math.PI/(8+phase*2),'cold',2.6);else for(let i=0;i<6;i++)mark(target.x+Math.cos(i*Math.PI/3)*2,target.y+Math.sin(i*Math.PI/3)*2,.85,'cold',1.3);}
 if(type==='oath'){for(let i=1;i<=4+phase;i++)mark(boss.x+Math.cos(angle)*i,boss.y+Math.sin(angle)*i,.85,'physical',.9);if(beat%2)commands.push({kind:'charge',dx:Math.cos(angle),dy:Math.sin(angle)});}
 if(type==='king'){for(let i=-phase;i<=phase;i++)shot(angle+i*.22,'fire',3.7);mark(target.x,target.y,1.7,'fire',1.3);if(phase===2&&!boss.summoned)commands.push({kind:'summon'});}
 if(type==='wanderer'){for(let i=0;i<8+phase*4;i++)shot(i*2*Math.PI/(8+phase*4)+beat*.2,'aether',3.4);mark(target.x,target.y,1.5,'aether',1.3);if(beat%2)commands.push({kind:'blink',x:target.x-Math.cos(angle)*4,y:target.y-Math.sin(angle)*4});}
 return {name:BOSS_MOVES[type]?.[beat%2]||'Dark oath',phase,commands};
}
