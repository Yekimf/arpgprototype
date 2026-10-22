// The playable survey is surrounded by a visible frontier, not an empty void.
// Boundary edges point outward; gates are separate authored road transitions.
export function frontierEdges(tiles,water=new Set()){
 const edges=[],size=tiles.length;
 for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++)if(tiles[y][x]){
  for(const [dx,dy,axis,ox,oy]of [[0,-1,'x',0,0],[1,0,'y',1,0],[0,1,'x',0,1],[-1,0,'y',0,0]])if(!tiles[y+dy]?.[x+dx]&&!water.has((y+dy)*size+x+dx)){
   // Internal building foundations and camp fences already have physical art.
   const nx=x+dx,ny=y+dy;let exterior=x<5||y<5||x>size-6||y>size-6;
   if(!exterior){exterior=Math.hypot((nx-size/2)/(size*.49),(ny-size/2)/(size*.48))>.91;}
   if(exterior){edges.push({type:'frontier',axis,x:x+ox,y:y+oy,width:1});if(edges.length%9===0&&Math.hypot((nx-size/2)/(size*.49),(ny-size/2)/(size*.48))>1.01)edges.push({type:'building',sprite:7,x:nx+.5+dx*.7,y:ny+.5+dy*.7,width:135,height:185});}
  }
 }
 return edges;
}
