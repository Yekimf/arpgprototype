import {hasTurnRelay} from './connection-retry.js';
import defaults from '../network-config.json' with {type:'json'};
const KEY='forgotten-kingdom-social-v1';
export function displayName(raw){const name=String(raw||'').normalize('NFKC').trim().replace(/\s+/g,' ');if(!/^[\p{L}\p{N}][\p{L}\p{N} _'-]{1,23}$/u.test(name))throw Error('Use 2–24 letters, numbers, spaces, apostrophes or hyphens.');return name;}
export function validateConfig(raw){if(!raw?.supabaseUrl||!raw?.publishableKey)return null;const url=new URL(raw.supabaseUrl),local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);if(url.protocol!=='https:'&&!(local&&url.protocol==='http:'))throw Error('The friends service requires an HTTPS address.');if(/^sb_secret_/.test(raw.publishableKey))throw Error('Use a public publishable key, never a secret key.');try{const body=JSON.parse(atob(raw.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(body.role==='service_role')throw Error('Never put a service-role key in the game.');}catch(e){if(e.message.includes('service-role'))throw e;}const config={...defaults,...raw,supabaseUrl:url.origin};if(config.turnCredentialsUrl&&new URL(config.turnCredentialsUrl).origin!==url.origin)throw Error('The relay credentials endpoint must belong to the friends service.');return config;}
export async function networkConfig(){let config=defaults;if(/^https?:$/.test(location.protocol))try{const r=await fetch(new URL('browser-network.json',location.href),{cache:'no-store',signal:AbortSignal.timeout(4000)});if(r.ok){const hosted=await r.json();if(hosted.supabaseUrl&&hosted.publishableKey)config={...config,...hosted};}}catch{}return validateConfig(config);}
export function accountUsername(raw){const value=String(raw||'').trim().toLowerCase();if(!/^[a-z][a-z0-9_]{2,19}$/.test(value))throw Error('Use 3–20 letters, numbers or underscores; begin with a letter.');return value;}
export function accountPassword(raw){if(typeof raw!=='string'||raw.length<10||raw.length>128)throw Error('Use a password of 10–128 characters.');return raw;}
const accountEmail=name=>accountUsername(name)+'@accounts.forgotten-kingdom.invalid';
export class SocialService {
 constructor(config,{storage=globalThis.localStorage,fetcher=globalThis.fetch.bind(globalThis)}={}){this.config=validateConfig(config);if(!this.config)throw Error('The friends service has not been configured.');this.storage=storage;this.fetcher=fetcher;this.key=KEY+':'+this.config.supabaseUrl;try{this.session=JSON.parse(storage.getItem(this.key));}catch{} }
 persist(){try{this.storage.setItem(this.key,JSON.stringify(this.session));}catch{throw Error('Allow browser storage to keep your display name and friend code.');}}
 async request(path,body,{auth=true,retry=true,method='POST'}={}){if(auth)await this.authenticate();const response=await this.fetcher(this.config.supabaseUrl+path,{method,headers:{apikey:this.config.publishableKey,'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+this.session.access_token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});let result;try{result=response.status===204?null:await response.json();}catch{throw Error('The friends service returned an unreadable response.');}if(response.status===401&&auth&&retry){await this.refresh();return this.request(path,body,{auth,retry:false,method});}if(!response.ok&&result?.code==='PGRST202'&&/account_|online_/.test(path))throw Error('Update Supabase with 002_accounts_online_characters.sql, then reload the game.');if(!response.ok)throw Error(result.msg||result.message||result.error_description||result.error||'The friends service could not complete the request.');return result;}
 async authenticate(){if(this.authenticating)return this.authenticating;this.authenticating=(async()=>{if(!this.session?.refresh_token)throw Error('Sign in with your username and password.');if(!this.session.expires_at||this.session.expires_at*1000<Date.now()+60000)await this.refresh();})().finally(()=>this.authenticating=null);return this.authenticating;}
 setSession(session){if(!session.access_token||!session.refresh_token)throw Error('Account creation needs email confirmations disabled in Supabase. See the account setup guide.');this.session={...session,expires_at:session.expires_at||Math.floor(Date.now()/1000)+(session.expires_in||3600)};this.persist();}
 async signUp(username,password,name){username=accountUsername(username);accountPassword(password);const email=accountEmail(username);let session;if(this.session?.user?.is_anonymous){await this.authenticate();await this.request('/auth/v1/user',{email,password,data:{username}},{method:'PUT'});session=await this.request('/auth/v1/token?grant_type=password',{email,password},{auth:false});}else session=await this.request('/auth/v1/signup',{email,password,data:{username}},{auth:false});this.setSession(session);return this.rpc('account_register',{p_username:username,p_name:displayName(name||username)});}
 async signIn(username,password){username=accountUsername(username);if(!password)throw Error('Enter your password.');const session=await this.request('/auth/v1/token?grant_type=password',{email:accountEmail(username),password},{auth:false});this.setSession(session);return this.rpc('account_register',{p_username:username,p_name:username});}
 account(){return this.rpc('account_info');}
 async signOut(){try{if(this.session)await this.request('/auth/v1/logout?scope=local',{},{});}finally{this.session=null;this.storage.removeItem(this.key);}}
 async changePassword(username,current,next){accountPassword(next);await this.signIn(username,current);return this.request('/auth/v1/user',{password:next},{method:'PUT'});}
 async refresh(){if(this.refreshing)return this.refreshing;this.refreshing=(async()=>{const session=await this.request('/auth/v1/token?grant_type=refresh_token',{refresh_token:this.session.refresh_token},{auth:false});this.session={...session,expires_at:session.expires_at||Math.floor(Date.now()/1000)+(session.expires_in||3600)};this.persist();})().finally(()=>this.refreshing=null);return this.refreshing;}
 rpc(name,args={}){return this.request('/rest/v1/rpc/'+name,args);}
 async register(name){this.profile=await this.rpc('social_register',{p_name:displayName(name)});return this.profile;}
 onlineRoster(){return this.rpc('online_roster');}
 createOnline(name){return this.rpc('online_create',{p_name:displayName(name)});}
 openOnline(id,lease){return this.rpc('online_open',{p_id:id,p_lease:lease});}
 saveOnline(id,lease,revision,save){return this.rpc('online_save',{p_id:id,p_lease:lease,p_revision:revision,p_save:save});}
 releaseOnline(id,lease){return this.rpc('online_release',{p_id:id,p_lease:lease});}
 deleteOnline(id,name){return this.rpc('online_delete',{p_id:id,p_name:name});}
 peerCharacter(request){return this.rpc('online_peer_character',{p_request:request});}
 roster(){return this.rpc('social_roster');}
 heartbeat(hosting=null){return this.rpc('social_heartbeat',{p_hosting:hosting});}
 addFriend(code){return this.rpc('social_add_friend',{p_code:String(code).trim().toUpperCase()});}
 replyFriend(id,accept){return this.rpc('social_reply_friend',{p_id:id,p_accept:accept});}
 removeFriend(id){return this.rpc('social_remove_friend',{p_id:id});}
 requestJoin(host,room,character){return this.rpc('social_request_join',{p_host:host,p_room:room,p_character:character});}
 replyJoin(id,accept){return this.rpc('social_reply_join',{p_id:id,p_accept:accept});}
 cancelJoin(id){return this.rpc('social_cancel_join',{p_id:id});}
 poll(after=0){return this.rpc('social_poll',{p_after:after});}
 signal(id,kind,payload){return this.rpc('social_signal',{p_request:id,p_kind:kind,p_payload:payload});}
 async iceServers(){if(!this.config.turnCredentialsUrl)return this.config.iceServers||[];await this.authenticate();const r=await this.fetcher(this.config.turnCredentialsUrl,{method:'POST',headers:{Authorization:'Bearer '+this.session.access_token,apikey:this.config.publishableKey},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('The connection relay is unavailable. Try again shortly.');const data=await r.json();if(!Array.isArray(data.iceServers)||!hasTurnRelay(data.iceServers))throw Error('The relay returned no TURN servers. Check the Edge Function configuration.');return [...(this.config.iceServers||[]),...data.iceServers];}
}
