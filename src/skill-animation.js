// Rows are real painted poses, not rotations of a single icon.
export const SKILL_ANIMATIONS={
 firebolt:{sheet:'elements',row:0,anchor:'tip',loop:true},flame:{sheet:'elements',row:1,anchor:'floor',loop:true},fireburst:{sheet:'elements',row:2,anchor:'floor'},
 icebolt:{sheet:'elements',row:3,anchor:'tip',loop:true},frostburst:{sheet:'elements',row:4,anchor:'floor'},vortex:{sheet:'elements',row:5,anchor:'center',loop:true},
 cut:{sheet:'forces',row:0,anchor:'center'},earth:{sheet:'forces',row:1,anchor:'floor'},arc:{sheet:'forces',row:2,anchor:'center',loop:true},
 thunder:{sheet:'forces',row:3,anchor:'floor'},aetherbolt:{sheet:'forces',row:4,anchor:'tip',loop:true},sword:{sheet:'forces',row:5,anchor:'center',loop:true},
 guard:{sheet:'wards',row:0,anchor:'center',loop:true},trance:{sheet:'wards',row:1,anchor:'center',loop:true},steelhit:{sheet:'wards',row:2,anchor:'center'},
 rend:{sheet:'wards',row:3,anchor:'center'},arrow:{sheet:'wards',row:4,anchor:'tip',loop:true},heal:{sheet:'wards',row:5,anchor:'floor',loop:true},
};
export const SKILL_CELL=192,SKILL_FRAMES=6;
export function animationPose(value,{loop=false,reducedMotion=false}={}){
 const n=Number.isFinite(value)?value:0;
 if(reducedMotion)return{frame:2,next:2,blend:0};
 const phase=loop?((n%6)+6)%6:Math.max(0,Math.min(5,n*5));
 const frame=Math.floor(phase);return{frame,next:loop?(frame+1)%6:Math.min(5,frame+1),blend:phase-frame};
}
export function animationBudget(settings={}){return settings.quality==='performance'?100:settings.quality==='high'?300:190;}
export function projectilePainting(b){const element=b.element||(b.kind==='blade'?'physical':b.kind);return{physical:'arrow',fire:'firebolt',cold:'icebolt',aether:'aetherbolt',lightning:'aetherbolt'}[element]||'aetherbolt';}
