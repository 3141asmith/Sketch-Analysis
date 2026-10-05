(()=>{
  const list=document.getElementById('histogram-list'),status=document.getElementById('histograms-status'),search=document.getElementById('histogram-search'),retry=document.getElementById('histograms-retry');
  const rows=[],queue=[];let running=false;
  async function drain(){
    if(running)return;running=true;
    try{while(queue.length){const row=queue.shift();row.status.textContent=row.local?'Calculating the full-category histogram…':'Downloading category and calculating its histogram… This can take a few minutes.';
      try{const response=await fetch('/api/ink-stats?category='+encodeURIComponent(row.name));const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load this category.');window.renderInkHistogram(data,row.chart,row.status);row.local=true;row.done=true;row.button.textContent='Downloaded · Histogram ready';}
      catch(error){row.status.textContent=error.message;row.button.textContent='Retry download / analysis';row.button.disabled=false;}
      finally{row.queued=false;row.section.setAttribute('aria-busy','false');}
    }}finally{running=false;}
  }
  function enqueue(row,priority=false){if(row.queued||row.done)return;row.queued=true;row.button.disabled=true;row.button.textContent='Queued…';row.status.textContent='Waiting for the previous category to finish…';row.section.setAttribute('aria-busy','true');priority?queue.unshift(row):queue.push(row);drain();}
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const row=rows.find(r=>r.section===entry.target);if(row?.local){observer.unobserve(row.section);enqueue(row);}}},{rootMargin:'250px'});
  function filter(){const term=search.value.trim().toLowerCase();let count=0;for(const row of rows){row.section.hidden=!row.name.toLowerCase().includes(term);if(!row.section.hidden)count++;}status.textContent=`${count} of ${rows.length} categories`;}
  async function init(){retry.hidden=true;try{
    const response=await fetch('/api/categories');if(!response.ok)throw new Error('Could not load the category list.');const categories=await response.json();categories.sort((a,b)=>a.name.localeCompare(b.name,'en'));
    list.replaceChildren();rows.length=0;
    for(const category of categories){const section=document.createElement('section');section.className='ink-panel category-histogram';const title=document.createElement('h2');title.textContent=category.name;const button=document.createElement('button');button.textContent=category.local?'Populate histogram':'Download category & populate histogram';const message=document.createElement('p');message.setAttribute('role','status');message.textContent=category.local?'Downloaded locally. Histogram will load when visible.':'Not downloaded yet.';const chart=document.createElement('div');chart.className='category-chart';chart.textContent='Ink coverage histogram will appear here.';section.append(title,button,message,chart);const row={name:category.name,local:category.local,section,button,status:message,chart,queued:false,done:false};rows.push(row);button.onclick=()=>{observer.unobserve(section);enqueue(row,true);};list.append(section);if(category.local)observer.observe(section);}
    filter();
  }catch(error){status.textContent=error.message;retry.hidden=false;}}
  search.oninput=filter;retry.onclick=init;init();
})();
