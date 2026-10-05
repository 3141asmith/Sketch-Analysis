const assert = require('node:assert/strict');
const {chromium} = require('../.runtime/tools/node_modules/playwright');
const server = require('./server.cjs');
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    const first = await (await fetch(base+'/api/drawings?category=cat&page=1')).json();
    assert.equal(first.total, 123202); assert.equal(first.drawings.length,48);
    const last = await (await fetch(base+'/api/drawings?category=cat&page='+first.pages)).json();
    assert.equal(last.drawings.length,34);
    assert.equal((await fetch(base+'/api/drawings?category=../bad')).status,400);
    assert.equal((await fetch(base+'/api/drawings?page=-1')).status,400);
    browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    const page = await browser.newPage({viewport:{width:1440,height:1000}}), errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base); await page.locator('.card').first().waitFor();
    assert.equal(await page.locator('.card').count(),48);
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.card img')).every(img=>img.complete && img.naturalWidth>0));
    await page.locator('.card').first().click(); assert.equal(await page.locator('dialog').evaluate(d=>d.open),true);
    assert.ok((await page.locator('#metadata').innerText()).includes(first.drawings[0].key_id));
    await page.keyboard.press('Escape'); await page.locator('#next').click();
    await page.waitForFunction(()=>document.getElementById('page').value==='2');
    assert.ok((await page.locator('.card').first().innerText()).includes('#49'));
    await page.locator('#search').fill('zzzz'); assert.equal(await page.locator('#categories button').count(),0);
    await page.locator('#search').fill('cat'); assert.ok(await page.locator('#categories button').count()>0);
    await page.screenshot({path:__dirname+'/preview.png',fullPage:true});
    await page.setViewportSize({width:390,height:844}); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]); console.log('PASS: dataset pagination, invalid requests, images, details, navigation, search, mobile layout, no browser errors.');
  } finally {await browser?.close(); await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
