(()=>{
  const button=document.createElement('button');button.id='average-button';button.textContent='Average';document.querySelector('.collection-head').insertBefore(button,document.getElementById('shuffle'));
  const dialog=document.createElement('dialog');dialog.id='average-dialog';dialog.innerHTML='<div class="dialog-top"><h2 id="average-title">Category average</h2><button id="average-close" aria-label="Close average">✕</button></div><p id="average-status" role="status"></p><canvas id="average-image" width="279" height="279" role="img" hidden></canvas><p class="average-note">Every drawing is centered on the same canvas with the same stroke width. Pixel brightness is the arithmetic average: white means no drawings have ink there; black means all drawings do. Darker regions are more common. This combines every drawing in the category, not a sample.</p><button id="average-retry" hidden>Retry</button>';
  document.body.append(dialog);let generation=0,category='';
  const canvas=dialog.querySelector('canvas'),status=dialog.querySelector('#average-status'),retry=dialog.querySelector('#average-retry');
  const interpret=document.createElement('button');interpret.id='average-interpret';interpret.textContent='Interpret';interpret.disabled=true;canvas.after(interpret);
  const adjustment=document.createElement('div');adjustment.className='average-adjustment';adjustment.innerHTML='<label for="average-sharpness">Clarity <output id="average-sharpness-value">Original</output></label><input id="average-sharpness" type="range" min="0" max="100" value="0" disabled aria-describedby="average-sharpness-help"><p id="average-sharpness-help">Soft average → defined lines. Increasing clarity suppresses faint ink and strengthens dense areas. Set to 0 to restore the true average.</p><button id="average-reset" disabled>Reset</button>';interpret.before(adjustment);
  const slider=adjustment.querySelector('input'),output=adjustment.querySelector('output'),reset=adjustment.querySelector('button');
  let averagePixels=null,densities=null,interpreted=false,originalStatus='',lines=null;
  function redraw(){
    if(!averagePixels)return;
    const ctx=canvas.getContext('2d'),amount=Number(slider.value)/100;
    if(!amount)ctx.putImageData(averagePixels,0,0);
    else{
      const pixels=ctx.createImageData(canvas.width,canvas.height);let peak=1;for(const density of densities)peak=Math.max(peak,density);
      const power=1+amount*9;
      for(let i=0;i<densities.length;i++){
        const normalized=densities[i]/peak,a=normalized**power,b=.35**power;
        const enhanced=a/(a+b),ink=(1-amount)*densities[i]/255+amount*enhanced;
        const shade=Math.round(255*(1-ink));pixels.data[i*4]=pixels.data[i*4+1]=pixels.data[i*4+2]=shade;pixels.data[i*4+3]=255;
      }ctx.putImageData(pixels,0,0);
    }
    output.textContent=amount?`${slider.value}%`:'Original';reset.disabled=!amount&&!interpreted;
    if(interpreted){
      lines=lines||DensityLines.trace(densities,canvas.width);
      ctx.strokeStyle='#263c26';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      for(const [start,end]of lines){ctx.moveTo(start[0]+.5,start[1]+.5);ctx.lineTo(end[0]+.5,end[1]+.5);}ctx.stroke();
      status.textContent=lines.length?'Lines trace the centers of the highest-density regions. This is a geometric interpretation of the average.':'No distinct high-density lines found in this average.';
    }else status.textContent=originalStatus+(amount?' Clarity enhanced for viewing.':'');
    interpret.textContent=interpreted?'Hide interpretation':'Interpret';interpret.setAttribute('aria-pressed',String(interpreted));
    canvas.setAttribute('aria-label',`${category} average${interpreted?' with high-density centerlines':''}`);
  }
  interpret.onclick=()=>{interpreted=!interpreted;redraw();};
  slider.oninput=redraw;
  reset.onclick=()=>{slider.value='0';interpreted=false;redraw();};
  async function load(){
    slider.value='0';slider.disabled=true;reset.disabled=true;output.textContent='Original';
    averagePixels=null;densities=null;lines=null;interpreted=false;interpret.disabled=true;interpret.textContent='Interpret';interpret.setAttribute('aria-pressed','false');
    const token=++generation;canvas.hidden=true;retry.hidden=true;status.textContent='Combining every drawing in this category… The first calculation may take a minute.';
    try{
      const response=await fetch('/api/ink-stats?category='+encodeURIComponent(category));const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not calculate the average.');if(token!==generation)return;
      const bytes=atob(data.average),ctx=canvas.getContext('2d'),pixels=ctx.createImageData(data.imageSize,data.imageSize);
      for(let i=0;i<bytes.length;i++){const shade=255-bytes.charCodeAt(i);pixels.data[i*4]=pixels.data[i*4+1]=pixels.data[i*4+2]=shade;pixels.data[i*4+3]=255;}
      ctx.putImageData(pixels,0,0);canvas.hidden=false;canvas.setAttribute('aria-label',`Average ink image of all ${data.count.toLocaleString()} ${category} drawings`);status.textContent=`Average of all ${data.count.toLocaleString()} drawings. Darker pixels mean more shared ink.`;
      averagePixels=pixels;densities=Uint8Array.from(bytes,c=>c.charCodeAt(0));originalStatus=status.textContent;interpret.disabled=false;slider.disabled=false;
    }catch(error){if(token===generation){status.textContent=error.message;retry.hidden=false;}}
  }
  button.onclick=()=>{category=document.getElementById('title').textContent;dialog.querySelector('h2').textContent=category+' · average';dialog.showModal();load();};
  dialog.querySelector('#average-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>generation++);retry.onclick=load;
})();
