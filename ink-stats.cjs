const fs=require('node:fs/promises');
const {Worker}=require('node:worker_threads');
const path=require('node:path');
const dataset=require('./dataset.cjs');
const jobs=new Map();
async function statistics(category){
  if(jobs.has(category))return jobs.get(category);
  const job=(async()=>{
    await dataset.prepare(category);const file=dataset.fileFor(category),stat=await fs.stat(file),cache=file+'.ink.json';
    const key=`v2:${stat.size}:${stat.mtimeMs}`;
    try{const saved=JSON.parse(await fs.readFile(cache,'utf8'));if(saved.key===key)return saved;}catch{}
    const data=await new Promise((resolve,reject)=>{
      const worker=new Worker(path.join(__dirname,'ink-worker.cjs'),{workerData:{file}});let received=false;
      worker.once('message',result=>{received=true;resolve(result);});worker.once('error',reject);worker.once('exit',code=>{if(!received)reject(new Error('Ink analysis exited: '+code));});
    });
    const result={...data,key,category};await fs.writeFile(cache,JSON.stringify(result));return result;
  })();jobs.set(category,job);try{return await job;}finally{jobs.delete(category);}
}
module.exports={statistics};
