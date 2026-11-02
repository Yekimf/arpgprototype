import {test,expect} from '@playwright/test';

async function loadQuality(page,quality){
  await page.addInitScript(quality=>localStorage.setItem('ashen-reliquary-options-v1',JSON.stringify({quality,cursorCapture:false})),quality);
  await page.goto('/');
  await page.waitForFunction(()=>window.__reliquary);
}

async function resolution(page){
  return page.locator('#world').evaluate(canvas=>({width:canvas.width,height:canvas.height,scale:canvas.getContext('2d').getTransform().a}));
}

test.describe('dense display world resolution',()=>{
  test.use({deviceScaleFactor:2,viewport:{width:1280,height:800}});

  test('high quality preserves native density and caps large backing canvases',async({page})=>{
    await loadQuality(page,'high');
    await expect.poll(()=>resolution(page)).toEqual({width:2560,height:1600,scale:2});
    await page.setViewportSize({width:2560,height:1600});
    await expect.poll(()=>resolution(page)).toEqual({width:3840,height:2400,scale:1.5});
  });

  for(const [quality,width,height,scale] of [['balanced',1280,800,1],['performance',960,600,.75]]){
    test(`${quality} keeps its existing resolution budget`,async({page})=>{
      await loadQuality(page,quality);
      await expect.poll(()=>resolution(page)).toEqual({width,height,scale});
    });
  }
});

test.describe('high quality device scale limits',()=>{
  for(const [density,scale] of [[1,1],[3,2]]){
    test.describe(`device scale ${density}`,()=>{
      test.use({deviceScaleFactor:density,viewport:{width:1280,height:800}});
      test('uses native pixels up to twice the logical resolution',async({page})=>{
        await loadQuality(page,'high');
        await expect.poll(()=>resolution(page)).toEqual({width:1280*scale,height:800*scale,scale});
      });
    });
  }
});
