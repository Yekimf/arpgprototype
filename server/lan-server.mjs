import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {networkInterfaces} from 'node:os';
import {LanWorld} from './lan-world.mjs';
export async function createLanServer({port=8787,host='0.0.0.0',file=resolve('.lan-data/characters.json'),gameFile=resolve(dirname(fileURLToPath(import.meta.url)),'../forgotten-kingdom.html')}={}){
 const world=await new LanWorld({file}).load();
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const url=new URL(req.url,'http://localhost');
  try{
   if(req.method==='GET'&&url.pathname==='/api/lan'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({protocol:1,rooms:world.list(),addresses:addresses(server.address()?.port||port)}));return;}
   if(req.method==='GET'&&url.pathname==='/api/events'){
    const s=world.session(url.searchParams.get('token'));res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');
    const off=world.on(s.token,event=>{if(res.writableLength>1500000){res.end();return;}res.write('data: '+JSON.stringify(event)+'\n\n');});req.on('close',off);res.write('data: '+JSON.stringify(world.snapshot(s))+'\n\n');return;
   }
   if(req.method==='POST'&&['/api/create','/api/join','/api/action'].includes(url.pathname)){
    const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)throw Error('Open the game using this host’s LAN address.');
    let body='',bytes=0;for await(const part of req){bytes+=part.length;if(bytes>2000000){res.writeHead(413);res.end('Request too large');return;}body+=part;}
    const data=JSON.parse(body),run=()=>url.pathname==='/api/action'?world.action(data.token,data.action):world.join({...data,create:url.pathname==='/api/create'});
    const result=await run();res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,result:result??null}));return;
   }
   if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/forgotten-kingdom.html')){const metadata=await stat(gameFile),etag='"'+metadata.size+'-'+metadata.mtimeMs+'"';res.setHeader('ETag',etag);res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Type','text/html; charset=utf-8');if(req.headers['if-none-match']===etag){res.writeHead(304);res.end();}else res.end(await readFile(gameFile));return;}
   res.writeHead(404);res.end('Not found');
  }catch(error){if(!res.headersSent){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:error.message||'The command failed.'}));}else res.end();}
 });
 const timer=setInterval(()=>{try{world.tick(.1);}catch(e){console.error('LAN simulation:',e.message);}},100);timer.unref();
 await new Promise((ok,no)=>{server.once('error',no);server.listen(port,host,ok);});
 return {server,world,port:server.address().port,close:async()=>{clearInterval(timer);for(const s of world.sessions.values())world.send(s,{type:'session-ended',reason:'The host has stopped. Press P to save and leave.'});server.closeAllConnections();await new Promise(ok=>server.close(ok));await world.persist();}};
}
export function addresses(port){return ['http://localhost:'+port,...Object.values(networkInterfaces()).flat().filter(n=>n.family==='IPv4'&&!n.internal).map(n=>'http://'+n.address+':'+port)];}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=await createLanServer({port:Number(process.env.LAN_PORT)||8787,file:resolve(process.env.LAN_DATA_DIR||'.lan-data','characters.json'),gameFile:resolve(process.env.LAN_GAME_FILE||'forgotten-kingdom.html')});console.log('\nThe Forgotten Kingdom · LAN host\n'+addresses(app.port).join('\n')+'\n\nOpen one of these addresses in a browser. Friends use your Wi-Fi address.\nKeep this terminal open. Press Ctrl+C to stop.\n');
 let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await app.close();process.exit(0);});
}
