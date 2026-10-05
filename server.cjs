const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const dataset = require('./dataset.cjs');
const assets = {'/life':['life.html','text/html'], '/life.html':['life.html','text/html'], '/life.js':['life.js','text/javascript'], '/life-motion.js':['life-motion.js','text/javascript'], '/life.css':['life.css','text/css'], '/analysis':['analysis.html','text/html'], '/analysis.js':['analysis.js','text/javascript'], '/analysis.css':['analysis.css','text/css'], '/density-lines.js':['density-lines.js','text/javascript'], '/histograms':['histograms.html','text/html'], '/histograms.js':['histograms.js','text/javascript'], '/histogram-chart.js':['histogram-chart.js','text/javascript'], '/average.js':['average.js','text/javascript'], '/morph.js':['morph.js','text/javascript'], '/histogram.js':['histogram.js','text/javascript'], '/animate':['animate.html','text/html'], '/animate.html':['animate.html','text/html'], '/animate.js':['animate.js','text/javascript'], '/animate.css':['animate.css','text/css'], '/':['index.html','text/html'], '/draw':['draw.html','text/html'], '/draw.html':['draw.html','text/html'], '/draw.js':['draw.js','text/javascript'], '/draw.css':['draw.css','text/css'], '/match-worker.js':['match-worker.js','text/javascript'], '/matcher.js':['matcher.js','text/javascript'], '/app.js':['app.js','text/javascript'], '/style.css':['style.css','text/css']};
let referenceCache;
async function references() {
  const local = dataset.categories.filter(name => fs.existsSync(dataset.fileFor(name)));
  const key = local.join('|');
  if (referenceCache?.key === key) return referenceCache.promise;
  const promise = (async () => {
    const drawings = [];
    for (const category of local) {
      const offsets = await dataset.prepare(category);
      const pages = Math.ceil((offsets.length - 1) / 64);
      const selected = new Set(Array.from({length:8}, (_, i) => 1 + Math.floor(i * (pages - 1) / 7)));
      for (const number of selected) {
        const result = await dataset.page(category, number, 64);
        drawings.push(...result.drawings.map(({key_id, word, drawing, countrycode}) => ({key_id, word, drawing, countrycode})));
      }
    }
    return {categories:local, drawings, perCategory:512};
  })();
  referenceCache = {key, promise};
  try { return await promise; } catch (error) {referenceCache = undefined; throw error;}
}
const server = http.createServer(async (req, res) => {
  const send = (status, body) => {res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(body));};
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET') return send(405, {error:'Method not allowed'});
    if (url.pathname === '/api/categories') return send(200, dataset.categories.map(name => ({name, local:fs.existsSync(dataset.fileFor(name))})));
    if (url.pathname === '/api/ink-stats') { const category = url.searchParams.get('category'); if (!dataset.categories.includes(category)) return send(400, {error:'Invalid category'}); return send(200, await require('./ink-stats.cjs').statistics(category)); }
    if (url.pathname === '/api/country-drawings') { const category=url.searchParams.get('category'),country=url.searchParams.get('country'),page=Number(url.searchParams.get('page')||1); if(!dataset.categories.includes(category)||!country||!/^([A-Z]{2}|Unknown)$/.test(country)||!Number.isSafeInteger(page)||page<1)return send(400,{error:'Invalid category, country or page'});return send(200,await require('./country.cjs').countryPage(category,country,page)); }
    if (url.pathname === '/api/analysis') { const category = url.searchParams.get('category'); if (!dataset.categories.includes(category)) return send(400, {error:'Invalid category'}); return send(200, await require('./analysis.cjs').analyze(category)); }
    if (url.pathname === '/api/match-references') return send(200, await references());
    if (url.pathname === '/api/drawings') {
      const category = url.searchParams.get('category') || 'cat';
      const page = Number(url.searchParams.get('page') || 1);
      if (!dataset.categories.includes(category) || !Number.isSafeInteger(page) || page < 1) return send(400, {error:'Invalid category or page'});
      return send(200, await dataset.page(category, page));
    }
    const asset = assets[url.pathname];
    if (!asset) return send(404, {error:'Not found'});
    res.writeHead(200, {'Content-Type':asset[1]+'; charset=utf-8'});
    res.end(await fs.promises.readFile(path.join(__dirname, 'public', asset[0])));
  } catch (error) { console.error(error.message); send(502, {error:'Could not load the dataset. Check your internet connection for categories not yet downloaded, then retry.'}); }
});
if (require.main === module) server.listen(Number(process.env.PORT) || 4173, '127.0.0.1', () => console.log('Quick Draw viewer: http://localhost:' + server.address().port));
module.exports = server;
