// Ground footprints, never the canopy or roof. Spatial bins keep movement and
// pathfinding independent of the number of decorative grass/straw sprites.
const caches=new WeakMap(),CELL=4;
const circle=(p,r)=>({x:p.x,y:p.y,rx:r,ry:r});
export function propFootprints(p){
 if(p.passable||p.exit||!Number.isFinite(p.x)||!Number.isFinite(p.y))return [];
 if(p.collision)return [{x:p.x+(p.collision.dx||0),y:p.y+(p.collision.dy||0),...p.collision}];
 if(p.type==='building'){if(p.sprite===7)return [circle(p,.32)];if(p.stash)return [{x:p.x,y:p.y,rx:.45,ry:.35}];if(p.sprite===12)return [circle(p,.4)];return [{x:p.x,y:p.y,rx:1.6,ry:1.25,box:true}];}
 if(p.type==='tree')return [circle(p,.35)];
 if(p.type==='granary-prop'){const shapes=[{rx:2,ry:1.4,box:true},null,{rx:1.25,ry:.7,box:true},{rx:.5,ry:.4},{rx:.8,ry:.45,box:true},{rx:.55,ry:.5},null,{rx:.85,ry:.55,box:true}],shape=shapes[p.granarySprite];if(p.granarySprite===1)return [-1,1].flatMap(dx=>[-1,1].map(dy=>circle({x:p.x+dx*1.6,y:p.y+dy*1.2},.22)));return shape?[{x:p.x,y:p.y,...shape}]:[];}
 if(p.type==='farm-prop'){const sizes={5:.5,7:.55,11:.65,12:1.6,13:1.3,14:.65,15:.55},r=sizes[p.farmSprite];return r?[circle(p,r)]:[];}
 if(['pillar','tomb','brazier','signpost','road-lantern'].includes(p.type))return [circle(p,p.type==='tomb'?.65:p.type==='pillar'?.38:p.type==='brazier'?.25:.17)];
 return [];
}
function index(d){let cache=caches.get(d);if(cache&&cache.props===d.props&&cache.length===d.props.length)return cache;const bins=new Map(),protectedPoints=[d.start,d.portal,d.arrival,d.exitDoor,d.returnGate,d.waypoint,d.townWaypoint,d.supplies,...(d.npcs||[])].filter(Boolean);let count=0;
 for(const p of d.props)for(const f of propFootprints(p)){if(protectedPoints.some(at=>Math.hypot(at.x-f.x,at.y-f.y)<Math.max(f.rx,f.ry)+.7))continue;count++;for(let y=Math.floor((f.y-f.ry)/CELL);y<=Math.floor((f.y+f.ry)/CELL);y++)for(let x=Math.floor((f.x-f.rx)/CELL);x<=Math.floor((f.x+f.rx)/CELL);x++){const key=x+','+y;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(f);}}
 cache={props:d.props,length:d.props.length,bins,count};caches.set(d,cache);return cache;
}
export function enableObjectCollisions(d){d.objectCollisions=true;index(d);const free=(x,y)=>{const r=.25;return !objectBlocks(d,x,y,r)&&[[-r,-r],[r,-r],[-r,r],[r,r]].every(([dx,dy])=>d.tiles[Math.floor(y+dy)]?.[Math.floor(x+dx)]===1);};for(const e of d.enemies||[]){if(free(e.x,e.y))continue;let found=false;for(let r=1;r<=12&&!found;r++)for(let y=-r;y<=r&&!found;y++)for(let x=-r;x<=r;x++){if(Math.abs(x)!==r&&Math.abs(y)!==r)continue;const px=Math.floor(e.x)+.5+x*.5,py=Math.floor(e.y)+.5+y*.5;if(free(px,py)){e.x=px;e.y=py;found=true;break;}}}return d;}
export function objectBlocks(d,x,y,radius){if(!d.objectCollisions||!d.props)return false;const {bins}=index(d),seen=new Set();for(let by=Math.floor((y-radius)/CELL);by<=Math.floor((y+radius)/CELL);by++)for(let bx=Math.floor((x-radius)/CELL);bx<=Math.floor((x+radius)/CELL);bx++)for(const f of bins.get(bx+','+by)||[]){if(seen.has(f))continue;seen.add(f);const dx=Math.abs(x-f.x),dy=Math.abs(y-f.y);if(f.box?(dx<f.rx&&dy<f.ry||Math.hypot(Math.max(0,dx-f.rx),Math.max(0,dy-f.ry))<radius):((dx/(f.rx+radius))**2+(dy/(f.ry+radius))**2<1))return true;}return false;}
