(()=>{
  const host=document.createElement('section');host.className='ink-panel';host.innerHTML='<h2>Ink coverage distribution</h2><p id="ink-status" role="status"></p><div id="ink-chart"></div><button id="ink-retry" hidden>Retry analysis</button><p class="ink-note">Horizontal axis: percentage of the image covered by ink. Vertical axis: number of drawings. Each bin spans 1 percentage point. Measured across the entire category on a 279 × 279 canvas with 3-pixel rounded strokes, matching the gallery proportions. Overlapping strokes count once; antialiasing is excluded.</p>';
  document.querySelector('.collection-head').after(host);
  let selected='',generation=0;const cache=new Map();
  const status=host.querySelector('#ink-status'),chart=host.querySelector('#ink-chart'),retry=host.querySelector('#ink-retry');
  async function load(category){selected=category;const token=++generation;chart.replaceChildren();retry.hidden=true;status.textContent='Measuring ink coverage for every drawing… The first analysis may take a minute.';try{let data=cache.get(category);if(!data){const response=await fetch('/api/ink-stats?category='+encodeURIComponent(category));data=await response.json();if(!response.ok)throw new Error(data.error||'Analysis failed.');cache.set(category,data);}if(token===generation)window.renderInkHistogram(data,chart,status);}catch(error){if(token===generation){status.textContent=error.message;retry.hidden=false;}}}
  retry.onclick=()=>load(selected);window.loadInkHistogram=category=>{if(category!==selected)load(category);};
})();
