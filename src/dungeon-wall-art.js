// Walls are cached as textured edge panels. Their lower vertices lie exactly
// on the floor boundary. No detached ellipse is painted underneath them.
export function paintDungeonWall(r,o,height){
 const c=r.ctx,dx=o.axis==='x'?34:-34,A={x:-dx/2,y:-8.5},B={x:dx/2,y:8.5},out=o.side==='north'?{x:7,y:-3.5}:o.side==='west'?{x:-7,y:-3.5}:o.side==='south'?{x:-7,y:3.5}:{x:7,y:3.5},crypt=o.theme==='redoubt';
 const face=[[A.x,A.y],[B.x,B.y],[B.x,B.y-height],[A.x,A.y-height]],cap=[[A.x,A.y-height],[B.x,B.y-height],[B.x+out.x,B.y+out.y-height],[A.x+out.x,A.y+out.y-height]];
 const shade=o.axis==='x'?(crypt?'#292c2e77':'#302a2077'):(crypt?'#13191f99':'#211b1399');
 // A narrow contact strip falls onto the walkable floor, directly at its edge.
 r.poly([[A.x,A.y],[B.x,B.y],[B.x-out.x*.7,B.y-out.y*.7+2],[A.x-out.x*.7,A.y-out.y*.7+2]],'#0a090755');
 r.stoneFace(face,shade);
 r.stoneFace([[B.x,B.y],[B.x+out.x,B.y+out.y],[B.x+out.x,B.y+out.y-height],[B.x,B.y-height]],'#161411aa');
 r.stoneFace(cap,crypt?'#9b9b8b22':'#c7b58c22');
 c.save();c.beginPath();face.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 for(let row=0;row<height/14;row++){
  const h=row*14;
  r.line([[A.x,A.y-h],[B.x,B.y-h]],'#08070688',1.2);
  r.line([[A.x,A.y-h-1],[B.x,B.y-h-1]],'#b4aa8a20',.65);
  for(const f of row%2?[.18,.72]:[.45]){const x=A.x+dx*f,y=A.y+17*f;r.line([[x,y-h],[x,y-h-14]],'#100e0b88',1);}
 }
 // Low skirting and an eroded stone cornice join across neighbouring panels.
 r.line([[A.x,A.y-6],[B.x,B.y-6]],'#aaa08b26',1);
 r.line([[A.x,A.y-height+9],[B.x,B.y-height+9]],'#0c0b0999',2);
 if(o.variant===2)r.line([[A.x+dx*.3,A.y+5-height*.6],[A.x+dx*.4,A.y+15-height*.6],[A.x+dx*.32,A.y+24-height*.6]],'#14131088',.8);
 c.restore();r.line(cap.concat([cap[0]]),'#8e88713b',.7);
}
export function drawDungeonDressing(r,o){
 const c=r.ctx;
 if(o.kind==='stores'){r.structureShadow(r.worldArt,13,82,67,12);r.sprite(13,82,67,12);}
 else if(o.kind==='ossuary'){r.structureShadow(r.worldArt,14,99,75,5);r.sprite(14,99,75,5);}
 else if(o.kind==='rack'){
  r.poly([[-27,0],[-24,-58],[-20,-60],[-21,-2]],'#32271c','#15110c');r.poly([[22,2],[20,-55],[24,-54],[28,2]],'#423322','#1b150e');
  r.poly([[-27,-46],[25,-43],[25,-38],[-27,-41]],'#56422c','#22190f');
  for(let i=0;i<3;i++){c.save();c.translate(-16+i*16,-5);c.rotate((i-1)*.12);r.cachedSprite(r.itemArt,i===1?5:4,26,61,0);c.restore();}
 }else if(o.kind==='fallen-arms'){c.save();c.rotate(.7);r.cachedSprite(r.itemArt,13,34,31,3);c.translate(17,3);c.rotate(-.3);r.cachedSprite(r.itemArt,4,24,49,14);c.restore();}
 else if(o.kind==='urns'){
  for(const [x,y,s]of [[-13,0,1],[8,3,.8]]){c.save();c.translate(x,y);c.scale(s,s);r.ellipse(0,0,9,4,'#0a090666');const g=c.createLinearGradient(-10,0,10,0);g.addColorStop(0,'#34312b');g.addColorStop(.4,'#77705d');g.addColorStop(1,'#262520');r.poly([[-6,-25],[6,-25],[10,-19],[8,-3],[3,0],[-6,-2],[-10,-18]],g,'#29251d');r.ellipse(0,-25,6,2,'#1b1914','#6a6250');r.line([[-8,-17],[8,-17]],'#a0937033',1);c.restore();}
 }else if(o.kind==='candles'){
  r.sprite(14,72,48,0);for(const x of [-18,-3,12]){r.line([[x,-24],[x,-35]],'#b0a17b',3);r.ellipse(x,-38,1.4,3.5,'#e3bd73');r.light(x,-37,27,'#dc9c3820');}
 }else{r.debris({type:'rubble',variant:o.variant});c.save();c.translate(13,-3);r.debris({type:'rubble',variant:2});c.restore();}
}
export function drawWallFixture(r,o){
 const c=r.ctx,flip=o.axis==='x'?1:-1;
 c.save();c.translate(0,-62);c.transform(flip,.5,0,1,0,0);
 if(o.kind==='banner'){
  r.line([[-17,-36],[17,-36]],'#73654c',3);r.poly([[-14,-34],[14,-34],[13,21],[5,27],[1,22],[-6,28],[-13,22]],'#4d2820','#231811');
  r.line([[-10,-31],[-9,19]],'#a891593b',1);r.line([[10,-31],[9,18]],'#b5985b38',1);r.line([[0,-25],[0,12]],'#b3a37566',2);r.line([[-7,-13],[7,-13]],'#b3a37566',2);
 }else if(o.kind==='niche'){
  c.beginPath();c.moveTo(-13,25);c.lineTo(-13,-14);c.quadraticCurveTo(0,-40,13,-14);c.lineTo(13,25);c.closePath();c.fillStyle='#131312';c.fill();c.strokeStyle='#77715c';c.lineWidth=3;c.stroke();r.line([[-13,25],[13,25]],'#a39a7944',3);r.ellipse(0,14,4,7,'#7e7966');r.ellipse(0,3,3,3,'#959078');
 }else{r.poly([[-5,-9],[5,-9],[4,9],[-4,9]],'#25231c','#7a6c4e');r.line([[0,0],[0,21],[8,25]],'#494334',3);}
 c.restore();if(o.kind==='sconce'){r.light(8,-38,57,'#d598342d');r.ellipse(8,-38,2.5,7+Math.sin(r.time*9+o.x),'#d9a85a');r.ellipse(8,-37,1,4,'#f1ce85');}
}
