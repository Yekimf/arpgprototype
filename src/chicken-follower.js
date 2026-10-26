import {ensurePets,petName} from './chicken-pets.js';
import {findPath,moveEntity,isWalkable} from './game.js';
export function tickChickenFollower(game,dt){
 const p=game.player,s=ensurePets(p),pet=s.roster.find(c=>c.id===s.active),d=game.dungeon;
 if(!pet||pet.trip||s.follow===false||game.frontScreen||p.hp<=0){game.chickenFollower=null;return;}
 let f=game.chickenFollower;if(!f||f.petId!==pet.id||f.area!==d){f=game.chickenFollower={petId:pet.id,area:d,x:p.x,y:p.y,heading:0,gait:0,path:[],repath:0};}
 Object.assign(f,{breed:pet.breed,name:petName(pet),hat:pet.hat,pet:true});f.moving=false;
 if(game.petPaused||game.paused||game.loading)return;
 const gap=Math.hypot(p.x-f.x,p.y-f.y);if(gap>18){f.x=p.x;f.y=p.y;f.path=[];return;}if(gap<1.4){f.path=[];return;}
 f.repath-=dt;if(f.repath<=0){f.repath=.65;f.path=findPath(d,f,p);}
 while(f.path.length&&Math.hypot(f.path[0].x-f.x,f.path[0].y-f.y)<.2)f.path.shift();const target=f.path[0];if(!target)return;
 const dx=target.x-f.x,dy=target.y-f.y,len=Math.hypot(dx,dy),step=Math.min(len,dt*(gap>4?7:4.8)),ox=f.x,oy=f.y;
 moveEntity(d,f,dx/len*step,dy/len*step,.15);const moved=Math.hypot(f.x-ox,f.y-oy);if(moved>.001){f.heading=Math.atan2(dy,dx);f.gait+=moved*7;f.moving=true;}
 if(!isWalkable(d,f.x,f.y,.1)){f.x=p.x;f.y=p.y;f.path=[];}
}
