// Movement is latest-value data; hits/casts are retained in order. Never queue
// another round trip for every rendered update on a high-latency connection.
export class GameplayStream {
 constructor(send,onError=()=>{}){this.send=send;this.onError=onError;this.reset();}
 reset(){this.generation=(this.generation||0)+1;this.busy=false;this.move=null;this.actions=[];}
 update(move,actions=[]){this.move=move;this.actions.push(...actions);this.flush();}
 flush(){if(this.busy||!this.move)return;const generation=this.generation,actions=[this.move,...this.actions.splice(0,80)];this.move=null;this.busy=true;
  Promise.resolve().then(()=>generation===this.generation?this.send({type:'batch',actions}):undefined).catch(e=>{if(generation===this.generation)this.onError(e);}).finally(()=>{if(generation!==this.generation)return;this.busy=false;this.flush();});
 }
}
// Compare the host to the position it acknowledged, not to the player's newer
// predicted position. Otherwise normal latency looks like a teleport cheat.
export class MovementHistory {
 constructor(){this.sequence=0;this.reset();}
 reset(){this.pending=new Map();this.ack=this.sequence;}
 sent(move){const seq=++this.sequence;this.pending.set(seq,{x:move.x,y:move.y,area:move.area});while(this.pending.size>128)this.pending.delete(this.pending.keys().next().value);return {...move,moveSeq:seq};}
 reconcile(self,player,area,walkable){const seq=self?.moveSeq;if(!Number.isSafeInteger(seq)||seq<=this.ack)return false;this.ack=seq;const sent=this.pending.get(seq);for(const key of this.pending.keys())if(key<=seq)this.pending.delete(key);if(!sent||sent.area!==area||self.area!==area)return false;
  const dx=self.x-sent.x,dy=self.y-sent.y;if(Math.hypot(dx,dy)<.05)return false;const next={x:player.x+dx,y:player.y+dy};Object.assign(player,walkable(next)?next:{x:self.x,y:self.y});return true;
 }
}
