import {readCharacterFile} from './character-transfer.js';
import {arrange,STASH} from './settlement.js';
const clone=v=>structuredClone(v),FORMAT='forgotten-kingdom-local-archive';
const fingerprint=item=>{const value={...item};delete value.bagX;delete value.bagY;return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))));};
const collisionId=item=>{let hash=2166136261;for(const c of fingerprint(item))hash=Math.imul(hash^c.charCodeAt(0),16777619);return 'archive-item-'+item.id+'-'+(hash>>>0).toString(36);};
const uuid=()=>globalThis.crypto?.randomUUID?.()||'import-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export function localArchiveFile(state){return {format:FORMAT,version:1,exportedAt:Date.now(),archive:clone(state)};}
export function readLocalArchive(raw){
 if(JSON.stringify(raw).length>4500000)throw Error('Choose a local-save backup smaller than 4.5 MB.');
 if(raw?.format==='forgotten-kingdom-character'){const save=readCharacterFile(raw);return {version:1,activeId:null,characters:[{id:'character-'+(save.player.lanIdentity?.id||uuid()),save}],sharedStashes:[[],[],[]]};}
 if(raw?.format!==FORMAT||raw.version!==1||raw.archive?.version!==1||!Array.isArray(raw.archive.characters)||raw.archive.characters.length>256)throw Error('Choose a Forgotten Kingdom local-save backup or character export.');
 const state=clone(raw.archive),ids=new Set();for(const record of state.characters){if(typeof record.id!=='string'||!record.id||record.id.length>150||ids.has(record.id))throw Error('The backup has invalid or repeated character identifiers.');ids.add(record.id);record.save=readCharacterFile({format:'forgotten-kingdom-character',version:1,save:record.save});}
 if(!Array.isArray(state.sharedStashes)||state.sharedStashes.length!==3)throw Error('The backup needs three shared stash pages.');
 for(const page of state.sharedStashes)if(!Array.isArray(page)||page.length>512||page.some(i=>!i||typeof i!=='object'||typeof i.id!=='string'||typeof i.name!=='string'||typeof i.slot!=='string'))throw Error('The shared stash contains invalid items.');
 return state;
}
export function mergeLocalArchive(current,incoming,{replaceMatches=false}={}){
 const next=clone(current),summary={added:0,updated:0,kept:0,stashAdded:0,stashKept:0};const mapping=new Map();
 for(const record of incoming.characters){const identity=record.save.player.lanIdentity?.id,match=next.characters.find(r=>r.id===record.id||identity&&r.save.player.lanIdentity?.id===identity);if(match){mapping.set(record.id,match.id);if(replaceMatches){match.save=clone(record.save);match.updatedAt=Date.now();summary.updated++;}else summary.kept++;}else{const added={id:record.id,save:clone(record.save),createdAt:record.createdAt||Date.now(),updatedAt:Date.now()};next.characters.push(added);mapping.set(record.id,added.id);summary.added++;}}
 next.sharedStashes??=[[],[],[]];const owned=new Map(next.sharedStashes.flat().map(item=>[item.id,item]));
 for(let n=0;n<3;n++)for(const raw of incoming.sharedStashes[n]){const item=clone(raw),existing=owned.get(item.id);if(existing&&fingerprint(existing)===fingerprint(item)){summary.stashKept++;continue;}if(existing){item.id=collisionId(item);if(owned.has(item.id)&&fingerprint(owned.get(item.id))===fingerprint(item)){summary.stashKept++;continue;}if(owned.has(item.id))item.id='import-item-'+uuid();}item.bagX=-1;item.bagY=-1;next.sharedStashes[n].push(item);owned.set(item.id,item);summary.stashAdded++;}
 for(let page=0;page<3;page++)if(arrange(next.sharedStashes[page],STASH))throw Error('Shared stash '+(page+1)+' does not have room for this backup. Free space before importing; no saves have changed.');
 if(!next.characters.some(r=>r.id===next.activeId))next.activeId=mapping.get(incoming.activeId)||next.characters[0]?.id||null;
 return {state:next,summary};
}
export function downloadLocalArchive(state){const blob=new Blob([JSON.stringify(localArchiveFile(state),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='forgotten-kingdom-local-saves.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
