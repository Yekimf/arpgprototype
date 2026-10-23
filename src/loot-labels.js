export function placeLootLabels(entries,measure,screen,width,height){
 const labels=[];
 for(const entry of entries){const p=screen(entry.loot.x,entry.loot.y),w=Math.ceil(measure(entry.name))+18,h=21;if(p.x<0||p.x>width||p.y<0||p.y>height)continue;
  const x=Math.max(2,Math.min(width-w-2,p.x-w/2));let y=p.y-57;
  for(let n=0;n<labels.length+1;n++){const collision=labels.find(b=>x<b.x+b.w+3&&x+w>b.x-3&&y<b.y+b.h+2&&y+h>b.y-2);if(!collision)break;y=collision.y-h-3;}
  labels.push({...entry,x,y,w,h});
 }return labels;
}
export const lootLabelAt=(labels,x,y,loot)=>[...labels].reverse().find(b=>loot.includes(b.loot)&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)?.loot;
