import {writeFile} from 'node:fs/promises';
import {validateConfig} from '../src/network/social-service.js';
const config=validateConfig({supabaseUrl:process.env.FK_SUPABASE_URL,publishableKey:process.env.FK_SUPABASE_PUBLIC_KEY,turnCredentialsUrl:process.env.FK_TURN_CREDENTIALS_URL||'',iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
if(!config)throw Error('Set FK_SUPABASE_URL and FK_SUPABASE_PUBLIC_KEY as repository variables before publishing.');
await writeFile('dist/browser-network.json',JSON.stringify(config,null,2)+'\n');
console.log('Public friends settings written.');
