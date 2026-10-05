const fs=require('node:fs'),readline=require('node:readline'),dataset=require('./dataset.cjs');
const indexes=new Map();
async function countryPage(category,country,page){
 await dataset.prepare(category);
 if(!indexes.has(category)){
  const promise=(async()=>{const groups=new Map();let offset=0;for await(const line of readline.createInterface({input:fs.createReadStream(dataset.fileFor(category)),crlfDelay:Infinity})){if(line.trim()){const record=JSON.parse(line),key=record.countrycode||'Unknown';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(offset);}offset++;}return groups;})();indexes.set(category,promise);promise.catch(()=>indexes.delete(category));
 }
 const groups=await indexes.get(category),rows=groups.get(country)||[],total=rows.length,pages=Math.max(1,Math.ceil(total/48));page=Math.min(page,pages);
 const drawings=[];for(const index of rows.slice((page-1)*48,page*48)){const result=await dataset.page(category,index+1,1);drawings.push(result.drawings[0]);}
 return {category,country,total,pages,page,drawings};
}
module.exports={countryPage};
