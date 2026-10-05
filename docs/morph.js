(function(root){
  function strokes(record){
    let mx=0,my=0;for(const [xs,ys]of record.drawing){for(const x of xs)mx=Math.max(mx,x);for(const y of ys)my=Math.max(my,y);}
    return record.drawing.filter(s=>s[0].length).map(([xs,ys])=>xs.map((x,i)=>[x+12+(255-mx)/2,ys[i]+12+(255-my)/2]));
  }
  function path(points){
    const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
    const length=lengths.at(-1);return {points,knots: length?lengths.map(n=>n/length):points.map(()=>0)};
  }
  function at(p,t){
    if(t>=1)return p.points.at(-1);let i=1;while(i<p.knots.length&&p.knots[i]<t)i++;if(i===p.knots.length)return p.points[0];
    const fraction=(t-p.knots[i-1])/(p.knots[i]-p.knots[i-1]||1);return p.points[i].map((n,k)=>p.points[i-1][k]+(n-p.points[i-1][k])*fraction);
  }
  function cost(a,b,reverse){let sum=0;for(let i=0;i<16;i++){const p=at(a,i/15),q=at(b,reverse?1-i/15:i/15);sum+=(p[0]-q[0])**2+(p[1]-q[1])**2;}return sum;}
  function collapse(p){const c=[0,0];for(let i=0;i<16;i++){const point=at(p,i/15);c[0]+=point[0]/16;c[1]+=point[1]/16;}return path([c]);}
  function pair(a,b,fromWidth=1,toWidth=1){
    // Include every original corner from both paths, preserving exact endpoint geometry.
    const knots=[...new Set([0,1,...a.knots,...b.knots])].sort((x,y)=>x-y);
    return {from:knots.map(t=>at(a,t)),to:knots.map(t=>at(b,t)),fromWidth,toWidth};
  }
  function prepare(first,second){
    const a=strokes(first).map(path),b=strokes(second).map(path),candidates=[];
    for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){const forward=cost(a[i],b[j],false),backward=cost(a[i],b[j],true);candidates.push({i,j,reverse:backward<forward,cost:Math.min(forward,backward)});}
    candidates.sort((x,y)=>x.cost-y.cost);const usedA=new Set(),usedB=new Set(),pairs=[];
    for(const c of candidates){if(usedA.has(c.i)||usedB.has(c.j))continue;usedA.add(c.i);usedB.add(c.j);pairs.push(pair(a[c.i],c.reverse?path([...b[c.j].points].reverse()):b[c.j]));}
    a.forEach((p,i)=>{if(!usedA.has(i))pairs.push(pair(p,collapse(p),1,0));});
    b.forEach((p,i)=>{if(!usedB.has(i))pairs.push(pair(collapse(p),p,0,1));});return pairs;
  }
  function interpolate(pairs,t){return pairs.map(p=>({points:p.from.map((point,i)=>point.map((n,k)=>n+(p.to[i][k]-n)*t)),width:p.fromWidth+(p.toWidth-p.fromWidth)*t}));}
  const api={prepare,interpolate};if(typeof module!=='undefined')module.exports=api;else root.StrokeMorph=api;
})(globalThis);
