// Ordered reliable messages, split below common SCTP limits. Character imports
// can exceed a megabyte; gameplay snapshots remain small and may be coalesced.
export class DataPipe {
 constructor(channel,onMessage,onClose=()=>{}){this.channel=channel;this.onMessage=onMessage;this.onClose=onClose;this.queue=[];this.parts=new Map();this.bytes=0;channel.binaryType='arraybuffer';channel.onmessage=e=>this.receive(e.data);channel.onclose=()=>this.close(false);channel.onerror=()=>this.close();channel.bufferedAmountLowThreshold=32768;channel.onbufferedamountlow=()=>this.flush();this.timer=setInterval(()=>this.flush(),30);}
 send(packet){
  if(this.closed)throw Error('The host connection closed.');
  const value=JSON.stringify(packet);if(value.length>2000000)throw Error('The network message is too large.');
  const state=packet.kind==='event'&&packet.event?.type==='state';
  // Replace only wholly unsent snapshots. A partially sent packet must finish.
  if(state){const old=this.queue.findIndex(p=>p.state&&p.index===0);if(old>=0){this.bytes-=this.queue[old].size;this.queue.splice(old,1);}}
  const id=crypto.randomUUID(),count=Math.ceil(value.length/2000),frames=[];let size=0;
  for(let i=0;i<count;i++){const frame=JSON.stringify({id,index:i,count,part:value.slice(i*2000,(i+1)*2000)});frames.push(frame);size+=frame.length;}
  const entry={frames,index:0,size,state};
  // Replies, chat and asset transfers should not wait behind an unsent world view.
  const at=!state?this.queue.findIndex(p=>p.state&&p.index===0):-1;if(at>=0)this.queue.splice(at,0,entry);else this.queue.push(entry);this.bytes+=size;
  if(this.bytes>6000000){this.close();throw Error('The connection is too slow to keep up.');}this.flush();
 }
 flush(){if(this.closed||this.channel.readyState!=='open')return;while(this.queue.length&&this.channel.bufferedAmount<65536){const entry=this.queue[0],frame=entry.frames[entry.index++];this.bytes-=frame.length;entry.size-=frame.length;try{this.channel.send(frame);}catch{this.close();return;}if(entry.index===entry.frames.length)this.queue.shift();}for(const [id,p]of this.parts)if(Date.now()-p.at>60000)this.parts.delete(id);}
 receive(raw){try{if(typeof raw!=='string'||raw.length>80000)throw Error();const f=JSON.parse(raw);if(typeof f.id!=='string'||!Number.isInteger(f.index)||!Number.isInteger(f.count)||f.count<1||f.count>1000||f.index<0||f.index>=f.count||typeof f.part!=='string'||f.part.length>12000)throw Error();let p=this.parts.get(f.id);if(!p){if(this.parts.size>=8)throw Error();this.parts.set(f.id,p={at:Date.now(),count:f.count,parts:new Map(),size:0});}if(p.count!==f.count||p.parts.has(f.index))throw Error();p.parts.set(f.index,f.part);p.size+=f.part.length;if(p.size>2000000)throw Error();if(p.parts.size===p.count){this.parts.delete(f.id);const message=JSON.parse(Array.from({length:p.count},(_,i)=>p.parts.get(i)).join(''));this.onMessage(message);}}catch{this.close();}}
 close(closeChannel=true){if(this.closed)return;this.closed=true;clearInterval(this.timer);this.queue=[];this.bytes=0;this.parts.clear();if(closeChannel)this.channel.close();this.onClose();}
}
export class RemoteTransport {
 constructor(channel){this.pending=new Map();this.buffer=[];this.pipe=new DataPipe(channel,p=>{if(p.kind==='response'){const task=this.pending.get(p.id);if(!task)return;clearTimeout(task.timer);this.pending.delete(p.id);p.error?task.reject(Error(p.error)):task.resolve(p.result);}else if(p.kind==='event'){if(this.listener)this.listener(p.event);else{this.buffer.push(p.event);if(this.buffer.length>256)this.buffer.shift();}}},()=>{for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(Error('The host connection ended.'));}this.pending.clear();this.listener?.({type:'session-ended',reason:'The host connection ended. Press P to save and leave.'});this.onClose?.();});}
 request(path,data){return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{this.pending.delete(id);reject(Error('The host did not respond.'));},path==='join'?60000:20000);this.pending.set(id,{resolve,reject,timer});try{this.pipe.send({kind:'request',id,path,data});}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e);}});}
 api(path,data){if(path!=='/api/action')throw Error('Unsupported peer request.');return this.request('action',data.action);}
 subscribe(listener){this.listener=listener;for(const e of this.buffer.splice(0))listener(e);return {close:()=>{this.listener=null;}};}
 close(){this.pipe.close();}
}
export class LocalTransport {
 constructor(world,token){this.world=world;this.token=token;}
 api(path,data){return this.world.action(this.token,data.action);}
 subscribe(listener){const off=this.world.on(this.token,listener);listener(this.world.snapshot(this.world.session(this.token)));return {close:off};}
 close(){}
}
export function servePeer(channel,world,roomId,onClose,{validateJoin}={}){
 let token,joining=false,closed=false;
 const removeSession=()=>{if(token){const session=world.sessions.get(token);if(session)world.enqueue(()=>world.leave(session));}};
 const pipe=new DataPipe(channel,async packet=>{
  if(packet.kind!=='request'||typeof packet.id!=='string')return;
  try{let result;
   if(packet.path==='join'&&!token&&!joining){joining=true;const data=validateJoin?await validateJoin(packet.data):packet.data;if(closed)return;result=await world.join({...data,create:false,roomId});token=result.token;if(closed){removeSession();return;}world.on(token,event=>pipe.send({kind:'event',event}));}
   else if(packet.path==='action'&&token)result=await world.action(token,packet.data);
   else throw Error('Join this company first.');
   pipe.send({kind:'response',id:packet.id,result});
  }catch(e){try{pipe.send({kind:'response',id:packet.id,error:e.message});}catch{}}
 },()=>{closed=true;removeSession();onClose?.();});return pipe;
}
