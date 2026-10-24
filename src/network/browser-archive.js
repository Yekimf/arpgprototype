import {LanWorld} from './shared-world.js';
const database=()=>new Promise((resolve,reject)=>{const request=indexedDB.open('forgotten-kingdom-hosts-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('archives');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('Browser host storage is unavailable. Allow site storage before hosting.'));});
export class BrowserWorld extends LanWorld {
 constructor(owner){super();this.owner=owner;}
 async load(){this.db=await database();this.records=await new Promise((resolve,reject)=>{const r=this.db.transaction('archives').objectStore('archives').get(this.owner);r.onsuccess=()=>resolve(r.result||{});r.onerror=()=>reject(r.error);});return this;}
 async persist(){const records=structuredClone(this.records);this.pendingWrite=this.pendingWrite.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{const tx=this.db.transaction('archives','readwrite');tx.objectStore('archives').put(records,this.owner);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('The host could not save. Free site storage and retry.'));tx.onabort=()=>reject(Error('The host save was interrupted.'));}));await this.pendingWrite;}
 async close(){await this.pendingWrite;this.db?.close();}
}
