/* Deterministic secondary motion: replay and pause preserve every particle. */
globalThis.LifeEffects={draw(ctx,kind,category,t,cx,cy){
 const circle=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();};
 ctx.save();ctx.lineCap='round';ctx.lineWidth=1.5;
 if(['walk','crawl','hop','bounce','drive'].includes(kind)){
  for(let i=0;i<9;i++){const age=(t*1.4+i*.19)%1;ctx.globalAlpha=(1-age)*.28;ctx.strokeStyle='#8d9b71';circle(cx-65-age*150+i*6,551-age*25,2+age*9);}
  if(kind==='walk'||kind==='crawl'){for(let i=0;i<8;i++){const age=(t*.6+i*.13)%1;ctx.globalAlpha=(1-age)*.17;ctx.fillStyle='#758963';ctx.beginPath();ctx.ellipse(cx-30-age*190,553+(i%2?4:-4),4,2,-.2,0,Math.PI*2);ctx.fill();}}
  if(kind==='hop'||kind==='bounce'){const phase=(t/1.65)%1;if(phase>.85){const age=(phase-.85)/.15;ctx.globalAlpha=(1-age)*.4;ctx.strokeStyle='#809966';ctx.beginPath();ctx.ellipse(cx,553,20+age*90,3+age*6,0,0,Math.PI*2);ctx.stroke();}}
 }
 if(kind==='swim'||kind==='float'){
  ctx.strokeStyle='#80b4b8';for(let i=0;i<12;i++){const age=(t*.24+i*.087)%1;ctx.globalAlpha=Math.sin(age*Math.PI)*.5;circle(cx+200-age*410+Math.sin(age*8+i)*14,cy+100-age*230,3+i%4);}
  ctx.globalAlpha=.3;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(cx-100,535,60+i*23+Math.sin(t*2)*10,5+i*4,0,0,Math.PI*2);ctx.stroke();}
 }
 if(kind==='grow'){
  for(let i=0;i<7;i++){const age=(t*.12+i*.17)%1;ctx.save();ctx.globalAlpha=Math.sin(age*Math.PI)*.45;ctx.translate(120+age*760,150+i*50+Math.sin(age*8+i)*28);ctx.rotate(age*8);ctx.strokeStyle='#789a57';ctx.beginPath();ctx.ellipse(0,0,7,3,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 }
 if(kind==='ring'||kind==='music'){
  ctx.strokeStyle='#9cac71';for(let side of [-1,1])for(let i=0;i<3;i++){const age=(t*1.4+i/3)%1;ctx.globalAlpha=(1-age)*.45;ctx.beginPath();ctx.arc(cx+side*160,cy,25+age*60,side===1?-.7:Math.PI-.7,side===1?.7:Math.PI+.7);ctx.stroke();}
 }
 if(kind==='rain'){
  ctx.strokeStyle='#8bb4c1';for(let i=0;i<12;i++){const age=(t*1.2+i*.13)%1;ctx.globalAlpha=(1-age)*.45;ctx.beginPath();ctx.ellipse(100+i*70,558,age*20+1,age*5+1,0,0,Math.PI*2);ctx.stroke();}
 }
 if(kind==='glow'){
  ctx.globalAlpha=.2;const g=ctx.createRadialGradient(cx,cy,70,cx,cy,270);g.addColorStop(0,'#f7d87d');g.addColorStop(1,'#f7d87d00');ctx.fillStyle=g;ctx.fillRect(cx-270,cy-270,540,540);
  for(let i=0;i<12;i++){const age=(t*.2+i*.09)%1;ctx.globalAlpha=Math.sin(age*Math.PI)*.6;ctx.fillStyle='#d3ab4e';ctx.beginPath();ctx.arc(cx+Math.sin(i*19)*180+Math.sin(t+i)*10,cy+100-age*340,1.5,0,Math.PI*2);ctx.fill();}
 }
 if(kind==='fly'&&category==='helicopter'){
  ctx.globalAlpha=.45;ctx.strokeStyle='#607954';ctx.beginPath();ctx.ellipse(cx,cy-190,110,7+Math.sin(t*35)*3,0,0,Math.PI*2);ctx.stroke();
 }
 if(kind==='drive'&&['ambulance','police car','firetruck'].includes(category)){
  ctx.globalAlpha=.22+.12*Math.sin(t*6);ctx.fillStyle='#daa25e';ctx.beginPath();ctx.ellipse(cx,cy-170,25,10,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}};
