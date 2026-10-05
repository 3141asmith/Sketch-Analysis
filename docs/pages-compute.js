const fs={createReadStream:file=>file},readline={createInterface:({input})=>input};
const Buffer={alloc:n=>{const bytes=new Uint8Array(n);bytes.toString=()=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);};return bytes;}};
const SIZE=279, RADIUS=1.5;
function coverage(drawing,accumulator) {
  const pixels=new Uint8Array(SIZE*SIZE);let count=0,maxX=0,maxY=0;
  for(const [xs,ys] of drawing){for(const x of xs)maxX=Math.max(maxX,x);for(const y of ys)maxY=Math.max(maxY,y);}
  const ox=12+(255-maxX)/2,oy=12+(255-maxY)/2;
  function segment(ax,ay,bx,by){
    const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
    for(let y=Math.max(0,Math.ceil(Math.min(ay,by)-RADIUS-.5));y<=Math.min(SIZE-1,Math.floor(Math.max(ay,by)+RADIUS-.5));y++){
      let low=0,high=1;
      if(dy){const t1=(y+.5-RADIUS-ay)/dy,t2=(y+.5+RADIUS-ay)/dy;low=Math.max(0,Math.min(t1,t2));high=Math.min(1,Math.max(t1,t2));if(low>high)continue;}
      const x1=ax+dx*low,x2=ax+dx*high;
      for(let x=Math.max(0,Math.ceil(Math.min(x1,x2)-RADIUS-.5));x<=Math.min(SIZE-1,Math.floor(Math.max(x1,x2)+RADIUS-.5));x++){
        const t=length?Math.max(0,Math.min(1,((x+.5-ax)*dx+(y+.5-ay)*dy)/length)):0;
        if((x+.5-ax-t*dx)**2+(y+.5-ay-t*dy)**2<=RADIUS*RADIUS){const i=y*SIZE+x;if(!pixels[i]){pixels[i]=1;count++;}}
      }
    }
  }
  for(const [xs,ys]of drawing)for(let i=0;i<xs.length;i++)segment(xs[Math.max(0,i-1)]+ox,ys[Math.max(0,i-1)]+oy,xs[i]+ox,ys[i]+oy);
  if(accumulator)for(let i=0;i<pixels.length;i++)accumulator[i]+=pixels[i];
  return count/(SIZE*SIZE)*100;
}


