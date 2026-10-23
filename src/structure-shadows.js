// A small cached contact shadow follows the painted lower edge, rather than
// placing an oval under the frontmost point of an isometric building.
export function makeStructureShadow(art,index,width,height){
 const scale=Math.min(1,320/width),w=Math.ceil(width*scale),h=Math.ceil(height*scale),cut=Math.floor(h*.62),pad=4;
 const source=document.createElement('canvas');source.width=w;source.height=h;const c=source.getContext('2d');
 if(index===null)c.drawImage(art,0,0,w,h);
 else{const cell=art.naturalWidth/4;c.drawImage(art,index%4*cell+.8,Math.floor(index/4)*cell+.8,cell-1.6,cell-1.6,0,0,w,h);}
 const pixels=c.getImageData(0,0,w,h).data,mask=document.createElement('canvas');mask.width=w;mask.height=h-cut+4;const mc=mask.getContext('2d');mc.fillStyle='#080604';
 for(let x=0;x<w;x++)for(let y=h-1;y>=cut;y--)if(pixels[(y*w+x)*4+3]>100){mc.fillRect(x,y-cut-1,1,3);break;}
 const canvas=document.createElement('canvas');canvas.width=w+pad*2;canvas.height=mask.height+pad*2;const ctx=canvas.getContext('2d');ctx.globalAlpha=.5;ctx.filter='blur(1.3px)';ctx.drawImage(mask,pad,pad);ctx.filter='none';ctx.globalAlpha=.3;ctx.drawImage(mask,pad,pad);
 return {canvas,scale,cut,pad};
}
