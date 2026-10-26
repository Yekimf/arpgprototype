import {test,expect} from '@playwright/test';
test('party ledger and square life wells fit desktop sizes and update health',async({page})=>{
 await page.goto('/');await expect(page.locator('[data-front=create]')).toBeVisible();await expect(page.locator('#boot-screen')).toHaveCount(0);

 await page.evaluate(async()=>{
 const {LanClient}=await import('/src/lan-client.js'),{partyHud}=await import('/src/party-ui.js');
 const players=Array.from({length:8},(_,i)=>({id:'member'+i,name:i?'Oathkeeper '+i:'The Loyalist',level:12+i,hp:75,maxHp:150,party:'oath',partyLeader:'member0',area:i%2?'stronghold:1':'wilderness:0',zone:'town',x:40,y:40}));
 const ui=Object.create(LanClient.prototype);Object.assign(ui,{id:'member0',latest:{players},invites:[],room:{name:'The Old Oath'},game:{player:{x:40,y:40}},root:document.querySelector('#lan-panel')});
 ui.root.classList.remove('hidden');ui.paintSocial();
 document.querySelector('#lan-hud').classList.remove('hidden');document.querySelector('.lan-party').innerHTML=partyHud(players,'member0');
 window.__partyStyleFixture=ui;
 });
 for(const [width,height] of [[1024,720],[1280,720],[1920,1080]]){
 await page.setViewportSize({width,height});
 await expect(page.locator('.company-member')).toHaveCount(8);await expect(page.locator('.lan-party .party-companion')).toHaveCount(7);
 expect(await page.locator('.company-member').first().evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 expect(await page.locator('.party-life').first().evaluate(e=>getComputedStyle(e).borderTopLeftRadius)).toBe('0px');
 expect(await page.locator('.lan-folio').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
 await page.screenshot({path:`/tmp/party-ledger-${width}.png`});
 }
 await page.evaluate(()=>{const ui=window.__partyStyleFixture;ui.latest.players[1].hp=30;ui.paintSocial();});
 await expect(page.locator('#lan-panel [data-peer-hp=member1]')).toHaveAttribute('aria-valuenow','30');
 await expect(page.locator('#lan-panel [data-peer-hp=member1] span')).toHaveText('30 / 150 life');
});
