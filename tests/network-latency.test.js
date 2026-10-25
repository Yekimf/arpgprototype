import test from 'node:test';
import assert from 'node:assert/strict';
import {GameplayStream,MovementHistory} from '../src/network/gameplay-stream.js';
import {ConnectionSlots,retrySignal,hasTurnRelay} from '../src/network/connection-retry.js';
import {DataPipe,RemoteTransport,servePeer} from '../src/network/rtc-transport.js';
import {LanWorld} from '../src/network/shared-world.js';
import {createPlayer} from '../src/game.js';
const turn=()=>new Promise(r=>setImmediate(r));
const identity=()=>({id:crypto.randomUUID(),secret:crypto.randomUUID()});
test('slow replies coalesce movement while preserving every hit and cast exactly once',async()=>{
 const sent=[],replies=[],errors=[],stream=new GameplayStream(a=>{sent.push(a);return new Promise(r=>replies.push(r));},e=>errors.push(e));
 stream.update({x:0},[{type:'hit',id:0}]);await turn();for(let i=1;i<=20;i++)stream.update({x:i},[{type:i%2?'hit':'cast',id:i}]);assert.equal(sent.length,1);replies.shift()();await turn();assert.equal(sent.length,2);assert.equal(sent[1].actions[0].x,20);assert.deepEqual(sent.flatMap(p=>p.actions.slice(1).map(a=>a.id)),Array.from({length:21},(_,i)=>i));replies.shift()();await turn();assert.equal(errors.length,0);
 stream.update({x:21});stream.reset();await turn();assert.equal(sent.length,2);
});
test('delayed accepted positions never snap prediction backward; rejected moves correct once',()=>{
 const history=new MovementHistory(),area='wilderness:0',sent=history.sent({x:5,y:5,area}),player={x:12,y:5};assert.equal(history.reconcile({x:5,y:5,area,moveSeq:sent.moveSeq},player,area,()=>true),false);assert.equal(player.x,12);
 const next=history.sent({x:13,y:5,area});player.x=14;assert.equal(history.reconcile({x:12,y:5,area,moveSeq:next.moveSeq},player,area,()=>true),true);assert.equal(player.x,13);history.reconcile({x:12,y:5,area,moveSeq:next.moveSeq},player,area,()=>true);assert.equal(player.x,13);history.reset();history.reconcile({x:0,y:0,area,moveSeq:next.moveSeq},player,area,()=>true);assert.equal(player.x,13);
});
test('backpressure retains only the newest unsent snapshot and prioritizes reliable replies',()=>{
 const sent=[],ch={readyState:'open',bufferedAmount:100000,send:v=>sent.push(JSON.parse(v)),close(){}},pipe=new DataPipe(ch,()=>{});
 try{for(let n=0;n<100;n++)pipe.send({kind:'event',event:{type:'state',stateSeq:n,padding:'x'.repeat(10000)}});pipe.send({kind:'response',id:'join',result:'ready'});assert.equal(pipe.queue.length,2);assert.ok(pipe.bytes<20000);ch.bufferedAmount=0;pipe.flush();const responses=[];let frames=[];for(const f of sent){frames.push(f.part);if(f.index===f.count-1){responses.push(JSON.parse(frames.join('')));frames=[];}}assert.equal(responses[0].kind,'response');assert.equal(responses[1].event.stateSeq,99);}finally{pipe.close();}
});
test('simultaneous ICE and offer creation share one peer, and signalling retries transient failures',async()=>{
 const slots=new ConnectionSlots();let creates=0,resolve;const create=()=>{creates++;return new Promise(r=>resolve=r);};const first=slots.get('join',create),second=slots.get('join',create);await turn();assert.equal(creates,1);const peer={pc:{close(){}}};resolve(peer);assert.equal(await first,peer);assert.equal(await second,peer);
 let tries=0;await retrySignal(async()=>{if(++tries<3)throw Error('Temporary outage');},()=>true,async()=>{});assert.equal(tries,3);assert.equal(hasTurnRelay([{urls:['stun:example','turns:relay:443?transport=tcp']}]),true);assert.equal(hasTurnRelay([{urls:'stun:example'}]),false);
});
test('host acknowledges processed movement and ignores old sequences',async()=>{
 let now=10000;const world=new LanWorld({now:()=>now}),joined=await world.join({create:true,player:createPlayer(),identity:identity()}),s=world.session(joined.token),pos={...s.pos};now+=500;await world.action(joined.token,{type:'move',area:s.area,...pos,hp:100,moveSeq:2});assert.equal(world.snapshot(s).players[0].moveSeq,2);await world.action(joined.token,{type:'move',area:s.area,x:NaN,y:NaN,moveSeq:1});assert.equal(world.snapshot(s).players[0].moveSeq,2);assert.deepEqual(s.pos,pos);
});
test('a channel closing while character validation is pending cannot leave a ghost player',async()=>{
 const world=new LanWorld(),host=await world.join({create:true,player:createPlayer(),identity:identity()});let validate;const channel={readyState:'open',bufferedAmount:0,send(){},close(){this.readyState='closed';this.onclose?.();}},server=servePeer(channel,world,host.room.id,()=>{},{validateJoin:()=>new Promise(r=>validate=r)});
 const value=JSON.stringify({kind:'request',id:'join',path:'join',data:{}});server.receive(JSON.stringify({id:'frame',index:0,count:1,part:value}));assert.ok(validate);server.close();validate({player:createPlayer(),identity:identity()});await turn();assert.equal(world.sessions.size,1);
});
