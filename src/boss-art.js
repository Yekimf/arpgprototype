import frames from './art/runtime/boss-frames.webp?inline';
import materials from './art/runtime/boss-materials.webp?inline';
export class BossArt {
 constructor(){this.frames=new Image();this.frames.src=frames;this.materials=new Image();this.materials.src=materials;}
 get images(){return [this.frames,this.materials];}
 draw(c,index,{x=0,y=0,width=120,height=width,alpha=1,frame=null}={}){const image=frame===null?this.materials:this.frames,cols=frame===null?4:6,i=frame===null?index:index*6+frame;if(!image.complete||!image.naturalWidth)return false;const before=c.globalAlpha;c.globalAlpha*=alpha;c.drawImage(image,i%cols*256,Math.floor(i/cols)*256,256,256,x-width/2,y-height*.92,width,height);c.globalAlpha=before;return true;}
}
