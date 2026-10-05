const assert=require('node:assert/strict'),{chromium}=require('../.runtime/tools/node_modules/playwright'),server=require('./server.cjs'),motion=require('./public/life-motion.js');
(async()=>{
 for(const [name,kind]of [['cat','walk'],['frog','hop'],['bird','fly'],['fish','swim'],['car','drive'],['guitar','music'],['tree','grow']])assert.equal(motion.mode(name),kind);
 for(const kind of Object.keys(motion.labels))for(const t of [0,1,10])assert.ok(Object.values(motion.pose(kind,t)).every(Number.isFinite));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.getByRole('link',{name:'Come to life',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('life-play').disabled);assert.equal(await page.locator('#life-category option').count(),345);assert.equal(await page.locator('#life-play').innerText(),'Play');
 const snap=()=>page.locator('#life-canvas').evaluate(c=>c.toDataURL());const first=await snap();await page.locator('#life-play').click();await page.waitForTimeout(300);await page.locator('#life-play').click();assert.notEqual(first,await snap());const paused=await snap();await page.waitForTimeout(150);assert.equal(paused,await snap());
 await page.locator('#life-new').click();await page.waitForFunction(()=>!document.getElementById('life-new').disabled);assert.ok((await page.locator('#life-meta').innerText()).includes('Drawing'));
 await page.locator('#life-category').selectOption('dog');await page.waitForFunction(()=>document.getElementById('life-title').textContent==='dog'&&!document.getElementById('life-play').disabled);await page.locator('#life-replay').click();assert.equal(await page.locator('#life-play').innerText(),'Pause');
 await page.screenshot({path:__dirname+'/life-preview.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS motion families, random real drawings, reduced motion, play/pause, replay, category changes, mobile layout');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
