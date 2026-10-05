(()=>{
 const nativeFetch=window.fetch.bind(window),worker=new Worker(new URL('./pages-worker.js',document.currentScript.src));
 let id=0;const pending=new Map();
 worker.onmessage=({data})=>{const resolve=pending.get(data.id);if(resolve){pending.delete(data.id);resolve(new Response(JSON.stringify(data.error?{error:data.error}:data.result),{status:data.error?502:200,headers:{'Content-Type':'application/json'}}));}};
 worker.onerror=()=>{for(const resolve of pending.values())resolve(new Response(JSON.stringify({error:'Browser data worker failed. Reload the page to retry.'}),{status:502}));pending.clear();};
 window.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.origin===location.origin&&url.pathname.startsWith('/api/'))return new Promise(resolve=>{const request=++id;pending.set(request,resolve);worker.postMessage({id:request,path:url.pathname,search:url.search});});return nativeFetch(input,options);};
})();
