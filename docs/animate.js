const $=id=>document.getElementById(id), canvas=$('animation'), ctx=canvas.getContext('2d');
let category='cat', index=0, total=0, current=null, next=null, playing=false, elapsed=0, lastTime=0, generation=0, busy=false, failed=false;
const cache=new Map();
let morph=null;
let renderedProgress=0;
const heatHistory=new Float64Array(10000),heatSeen=new Set();
let heatCategory='';
const inkFrame=document.createElement('canvas');inkFrame.width=inkFrame.height=700;
const inkContext=inkFrame.getContext('2d');
const heatCanvas=document.createElement('canvas');heatCanvas.width=heatCanvas.height=100;
const heatContext=heatCanvas.getContext('2d',{willReadFrequently:true});
function overlayHeatmap(){
  if(!current)return;
  if(heatCategory!==category){heatCategory=category;heatHistory.fill(0);heatSeen.clear();}
  const addDrawing=renderedProgress===0&&!heatSeen.has(current.key_id);
  if(!$('heatmap').checked&&!addDrawing)return;
  inkContext.clearRect(0,0,700,700);inkContext.drawImage(canvas,0,0);
  heatContext.clearRect(0,0,100,100);heatContext.drawImage(canvas,0,0,100,100);
  const source=heatContext.getImageData(0,0,100,100),integral=new Float32Array(101*101),density=new Float32Array(10000);let peak=0;
  for(let y=0;y<100;y++){let sum=0;for(let x=0;x<100;x++){sum+=source.data[(y*100+x)*4+3]/255;integral[(y+1)*101+x+1]=integral[y*101+x+1]+sum;}}
  for(let y=0;y<100;y++)for(let x=0;x<100;x++){
    const x0=Math.max(0,x-4),x1=Math.min(100,x+5),y0=Math.max(0,y-4),y1=Math.min(100,y+5);
    const value=(integral[y1*101+x1]-integral[y0*101+x1]-integral[y1*101+x0]+integral[y0*101+x0])/((x1-x0)*(y1-y0));density[y*100+x]=value;peak=Math.max(peak,value);
  }
  if(addDrawing){for(let i=0;i<density.length;i++)heatHistory[i]+=Math.max(0,density[i]);heatSeen.add(current.key_id);}
  if(!$('heatmap').checked)return;
  peak=0;
  for(let i=0;i<density.length;i++){
    density[i]=heatHistory[i]+(renderedProgress>0?Math.max(0,density[i])*renderedProgress:0);
    peak=Math.max(peak,density[i]);
  }
  $('heatmap-count').textContent=`${heatSeen.size.toLocaleString()} drawings accumulated`;
  const colors=[[45,92,210],[37,193,187],[248,218,76],[224,53,40]];
  for(let i=0;i<density.length;i++){
    const value=peak?Math.max(0,Math.min(1,density[i]/peak)):0,position=value*3,segment=Math.min(2,Math.floor(position)),fraction=position-segment;
    for(let k=0;k<3;k++)source.data[i*4+k]=colors[segment][k]+(colors[segment+1][k]-colors[segment][k])*fraction;
    source.data[i*4+3]=value>0?Math.round(190*Math.sqrt(value)):0;
  }
  heatContext.putImageData(source,0,0);ctx.clearRect(0,0,700,700);ctx.drawImage(heatCanvas,0,0,700,700);ctx.drawImage(inkFrame,0,0);
}
const duration=()=>1000/Number($('speed').value);
function controls(){ $('play').textContent=playing?'Pause':'Play';$('play').disabled=!current||busy||failed;$('next-drawing').disabled=!current||busy||failed;$('jump-button').disabled=!total||busy; }
function drawRecord(record,alpha){
  if(!record||alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(65,65);ctx.scale(570/279,570/279);
  let mx=0,my=0;for(const [xs,ys]of record.drawing){for(const x of xs)mx=Math.max(mx,x);for(const y of ys)my=Math.max(my,y);}
  ctx.translate(12+(255-mx)/2,12+(255-my)/2);ctx.strokeStyle=ctx.fillStyle='#252923';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
  for(const [xs,ys]of record.drawing){if(!xs.length)continue;ctx.beginPath();ctx.moveTo(xs[0],ys[0]);for(let i=1;i<xs.length;i++)ctx.lineTo(xs[i],ys[i]);ctx.stroke();if(xs.length===1){ctx.beginPath();ctx.arc(xs[0],ys[0],1.5,0,Math.PI*2);ctx.fill();}}ctx.restore();
}
function render(progress=0){
  renderedProgress=progress;
  ctx.clearRect(0,0,700,700);
  if(!morph||progress===0){drawRecord(current,1);overlayHeatmap();return;}
  ctx.save();ctx.translate(65,65);ctx.scale(570/279,570/279);ctx.strokeStyle=ctx.fillStyle='#252923';ctx.lineCap='round';ctx.lineJoin='round';
  for(const stroke of StrokeMorph.interpolate(morph,progress)){
    if(stroke.width<=0)continue;ctx.lineWidth=3*stroke.width;ctx.beginPath();ctx.moveTo(...stroke.points[0]);for(const point of stroke.points.slice(1))ctx.lineTo(...point);ctx.stroke();
    if(stroke.points.every(p=>p[0]===stroke.points[0][0]&&p[1]===stroke.points[0][1])){ctx.beginPath();ctx.arc(...stroke.points[0],ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
  }ctx.restore();overlayHeatmap();
}
function caption(){ $('drawing-title').textContent=category;$('position').textContent=`Drawing ${(index+1).toLocaleString()} of ${total.toLocaleString()}`;$('animation').setAttribute('aria-label',`${category} drawing ${index+1}`);$('jump').value=index+1;$('jump').max=total; }
async function batch(number,token){
  if(cache.has(number))return cache.get(number);
  const promise=(async()=>{const response=await fetch(`/api/drawings?category=${encodeURIComponent(category)}&page=${number}`);const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load drawings.');return data;})();
  cache.set(number,promise);
  try{return await promise;}catch(error){if(token===generation)cache.delete(number);throw error;}
}
async function record(at,token){const data=await batch(Math.floor(at/48)+1,token);return data.drawings[at%48];}
function report(error,token){if(token!==generation)return;playing=false;failed=true;$('animation-status').textContent=error.message;$('retry-animation').hidden=false;controls();}
async function prepareNext(token){
  try{const upcoming=await record((index+1)%total,token);if(token!==generation)return;next=upcoming;morph=StrokeMorph.prepare(current,next);
    // Retain only the active batch and its neighbor; prefetch across batch boundaries.
    const activePage=Math.floor(index/48)+1, futurePage=Math.floor(((index+48)%total)/48)+1;
    for(const key of cache.keys())if(key!==activePage&&key!==futurePage)cache.delete(key);
    batch(futurePage,token).catch(()=>{});
  }catch(error){report(error,token);}
}
async function load(at=0){
  const token=++generation;playing=false;busy=true;failed=false;current=next=null;morph=null;elapsed=0;cache.clear();render();controls();$('retry-animation').hidden=true;$('animation-status').textContent='Loading category… First-time downloads may take a few minutes.';
  try{const data=await batch(Math.floor(at/48)+1,token);if(token!==generation)return;total=data.total;index=Math.min(at,total-1);current=data.drawings[index%48];caption();render();await prepareNext(token);if(token!==generation)return;if(!failed)$('animation-status').textContent='Ready. Press Play to animate this category.';}
  catch(error){report(error,token);}finally{if(token===generation){busy=false;controls();}}
}
async function advance(){if(!next)return false;current=next;next=null;morph=null;index=(index+1)%total;elapsed=0;caption();render();await prepareNext(generation);return true;}
async function frame(time){
  const delta=lastTime?Math.min(time-lastTime,250):0;lastTime=time;
  if(playing&&!document.hidden&&current){
    if(next){
      elapsed+=delta;const token=generation;
      // Carry fractional time forward and advance multiple records per display frame.
      while(elapsed>=duration()&&next&&playing&&!document.hidden&&token===generation){
        const remaining=elapsed-duration();await advance();
        if(token!==generation)break;elapsed=remaining;
      }
      if(token===generation&&current){const p=Math.min(1,Math.max(0,(elapsed/duration()-.35)/.65));render(p*p*(3-2*p));}
    }
  }
  requestAnimationFrame(frame);
}
$('play').onclick=()=>{playing=!playing;lastTime=0;controls();$('animation-status').textContent=playing?'Playing all drawings in order.':'Paused.';};
$('heatmap').onchange=()=>{$('heatmap-legend').hidden=!$('heatmap').checked;render(renderedProgress);};
$('next-drawing').onclick=async()=>{playing=false;controls();if(await advance())$('animation-status').textContent='Paused. Showing the next drawing.';};
$('category').onchange=()=>{category=$('category').value;total=0;index=0;load();};
$('speed').onchange=()=>{elapsed=0;lastTime=0;render();};
$('jump-form').onsubmit=event=>{event.preventDefault();const number=Number($('jump').value);if(Number.isSafeInteger(number)&&number>=1&&number<=total)load(number-1);};
$('retry-animation').onclick=()=>total?load(index):init();
async function init(){try{const response=await fetch('/api/categories');if(!response.ok)throw new Error('Could not load categories. Please retry.');const categories=await response.json();$('category').replaceChildren(...categories.map(item=>{const option=document.createElement('option');option.value=item.name;option.textContent=item.name+(item.local?' · downloaded':'');return option;}));$('category').value=category;await load();}catch(error){report(error,generation);}}
requestAnimationFrame(frame);init();
