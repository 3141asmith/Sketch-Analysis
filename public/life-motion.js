(function(root){
 const groups={
  hop:'frog|rabbit|kangaroo|grasshopper',
  fly:'airplane|bird|bee|butterfly|bat|owl|parrot|mosquito|angel|dragon|helicopter|flying saucer|feather|hot air balloon|parachute',
  swim:'fish|shark|dolphin|whale|sea turtle|octopus|mermaid|submarine',
  slither:'snake|snail|worm|squiggle|zigzag',
  walk:'cat|dog|bear|camel|cow|crocodile|elephant|giraffe|hedgehog|horse|lion|monkey|mouse|panda|pig|raccoon|rhinoceros|sheep|squirrel|tiger|zebra|teddy-bear|animal migration|duck|penguin|flamingo|swan',
  crawl:'ant|spider|crab|lobster|scorpion',
  drive:'ambulance|bicycle|bulldozer|bus|car|firetruck|motorbike|pickup truck|police car|school bus|tractor|train|truck|van|skateboard|rollerskates|roller coaster',
  float:'aircraft carrier|canoe|cruise ship|sailboat|speedboat|bottlecap|beach|ocean|pond|pool|river|waterslide|snorkel',
  bounce:'baseball|basketball|soccer ball|tennis racquet|hockey puck|circle|ball|apple|orange|pear|potato|onion|watermelon|donut|cookie|peanut|tomato',
  spin:'ceiling fan|fan|wheel|windmill|boomerang|compass|snowflake|hurricane|tornado|hexagon|octagon|square|triangle|diamond|star',
  grow:'tree|palm tree|flower|house plant|grass|bush|garden|cactus|mushroom|broccoli|asparagus|string bean|carrot|leaf|grapes|pineapple',
  ring:'alarm clock|clock|wristwatch|telephone|cell phone|doorbell',
  music:'cello|clarinet|drums|guitar|harp|headphones|microphone|piano|radio|saxophone|stereo|trombone|trumpet|violin|megaphone',
  steam:'coffee cup|mug|cup|teapot|frying pan|oven|stove|toaster|microwave|hot tub|hot dog|hamburger|steak|pizza',
  glow:'sun|moon|light bulb|lantern|lighthouse|flashlight|streetlight|floor lamp|chandelier|candle|campfire|fireplace|lighter|matches|lightning|rainbow',
  rain:'rain|cloud|umbrella',
  wave:'hand|arm|finger|leg|foot|toe|elbow|knee|yoga',
  blink:'eye|face|smiley face|The Mona Lisa|skull|brain|nose|mouth|ear|beard|goatee|moustache',
  swing:'axe|hammer|golf club|baseball bat|hockey stick|sword|saw|broom|rake|shovel|swing set|see saw|diving board|stethoscope',
  open:'book|door|laptop|envelope|mailbox|suitcase|backpack|purse|oven|dishwasher|washing machine|toilet|box',
  write:'pencil|pen|crayon|marker|paintbrush|eraser|lipstick|toothbrush|screwdriver|drill|knife|fork|spoon|scissors|pliers|syringe|key',
 };
 const labels={hop:'Hop, land, repeat',fly:'Taking flight',swim:'Just keep swimming',slither:'A little wiggle',walk:'Out for a stroll',crawl:'Scuttling along',drive:'On the move',float:'Riding the waves',bounce:'A playful bounce',spin:'Round and round',grow:'Swaying in the breeze',ring:'Ring ring!',music:'Keeping the beat',steam:'Fresh and warm',glow:'A little glow',rain:'A passing shower',wave:'Hello there!',blink:'A curious expression',swing:'Back and forth',open:'Opening up',write:'Making a mark',sway:'A playful wobble'};
 function mode(category){return Object.keys(groups).find(key=>groups[key].split('|').includes(category))||'sway';}
 function pose(kind,t){const s=Math.sin;let x=0,y=0,angle=0,sx=1,sy=1;
  if(kind==='hop'||kind==='bounce'){const phase=(t/1.65)%1,flight=Math.max(0,Math.min(1,(phase-.22)/.63)),jump=4*flight*(1-flight),crouch=phase<.22?Math.sin(phase/.22*Math.PI):phase>.85?Math.sin((phase-.85)/.15*Math.PI):0;y=-135*jump;x=95*s(t*.48);sx=1+.18*crouch-.055*jump;sy=1-.2*crouch+.065*jump;angle=kind==='bounce'?t*.5:.06*s(flight*Math.PI*2);}
  else if(kind==='fly'){x=140*s(t*.6);y=-70+45*s(t*1.2);angle=.12*Math.cos(t*.6);}
  else if(kind==='swim'||kind==='float'){x=120*s(t*.55);y=20*s(t*1.7);angle=.06*s(t*1.7);}
  else if(['walk','crawl','drive'].includes(kind)){const pause=kind==='walk'&&(t%9)>6.7;const gait=pause?0:1;x=125*s(t*.55);y=-Math.abs(s(t*(kind==='drive'?8:5)))*(kind==='drive'?3:9)*gait;angle=.025*s(t*5)*gait;sx=1+.012*s(t*3);sy=1+.015*s(t*3+1);}
  else if(kind==='spin'){angle=t*1.2;sx=sy=.88;}
  else if(kind==='ring'){angle=.07*s(t*35)*(s(t*2)>0?1:0);}
  else if(kind==='swing'||kind==='wave'){angle=.3*s(t*2);}
  else if(kind==='open'){sx=.35+.65*(.5+.5*Math.cos(t*1.6));}
  else if(kind==='write'){x=60*s(t*1.5);y=20*s(t*3);angle=-.15;}
  else if(kind==='music'){sx=1+.025*s(t*6);sy=1-.035*s(t*6);angle=.04*s(t*3);}
  else if(kind==='blink'){sy=1-.13*Math.max(0,Math.cos(t*1.5))**24;angle=.035*s(t);}
  else{angle=.04*s(t*1.4);y=5*s(t*1.5);}
  return {x,y,angle,sx,sy};
 }
 function rig(strokes,kind){
  let left=0,right=0,top=0,bottom=0;for(const stroke of strokes)for(const[x,y]of stroke){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const width=Math.max(1,right-left),height=Math.max(1,bottom-top);
  return strokes.map(points=>{
   if(!points.length)return {role:'body',pivot:[0,0],bounds:{left,right,top,bottom,width,height}};
   const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),cx=(minX+maxX)/2,cy=(minY+maxY)/2,w=maxX-minX,h=maxY-minY;
   let role='body',pivot=[cx,minY];
   if(kind==='drive'&&cy>top+height*.55&&w<width*.45&&h<height*.5&&w>height*.06&&h>w*.5&&h<w*1.7&&Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<Math.max(w,h)*.4){role='wheel';pivot=[cx,cy];}
   else if(['walk','hop','crawl'].includes(kind)&&minY>top+height*.45&&h>height*.15&&w<width*.4){role='limb';}
   else if(['walk','swim'].includes(kind)&&Math.abs(cx)>width*.3&&w<width*.4){role='tail';pivot=[cx<0?maxX:minX,cy];}
   else if(['walk','hop','blink'].includes(kind)&&cy<top+height*.45&&w<width*.18&&h<height*.14){role='eye';pivot=[cx,cy];}
   else if(kind==='fly'&&Math.abs(cx)>width*.17&&w<width*.65){role='wing';pivot=[cx<0?maxX:minX,cy];}
   return {role,pivot,bounds:{left,right,top,bottom,width,height}};
  });
 }
 function warp(kind,x,y,t,category,part){
  const b=part?.bounds||{top:-128,bottom:128,width:256,height:256},nx=x/b.width,ny=(y-b.top)/b.height;
  if(part){
   let angle=0;const [px,py]=part.pivot;
   if(part.role==='wheel')angle=t*5;
   if(part.role==='limb'){angle=Math.sin(t*6+(px>0?Math.PI:0))*.32;if(kind==='hop')angle=Math.sin(t/1.65*Math.PI*2)*.45;if(kind==='walk'&&t%9>6.7)angle=0;}
   if(part.role==='tail')angle=Math.sin(t*(kind==='swim'?5:7))*.24;
   if(part.role==='wing'&&!['airplane','helicopter','flying saucer','hot air balloon','parachute'].includes(category))angle=Math.sin(t*9)*(px>0?1:-1)*.32;
   if(angle){const dx=x-px,dy=y-py;x=px+dx*Math.cos(angle)-dy*Math.sin(angle);y=py+dx*Math.sin(angle)+dy*Math.cos(angle);}
   if(part.role==='eye'){const blink=Math.max(0,Math.cos(t*1.8))**36;y=py+(y-py)*(1-.85*blink);}
  }
  if((kind==='walk'||kind==='crawl')&&part?.role!=='limb'){const lower=Math.max(0,(ny-.55)/.45),pause=kind==='walk'&&t%9>6.7;x+=Math.sin(t*6+nx*9)*lower*13*(pause?0:1);y-=Math.max(0,Math.sin(t*6+nx*9))*lower*8*(pause?0:1);}
  if(kind==='walk'&&ny<.5&&t%9>6.7){x+=Math.sin((t%9-6.7)*3)*5*(.5-ny);}
  if(kind==='fly'&&part?.role!=='wing'&&!['airplane','helicopter','flying saucer','hot air balloon','parachute'].includes(category))y+=Math.sin(t*9)*Math.abs(x)*.12;
  if(kind==='swim'||kind==='slither')y+=Math.sin(nx*8+t*4)*(5+Math.abs(nx)*22);
  if(kind==='grow')x+=Math.sin(t*1.6+ny*.8)*(1-ny)**2*15;
  if(kind==='music')x+=Math.sin(t*16+y*.08)*1.3;
  if(kind==='steam')y+=Math.sin(t*2+x*.04)*.7;
  if(kind==='glow'&&['campfire','fireplace','candle','lighter','matches'].includes(category)){x+=Math.sin(t*9+ny*7)*(1-ny)*4;y-=Math.sin(t*7+nx*4)*(1-ny)*4;}
  return [x,y];
 }
 const api={mode,labels,pose,warp,rig};if(typeof module!=='undefined')module.exports=api;else root.LifeMotion=api;
})(globalThis);
