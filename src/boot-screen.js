import {TITLE_LANDSCAPE,MENU_BUTTON,MENU_BUTTON_LIT} from './assets.js';

// The first-paint shell stays up while the title's painted assets decode.
// No timer or fabricated percentage can expose a half-initialized game.
export async function finishBoot(){
 const root=document.getElementById('boot-screen');if(!root)return;
 try{
  await Promise.all([TITLE_LANDSCAPE,MENU_BUTTON,MENU_BUTTON_LIT].map(src=>{const art=new Image();art.src=src;return art.decode();}));
  await new Promise(requestAnimationFrame);
  if(root.dataset.failed)return;
  document.getElementById('app').removeAttribute('inert');
  document.documentElement.removeAttribute('data-boot');root.remove();
 }catch{
  root.dataset.failed='true';root.setAttribute('aria-busy','false');
  document.getElementById('boot-status').textContent='The kingdom could not be opened';
  root.querySelector('.boot-note').textContent='The title artwork could not load. Please try again. Your saved characters are kept.';
  root.querySelector('button').hidden=false;
 }
}
