import {GuardSprites} from './guard-sprites.js';
export class CharacterPortraits{
 constructor(){this.guard=new GuardSprites();this.ready=Promise.all([this.guard.art,this.guard.items,this.guard.original,this.guard.weapons,this.guard.setArt].map(i=>i.decode()));}
 async paint(root,characters){await this.ready;if(!root.isConnected)return;for(const canvas of root.querySelectorAll('[data-character-portrait]')){const record=characters.find(c=>c.id===canvas.dataset.characterPortrait);if(!record)continue;const c=canvas.getContext('2d');c.clearRect(0,0,96,128);const frame=this.guard.frame(record.save.player,false,0);if(frame)c.drawImage(frame,-24,-2,144,132);}}
}
