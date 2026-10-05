/* Trace the centerlines of high-density regions; this is a geometric interpretation. */
(function(root){
  function trace(values,size){
    const smooth=new Float32Array(values.length),positive=[];
    for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
      let sum=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)sum+=values[(y+dy)*size+x+dx]*(dx===0?2:1)*(dy===0?2:1);
      const value=sum/16;smooth[y*size+x]=value;if(value>0)positive.push(value);
    }
    if(!positive.length)return [];
    positive.sort((a,b)=>a-b);
    const threshold=Math.max(positive[Math.floor(positive.length*.7)],positive.at(-1)*.25),mask=new Uint8Array(values.length);
    for(let i=0;i<mask.length;i++)mask[i]=smooth[i]>=threshold?1:0;
    const offsets=[-size,1-size,1,1+size,size,size-1,-1,-size-1];
    // Zhang–Suen thinning preserves connected shapes while narrowing regions to lines.
    let changed=true;
    while(changed){changed=false;for(let pass=0;pass<2;pass++){
      const remove=[];
      for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
        const i=y*size+x;if(!mask[i])continue;const p=offsets.map(d=>mask[i+d]);const count=p.reduce((a,b)=>a+b,0);if(count<2||count>6)continue;
        let transitions=0;for(let j=0;j<8;j++)if(!p[j]&&p[(j+1)%8])transitions++;
        if(transitions!==1)continue;
        if(pass===0?(p[0]*p[2]*p[4]||p[2]*p[4]*p[6]):(p[0]*p[2]*p[6]||p[0]*p[4]*p[6]))continue;
        remove.push(i);
      }
      for(const i of remove)mask[i]=0;if(remove.length)changed=true;
    }}
    const visited=new Uint8Array(mask.length),lines=[];
    for(let i=0;i<mask.length;i++){
      if(!mask[i]||visited[i])continue;const component=[i];visited[i]=1;
      for(let k=0;k<component.length;k++)for(const offset of offsets){const j=component[k]+offset;if(j>=0&&j<mask.length&&mask[j]&&!visited[j]){visited[j]=1;component.push(j);}}
      if(component.length<8)continue;
      for(const point of component)for(const offset of [1,size-1,size,size+1]){const end=point+offset;if(mask[end])lines.push([[point%size,Math.floor(point/size)],[end%size,Math.floor(end/size)]]);}
    }
    return lines;
  }
  if(typeof module!=='undefined')module.exports={trace};else root.DensityLines={trace};
})(globalThis);
