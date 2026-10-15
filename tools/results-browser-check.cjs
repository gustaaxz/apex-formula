/* Optional UI check: Node 22+ and a local Chrome/Edge installation, no packages.
   Uses an isolated temporary browser profile and a loopback-only HTTP server. */
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const http=require('node:http'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const only6=process.argv.includes('--stage6-only'),stage6=only6||process.argv.includes('--stage6'),only5=process.argv.includes('--stage5-only'),stage5=only5||(!only6&&stage6)||process.argv.includes('--stage5'),only4=process.argv.includes('--stage4-only'),skipEarlier=only4||only5||only6,stage4=only4||(!only5&&stage5)||process.argv.includes('--stage4'),stage3=!skipEarlier&&(stage4||process.argv.includes('--stage3')),stage2=stage3||process.argv.includes('--stage2');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 const candidates=[process.env.APEX_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
 let executable;
 for(const candidate of candidates){try{await fs.access(candidate);executable=candidate;break;}catch{}}
 assert(executable,'Chrome/Edge not found; set APEX_BROWSER to the executable path.');
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'apex-stage1-browser-'));
 const server=http.createServer(async(req,res)=>{
  try{
   const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const filename=path.resolve(ROOT,'.'+name);
   if(!filename.startsWith(ROOT+path.sep))throw Error('Outside project');
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
   res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');
   res.end(await fs.readFile(filename));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=spawn(executable,['--headless=new','--no-first-run','--no-default-browser-check','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws;
 try{
  let port;
  for(let i=0;i<100;i++){
   try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await sleep(100);}
  }
  assert(port,'Browser did not start.');
  const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let seq=0;const pending=new Map(),exceptions=[];
  ws.addEventListener('message',event=>{
   const message=JSON.parse(event.data);
   if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails.text+': '+(message.params.exceptionDetails.exception?.description||''));
   if(!message.id)return;
   const entry=pending.get(message.id);if(!entry)return;
   pending.delete(message.id);clearTimeout(entry.timeout);
   message.error?entry.reject(Error(JSON.stringify(message.error))):entry.resolve(message.result);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++seq,timeout=setTimeout(()=>{pending.delete(id);reject(Error('Timed out: '+method));},20000);
   pending.set(id,{resolve,reject,timeout});ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
   const response=await send('Runtime.evaluate',{expression,returnByValue:true});
   if(response.exceptionDetails)throw Error(response.exceptionDetails.text);
   return response.result.value;
  };
  await send('Page.enable');await send('Runtime.enable');
  const reports=[];
  for(const scenario of skipEarlier?[]:['penalty','lapped','dnf','pending','completed','career','mobile']){
   const mobile=scenario==='mobile';
   await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1000,deviceScaleFactor:1,mobile});
   const kind=scenario==='completed'?'pending':['career','mobile'].includes(scenario)?'penalty':scenario;
   await send('Page.navigate',{url:`${origin}/tests/results-browser.html?case=${kind}${scenario==='completed'?'&complete=1':''}${scenario==='career'?'&mode=career':''}`});
   let report;
   for(let i=0;i<160;i++){
    report=await evaluate(`(()=>{const out=document.getElementById('verification');try{return JSON.parse(out?.dataset.report)}catch{return null}})()`);
    if(report?.ok&&report?.scenario===(scenario==='completed'?'completed':kind)&&report?.mode===(scenario==='career'?'career':'gp'))break;
    await sleep(100);
   }
   assert(report?.ok,JSON.stringify({scenario,report}));
   if(scenario==='career'){
    const saved=await evaluate(`JSON.parse(document.querySelector('iframe').contentWindow.localStorage.getItem('apex-progress-v2')).career`);
    assert.equal(saved.points,18);assert.equal(saved.credits,112);assert.equal(saved.round,1);
    report.saved={points:saved.points,credits:saved.credits,round:saved.round};
   }
   if(['penalty','mobile'].includes(scenario)){
    report.layout=await evaluate(`(()=>{const d=document.querySelector('iframe').contentDocument,m=d.getElementById('modal'),t=d.querySelector('.result-scroll');return {viewport:d.documentElement.clientWidth,body:d.body.scrollWidth,modal:m.getBoundingClientRect().width,tableScrollable:t.scrollWidth>t.clientWidth,rows:d.querySelectorAll('.race-results tbody tr').length}})()`);
    assert.equal(report.layout.rows,2);assert(report.layout.body<=report.layout.viewport);
    const clip=await evaluate(`(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);
    const screenshot=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
    await fs.writeFile(path.join(ROOT,'docs',`results-stage1-${scenario}.png`),Buffer.from(screenshot.data,'base64'));
   }
   reports.push({...report,scenario});
   console.log('PASS '+scenario);
  }
  if(!skipEarlier){
  // Verify the review artifact also works directly from disk, without a server.
  const {pathToFileURL}=require('node:url');
  await send('Page.navigate',{url:pathToFileURL(path.join(ROOT,'tests','results-review.html')).href});
  let offline;
  for(let i=0;i<100;i++){
   offline=await evaluate(`(()=>{const content=document.getElementById('review');return content?.textContent||''})()`);
   if(offline.includes('112 créditos'))break;
   await sleep(100);
  }
  assert(offline.includes('P2.'));assert(offline.includes('18 pontos'));assert(offline.includes('112 créditos'));
  const reopened=await evaluate(`document.getElementById('reviewAction').click();document.getElementById('review').textContent`);
  assert.equal(reopened,offline);
  const completed=await evaluate(`document.querySelector('[data-case="pending"]').click();document.getElementById('reviewAction').click();document.getElementById('review').textContent`);
  assert(completed.includes('RESULTADO DEFINITIVO'));assert(completed.includes('25 pontos'));assert(completed.includes('140 créditos'));
  reports.push({scenario:'offline-review',ok:true,penaltyPoints:18,penaltyCredits:112,reopenUnchanged:true,completedPoints:25});
  console.log('PASS offline-review');
  }
  if(stage2)for(const scenario of ['qualify-valid','qualify-invalid','qualify-grid','cut','recover','mobile']){
   const mobile=scenario==='mobile';
   await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1000,deviceScaleFactor:1,mobile});
   await send('Page.navigate',{url:`${origin}/tests/course-browser.html?case=${scenario}`});
   let report;
   for(let i=0;i<160;i++){
    report=await evaluate(`(()=>{try{return JSON.parse(document.getElementById('verification')?.dataset.report)}catch{return null}})()`);
    if(report?.ok&&report.scenario===scenario)break;
    await sleep(100);
   }
   assert(report?.ok&&report.scenario===scenario,JSON.stringify({scenario,report}));
   if(['qualify-invalid','mobile'].includes(scenario)){
    const clip=await evaluate(`(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);
    const screenshot=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
    await fs.writeFile(path.join(ROOT,'docs',`course-stage2-${scenario}.png`),Buffer.from(screenshot.data,'base64'));
   }
   reports.push(report);console.log('PASS '+scenario);
  }
  if(stage3)for(const scenario of ['vsc-good','vsc-bad','return','penalty','restart','pit','mobile']){
   const mobile=scenario==='mobile';
   await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1000,deviceScaleFactor:1,mobile});
   await send('Page.navigate',{url:`${origin}/tests/race-control-browser.html?case=${scenario}`});
   let report;
   for(let i=0;i<160;i++){
    report=await evaluate(`(()=>{try{return JSON.parse(document.getElementById('verification')?.dataset.report)}catch{return null}})()`);
    if(report?.ok&&report.scenario===scenario)break;
    await sleep(100);
   }
   assert(report?.ok&&report.scenario===scenario,JSON.stringify({scenario,report}));
   if(['vsc-bad','mobile'].includes(scenario)){
    const clip=await evaluate(`(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);
    const screenshot=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
    await fs.writeFile(path.join(ROOT,'docs',`race-stage3-${scenario}.png`),Buffer.from(screenshot.data,'base64'));
   }
   reports.push({...report,stage:3});console.log('PASS stage3 '+scenario);
  }
  if(stage4)await require('./progression-browser-scenarios.cjs')({send,evaluate,origin,ROOT,reports});
  if(stage5)await require('./learning-browser-scenarios.cjs')({send,evaluate,origin,ROOT,reports});
  if(stage6)await require('./personal-browser-scenarios.cjs')({send,evaluate,origin,ROOT,reports});
  assert.deepEqual(exceptions,[],'Browser runtime errors');
  await fs.writeFile(path.join(ROOT,'docs',only6?'personal-stage6-browser-partial.json':stage6?'personal-stage6-browser.json':only5?'learning-stage5-browser-partial.json':stage5?'learning-stage5-browser.json':only4?'season-stage4-browser-partial.json':stage4?'season-stage4-browser.json':stage3?'race-stage3-browser.json':stage2?'course-stage2-browser.json':'results-stage1-browser.json'),JSON.stringify({reports,exceptions},null,2)+'\n');
 }finally{
  ws?.close();browser.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await sleep(300);
  // Only delete the exact unique temporary profile created above.
  const resolved=path.resolve(profile),parent=path.resolve(os.tmpdir());
  if(path.dirname(resolved)===parent&&path.basename(resolved).startsWith('apex-stage1-browser-'))await fs.rm(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:150}).catch(()=>{});
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
