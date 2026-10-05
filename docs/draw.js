const $=id=>document.getElementById(id), canvas=$('sketch'), ctx=canvas.getContext('2d');
let strokes=[], active=null, pointer=null, worker=null, ready=false, inFlight=false, version=0, sentVersion=-1, timer=null;
function paint(){
  ctx.clearRect(0,0,560,560);ctx.strokeStyle='#252923';ctx.fillStyle='#252923';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
  for(const [xs,ys] of strokes){ctx.beginPath();ctx.moveTo(xs[0],ys[0]);for(let i=1;i<xs.length;i++)ctx.lineTo(xs[i],ys[i]);ctx.stroke();if(xs.length===1){ctx.beginPath();ctx.arc(xs[0],ys[0],2,0,Math.PI*2);ctx.fill();}}
  $('hint').hidden=strokes.length>0;$('undo').disabled=$('clear').disabled=!strokes.length;
}
function emptyMatch(){ $('match-image').replaceChildren();const p=document.createElement('p');p.textContent='Your match will appear here.';$('match-image').append(p);$('match-name').textContent='A little inspiration awaits';$('match-meta').textContent='An actual drawing from Quick, Draw!';}
function changed(){version++;paint();if(!strokes.length){emptyMatch();if(ready)$('match-status').textContent='Ready when you are. Start drawing to find a match.';}schedule();}
function schedule(){if(!timer)timer=setTimeout(()=>{timer=null;send();},90);}
function send(){if(!ready||inFlight||!strokes.length||sentVersion===version)return;inFlight=true;sentVersion=version;worker.postMessage({type:'match',strokes,version});}
function point(event){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(560,(event.clientX-r.left)*560/r.width)),Math.max(0,Math.min(560,(event.clientY-r.top)*560/r.height))];}
function add(event){const [x,y]=point(event),[xs,ys]=active;if(!xs.length||Math.hypot(x-xs.at(-1),y-ys.at(-1))>.8){xs.push(x);ys.push(y);}}
canvas.onpointerdown=event=>{if(pointer!==null||event.button!==0)return;event.preventDefault();pointer=event.pointerId;canvas.setPointerCapture(pointer);active=[[],[]];strokes.push(active);add(event);changed();};
canvas.onpointermove=event=>{if(event.pointerId!==pointer||!active)return;const events=event.getCoalescedEvents?.();for(const item of events?.length?events:[event])add(item);changed();};
function finish(event){if(event.pointerId!==pointer)return;if(event.type==='pointerup')add(event);active=null;pointer=null;changed();}
canvas.onpointerup=finish;canvas.onpointercancel=finish;canvas.onlostpointercapture=event=>{if(pointer===event.pointerId){active=null;pointer=null;}};
function stopStroke(){if(pointer!==null&&canvas.hasPointerCapture(pointer))canvas.releasePointerCapture(pointer);active=null;pointer=null;}
$('undo').onclick=()=>{stopStroke();strokes.pop();changed();};
$('clear').onclick=()=>{stopStroke();strokes=[];changed();};
function showMatch(record){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','-12 -12 279 279');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Dataset drawing of ${record.word}`);
  let maxX=0,maxY=0;for(const [xs,ys]of record.drawing){for(const x of xs)maxX=Math.max(maxX,x);for(const y of ys)maxY=Math.max(maxY,y);}
  const group=document.createElementNS(ns,'g');group.setAttribute('transform',`translate(${(255-maxX)/2} ${(255-maxY)/2})`);group.setAttribute('fill','none');group.setAttribute('stroke','#252923');group.setAttribute('stroke-width','3');group.setAttribute('stroke-linecap','round');group.setAttribute('stroke-linejoin','round');
  for(const [xs,ys]of record.drawing){const shape=document.createElementNS(ns,xs.length===1?'circle':'polyline');if(xs.length===1){shape.setAttribute('cx',xs[0]);shape.setAttribute('cy',ys[0]);shape.setAttribute('r','1.5');}else shape.setAttribute('points',xs.map((x,i)=>`${x},${ys[i]}`).join(' '));group.append(shape);}svg.append(group);$('match-image').replaceChildren(svg);
  $('match-name').textContent=record.word;$('match-meta').textContent=`${record.countrycode} · Drawing ${record.key_id}`;$('match-status').textContent='Live match updated. Keep drawing to refine it.';
}
function fail(message){ready=false;inFlight=false;worker?.terminate();$('match-status').textContent=message;$('retry-match').hidden=false;}
async function init(){
  worker?.terminate();ready=false;inFlight=false;sentVersion=-1;$('retry-match').hidden=true;$('match-status').textContent='Loading local drawings for matching…';
  try{
    const response=await fetch('/api/match-references');if(!response.ok)throw new Error('Could not load local drawings. Please retry.');const data=await response.json();
    if(!data.drawings.length)throw new Error('Open a category in the gallery to download drawings, then retry here.');
    $('coverage').textContent=`Matching against ${data.drawings.length.toLocaleString()} real drawings across ${data.categories.length} downloaded categories: ${data.categories.join(', ')}.`;
    worker=new Worker('./match-worker.js');worker.onerror=()=>fail('Matching could not start. Please retry.');
    worker.onmessage=({data:result})=>{
      if(result.type==='error'){fail('Matching failed. Please retry.');return;}
      if(result.type==='ready'){ready=true;$('match-status').textContent='Ready when you are. Start drawing to find a match.';send();return;}
      inFlight=false;
      if(result.version===version&&strokes.length&&result.record)showMatch(result.record);
      if(sentVersion!==version)schedule();
    };
    worker.postMessage({type:'init',drawings:data.drawings});
  }catch(error){fail(error.message);}
}
$('retry-match').onclick=init;paint();init();
