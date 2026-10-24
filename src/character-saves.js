export const LEGACY_SAVE_KEY='ashen-reliquary-save-v1';
export const CHARACTER_SAVE_KEY='forgotten-kingdom-characters-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
export const validCharacterSave=s=>!!(s?.version===1&&s.player?.skills&&Array.isArray(s.player.inventory)&&s.player.equipment);
const id=()=>globalThis.crypto?.randomUUID?.()||'loyalist-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export class CharacterSaves{
 constructor(storage=null){
  this.storage=storage;this.persistent=!!storage;this.error='';this.state={version:1,activeId:null,characters:[],sharedStashes:[[],[],[]]};
  let raw,legacy;try{raw=storage?.getItem(CHARACTER_SAVE_KEY);legacy=storage?.getItem(LEGACY_SAVE_KEY);}catch{this.storage=null;this.persistent=false;}
  this.serialized=raw||null;
  if(raw){try{const archive=JSON.parse(raw);if(archive.version!==1||!Array.isArray(archive.characters)||archive.characters.some(c=>!c.id||!validCharacterSave(c.save)))throw Error();this.state=archive;this.state.sharedStashes=Array.from({length:3},(_,i)=>Array.isArray(archive.sharedStashes?.[i])?archive.sharedStashes[i]:[]);if(!this.state.characters.some(c=>c.id===archive.activeId))this.state.activeId=this.state.characters[0]?.id||null;}catch{this.error='The character archive could not be read. It has been kept untouched.';this.readOnly=true;}}
  else if(legacy){try{const save=JSON.parse(legacy);if(validCharacterSave(save)&&!this.create(save)){const record={id:id(),createdAt:Date.now(),updatedAt:Date.now(),save:clone(save)};this.state.characters=[record];this.state.activeId=record.id;}}catch{}}
 }
 importCharacter(save,replaceId=null){if(save?.player?.onlineCharacterId||!validCharacterSave(save))return null;if(!replaceId)return this.create(save);const next=clone(this.state),record=next.characters.find(c=>c.id===replaceId);if(!record)return null;record.save=clone(save);record.updatedAt=Date.now();next.activeId=record.id;return this.commit(next)?this.active:null;}
 get characters(){return this.state.characters;}
 get active(){return this.characters.find(c=>c.id===this.state.activeId)||null;}
 get sharedStashes(){return this.state.sharedStashes;}
 commit(next){
  if(this.readOnly)return false;
  if(this.storage){try{if((this.storage.getItem(CHARACTER_SAVE_KEY)||null)!==this.serialized){this.error='Characters changed in another tab. Reload before saving here.';return false;}const serialized=JSON.stringify(next);this.storage.setItem(CHARACTER_SAVE_KEY,serialized);this.serialized=serialized;}catch{this.error='Could not save characters. Browser storage may be full. Your previous archive is unchanged.';return false;}}
  this.state=next;this.error='';
  // Compatibility copy for older builds. The roster is always written first;
  // a failed compatibility write cannot discard an already saved character.
  try{if(this.active)this.storage?.setItem(LEGACY_SAVE_KEY,JSON.stringify(this.active.save));else this.storage?.removeItem(LEGACY_SAVE_KEY);}catch{}
  return true;
 }
 create(save){if(save?.player?.onlineCharacterId||!validCharacterSave(save))return null;const record={id:id(),createdAt:Date.now(),updatedAt:Date.now(),save:clone(save)},next=clone(this.state);next.characters.push(record);next.activeId=record.id;return this.commit(next)?record:null;}
 save(save){if(save?.player?.onlineCharacterId||!validCharacterSave(save))return false;if(!this.active)return !!this.create(save);const next=clone(this.state),record=next.characters.find(c=>c.id===next.activeId);record.save=clone(save);record.updatedAt=Date.now();return this.commit(next);}
 select(characterId){if(characterId&&characterId===this.state.activeId)return true;if(!this.characters.some(c=>c.id===characterId))return false;return this.commit({...this.state,activeId:characterId});}
 remove(characterId){if(!this.characters.some(c=>c.id===characterId))return false;const next=clone(this.state);next.characters=next.characters.filter(c=>c.id!==characterId);if(next.activeId===characterId)next.activeId=next.characters[0]?.id||null;return this.commit(next);}
}
