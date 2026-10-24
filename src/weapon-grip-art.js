// The hand has two depth layers. The palm/heel sits behind the actual handle;
// individual curled fingers and the opposing thumb pass in front of it.
function palette(gloves){return gloves==='steel'?{dark:'#343a35',mid:'#74776b',light:'#b1ad96'}:gloves==='leather'?{dark:'#342519',mid:'#715136',light:'#a47c4c'}:{dark:'#593d2c',mid:'#997351',light:'#c29b74'};}
function space(c,hand){const g=hand.grip;c.translate(hand.center.x,hand.center.y);c.rotate(g.angle);c.scale(1,g.side);return g;}
function texture(c,guard,back,gloves,x,y,w,h){
 const custom=gloves!=='none'&&Number.isInteger(guard.skin)&&guard.skin>=0,image=custom?guard.setArt:guard.art,cell=custom?guard.skin*2+(back?1:0):(gloves==='none'?2:gloves==='steel'?0:4)+(back?1:0),s=image.naturalWidth/4,p=gloves==='none'?(back?[262,178,17,16]:[109,175,17,17]):back?[254,146,10,23]:[109,139,10,24];
 c.drawImage(image,cell%4*s+p[0],Math.floor(cell/4)*s+p[1],p[2],p[3],x,y,w,h);
}
export function paintGripPalm(c,guard,{hand,gloves='none',back=false}){
 if(!hand.grip)return;const p=palette(gloves);c.save();const g=space(c,hand),wx=g.wristX,wy=g.wristY,len=Math.hypot(wx,wy)||1,nx=-wy/len,ny=wx/len;
 c.beginPath();c.moveTo(wx+nx*5+wx/len*2,wy+ny*5+wy/len*2);c.quadraticCurveTo(-10,8,-7,2);c.quadraticCurveTo(0,-1,7,2);c.quadraticCurveTo(10,7,wx-nx*5+wx/len*2,wy-ny*5+wy/len*2);c.closePath();c.clip();
 c.fillStyle=p.mid;c.fillRect(-17,-5,36,25);texture(c,guard,back,gloves,-11,-3,25,22);
 const shade=c.createLinearGradient(-9,0,10,13);shade.addColorStop(0,'#0b080577');shade.addColorStop(.48,'#dac4a52b');shade.addColorStop(1,'#09070488');c.fillStyle=shade;c.fillRect(-17,-5,36,25);
 c.strokeStyle=p.dark;c.lineWidth=1.7;c.beginPath();c.moveTo(-7,3);c.quadraticCurveTo(0,6,7,3);c.stroke();c.restore();
}
export function paintGripFingers(c,guard,{hand,gloves='none',back=false}){
 if(!hand.grip)return;const p=palette(gloves);c.save();space(c,hand);
 for(const x of [-6,-2.2,2.2,6]){
  c.save();c.beginPath();c.moveTo(x-1.2,5);c.quadraticCurveTo(x-1.55,1,x-1.3,-2.5);c.quadraticCurveTo(x-.9,-4.5,x+.6,-3.7);c.quadraticCurveTo(x+1.5,-2,x+1.2,4.7);c.closePath();c.clip();
  const skin=c.createLinearGradient(0,-4,0,5);skin.addColorStop(0,p.dark);skin.addColorStop(.35,p.light);skin.addColorStop(.7,p.mid);skin.addColorStop(1,p.dark);c.fillStyle=skin;c.fillRect(x-3,-5,6,12);c.globalAlpha=.24;texture(c,guard,back,gloves,x-2,-4,4,10);c.globalAlpha=1;
  c.strokeStyle=gloves==='steel'?'#d2c9ac88':'#d6b08a66';c.lineWidth=.7;c.beginPath();c.moveTo(x-1,-.5);c.lineTo(x+1,-.5);c.stroke();c.restore();
 }
 // Thumb closes from the heel across the first two fingers, rather than a full
 // opaque palm stamp covering the hilt, shaft and crossguard together.
 c.save();c.beginPath();c.moveTo(-8,7);c.quadraticCurveTo(-9,1,-4,-1.8);c.quadraticCurveTo(-2,-3.4,-.9,-.5);c.quadraticCurveTo(-.7,1,-2.5,2.8);c.lineTo(-4,7);c.closePath();c.clip();const thumb=c.createLinearGradient(-8,5,0,-2);thumb.addColorStop(0,p.dark);thumb.addColorStop(.5,p.mid);thumb.addColorStop(.8,p.light);thumb.addColorStop(1,p.mid);c.fillStyle=thumb;c.fillRect(-10,-5,13,15);c.globalAlpha=.2;texture(c,guard,back,gloves,-9,-3,12,13);c.restore();c.restore();
}
