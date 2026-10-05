const $ = id => document.getElementById(id);
let categories = [], current = 'cat', currentPage = 1, pageCount = 1, requestId = 0, busy = false;
const fmt = n => n.toLocaleString();
async function api(url) { const response = await fetch(url); const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; }
function imageFor(record) {
  let maxX = 0, maxY = 0;
  for (const [xs, ys] of record.drawing) {for (const x of xs) maxX = Math.max(maxX, x); for (const y of ys) maxY = Math.max(maxY, y);}
  const strokes = record.drawing.map(([xs, ys]) => {
    const points = xs.map((x, i) => `${Number(x)},${Number(ys[i])}`).join(' ');
    return xs.length === 1 ? `<circle cx="${Number(xs[0])}" cy="${Number(ys[0])}" r="1.5" fill="#252923"/>` : `<polyline points="${points}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 279 279"><g transform="translate(${(255-maxX)/2} ${(255-maxY)/2})" fill="none" stroke="#252923" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${strokes}</g></svg>`;
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); img.alt = `A drawing of ${record.word}`; return img;
}
function renderCategories() {
  const term = $('search').value.trim().toLowerCase();
  const matches = categories.filter(c => c.name.toLowerCase().includes(term));
  $('category-count').textContent = `${matches.length} categories · ${categories.filter(c=>c.local).length} downloaded`;
  $('categories').replaceChildren(...matches.map(c => {
    const button = document.createElement('button'); button.textContent = c.name; button.setAttribute('aria-current', String(c.name === current));
    if (c.local) {const dot = document.createElement('span'); dot.textContent = '●'; dot.title = 'Downloaded'; button.append(dot);}
    button.onclick = () => load(c.name, 1); return button;
  }));
  if (!matches.length) $('categories').textContent = 'No matching categories.';
}
function controls() { $('previous').disabled = busy || currentPage <= 1; $('next').disabled = busy || currentPage >= pageCount; $('shuffle').disabled = busy; $('page').disabled = busy; $('page-form').querySelector('button').disabled = busy; }
function showDetail(record) {
  $('detail-title').textContent = record.word; $('detail-image').replaceChildren(imageFor(record)); $('metadata').replaceChildren();
  for (const [key, value] of Object.entries({'Drawing ID':record.key_id, Country:record.countrycode, Recognized:record.recognized ? 'Yes' : 'No', Created:record.timestamp, Strokes:record.drawing.length})) {
    const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = value; $('metadata').append(dt, dd);
  }
  $('detail').showModal();
}
async function load(category, page) {
  window.loadInkHistogram(category);
  const id = ++requestId; current = category; currentPage = page; busy = true; controls(); renderCategories();
  $('title').textContent = category; $('summary').textContent = 'Loading drawings…'; $('gallery').replaceChildren(); $('gallery').setAttribute('aria-busy','true'); $('retry').hidden = true;
  $('status').textContent = categories.find(c=>c.name === category)?.local ? 'Opening local drawings…' : 'Downloading this category for offline use. The first visit may take a few minutes…';
  try {
    const result = await api(`/api/drawings?category=${encodeURIComponent(category)}&page=${page}`);
    if (id !== requestId) return;
    currentPage = result.page; pageCount = result.pages; categories.find(c=>c.name === category).local = true; renderCategories();
    $('gallery').replaceChildren(...result.drawings.map((record, i) => {
      const card = document.createElement('button'); card.className = 'card'; card.setAttribute('aria-label', `View ${category} drawing ${(currentPage-1)*48+i+1}`);
      const caption = document.createElement('div'); caption.className = 'card-caption';
      const number = document.createElement('span'), country = document.createElement('span'); number.textContent = '#' + fmt((currentPage-1)*48+i+1); country.textContent = record.countrycode + ' · ' + (record.recognized ? 'Recognized' : 'Unrecognized');
      caption.append(number,country); card.append(imageFor(record), caption); card.onclick = () => showDetail(record); return card;
    }));
    $('summary').textContent = `${fmt(result.total)} drawings · Downloaded locally`; $('page').value = currentPage; $('page').max = pageCount; $('pages').textContent = `of ${fmt(pageCount)}`; $('status').textContent = `Showing ${fmt((currentPage-1)*48+1)}–${fmt(Math.min(currentPage*48,result.total))}. Select a drawing to take a closer look.`;
  } catch (error) {if (id !== requestId) return; $('status').textContent = error.message; $('summary').textContent = 'Collection unavailable'; $('retry').hidden = false; }
  finally {if (id === requestId) {busy = false; controls(); $('gallery').setAttribute('aria-busy','false');}}
}
$('search').oninput = renderCategories;
$('previous').onclick = () => load(current, currentPage-1);
$('next').onclick = () => load(current, currentPage+1);
$('shuffle').onclick = () => load(current, Math.floor(Math.random()*pageCount)+1);
$('page-form').onsubmit = event => {event.preventDefault(); const page = Number($('page').value); if (!busy && Number.isSafeInteger(page) && page >= 1 && page <= pageCount) load(current,page);};
$('close').onclick = () => $('detail').close();
$('detail').onclick = event => {if (event.target === $('detail')) {const rect = $('detail').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('detail').close();}};
async function init() { try {categories = await api('/api/categories'); await load(current,1);} catch(error) {$('status').textContent = error.message; $('retry').hidden = false;} }
$('retry').onclick = () => categories.length ? load(current,currentPage) : init();
init();
