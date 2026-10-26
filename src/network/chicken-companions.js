import {BREEDS,HATS,petName} from '../chicken-pets.js';
// The atlas birds face left. Positive isometric screen-X needs a mirrored bird.
export const chickenFacesRight=heading=>Math.cos(Number(heading)||0)-Math.sin(Number(heading)||0)>0;
export function selectedCompanion(player){const s=player.pets,c=s?.roster?.find(c=>c.id===s.active);return c&&!c.trip&&BREEDS.some(b=>b.id===c.breed)?c:null;}
export function followerPose(game){const f=game.chickenFollower;if(!f||f.area!==game.dungeon)return null;return {petId:f.petId,x:f.x,y:f.y,heading:f.heading,gait:f.gait,moving:!!f.moving};}
export function companionView(session){
 const p=session.player,c=selectedCompanion(p),pose=session.companion;if(!c||!pose||pose.petId!==c.id||p.pets.follow===false||p.hp<=0)return null;
 const x=Number(pose.x),y=Number(pose.y);if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x-session.pos.x,y-session.pos.y)>20)return null;
 return {type:'chicken',pet:true,petId:c.id,ownerId:session.id,ownerName:p.name,name:petName(c).slice(0,40),breed:c.breed,level:c.level,hat:HATS.some(h=>h.id===c.hat)?c.hat:null,x,y,heading:Number(pose.heading)||0,gait:Number(pose.gait)||0,moving:!!pose.moving};
}
