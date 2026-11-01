import {test,expect} from '@playwright/test';

test('female creation keeps its own fitted model through save, equipment and animation',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await page.locator('[data-front=create]').click();
 await page.locator('input[name=sex][value=female]').check();
 await expect(page.locator('.creation-stage')).toHaveAttribute('aria-label',/female loyalist/);
 await page.locator('#character-name').fill('Ser Mira');
 await page.screenshot({path:'test-results/female-creation.png'});
 await page.locator('#creation-form button[type=submit]').click();
 await page.keyboard.press('Escape');
 await expect(page.locator('#area-loading')).toBeHidden();
 await expect.poll(()=>page.evaluate(()=>window.__reliquary?.snapshot().appearance.sex)).toBe('female');
 const original=await page.evaluate(()=>window.__reliquary.spriteSignature());
 await page.keyboard.press('i');
 await expect(page.locator('.paperdoll canvas')).toBeVisible();
 const preview=await page.locator('.paperdoll canvas').evaluate(c=>[...c.getContext('2d').getImageData(0,0,c.width,c.height).data].some((v,i)=>i%4===3&&v>0));
 expect(preview).toBe(true);
 const armorArt=await page.evaluate(async()=>{const {itemArt}=await import('/src/item-art.js');return itemArt({slot:'armor',look:'plate',rarity:'normal'},'female');});
 expect(armorArt).toContain('data-armor-model="female"');
 await page.screenshot({path:'test-results/female-inventory.png'});
 const result=await page.evaluate(async()=>{
  const {createPlayer}=await import('/src/game.js');const {GuardSprites}=await import('/src/guard-sprites.js');
  const guard=new GuardSprites();await Promise.all([guard.art,guard.femaleArt,guard.setArt,guard.femaleSetArt,guard.weapons,guard.items,guard.original].map(a=>a.decode()));
  const female=createPlayer({sex:'female'}),male=createPlayer();
  const hash=frame=>{let h=2166136261;for(const v of frame.getContext('2d').getImageData(0,0,frame.width,frame.height).data)h=Math.imul(h^v,16777619);return h>>>0;};
  const idle=hash(guard.frame(female,false,0)),walk=hash(guard.frame(female,false,2)),attack=hash(guard.frame(female,false,20));
  female.equipment.armor={id:'test-plate',slot:'armor',look:'plate',rarity:'normal',requiredLevel:1,requiredStats:{might:0}};
  const plate=hash(guard.frame(female,false,0));return {idle,walk,attack,plate,male:hash(guard.frame(male,false,0))};
 });
 expect(new Set(Object.values(result)).size).toBe(5);
 expect(original).toBe(result.idle);
 await page.reload();
 await expect(page.locator('[data-front=continue]')).toBeVisible();
 await page.locator('[data-front=continue]').click();
 await expect(page.locator('.character-card')).toContainText('Ser Mira');
 expect(errors).toEqual([]);
});