async function computeInk(lines,options={}){const workerData={file:lines,...options};let answer;const parentPort={postMessage:value=>answer=value};
await (async()=>{
  const bins=Array(100).fill(0),accumulator=new Uint32Array(279*279);let count=0,sum=0,min=100,max=0;
  for await(const line of readline.createInterface({input:fs.createReadStream(workerData.file),crlfDelay:Infinity})){
    if(!line.trim())continue;
    const value=coverage(JSON.parse(line).drawing,accumulator);bins[Math.min(99,Math.floor(value))]++;count++;sum+=value;min=Math.min(min,value);max=Math.max(max,value);
  }
  const average=Buffer.alloc(accumulator.length);for(let i=0;i<average.length;i++)average[i]=count?Math.round(255*accumulator[i]/count):0;
  parentPort.postMessage({bins,count,mean:count?sum/count:0,min:count?min:0,max,binWidth:1,average:average.toString('base64'),imageSize:279});
})().catch(error=>{throw error;});

return answer;}
async function computeAnalysis(lines,options={}){const workerData={file:lines,...options};let answer;const parentPort={postMessage:value=>answer=value};const {describe}=ShapeMatcher;
const group=()=>({count:0,strokes:0,length:0,symmetry:0,aspect:0,recognized:0});
const sum=group(),recognition={recognized:group(),unrecognized:group()},countries={},strokeBins={},lengthBins=Array(21).fill(0),sample=[];
function add(g,m,r){g.count++;for(const k of ['strokes','length','symmetry','aspect'])g[k]+=m[k];g.recognized+=r?1:0;}
function finish(g){return {...g,strokes:g.strokes/g.count,length:g.length/g.count,symmetry:g.symmetry/g.count,aspect:g.aspect/g.count,recognitionRate:g.recognized/g.count};}
function vector(record){const d=describe(record.drawing),v=new Float32Array(784);if(d)for(let i=0;i<784;i++)v[i]=Math.exp(-d.distances[i]*d.distances[i]/4);return v;}
function distance(a,b){let d=0;for(let i=0;i<a.length;i++)d+=(a[i]-b[i])**2;return d/a.length;}
function mean(vectors){const result=new Float32Array(784);for(const v of vectors)for(let i=0;i<784;i++)result[i]+=v[i]/vectors.length;return result;}
await (async()=>{
 let index=0;
 const targets=new Set(Array.from({length:Math.min(512,workerData.total)},(_,i)=>Math.floor(i*workerData.total/Math.min(512,workerData.total))));
 for await(const line of readline.createInterface({input:fs.createReadStream(workerData.file),crlfDelay:Infinity})){
  if(!line.trim())continue;const r=JSON.parse(line);let length=0,x0=Infinity,y0=Infinity,x1=0,y1=0;
  for(const [xs,ys]of r.drawing)for(let i=0;i<xs.length;i++){x0=Math.min(x0,xs[i]);y0=Math.min(y0,ys[i]);x1=Math.max(x1,xs[i]);y1=Math.max(y1,ys[i]);if(i)length+=Math.hypot(xs[i]-xs[i-1],ys[i]-ys[i-1]);}
  const d=describe(r.drawing);let overlap=0;if(d){const ink=new Set(d.points);for(const p of ink)if(ink.has(Math.floor(p/28)*28+27-p%28))overlap++;}
  const m={strokes:r.drawing.length,length,symmetry:d?overlap/d.points.length:0,aspect:Number.isFinite(x0)?(x1-x0+1)/(y1-y0+1):1};
  add(sum,m,r.recognized);add(recognition[r.recognized?'recognized':'unrecognized'],m,r.recognized);const country=r.countrycode||'Unknown';countries[country]??=group();add(countries[country],m,r.recognized);
  strokeBins[m.strokes]=(strokeBins[m.strokes]||0)+1;lengthBins[Math.min(20,Math.floor(length/250))]++;
  if(targets.has(index))sample.push({record:r,v:vector(r)});index++;
 }
 const avg=mean(sample.map(s=>s.v)),variation=Array.from(avg,(v,i)=>sample.reduce((sum,s)=>sum+(s.v[i]-v)**2,0)/sample.length);
 const k=Math.min(6,sample.length),centers=[sample[0].v.slice()];
 while(centers.length<k){let best=sample[0],score=-1;for(const s of sample){const d=Math.min(...centers.map(c=>distance(c,s.v)));if(d>score){score=d;best=s;}}centers.push(best.v.slice());}
 let assignments=[];
 for(let iteration=0;iteration<12;iteration++){assignments=sample.map(s=>{let best=0;for(let j=1;j<k;j++)if(distance(s.v,centers[j])<distance(s.v,centers[best]))best=j;return best;});for(let j=0;j<k;j++){const members=sample.filter((_,i)=>assignments[i]===j);if(members.length)centers[j]=mean(members.map(s=>s.v));}}
 const clusters=centers.map((c,j)=>{const members=sample.filter((_,i)=>assignments[i]===j);members.sort((a,b)=>distance(a.v,c)-distance(b.v,c));return {count:members.length,average:Array.from(c),representative:members[0]?.record};}).filter(c=>c.count);
 // Typicality uses average pairwise shape distance, rather than distance to a blurry pixel average.
 const scores=sample.map(s=>{let score=0;for(const other of sample)score+=distance(s.v,other.v);return {record:s.record,score:score/sample.length};}).sort((a,b)=>a.score-b.score);
 const order=Array.from({length:3},()=>new Float32Array(784));
 for(const s of sample)for(let stage=0;stage<3;stage++){const visited=new Uint8Array(784);const record={drawing:s.record.drawing.slice(0,Math.ceil(s.record.drawing.length*(stage+1)/3))};
  // Keep the original coordinate frame for stroke-order maps.
  let mx=0,my=0;for(const [xs,ys]of s.record.drawing){for(const x of xs)mx=Math.max(mx,x);for(const y of ys)my=Math.max(my,y);}
  for(const [xs,ys]of record.drawing)for(let i=0;i<xs.length;i++){const x=(xs[i]+(255-mx)/2)/255*25+1,y=(ys[i]+(255-my)/2)/255*25+1;const px=i?(xs[i-1]+(255-mx)/2)/255*25+1:x,py=i?(ys[i-1]+(255-my)/2)/255*25+1:y;const steps=Math.max(1,Math.ceil(Math.hypot(x-px,y-py)*2));for(let t=0;t<=steps;t++)visited[Math.round(py+(y-py)*t/steps)*28+Math.round(px+(x-px)*t/steps)]=1;}
  for(let i=0;i<784;i++)order[stage][i]+=visited[i]/sample.length;
 }
 const similarities=workerData.comparisons.map(c=>({category:c.category,count:c.drawings.length,distance:distance(avg,mean(c.drawings.map(vector)))})).sort((a,b)=>a.distance-b.distance);
 parentPort.postMessage({total:index,summary:finish(sum),recognition:Object.fromEntries(Object.entries(recognition).filter(([,g])=>g.count).map(([k,g])=>[k,finish(g)])),countries:Object.entries(countries).map(([country,g])=>({country,...finish(g)})).sort((a,b)=>b.count-a.count),strokeBins,lengthBins,sampleSize:sample.length,average:Array.from(avg),variation,clusters,typical:scores.slice(0,6),unusual:scores.slice(-6).reverse(),order:order.map(v=>Array.from(v)),similarities});
})().catch(error=>{throw error;});

return answer;}
