// Authenticated short-lived TURN credentials. Provider secrets stay here, never
// in the published game. Supports managed Cloudflare TURN or an existing coturn.
Deno.serve(async request=>{
 const origin=request.headers.get('origin')||'',allowed=(Deno.env.get('GAME_ORIGINS')||'').split(',').map(s=>s.trim()),headers={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowed.includes(origin))return reply({error:'Origin is not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'Use POST'},405);
 try{
  const response=await fetch(Deno.env.get('SUPABASE_URL')+'/auth/v1/user',{headers:{Authorization:request.headers.get('authorization')||'',apikey:Deno.env.get('SUPABASE_ANON_KEY')||''},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return reply({error:'Sign in first'},401);
  const user=await response.json();if(!user.id)return reply({error:'Sign in first'},401);
  const keyId=Deno.env.get('CLOUDFLARE_TURN_KEY_ID'),token=Deno.env.get('CLOUDFLARE_TURN_API_TOKEN');
  if(keyId&&token){
   if(!/^[a-zA-Z0-9_-]+$/.test(keyId))return reply({error:'Invalid relay key ID'},503);
   const result=await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/'+keyId+'/credentials/generate',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({ttl:3600}),signal:AbortSignal.timeout(10000)});
   if(!result.ok)return reply({error:'The relay provider is unavailable'},503);
   const data=await result.json(),iceServers=(Array.isArray(data.iceServers)?data.iceServers:[data.iceServers]).filter(Boolean);
   if(!iceServers.some(s=>(Array.isArray(s.urls)?s.urls:[s.urls]).some(url=>/^turns?:/.test(url||''))&&s.username&&s.credential))return reply({error:'The relay provider returned no TURN servers'},503);
   return reply({iceServers});
  }
  const secret=Deno.env.get('TURN_SHARED_SECRET'),urls=(Deno.env.get('TURN_URLS')||'').split(',').map(s=>s.trim()).filter(s=>/^turns?:/.test(s));
  if(!secret||!urls.length)return reply({error:'Relay configuration missing'},503);
  const username=Math.floor(Date.now()/1000+3600)+':'+user.id,key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']),signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(username)),credential=btoa(String.fromCharCode(...new Uint8Array(signature)));
  return reply({iceServers:[{urls,username,credential}]});
 }catch{return reply({error:'The relay service timed out. Try again shortly.'},503);}
});
