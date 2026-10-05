importScripts('./matcher.js','./pages-compute.js');
const database=new Promise((resolve,reject)=>{const request=indexedDB.open('sketch-analysis-v1',1);request.onupgradeneeded=()=>{request.result.createObjectStore('data');request.result.createObjectStore('results');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
async function storage(store,method,key,value){const db=await database;return new Promise((resolve,reject)=>{const tx=db.transaction(store,method==='put'?'readwrite':'readonly'),object=tx.objectStore(store);const request=method==='put'?object.put(value,key):method==='getAllKeys'?object.getAllKeys():object.get(key);let result;request.onsuccess=()=>result=request.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Browser storage unavailable'));});}
let names=null,activeName='',activeLines=null;
async function categories(){if(!names){const r=await fetch('./categories.txt');if(!r.ok)throw Error('Could not load categories');names=(await r.text()).trim().split(/\r?\n/);}return names;}
async function linesFor(category){
 if(!(await categories()).includes(category))throw Error('Unknown category');
 if(activeName===category&&activeLines)return activeLines;
 let blob=await storage('data','get',category);
 if(!blob){const response=await fetch('https://storage.googleapis.com/download/storage/v1/b/quickdraw_dataset/o/'+encodeURIComponent('full/simplified/'+category+'.ndjson')+'?alt=media');if(!response.ok)throw Error('Dataset download failed. Please retry.');blob=await response.blob();try{await storage('data','put',category,blob);}catch{throw Error('Not enough browser storage for this category. Free some space and retry.');}}
 activeLines=null;activeName='';const text=await blob.text();const lines=text.trim().split('\n');activeLines=lines;activeName=category;return lines;
}
function page(lines,number,size=48){const pages=Math.max(1,Math.ceil(lines.length/size));number=Math.min(number,pages);return {page:number,pages,total:lines.length,drawings:lines.slice((number-1)*size,number*size).map(JSON.parse)};}
function sample(lines,size=512){return Array.from({length:Math.min(size,lines.length)},(_,i)=>JSON.parse(lines[Math.floor(i*lines.length/Math.min(size,lines.length))]));}
async function handle(path,query){
 const p=new URLSearchParams(query),category=p.get('category')||'cat',number=Number(p.get('page')||1);
 if(!Number.isSafeInteger(number)||number<1)throw Error('Invalid page');
 if(path==='/api/categories'){const local=await storage('data','getAllKeys');return (await categories()).map(name=>({name,local:local.includes(name)}));}
 if(path==='/api/match-references'){let local=await storage('data','getAllKeys');if(!local.length){await linesFor('cat');local=['cat'];}const drawings=[];for(const c of local)drawings.push(...sample(await linesFor(c)));return {categories:local,drawings,perCategory:512};}
 const lines=await linesFor(category);
 if(path==='/api/drawings')return {category,...page(lines,number)};
 if(path==='/api/country-drawings'){const country=p.get('country');const filtered=lines.filter(line=>(JSON.parse(line).countrycode||'Unknown')===country);return {category,country,...page(filtered,number)};}
 if(path==='/api/ink-stats'){const key='ink-v1:'+category;let result=await storage('results','get',key);if(!result){result={category,...await computeInk(lines)};await storage('results','put',key,result);}return result;}
 if(path==='/api/analysis'){
  const local=(await storage('data','getAllKeys')).sort(),key='analysis-v1:'+category+':'+local.join('|');let result=await storage('results','get',key);
  if(!result){const comparisons=[];for(const c of local)if(c!==category)comparisons.push({category:c,drawings:sample(await linesFor(c),48)});result={category,...await computeAnalysis(lines,{total:lines.length,comparisons})};await storage('results','put',key,result);}return result;
 }
 throw Error('Unknown data request');
}
let queue=Promise.resolve();onmessage=({data})=>{queue=queue.then(async()=>{try{postMessage({id:data.id,result:await handle(data.path,data.search)});}catch(error){postMessage({id:data.id,error:error.message});}});};
