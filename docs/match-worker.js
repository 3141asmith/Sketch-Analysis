importScripts('./matcher.js');
let references=[];
onmessage=({data})=>{
  try {
    if(data.type==='init') {
      references=data.drawings.map(record=>({record,shape:ShapeMatcher.describe(record.drawing)})).filter(item=>item.shape);
      postMessage({type:'ready',count:references.length}); return;
    }
    const query=ShapeMatcher.describe(data.strokes);
    let best=null, score=Infinity;
    if(query) for(const item of references) {
      const d=ShapeMatcher.distance(query,item.shape);
      if(d<score){score=d;best=item.record;}
    }
    postMessage({type:'match',version:data.version,record:best});
  } catch(error) {postMessage({type:'error',message:error.message});}
};
