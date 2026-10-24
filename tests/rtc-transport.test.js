import test from 'node:test';
import assert from 'node:assert/strict';
import {DataPipe,RemoteTransport,servePeer} from '../src/network/rtc-transport.js';
import {LanWorld} from '../src/network/shared-world.js';
import {createPlayer} from '../src/game.js';
const channels=()=>{const a={readyState:'open',bufferedAmount:0},b={...a};for(const [one,other]of [[a,b],[b,a]]){one.send=value=>queueMicrotask(()=>other.onmessage?.({data:value}));one.close=()=>{if(one.readyState==='closed')return;one.readyState=other.readyState='closed';one.onclose?.();other.onclose?.();};}return [a,b];};
test('reliable data channel carries a large character file and isolates peer commands to their session',async()=>{
 const world=new LanWorld(),p=createPlayer(),id=()=>({id:crypto.randomUUID(),secret:crypto.randomUUID()}),host=await world.join({create:true,player:p,identity:id()}),[a,b]=channels(),server=servePeer(a,world,host.room.id),guest=new RemoteTransport(b);try{const character=createPlayer();character.notes='x'.repeat(350000);const joined=await guest.request('join',{player:character,identity:id()});assert.equal(joined.player.notes.length,350000);await guest.api('/api/action',{token:host.token,action:{type:'chat',text:'guest message'}});assert.equal(world.session(host.token).room.chat.at(-1).from,joined.id);await assert.rejects(guest.request('join',{player:p,identity:id()}),/Join this company first/);const received=[];guest.subscribe(e=>received.push(e));world.tick(.1);await new Promise(r=>setTimeout(r,20));assert.ok(received.some(e=>e.type==='state'));}finally{guest.close();server.close();}
});
test('malformed channel frames close the connection without executing commands',()=>{const [a,b]=channels();let calls=0,closed=false;const pipe=new DataPipe(a,()=>calls++,()=>closed=true);a.onmessage({data:JSON.stringify({id:'bad',index:0,count:999999,part:'x'})});assert.equal(closed,true);assert.equal(calls,0);pipe.close();b.close();});
