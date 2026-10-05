const fs=require('node:fs'),path=require('node:path'),{Worker}=require('node:worker_threads'),dataset=require('./dataset.cjs');
const jobs=new Map();
async function analyze(category){
 if(jobs.has(category))return jobs.get(category);
 const job=(async()=>{
  const offsets=await dataset.prepare(category),file=dataset.fileFor(category),stat=fs.statSync(file);
  const local=dataset.categories.filter(c=>fs.existsSync(dataset.fileFor(c))),key='v2:'+stat.size+':'+stat.mtimeMs+':'+local.join('|'),cache=file+'.analysis.json';
  try{const saved=JSON.parse(fs.readFileSync(cache,'utf8'));if(saved.key===key)return saved;}catch{}
  const comparisons=[];for(const c of local){if(c===category)continue;const o=await dataset.prepare(c),drawings=[];const pages=Math.ceil((o.length-1)/16);for(const p of new Set([1,Math.ceil(pages/2),pages]))drawings.push(...(await dataset.page(c,p,16)).drawings);comparisons.push({category:c,drawings});}
  const result=await new Promise((resolve,reject)=>{const w=new Worker(path.join(__dirname,'analysis-worker.cjs'),{workerData:{file,total:offsets.length-1,comparisons}});let done=false;w.once('message',r=>{done=true;resolve(r);});w.once('error',reject);w.once('exit',code=>{if(!done)reject(new Error('Analysis worker exited '+code));});});
  const saved={key,category,...result};await fs.promises.writeFile(cache,JSON.stringify(saved));return saved;
 })();jobs.set(category,job);try{return await job;}finally{jobs.delete(category);}
}
module.exports={analyze};
