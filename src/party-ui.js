const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=(n,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback;
export function partyLocation(p){
 if(p.zone==='town')return 'Emberfall';
 const [kind,index]=String(p.area||'').split(':'),chapter=Number(index)||0;
 return (kind==='stronghold'?['Ruined Marchgate','Tithe Granary','Thornbound Redoubt']:['Kingsroad Wilds','Widow’s Fields','Blackthorn Hollow'])[chapter]||'On the road';
}
export function partyHealth(p){
 const max=Math.max(1,finite(p.maxHp,1)),hp=Math.min(max,Math.max(0,finite(p.hp)));
 return {max,hp,percent:100*hp/max,label:`${Math.ceil(hp)} / ${Math.ceil(max)} life`};
}
export function partyLifeBar(p){const h=partyHealth(p);return `<div class="party-life" data-peer-hp="${esc(p.id)}" role="progressbar" aria-label="${esc(p.name)} life" aria-valuemin="0" aria-valuemax="${h.max}" aria-valuenow="${h.hp}" aria-valuetext="${h.label}" style="--life:${h.percent}%"><i></i><span>${h.label}</span></div>`;}
export function updatePartyLife(root,p){const bar=[...root.querySelectorAll('[data-peer-hp]')].find(e=>e.dataset.peerHp===p.id);if(!bar)return;const h=partyHealth(p);bar.style.setProperty('--life',h.percent+'%');bar.setAttribute('aria-valuemax',h.max);bar.setAttribute('aria-valuenow',h.hp);bar.setAttribute('aria-valuetext',h.label);bar.querySelector('span').textContent=h.label;}
export function partyHud(players,selfId){const self=players.find(p=>p.id===selfId),members=players.filter(p=>p.id!==selfId&&self?.party&&p.party===self.party);return members.length?`<h3>Party <span>${members.length+1}</span></h3>${members.map(p=>`<div class="party-companion ${p.hp<=0?'fallen':''}"><div class="party-member-heading"><span class="party-seal" aria-label="Level ${finite(p.level,1)}">${finite(p.level,1)}</span><div><strong>${esc(p.name)}</strong><small>${p.id===self.partyLeader?'Party leader · ':''}${esc(partyLocation(p))}${p.area!==self.area?' · Away':''}</small></div></div>${partyLifeBar(p)}</div>`).join('')}`:'';}
