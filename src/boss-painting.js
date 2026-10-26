export const BOSS_ROWS={oath:0,harvest:1,thorns:2};
export const BOSS_MATERIALS={oath:6,harvest:1,thorns:2,flood:3,fire:4,frost:5,king:4,wanderer:7};
export const bossFrame=(progress,reduced=false)=>reduced?2:Math.min(5,Math.floor(Math.max(0,progress)*6));
export function paintedBossAttack(r,e,p,game){
 const art=r.bossArt;if(!art?.frames.complete||!art.frames.naturalWidth)return false;
 if(!['boss-impact','boss-cast','boss-sweep','boss-wave','hostile-ground'].includes(e.type))return false;
 const theme=e.theme||({fire:'harvest',cold:'frost',aether:'wanderer'})[e.element]||'oath',row=BOSS_ROWS[theme],radius=Math.min(320,Math.max(.5,e.radius||2)*48),alpha=e.type==='boss-cast'?.38:e.type==='hostile-ground'?.6:Math.min(1,(1-p)*3),frame=bossFrame(p,game.settings?.reducedMotion),draw=(x,y,width,phase=p)=>{
  if(r.skillArt.used>=r.skillArt.limit)return;r.skillArt.used++;
  art.draw(r.ctx,row??BOSS_MATERIALS[theme]??6,{x,y,width,height:width,alpha,frame:row===undefined?null:bossFrame(phase,game.settings?.reducedMotion)});
 };
 if(e.type==='boss-wave'){const count=game.settings?.quality==='performance'?8:14;for(let i=0;i<count;i++){const angle=i*Math.PI*2/count;draw(Math.cos(angle)*radius*p,Math.sin(angle)*radius*p*.5,85+(i%3)*9);}return true;}
 if(e.type==='boss-sweep'){const v=r.iso(e.dx||1,e.dy||0),angle=Math.atan2(v.y*2,v.x),arc=e.arc||Math.PI*.72;for(let i=0;i<7;i++){const a=angle-arc/2+arc*i/6,phase=Math.max(0,Math.min(1,p*1.35-i*.06));draw(Math.cos(a)*radius*.75,Math.sin(a)*radius*.375,Math.min(160,radius*.85),phase);}return true;}
 if(e.type==='hostile-ground'){draw(0,0,Math.min(180,radius*1.5),.65+Math.sin(r.time*3)*.08);return true;}
 draw(0,6,Math.min(310,radius*2));return true;
}
