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
module.exports={coverage};
