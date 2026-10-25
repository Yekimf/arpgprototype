import {isWalkable,distance} from './game.js';

export function portalLanding(area,at){
 for(const [dx,dy]of [[1.25,0],[0,1.25],[-1.25,0],[0,-1.25],[0,0]])if(isWalkable(area,at.x+dx,at.y+dy,.28))return{x:at.x+dx,y:at.y+dy};
 return {...area.start};
}
export function capturePortalOrigin(game){return{area:game.dungeon,loot:game.loot,position:{x:game.player.x,y:game.player.y},kind:game.dungeon.kind,act:game.act,chapter:game.chapter,seed:game.seed,depth:game.depth};}
export function createPortalLink(origin,town){
 let at={x:town.start.x+5,y:town.start.y};if(!isWalkable(town,at.x,at.y,.3))at=portalLanding(town,town.start);
 return {origin,town,home:at};
}
export function visibleTownPortals(game){
 const link=game.portalLink;if(!link)return [];const markers=[];
 if(game.dungeon===link.origin.area)markers.push({...link.origin.position,side:'field',interaction:'town-portal:field',label:'Portal to Emberfall'});
 if(game.dungeon===link.town)markers.push({...link.home,side:'town',interaction:'town-portal:town',label:'Return through your town portal'});
 // Same-map portals still have two distinct ends, including near Emberfall.
 return markers.filter((p,i)=>!markers.slice(0,i).some(o=>distance(o,p)<.25));
}
export function drawTownPortal(r,portal){
 const c=r.ctx,t=r.settings?.reducedMotion?0:r.time;
 r.ellipse(0,2,31,12,'#020405b0');r.ellipse(0,1,25,9,'#8a9b9b25');
 c.save();c.translate(0,-48);
 const mist=c.createRadialGradient(-3,0,3,0,0,52);mist.addColorStop(0,'#030608');mist.addColorStop(.58,'#101b20ef');mist.addColorStop(.8,'#617c8540');mist.addColorStop(1,'#475c6600');
 c.fillStyle=mist;c.beginPath();c.ellipse(0,0,31,54,0,0,Math.PI*2);c.fill();
 for(let ring=0;ring<3;ring++){
  c.beginPath();for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,w=1+Math.sin(a*9+t*(ring+1))* .035,x=Math.cos(a)*(23+ring*2)*w,y=Math.sin(a)*(44+ring*3)*w;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=['#8fa2a294','#50666a66','#b3b8a542'][ring];c.lineWidth=ring===0?1.4:.8;c.stroke();
 }
 for(let i=0;i<12;i++){const a=i*2.4+t*.55,rad=24+Math.sin(t*1.8+i)*3;c.fillStyle=i%3?'#899e9d80':'#c4c4a799';c.fillRect(Math.cos(a)*rad,Math.sin(a)*46,1,2);}
 c.restore();
}
