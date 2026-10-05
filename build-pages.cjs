const fs=require('node:fs'),path=require('node:path');
const root=__dirname,out=path.join(root,'docs');fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(path.join(root,'public'))){
 if(!/\.(html|js|css)$/.test(name))continue;
 let text=fs.readFileSync(path.join(root,'public',name),'utf8');
 if(name.endsWith('.html')){
  text=text.replace(/(href|src)="\/([^"]*)"/g,(_,attr,url)=>`${attr}="./${url?(/\.[a-z]+$/i.test(url)?url:url+'.html'):'index.html'}"`);
  text=text.replace('<head>','<head><script src="./pages-api.js"></script>');
  text=text.replaceAll('Sketchbook','Sketch Analysis').replaceAll('Downloaded locally','Stored in this browser').replaceAll('downloaded locally','stored in this browser');
  text=text.replace('</body>','<p class="pages-storage-note">Data is downloaded directly from Google and cached in this browser. Large categories can take time and disk space. Browser storage may be cleared or evicted.</p></body>');
 }
 if(name.endsWith('.js'))text=text.replace(/(new Worker\(|importScripts\()(['"])\//g,'$1$2./');
 fs.writeFileSync(path.join(out,name),text);
}
for(const name of ['pages-api.js','pages-worker.js'])fs.copyFileSync(path.join(root,'pages',name),path.join(out,name));
fs.copyFileSync(path.join(root,'data/categories.txt'),path.join(out,'categories.txt'));
let ink=fs.readFileSync(path.join(root,'ink.cjs'),'utf8').replace('module.exports={coverage};','');
const prefix=`const fs={createReadStream:file=>file},readline={createInterface:({input})=>input};\nconst Buffer={alloc:n=>{const bytes=new Uint8Array(n);bytes.toString=()=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);};return bytes;}};\n`;
function algorithm(file,name,extra=''){
 let code=fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/).filter(line=>!line.startsWith('const ')||!line.includes('require(')).join('\n');
 code=code.replace('(async()=>{','await (async()=>{');
 return `async function ${name}(lines,options={}){const workerData={file:lines,...options};let answer;const parentPort={postMessage:value=>answer=value};${extra}\n${code}\nreturn answer;}\n`;
}
fs.writeFileSync(path.join(out,'pages-compute.js'),prefix+ink+'\n'+algorithm('ink-worker.cjs','computeInk')+algorithm('analysis-worker.cjs','computeAnalysis','const {describe}=ShapeMatcher;'));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.appendFileSync(path.join(out,'style.css'),'\n.pages-storage-note{max-width:1100px;margin:24px auto;padding:0 24px;font-size:12px;color:#737d68;line-height:1.6}\nheader{flex-wrap:wrap;height:auto;min-height:86px;padding-top:16px;padding-bottom:16px}\n');
console.log('Built GitHub Pages site in docs/');
