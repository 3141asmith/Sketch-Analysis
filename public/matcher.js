/* Shared deterministic shape comparison; no model, remote service or training required. */
(function (root) {
  const N = 28, SIZE = N * N;
  function describe(strokes) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [xs, ys] of strokes) for (let i=0;i<xs.length;i++) {
      minX=Math.min(minX,xs[i]); maxX=Math.max(maxX,xs[i]); minY=Math.min(minY,ys[i]); maxY=Math.max(maxY,ys[i]);
    }
    if (!Number.isFinite(minX)) return null;
    const scale = (N-5)/Math.max(maxX-minX,maxY-minY,1);
    const ox=(N-1-(maxX-minX)*scale)/2, oy=(N-1-(maxY-minY)*scale)/2;
    const ink = new Uint8Array(SIZE);
    const dot = (x,y) => {ink[Math.max(0,Math.min(N-1,Math.round(y)))*N+Math.max(0,Math.min(N-1,Math.round(x)))]=1;};
    for (const [xs,ys] of strokes) for (let i=0;i<xs.length;i++) {
      const x=(xs[i]-minX)*scale+ox, y=(ys[i]-minY)*scale+oy;
      const px=i ? (xs[i-1]-minX)*scale+ox : x, py=i ? (ys[i-1]-minY)*scale+oy : y;
      const steps=Math.max(1,Math.ceil(Math.hypot(x-px,y-py)*2));
      for(let j=0;j<=steps;j++) dot(px+(x-px)*j/steps,py+(y-py)*j/steps);
    }
    const points=[]; const distances=new Float32Array(SIZE);
    for(let i=0;i<SIZE;i++){distances[i]=ink[i]?0:100; if(ink[i]) points.push(i);}
    // Two-pass chamfer distance transform, including diagonal neighbors.
    for(let y=0;y<N;y++) for(let x=0;x<N;x++) {
      const i=y*N+x;
      if(x) distances[i]=Math.min(distances[i],distances[i-1]+1);
      if(y) distances[i]=Math.min(distances[i],distances[i-N]+1);
      if(x&&y) distances[i]=Math.min(distances[i],distances[i-N-1]+Math.SQRT2);
      if(x<N-1&&y) distances[i]=Math.min(distances[i],distances[i-N+1]+Math.SQRT2);
    }
    for(let y=N-1;y>=0;y--) for(let x=N-1;x>=0;x--) {
      const i=y*N+x;
      if(x<N-1) distances[i]=Math.min(distances[i],distances[i+1]+1);
      if(y<N-1) distances[i]=Math.min(distances[i],distances[i+N]+1);
      if(x<N-1&&y<N-1) distances[i]=Math.min(distances[i],distances[i+N+1]+Math.SQRT2);
      if(x&&y<N-1) distances[i]=Math.min(distances[i],distances[i+N-1]+Math.SQRT2);
    }
    return {points,distances};
  }
  function distance(a,b) {
    let forward=0, backward=0;
    for(const p of a.points) forward+=b.distances[p];
    for(const p of b.points) backward+=a.distances[p];
    return forward/a.points.length + backward/b.points.length;
  }
  const api={describe,distance};
  if(typeof module !== 'undefined') module.exports=api; else root.ShapeMatcher=api;
})(globalThis);
