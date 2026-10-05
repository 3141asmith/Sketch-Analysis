const $=id=>document.getElementById(id),canvas=$('life-canvas'),ctx=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let rig=[],record=null,strokes=[],category='cat',kind='walk',running=!reduced.matches,time=0,last=0,request=0,loading=false;
function controls(){for(const id of ['life-new','life-play','life-replay'])$(id).disabled=loading||!record;$('life-play').textContent=running?'Pause':'Play';}
function prepare(r){let mx=0,my=0;for(const[xs,ys]of r.drawing){for(const x of xs)mx=Math.max(mx,x);for(const y of ys)my=Math.max(my,y);}return r.drawing.map(([xs,ys])=>{const points=[];for(let i=0;i<xs.length;i++){const x=xs[i]-mx/2,y=ys[i]-my/2,px=i?xs[i-1]-mx/2:x,py=i?ys[i-1]-my/2:y,n=Math.max(1,Math.ceil(Math.hypot(x-px,y-py)/4));if(!i)points.push([x,y]);else for(let j=1;j<=n;j++)points.push([px+(x-px)*j/n,py+(y-py)*j/n]);}return points;});}
async function api(url){const r=await fetch(url);const d=await r.json();if(!r.ok)throw Error(d.error||'Could not load this category.');return d;}
async function load(){const token=++request;loading=true;record=null;strokes=[];controls();$('life-retry').hidden=true;$('life-title').textContent=category;$('life-meta').textContent='';$('life-status').textContent='Picking a drawing… New categories download on first use.';draw();try{
 const first=await api('/api/drawings?category='+encodeURIComponent(category)+'&page=1');if(token!==request)return;const index=Math.floor(Math.random()*first.total),page=Math.floor(index/48)+1;
 const data=page===1?first:await api('/api/drawings?category='+encodeURIComponent(category)+'&page='+page);if(token!==request)return;
 record=data.drawings[index%48];strokes=prepare(record);kind=LifeMotion.mode(category);rig=LifeMotion.rig(strokes,kind);time=0;last=0;running=!reduced.matches;$('life-badge').textContent=LifeMotion.labels[kind];$('life-meta').textContent=`${record.countrycode} · Drawing ${record.key_id}`;canvas.setAttribute('aria-label',`Animated ${category}: ${LifeMotion.labels[kind]}`);$('life-status').textContent=reduced.matches?'Motion is paused to respect your reduced-motion preference. Press Play to animate.':'A random drawing, brought to life. Try another to meet a different character.';
 }catch(error){if(token!==request)return;$('life-status').textContent=error.message;$('life-retry').hidden=false;}finally{if(token===request){loading=false;controls();draw();}}}
function path(points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function draw(){
 ctx.clearRect(0,0,1000,650);if(!record)return;const p=LifeMotion.pose(kind,time),cx=500+p.x;let cy=335+p.y;if(['walk','crawl','drive','hop','bounce'].includes(kind)){let bottom=0;for(const stroke of strokes)for(const point of stroke)bottom=Math.max(bottom,point[1]);cy=552-bottom*1.45*p.sy+p.y;}
 ctx.fillStyle='#64794b12';ctx.beginPath();ctx.ellipse(500+p.x,554,150*(1+Math.min(0,p.y)/300),15,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#93b1ac';ctx.lineWidth=2;
 if(['swim','float'].includes(kind)){for(let row=0;row<3;row++)path(Array.from({length:101},(_,i)=>[i*10,510+row*22+Math.sin(i*.3+time*2+row)*7]));}
 if(['drive','walk','crawl','hop','bounce'].includes(kind)){ctx.strokeStyle='#d5ddc9';path([[70,555],[930,555]]);}
 if(['fly','drive'].includes(kind)){ctx.strokeStyle='#b6c8ab';for(let i=0;i<6;i++){const x=1000-((time*120+i*180)%1100);path([[x,150+i*65],[x+45,150+i*65]]);}}
 if(kind==='rain'){ctx.strokeStyle='#9abfc9';for(let i=0;i<24;i++){const x=130+(i*73)%740,y=100+(i*37+time*150)%450;path([[x,y],[x-7,y+18]]);}}
 if(kind==='glow'){ctx.strokeStyle='#dcb85d';for(let i=0;i<12;i++){const a=i*Math.PI/6,len=20+8*Math.sin(time*2+i);path([[cx+220*Math.cos(a),cy+220*Math.sin(a)],[cx+(220+len)*Math.cos(a),cy+(220+len)*Math.sin(a)]]);}}
 if(kind==='music'){ctx.fillStyle='#80965d';ctx.font='30px Georgia';for(let i=0;i<5;i++)ctx.fillText(i%2?'♪':'♫',cx-240+i*110,150-((time*35+i*20)%65));}
 if(kind==='steam'){ctx.strokeStyle='#bac2af';for(let i=0;i<3;i++)path(Array.from({length:20},(_,j)=>[cx-55+i*55+8*Math.sin(j*.3+time*2),cy-180-j*4]));}
 if(kind==='write'){ctx.strokeStyle='#adc09b';path(Array.from({length:65},(_,i)=>[cx-130+i*4,cy+190+Math.sin(i*.2)*9]));}
 LifeEffects.draw(ctx,kind,category,time,cx,cy);ctx.save();ctx.translate(cx,cy);ctx.rotate(p.angle);ctx.scale(1.45*p.sx,1.45*p.sy);ctx.strokeStyle=ctx.fillStyle='#2b3526';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<strokes.length;i++){const stroke=strokes[i];if(!stroke.length)continue;const points=stroke.map(([x,y])=>LifeMotion.warp(kind,x,y,time,category,rig[i]));path(points);if(points.length===1){ctx.beginPath();ctx.arc(...points[0],1.5,0,Math.PI*2);ctx.fill();}}ctx.restore();
}
function frame(now){if(running&&!document.hidden&&record){time+=last?Math.min((now-last)/1000,.05):0;draw();}last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
$('life-category').onchange=()=>{category=$('life-category').value;load();};$('life-new').onclick=load;$('life-retry').onclick=()=>$('life-category').options.length?load():init();$('life-play').onclick=()=>{running=!running;last=0;controls();document.getElementById("life-status").textContent=running?'Your sketch is on the move.':'Paused.';};$('life-replay').onclick=()=>{time=0;last=0;running=true;controls();document.getElementById("life-status").textContent='Starting the motion again.';draw();};
reduced.addEventListener('change',()=>{if(reduced.matches){running=false;controls();}});
async function init(){try{const categories=await api('/api/categories');$('life-category').replaceChildren(...categories.map(c=>{const o=document.createElement('option');o.value=c.name;o.textContent=c.name+(c.local?' · downloaded':'');return o;}));$('life-category').value=category;$('life-category').disabled=false;await load();}catch(error){$('life-status').textContent=error.message;$('life-retry').hidden=false;}}init();
