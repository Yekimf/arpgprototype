// Narrow, opaque samples inside the painted sleeve/bracer and palm. We texture
// complete limb silhouettes rather than transforming irregular cutout masks.
const samples={
 front:{cloth:[[138,100,14,24],[114,143,10,25]],metal:[[127,100,12,23],[109,139,10,24]],palm:[109,175,17,17]},
 back:{cloth:[[242,103,14,24],[261,145,9,25]],metal:[[235,111,13,22],[254,146,10,23]],palm:[262,178,17,16]},
};
const material={none:['#755e46','#32251d'],leather:['#684b32','#261d16'],chain:['#77776c','#292e2b'],plate:['#8c8877','#292d2b'],original:['#81725a','#2a2721'],robe:['#635b4b','#27231d']};
export function paintLimb(c,guard,{from,to,part,look,back,gloves='none'}){
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),metal=['plate','chain','original'].includes(look),colors=material[look]||material.none;
 const upper=part==='upper',r0=upper?13:10,r1=upper?10:7,source=samples[back?'back':'front'][metal?'metal':'cloth'][upper?0:1];
 c.save();c.translate(from.x,from.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);
 c.beginPath();c.moveTo(-r0,0);c.quadraticCurveTo(-r0-1,-r0,r0,0);c.lineTo(r1,length);c.quadraticCurveTo(0,length+4,-r1,length);c.closePath();c.clip();
 c.fillStyle=colors[1];c.fillRect(-r0-2,-r0,r0*2+4,length+r0+5);
 const custom=Number.isInteger(guard.skin)&&guard.skin>=0,image=custom?guard.setArt:guard.art,sheet=image.naturalWidth/4,index=({none:2,leather:4,chain:6,plate:8,original:0,robe:10})[look]??2;
 // Samples come from the same material sheet, with the back-view sample mirrored
 // where appropriate. Stretching an opaque patch cannot erase an elbow/wrist.
 const cell=custom?guard.skin*2+(back?1:0):index+(back?1:0),sx=cell%4*sheet,sy=Math.floor(cell/4)*sheet;
 c.drawImage(image,sx+source[0],sy+source[1],source[2],source[3],-r0,-5,r0*2,length+10);
 const shade=c.createLinearGradient(-r0,0,r0,0);shade.addColorStop(0,'#0706058c');shade.addColorStop(.38,'#d4b89724');shade.addColorStop(1,'#08060580');c.fillStyle=shade;c.fillRect(-r0,-r0,r0*2,length+r0+5);
 if(!upper&&gloves!=='none'){const cuff=gloves==='steel'?'#77776c':'#594029';c.fillStyle=cuff;c.fillRect(-10,length-18,20,22);c.globalAlpha=.85;const gs=guard.art.naturalWidth/4,gcell=(gloves==='steel'?0:4)+(back?1:0),gx=gcell%4*gs,gy=Math.floor(gcell/4)*gs,patch=samples[back?'back':'front'].metal[1];c.drawImage(guard.art,gx+patch[0],gy+patch[1],patch[2],patch[3],-9,length-18,18,22);c.globalAlpha=1;c.strokeStyle=gloves==='steel'?'#b3a58b99':'#98754c99';c.lineWidth=1.2;c.beginPath();c.moveTo(-8,length-17);c.lineTo(8,length-17);c.stroke();}
 c.restore();
}
export function paintHand(c,guard,{hand,gloves='none',back=false,arm=0,closed=true}){
 const {center,angle}=hand;c.save();c.translate(center.x,center.y);c.rotate(angle);if(arm)c.scale(-1,1);
 // The palm is centred on the measured grip. Its back overlaps the sleeve wrist,
 // while the fingers and thumb wrap over the weapon after it is drawn.
 c.beginPath();c.moveTo(-6,-11);c.lineTo(5,-11);c.quadraticCurveTo(8,-7,8,-2);c.lineTo(9,4);c.quadraticCurveTo(6,11,2,11);c.lineTo(-5,8);c.lineTo(-8,2);c.lineTo(-8,-5);c.closePath();c.clip();
 const metal=gloves==='steel',bare=gloves==='none',dark=bare?'#694a37':metal?'#42463f':'#39291d',light=bare?'#b18b66':metal?'#a6a28c':'#967044';
 c.fillStyle=dark;c.fillRect(-10,-13,22,27);const custom=Number.isInteger(guard.skin)&&guard.skin>=0,image=custom&&!bare?guard.setArt:guard.art,sheet=image.naturalWidth/4;
 if(bare){const p=samples[back?'back':'front'].palm,cell=back?3:2;c.drawImage(guard.art,cell%4*sheet+p[0],Math.floor(cell/4)*sheet+p[1],p[2],p[3],-8,-9,17,21);}
 else{const cell=custom?guard.skin*2+(back?1:0):(metal?0:4)+(back?1:0),p=samples[back?'back':'front'].metal[1];c.drawImage(image,cell%4*sheet+p[0],Math.floor(cell/4)*sheet+p[1],p[2],p[3],-8,-11,17,24);}
 const shade=c.createLinearGradient(-9,-6,9,8);shade.addColorStop(0,'#08050377');shade.addColorStop(.4,'#d6b79422');shade.addColorStop(1,'#09060399');c.fillStyle=shade;c.fillRect(-10,-13,22,27);
 c.strokeStyle=dark;c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-5+i*4,closed?0:3);c.quadraticCurveTo(-4+i*4,closed?4:7,-5+i*4,8);c.stroke();}c.strokeStyle=light;c.globalAlpha=.5;c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-5+i*4,-2);c.lineTo(-3+i*4,-1);c.stroke();}c.globalAlpha=1;c.fillStyle=light;c.beginPath();c.ellipse(5,-1,3.5,6,-.5,0,Math.PI*2);c.fill();c.strokeStyle=dark;c.lineWidth=1;c.stroke();c.restore();
}
