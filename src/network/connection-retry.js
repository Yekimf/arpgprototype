export const hasTurnRelay=servers=>servers.some(s=>(Array.isArray(s.urls)?s.urls:[s.urls]).some(url=>/^turns?:/i.test(url||'')));
export async function retrySignal(send,alive=()=>true,wait=ms=>new Promise(r=>setTimeout(r,ms))){
 for(let attempt=0;attempt<3;attempt++){if(!alive())return;try{return await send();}catch(error){if(attempt===2)throw error;await wait(500*2**attempt);}}
}
// A candidate and an offer can arrive while TURN credentials are still loading.
// Both callers must receive the same connection, including when creation fails.
export class ConnectionSlots {
 constructor(){this.pending=new Map();this.generation=0;}
 clear(){this.generation++;this.pending.clear();}
 get(id,create){if(this.pending.has(id))return this.pending.get(id);const generation=this.generation;
  const pending=Promise.resolve().then(create).then(peer=>{if(generation!==this.generation){peer.pc.close();throw Error('The connection request was cancelled.');}return peer;}).finally(()=>{if(this.pending.get(id)===pending)this.pending.delete(id);});this.pending.set(id,pending);return pending;
 }
}
