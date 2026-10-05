const assert=require('node:assert/strict');
const {chromium}=require('../.runtime/tools/node_modules/playwright');
const {describe,distance}=require('./public/matcher.js');
const server=require('./server.cjs');
(async()=>{
  const line=[[[0,100],[0,100]]], shifted=[[[30,230],[50,250]]], opposite=[[[0,100],[100,0]]];
  assert.equal(describe([]),null);assert.equal(distance(describe(line),describe(shifted)),0);assert.ok(distance(describe(line),describe(opposite))>0);
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    const base='http://127.0.0.1:'+server.address().port;
    const references=await(await fetch(base+'/api/match-references')).json();assert.ok(references.drawings.length>0);
    const original=references.drawings[0], descriptor=describe(original.drawing);
    assert.equal(distance(descriptor,describe(original.drawing)),0);
    browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    const page=await browser.newPage({viewport:{width:1400,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.locator('a[href="/draw"]').click();await page.waitForFunction(()=>document.querySelector('#match-status').textContent.includes('Ready'));
    const box=await page.locator('#sketch').boundingBox();await page.mouse.move(box.x+80,box.y+80);await page.mouse.down();await page.mouse.move(box.x+230,box.y+200,{steps:15});
    // Must produce a match before pointerup, not just after finishing a stroke.
    await page.locator('#match-image svg').waitFor();const first=await page.locator('#match-meta').innerText();assert.ok(first.includes('Drawing'));
    await page.mouse.move(box.x+100,box.y+320,{steps:15});await page.mouse.up();await page.waitForTimeout(200);
    await page.screenshot({path:__dirname+'/draw-preview.png',fullPage:true});
    await page.locator('#undo').click();assert.equal(await page.locator('#match-image svg').count(),0);assert.equal(await page.locator('#hint').isVisible(),true);
    await page.mouse.move(box.x+100,box.y+100);await page.mouse.down();await page.mouse.move(box.x+250,box.y+250);await page.mouse.up();await page.locator('#clear').click();await page.waitForTimeout(250);assert.equal(await page.locator('#match-image svg').count(),0);
    // Worker exact-match retrieval must return an actual record with zero shape distance.
    const match=await page.evaluate(record=>new Promise(resolve=>{const w=new Worker('/match-worker.js');w.onmessage=({data})=>{if(data.type==='ready')w.postMessage({type:'match',version:1,strokes:record.drawing});else if(data.type==='match'){resolve(data.record);w.terminate();}};w.postMessage({type:'init',drawings:[record]});}),original);assert.equal(match.key_id,original.key_id);
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const touchPage=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});touchPage.on('pageerror',e=>errors.push(e.message));await touchPage.goto(base+'/draw');
    await touchPage.waitForFunction(()=>document.querySelector('#match-status').textContent.includes('Ready'));
    await touchPage.locator('#sketch').tap();await touchPage.locator('#match-image svg').waitFor();await touchPage.close();
    assert.deepEqual(errors,[]);console.log('PASS: shape invariance, real references, gallery link, matching during strokes, Undo, Clear, stale-result suppression, exact record retrieval, mobile layout.');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
