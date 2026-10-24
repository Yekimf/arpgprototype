export const CONTROL_ACTIONS=[
  ['skill0','Skill slot 1'],['skill1','Skill slot 2'],['skill2','Skill slot 3'],['skill3','Skill slot 4'],
  ['primary','Left-click skill · keyboard'],['secondary','Right-click skill · keyboard'],
  ['dodge','Evade'],['heal','Life flask'],['mana','Mana flask'],['portal','Town portal'],
];
const CLICK={skill0:'KeyQ',skill1:'KeyW',skill2:'KeyE',skill3:'KeyR',primary:null,secondary:null,dodge:'Space',heal:'Digit1',mana:'Digit2',portal:'KeyT'};
const WASD={...CLICK,skill1:'KeyE',skill2:'KeyR',skill3:'KeyF'};
const MENU_KEYS=new Set(['KeyI','KeyK','KeyC','KeyG','KeyJ','KeyN','KeyM','KeyP']);
const MOVEMENT_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD']);
const ARROWS=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
const PUNCTUATION={Minus:'−',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'Backslash',Semicolon:';',Quote:'Quote',Comma:',',Period:'.',Slash:'/',Backquote:'`'};
export function defaultControls(){return{movement:'click',profiles:{click:{...CLICK},wasd:{...WASD}}};}
export function allowedBinding(code,mode='click'){
  return typeof code==='string'&&!MENU_KEYS.has(code)&&!(mode==='wasd'&&MOVEMENT_KEYS.has(code))&&(/^(Key[A-Z]|Digit[0-9]|Numpad[0-9])$/.test(code)||code==='Space'||Object.hasOwn(PUNCTUATION,code));
}
export function sanitizeControls(raw){
  const result=defaultControls();result.movement=raw?.movement==='wasd'?'wasd':'click';
  for(const mode of ['click','wasd']){
    const used=new Set(),saved=raw?.profiles?.[mode];
    for(const [action] of CONTROL_ACTIONS){
      const code=saved&&Object.hasOwn(saved,action)?saved[action]:result.profiles[mode][action];
      result.profiles[mode][action]=code===null?null:allowedBinding(code,mode)&&!used.has(code)?code:null;
      if(result.profiles[mode][action])used.add(code);
    }
  }
  return result;
}
export const activeBindings=controls=>controls.profiles[controls.movement];
export function bindingError(controls,action,code){
  if(!CONTROL_ACTIONS.some(([id])=>id===action))return 'Unknown action.';
  if(code===null)return '';
  if(!allowedBinding(code,controls.movement))return controls.movement==='wasd'&&MOVEMENT_KEYS.has(code)?'W, A, S and D are reserved for movement.':'That key is reserved. Use a letter, number, Space, punctuation or numpad key.';
  const conflict=CONTROL_ACTIONS.find(([id])=>id!==action&&activeBindings(controls)[id]===code);
  return conflict?`${keyLabel(code)} is already assigned to ${conflict[1].toLowerCase()}. Clear that binding first.`:'';
}
export function keyLabel(code){
  if(!code)return 'Unbound';
  if(code==='Space')return 'Space';
  if(code.startsWith('Key'))return code.slice(3);
  if(code.startsWith('Digit'))return code.slice(5);
  if(code.startsWith('Numpad'))return 'Num '+code.slice(6);
  return PUNCTUATION[code]||code;
}
// Physical key codes keep shifted keys and key releases consistent. The fallback
// also supports accessibility tools that dispatch a key without a code.
export function eventCode(event){
  if(event.code)return event.code;
  if(/^[a-z]$/i.test(event.key))return 'Key'+event.key.toUpperCase();
  if(/^[0-9]$/.test(event.key))return 'Digit'+event.key;
  if(event.key===' ')return 'Space';
  if(event.key==='Shift')return 'ShiftLeft';
  return event.key;
}
export function movementVector(keys,controls){
  const wasd=controls.movement==='wasd';
  const sx=Number(keys.has('ArrowRight')||wasd&&keys.has('KeyD'))-Number(keys.has('ArrowLeft')||wasd&&keys.has('KeyA'));
  const sy=Number(keys.has('ArrowDown')||wasd&&keys.has('KeyS'))-Number(keys.has('ArrowUp')||wasd&&keys.has('KeyW'));
  // The world is projected at 2:1. Invert that projection so diagonals also
  // follow the screen directions, then normalize to the normal movement speed.
  // Keep the original arrow-key diagonals for established keyboard controls.
  const verticalScale=wasd&&(keys.has('KeyW')||keys.has('KeyA')||keys.has('KeyS')||keys.has('KeyD'))?2:1;
  const x=sx+sy*verticalScale,y=sy*verticalScale-sx,length=Math.hypot(x,y)||1;
  return{x:x/length,y:y/length};
}
export const isMovementCode=(code,controls)=>ARROWS.has(code)||controls.movement==='wasd'&&MOVEMENT_KEYS.has(code);
export function controlsMarkup(controls,pending=null,status=''){
  const bindings=activeBindings(controls);
  return `<div class="controls-body"><label class="movement-choice">Movement<select data-movement-mode><option value="click" ${controls.movement==='click'?'selected':''}>Click to move</option><option value="wasd" ${controls.movement==='wasd'?'selected':''}>WASD + click to move</option></select></label><p class="controls-note">Arrow keys and click movement work in both modes. Aim attacks with the cursor. Each mode keeps its own bindings.</p><div class="binding-grid">${CONTROL_ACTIONS.map(([id,label])=>`<div class="binding-row"><span>${label}</span><button class="binding-key ${pending===id?'listening':''}" data-bind-action="${id}" aria-label="Rebind ${label}" aria-pressed="${pending===id}">${pending===id?'Press a key…':keyLabel(bindings[id])}</button><button class="binding-clear" data-clear-binding="${id}" aria-label="Clear ${label}" ${bindings[id]===null?'disabled':''}>×</button></div>`).join('')}</div><p class="binding-status" role="status">${status||'Select a key box, then press a key. Escape cancels; Backspace or Delete clears. Mouse buttons remain available.'}</p><small class="controls-reserved">Menu shortcuts, Tab, Enter, modifiers and arrow keys stay reserved. WASD is reserved in WASD mode.</small></div><div class="modal-footer"><button class="text-button" data-action="reset-bindings">Reset this mode</button><button class="primary-button" data-action="options">Back to options</button></div>`;
}
