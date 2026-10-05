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
  if(kind==='hop'||kind==='bounce'){const jump=Math.abs(s(t*2.4));y=-110*jump;x=70*s(t*.65);sx=1+.13*(1-jump)**6;sy=1-.13*(1-jump)**6;angle=kind==='bounce'?t*.3:0;}
  else if(kind==='fly'){x=140*s(t*.6);y=-70+45*s(t*1.2);angle=.12*Math.cos(t*.6);}
  else if(kind==='swim'||kind==='float'){x=120*s(t*.55);y=20*s(t*1.7);angle=.06*s(t*1.7);}
  else if(['walk','crawl','drive'].includes(kind)){x=125*s(t*.55);y=-Math.abs(s(t*(kind==='drive'?8:5)))*(kind==='drive'?3:12);angle=.025*s(t*5);}
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
 function warp(kind,x,y,t,category){
  if(kind==='walk'||kind==='crawl'){const lower=Math.max(0,(y-20)/110);x+=Math.sin(t*7+x*.045)*lower*12;y+=Math.cos(t*7+x*.045)*lower*5;}
  if(kind==='fly'&&!['airplane','helicopter','flying saucer','hot air balloon','parachute'].includes(category))y+=Math.sin(t*9)*Math.abs(x)*.16;
  if(kind==='swim'||kind==='slither')y+=Math.sin(x*.035+t*4)*12;
  if(kind==='grow')x+=Math.sin(t*1.6+y*.009)*(128-y)*.04;
  return [x,y];
 }
 const api={mode,labels,pose,warp};if(typeof module!=='undefined')module.exports=api;else root.LifeMotion=api;
})(globalThis);
