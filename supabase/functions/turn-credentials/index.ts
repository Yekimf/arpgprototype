// Optional coturn REST credentials. Set TURN_SHARED_SECRET, TURN_URLS and
// GAME_ORIGINS as Edge Function secrets. Never embed the shared secret in HTML.
Deno.serve(async request=>{
 const origin=request.headers.get('origin')||'',allowed=(Deno.env.get('GAME_ORIGINS')||'').split(',').map(s=>s.trim()),headers={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:'null','Access-Control-Allow-Headers':'authorization,apikey,content-type','Vary':'Origin','Content-Type':'application/json'};
 if(!allowed.includes(origin))return new Response(JSON.stringify({error:'Origin is not allowed'}),{status:403,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return new Response(null,{status:405,headers});
 const response=await fetch(Deno.env.get('SUPABASE_URL')+'/auth/v1/user',{headers:{Authorization:request.headers.get('authorization')||'',apikey:Deno.env.get('SUPABASE_ANON_KEY')||''}});
 if(!response.ok)return new Response(JSON.stringify({error:'Sign in first'}),{status:401,headers});
 const user=await response.json(),secret=Deno.env.get('TURN_SHARED_SECRET'),urls=(Deno.env.get('TURN_URLS')||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!secret||!urls.length)return new Response(JSON.stringify({error:'Relay configuration missing'}),{status:503,headers});
 const username=Math.floor(Date.now()/1000+3600)+':'+user.id,key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']),signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(username)),credential=btoa(String.fromCharCode(...new Uint8Array(signature)));
 return new Response(JSON.stringify({iceServers:[{urls,username,credential}]}),{headers:{...headers,'Cache-Control':'no-store'}});
});
