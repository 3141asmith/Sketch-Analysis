const assert=require('node:assert/strict');
const {chromium}=require('../.runtime/tools/node_modules/playwright');
const server=require('./server.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 const base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage({viewport:{width:1400,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('a[href="/animate"]').click();await page.waitForFunction(()=>!document.getElementById('play').disabled);
 assert.equal(await page.locator('#category option').count(),345);
 await page.locator('#jump').fill('48');await page.locator('#jump-button').click();await page.waitForFunction(()=>!document.getElementById('play').disabled&&document.getElementById('position').textContent.includes('Drawing 48 of'));
 await page.locator('#speed').evaluate(e=>{e.value='.5';e.dispatchEvent(new Event('input'));});await page.locator('#play').click();await page.waitForFunction(()=>document.getElementById('position').textContent.includes('Drawing 49 of'));await page.locator('#play').click();const paused=await page.locator('#position').innerText();await page.waitForTimeout(650);assert.equal(await page.locator('#position').innerText(),paused);
 await page.locator('#jump').fill('123202');await page.locator('#jump-button').click();await page.waitForFunction(()=>!document.getElementById('play').disabled);await page.locator('#next-drawing').click();await page.waitForFunction(()=>document.getElementById('position').textContent.includes('Drawing 1 of'));
 await page.locator('#category').selectOption('dog');await page.waitForFunction(()=>document.getElementById('drawing-title').textContent==='dog'&&!document.getElementById('play').disabled);
 assert.ok(await page.locator('#animation').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(v=>v!==0)));
 await page.screenshot({path:__dirname+'/animate-preview.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.goto(base);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS: gallery link, batch boundary, pause, full-category looping, category switching, rendered canvas, mobile layout.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
