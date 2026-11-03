// Narrow, opaque samples inside the painted sleeve/bracer and palm. We texture
// complete limb silhouettes rather than transforming irregular cutout masks.
const samples={
 front:{cloth:[[138,100,14,24],[114,143,10,25]],metal:[[127,100,12,23],[109,139,10,24]],palm:[109,175,17,17]},
 back:{cloth:[[242,103,14,24],[261,145,9,25]],metal:[[235,111,13,22],[254,146,10,23]],palm:[262,178,17,16]},
};
const material={none:['#755e46','#32251d'],leather:['#684b32','#261d16'],chain:['#77776c','#292e2b'],plate:['#8c8877','#292d2b'],original:['#81725a','#2a2721'],robe:['#635b4b','#27231d']};
// The unarmed source painting has complete sleeves and bracers. Move those
// painted segments with the joints instead of stretching a tiny texture strip
// over a synthetic rectangle. Each mask deliberately overlaps at the elbow.
const naturalArms={
 front:[
  {upper:{from:[145,94],to:[124,132],mask:[[142,87],[158,99],[152,113],[137,139],[120,146],[109,135],[113,119],[127,95]]},lower:{from:[124,132],to:[118,176],mask:[[112,124],[136,127],[135,144],[129,178],[109,183],[105,166]]}},
  {upper:{from:[230,96],to:[251,136],mask:[[219,88],[238,89],[254,112],[263,135],[251,147],[235,137],[226,115]]},lower:{from:[251,136],to:[263,177],mask:[[240,130],[260,126],[270,145],[273,180],[253,185],[245,164]]}},
 ],
 back:[
  {upper:{from:[242,94],to:[263,137],mask:[[230,87],[249,89],[264,113],[274,136],[261,147],[244,136],[235,115]]},lower:{from:[263,137],to:[268,178],mask:[[251,130],[273,128],[280,146],[280,180],[260,185],[251,162]]}},
  {upper:{from:[151,94],to:[137,135],mask:[[141,87],[163,88],[161,110],[152,133],[138,146],[125,136],[132,111]]},lower:{from:[137,135],to:[123,176],mask:[[127,127],[148,129],[146,148],[137,177],[117,182],[110,166]]}},
 ],
};
// The female sleeves have their own silhouette and elbow locations. Translating
// male cutouts clips the outside of her upper arm and leaves holes at the cuff.
const femaleNaturalArms={
 front:[
  {upper:{from:[138,91],to:[127,128],mask:[[133,69],[150,73],[158,94],[151,115],[141,129],[126,135],[116,125],[122,104],[128,83]]},lower:{from:[127,128],to:[107,174],mask:[[116,120],[141,126],[137,143],[119,174],[99,179],[96,168],[104,146],[109,133]]}},
  {upper:{from:[229,92],to:[240,129],mask:[[214,74],[230,68],[239,81],[245,104],[253,121],[251,132],[233,137],[224,119],[219,100]]},lower:{from:[240,129],to:[259,174],mask:[[229,123],[251,121],[259,141],[269,171],[268,179],[249,181],[242,158],[234,143]]}},
 ],
 back:[
  {upper:{from:[214,92],to:[222,130],mask:[[208,73],[223,68],[235,80],[239,99],[245,116],[247,129],[230,139],[217,123],[214,105]]},lower:{from:[222,130],to:[248,174],mask:[[212,122],[235,122],[244,142],[258,169],[256,180],[239,181],[229,161],[217,143]]}},
  {upper:{from:[129,94],to:[114,131],mask:[[127,72],[143,79],[144,101],[135,119],[128,134],[110,140],[100,126],[107,107],[116,86]]},lower:{from:[114,131],to:[98,174],mask:[[102,123],[126,126],[124,145],[110,176],[93,180],[88,170],[94,148],[98,135]]}},
 ],
};
function paintNaturalLimb(c,guard,{from,to,part,back,arm}){
 const source=(guard.sex==='female'?femaleNaturalArms:naturalArms)[back?'back':'front'][arm][part],a=source.from,b=source.to,
  sourceAngle=Math.atan2(b[1]-a[1],b[0]-a[0]),targetAngle=Math.atan2(to.y-from.y,to.x-from.x),
  sourceLength=Math.hypot(b[0]-a[0],b[1]-a[1]),targetLength=Math.hypot(to.x-from.x,to.y-from.y),
  scale=targetLength/sourceLength,image=guard.sex==='female'?guard.femaleArt:guard.art,cell=back?3:2,s=image.naturalWidth/4;
 c.save();c.translate(from.x,from.y);c.rotate(targetAngle-sourceAngle);c.scale(scale,scale);c.translate(-a[0],-a[1]);
 c.beginPath();source.mask.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 c.drawImage(image,cell%4*s,Math.floor(cell/4)*s,s,s,0,0,320,320);c.restore();
}
function paintNaturalCuff(c,guard,{from,to,back,gloves}){
 const length=Math.hypot(to.x-from.x,to.y-from.y),metal=gloves==='steel',image=guard.sex==='female'?guard.femaleArt:guard.art,
  cell=(metal?0:4)+(back?1:0),s=image.naturalWidth/4,p=samples[back?'back':'front'].metal[1];
 c.save();c.translate(from.x,from.y);c.rotate(Math.atan2(to.y-from.y,to.x-from.x)-Math.PI/2);c.translate(0,length-15);
 c.beginPath();c.roundRect(-8,-5,16,19,3);c.clip();c.fillStyle=metal?'#57554d':'#4d3322';c.fillRect(-9,-6,18,21);
 c.drawImage(image,cell%4*s+p[0],Math.floor(cell/4)*s+p[1],p[2],p[3],-8,-5,16,19);
 c.strokeStyle=metal?'#b0a88b':'#9d714b';c.lineWidth=1;c.beginPath();c.moveTo(-7,-3);c.lineTo(7,-3);c.stroke();c.restore();
}
export function paintLimb(c,guard,{from,to,part,look,back,gloves='none',arm=null}){
 if(look==='leather'&&guard.skin==null){
  const index=arm??(back?from.x>190?0:1:from.x<190?0:1);
  paintNaturalLimb(c,guard,{from,to,part,back,arm:index});
  if(part==='lower'&&gloves!=='none')paintNaturalCuff(c,guard,{from,to,back,gloves});
  return;
 }
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),metal=['plate','chain','original'].includes(look),colors=material[look]||material.none;
 const upper=part==='upper',slim=guard.sex==='female'?0.86:1,r0=(upper?13:10)*slim,r1=(upper?10:7)*slim,source=samples[back?'back':'front'][metal?'metal':'cloth'][upper?0:1];
 c.save();c.translate(from.x,from.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);
 c.beginPath();c.moveTo(-r0,0);c.quadraticCurveTo(-r0-1,-r0,r0,0);c.lineTo(r1,length);c.quadraticCurveTo(0,length+4,-r1,length);c.closePath();c.clip();
 c.fillStyle=colors[1];c.fillRect(-r0-2,-r0,r0*2+4,length+r0+5);
 const custom=Number.isInteger(guard.skin)&&guard.skin>=0,image=custom?(guard.sex==='female'?guard.femaleSetArt:guard.setArt):(guard.sex==='female'?guard.femaleArt:guard.art),sheet=image.naturalWidth/4,index=({none:2,leather:4,chain:6,plate:8,original:0,robe:10})[look]??2;
 // Samples come from the same material sheet, with the back-view sample mirrored
 // where appropriate. Stretching an opaque patch cannot erase an elbow/wrist.
 const cell=custom?guard.skin*2+(back?1:0):index+(back?1:0),sx=cell%4*sheet,sy=Math.floor(cell/4)*sheet;
 c.drawImage(image,sx+source[0],sy+source[1],source[2],source[3],-r0,-5,r0*2,length+10);
 const shade=c.createLinearGradient(-r0,0,r0,0);shade.addColorStop(0,'#0706058c');shade.addColorStop(.38,'#d4b89724');shade.addColorStop(1,'#08060580');c.fillStyle=shade;c.fillRect(-r0,-r0,r0*2,length+r0+5);
 if(!upper&&gloves!=='none'){const cuff=gloves==='steel'?'#77776c':'#594029';c.fillStyle=cuff;c.fillRect(-10,length-18,20,22);c.globalAlpha=.85;const patchArt=guard.sex==='female'?guard.femaleArt:guard.art,gs=patchArt.naturalWidth/4,gcell=(gloves==='steel'?0:4)+(back?1:0),gx=gcell%4*gs,gy=Math.floor(gcell/4)*gs,patch=samples[back?'back':'front'].metal[1];c.drawImage(patchArt,gx+patch[0],gy+patch[1],patch[2],patch[3],-9,length-18,18,22);c.globalAlpha=1;c.strokeStyle=gloves==='steel'?'#b3a58b99':'#98754c99';c.lineWidth=1.2;c.beginPath();c.moveTo(-8,length-17);c.lineTo(8,length-17);c.stroke();}
 c.restore();
}
export function paintHand(c,guard,{hand,gloves='none',back=false,arm=0,closed=true}){
 const {center,angle}=hand;c.save();c.translate(center.x,center.y);c.rotate(angle);if(arm)c.scale(-1,1);
 // The palm is centred on the measured grip. Its back overlaps the sleeve wrist,
 // while the fingers and thumb wrap over the weapon after it is drawn.
 c.beginPath();c.moveTo(-6,-11);c.lineTo(5,-11);c.quadraticCurveTo(8,-7,8,-2);c.lineTo(9,4);c.quadraticCurveTo(6,11,2,11);c.lineTo(-5,8);c.lineTo(-8,2);c.lineTo(-8,-5);c.closePath();c.clip();
 const metal=gloves==='steel',bare=gloves==='none',dark=bare?'#694a37':metal?'#42463f':'#39291d',light=bare?'#b18b66':metal?'#a6a28c':'#967044';
 c.fillStyle=dark;c.fillRect(-10,-13,22,27);const custom=Number.isInteger(guard.skin)&&guard.skin>=0,image=custom&&!bare?(guard.sex==='female'?guard.femaleSetArt:guard.setArt):(guard.sex==='female'?guard.femaleArt:guard.art),sheet=image.naturalWidth/4;
 if(bare){const p=samples[back?'back':'front'].palm,cell=back?3:2;c.drawImage(image,cell%4*sheet+p[0],Math.floor(cell/4)*sheet+p[1],p[2],p[3],-8,-9,17,21);}
 else{const cell=custom?guard.skin*2+(back?1:0):(metal?0:4)+(back?1:0),p=samples[back?'back':'front'].metal[1];c.drawImage(image,cell%4*sheet+p[0],Math.floor(cell/4)*sheet+p[1],p[2],p[3],-8,-11,17,24);}
 const shade=c.createLinearGradient(-9,-6,9,8);shade.addColorStop(0,'#08050377');shade.addColorStop(.4,'#d6b79422');shade.addColorStop(1,'#09060399');c.fillStyle=shade;c.fillRect(-10,-13,22,27);
 c.strokeStyle=dark;c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-5+i*4,closed?0:3);c.quadraticCurveTo(-4+i*4,closed?4:7,-5+i*4,8);c.stroke();}c.strokeStyle=light;c.globalAlpha=.5;c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-5+i*4,-2);c.lineTo(-3+i*4,-1);c.stroke();}c.globalAlpha=1;c.fillStyle=light;c.beginPath();c.ellipse(5,-1,3.5,6,-.5,0,Math.PI*2);c.fill();c.strokeStyle=dark;c.lineWidth=1;c.stroke();c.restore();
}
