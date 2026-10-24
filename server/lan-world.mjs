import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {LanWorld as SharedWorld} from '../src/network/shared-world.js';
export {assets,cleanPlayer} from '../src/network/shared-world.js';
// The simulation is shared with browser hosts; only this adapter uses Node.
export class LanWorld extends SharedWorld {
 async load(){if(this.file)try{const s=JSON.parse(await readFile(this.file,'utf8'));if(s.version!==1||!s.characters)throw Error('Unsupported LAN character archive');this.records=s.characters;}catch(e){if(e.code!=='ENOENT')throw e;}return this;}
 async persist(){if(!this.file)return;const data=JSON.stringify({version:1,characters:this.records});this.pendingWrite=this.pendingWrite.catch(()=>{}).then(async()=>{await mkdir(dirname(this.file),{recursive:true});const temp=this.file+'.tmp';await writeFile(temp,data,{mode:0o600});await rename(temp,this.file);});await this.pendingWrite;}
}
