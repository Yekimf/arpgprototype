// Original key poses in the guard painting's coordinate space. These are sampled
// into fixed frames once, then shared by body, gloves, shield and weapon layers.
// Combat timing selects frames; equipment never runs its own animation clock.
export const PLAYER_DIRECTIONS=16;
export const CLIP_FRAMES={idle:1,walk:16,attack:8,punch:6,cast:8};
const smooth=t=>t*t*(3-2*t);
const tracks={
 slash:[[0,0,0,0],[.23,-8,-48,-1.1],[.48,46,-14,.55],[.7,27,8,1],[1,0,0,0]],
 heavy:[[0,0,0,0],[.27,-10,-60,-1.5],[.5,38,-5,.8],[.76,16,15,1.05],[1,0,0,0]],
 thrust:[[0,0,0,0],[.25,-12,5,0],[.5,55,-7,0],[.68,42,-4,0],[1,0,0,0]],
 bow:[[0,0,0,0],[.28,7,-12,0],[.52,10,-16,0],[.68,5,-10,0],[1,0,0,0]],
 crossbow:[[0,0,0,0],[.28,7,-16,0],[.5,12,-17,0],[.67,4,-12,0],[1,0,0,0]],
 cast:[[0,0,0,0],[.28,-8,-28,-.8],[.5,26,-45,-.4],[.7,32,-30,0],[1,0,0,0]],
 punch:[[0,0,0,0],[.23,-7,4,0],[.5,52,-15,0],[.7,24,-3,0],[1,0,0,0]],
};
function sample(track,t){let b=track.findIndex(k=>k[0]>=t);if(b<=0)return track[0].slice(1);const a=track[b-1],next=track[b],u=smooth((t-a[0])/(next[0]-a[0]));return a.slice(1).map((n,i)=>n+(next[i+1]-n)*u);}
export const POSE_FRAMES=Object.fromEntries(Object.entries(tracks).map(([name,track])=>[name,Object.freeze(Array.from({length:name==='punch'?6:8},(_,i)=>Object.freeze(sample(track,i/(name==='punch'?5:7)))))]));
export function weaponMode(look){if(look.weapon==='none')return 'punch';if(['bow','crossbow'].includes(look.weapon))return look.weapon;if(['spear','dagger'].includes(look.weapon))return 'thrust';return look.twoHanded?'heavy':'slash';}
export function animationState(game,look){const attacking=game.attackAnim>0,cast=attacking&&game.animationMode==='cast',action=cast?'cast':attacking?look.weapon==='none'?'punch':'attack':game.moving?'walk':'idle',count=CLIP_FRAMES[action],progress=attacking?Math.max(0,Math.min(1,1-game.attackAnim/(game.attackDuration||.4))):0,frame=attacking?Math.min(count-1,Math.floor(progress*count)):game.moving?Math.floor(game.walkPhase||0)%count:0;return {action,frame,count,mode:cast?'cast':weaponMode(look)};}
export function layerOrder(direction,mode=null){
 if(['bow','crossbow','cast'].includes(mode))return ['legs','offArm','torso','head','accessories','primaryArm','weapon','primaryHand','offHand','shield'];
 const back=direction.back,primaryNear=direction.screen.x>=0;
 const primary=['weapon','primaryArm','primaryHand'],off=['offArm','offHand','shield'];
 // Facing away: both arms can pass behind the coat. At side views the far arm
 // is under the torso and the near arm above it. Hands always cover their grip.
 const rear=back?[...(primaryNear?off:primary),...(primaryNear?primary:off)]:Math.abs(direction.screen.x)>.7?(primaryNear?off:primary):[];
 const front=back?[]:Math.abs(direction.screen.x)>.7?(primaryNear?primary:off):[...primary,...off];
 return ['legs',...rear,'torso','head','accessories',...front];
}
export function poseFrame(face,look,state,heading={x:0,y:1}){
 const mode=state.mode||weaponMode(look),frames=POSE_FRAMES[mode],sampled=state.action==='idle'||state.action==='walk'?[0,0,0]:frames[Math.min(frames.length-1,state.frame)]||frames[0],reach=sampled[0],lift=sampled[1],sweep=sampled[2],dx=heading.x,dy=heading.y*.5,length=Math.hypot(dx,dy)||1,aim={x:dx/length,y:dy/length},back=face.hand[0]>.5;
 const primary={x:face.hand[0]*320+aim.x*reach,y:face.hand[1]*320+aim.y*reach*.55+lift};
 let angle=(look.twoHanded?-.95:back?1:2.12)+sweep;
 const attack=!['idle','walk'].includes(state.action);
 if(attack&&state.frame>0&&state.frame<state.count-1)angle=Math.atan2(aim.y,aim.x)+sweep;
 if(look.twoHanded){primary.x=160+aim.x*reach*.6;primary.y=148+lift+aim.y*reach*.4;}
 let support={x:face.offHand[0]*320,y:face.offHand[1]*320};
 let gripDistance=look.twoHanded?look.weapon==='bow'?0:look.weapon==='crossbow'?25:29:null;
 if(look.twoHanded){support={x:primary.x+Math.cos(angle)*gripDistance,y:primary.y+Math.sin(angle)*gripDistance};if(look.weapon==='bow'){
  // Bow limbs are perpendicular to the shot, with the left wrist holding the
  // riser ahead of the body and the right wrist drawing the string to the chest.
  const draw=attack?Math.abs(lift)*1.3:0;support={x:160+aim.x*65,y:116+aim.y*34};primary.x=face.arm[0]*320+aim.x*(12-draw);primary.y=128+aim.y*(10-draw);angle=Math.atan2(aim.y,aim.x)-Math.PI/2;gripDistance=null;
 }}
 if(state.action==='walk'){const phase=state.frame/16*Math.PI*2,shift=Math.sin(phase)*2;primary.y+=shift;if(!look.twoHanded)support.y-=shift;else support.y+=shift;}
 return {primary,support,angle,gripDistance,weaponHand:look.weapon==='bow'?'off':'primary'};
}
