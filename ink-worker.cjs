const {parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs');
const readline=require('node:readline');
const {coverage}=require('./ink.cjs');
(async()=>{
  const bins=Array(100).fill(0),accumulator=new Uint32Array(279*279);let count=0,sum=0,min=100,max=0;
  for await(const line of readline.createInterface({input:fs.createReadStream(workerData.file),crlfDelay:Infinity})){
    if(!line.trim())continue;
    const value=coverage(JSON.parse(line).drawing,accumulator);bins[Math.min(99,Math.floor(value))]++;count++;sum+=value;min=Math.min(min,value);max=Math.max(max,value);
  }
  const average=Buffer.alloc(accumulator.length);for(let i=0;i<average.length;i++)average[i]=count?Math.round(255*accumulator[i]/count):0;
  parentPort.postMessage({bins,count,mean:count?sum/count:0,min:count?min:0,max,binWidth:1,average:average.toString('base64'),imageSize:279});
})().catch(error=>{throw error;});
