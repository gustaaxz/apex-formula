/* Controlled telemetry exercises the actual UI in the runner's isolated profile. */
module.exports=async function({send,evaluate,origin,ROOT,reports}){
 const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
 const fixture=await fs.readFile(path.join(ROOT,'tests/personal-fixtures.js'),'utf8'),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));let serial=0;
 async function wait(expression){for(let i=0;i<240;i++){if(await evaluate(expression))return;await sleep(100);}throw Error('Timeout: '+expression);}
 async function ready(url){await wait(`location.href===${JSON.stringify(url)}&&!!window.apex&&document.getElementById('loading').classList.contains('hidden')`);await evaluate(fixture);}
 async function load(seed={},mobile=false){
  await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1000,deviceScaleFactor:1,mobile});
  const source=`if(location.pathname==='/index.html'){localStorage.clear();${Object.entries(seed).map(([k,v])=>`localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)});`).join('')}localStorage.setItem('apex-settings','{"quality":"low","shadows":false,"volume":0}');}`;
  const {identifier}=await send('Page.addScriptToEvaluateOnNewDocument',{source}),url=origin+'/index.html?stage6='+ ++serial;
  await send('Page.navigate',{url});await ready(url);await send('Page.removeScriptToEvaluateOnNewDocument',{identifier});return url;
 }
 async function click(id){const result=await send('Runtime.evaluate',{expression:`document.getElementById(${JSON.stringify(id)}).click()`,userGesture:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);}
 async function start(mode='time'){await evaluate(`document.querySelector('[data-mode="${mode}"]').click()`);await click('race');if(mode!=='time')await click('startGP');}
 async function finish(laps=[100,110],invalid=false){
  await click('pauseButton');await evaluate(`(()=>{const r=apex.race;r.phase='race';for(const duration of ${JSON.stringify(laps)})ApexPersonalFixtures.feedLap(r,duration,${invalid?'(r,f)=>{if(f>.3)r.timing.invalidate();}':'null'});r.finish=true;r.phase='finished';r.analysis.tick(r,ApexPersonal.pose(r));})()`);
  await wait(`document.getElementById('resultContinue')!==null&&document.getElementById('modalContent').textContent.includes('CONTRA O RELÓGIO')`);
 }
 async function shot(name){const data=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(ROOT,'docs','personal-stage6-'+name+'.png'),Buffer.from(data.data,'base64'));}
 function report(scenario,details={}){reports.push({stage:6,scenario,ok:true,...details});console.log('PASS stage6 '+scenario);}

 const url=await load();const preview=await evaluate(`document.getElementById('trackPreview').dataset.sectors`);assert.equal(preview,'S1,S2,S3');await shot('map-menu');
 await start('gp');assert.equal(await evaluate(`document.getElementById('minimap').dataset.sectors`),'S1,S2,S3');
 const colors=await evaluate(`(()=>{const c=document.getElementById('minimap'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data,colors=[[102,220,179],[136,184,251],[234,178,122]];return colors.map(color=>{let n=0;for(let i=0;i<data.length;i+=4)if(color.every((v,j)=>data[i+j]===v))n++;return n;});})()`);
 assert(colors.every(n=>n>10));await shot('map-hud');report('map-sector-boundaries',{preview,sectors:'S1/S2/S3',colorPixels:colors});

 await click('pauseButton');await evaluate(`(()=>{const r=apex.race;r.phase='race';ApexPersonalFixtures.feedDriver(r,r.cars[0],100);ApexPersonalFixtures.feedDriver(r,r.cars[1],90);ApexPersonalFixtures.feedDriver(r,r.cars[2],80,true);})()`);await click('pauseBoard');
 assert.equal(await evaluate(`document.querySelectorAll('.full-leaderboard tbody tr').length`),20);assert.equal(await evaluate(`document.querySelector('.fastest-badge').closest('tr').dataset.driverId`),'1');
 const boardText=await evaluate(`document.querySelector('.full-leaderboard').textContent`);for(const label of ['ESCUDERIA','Nº','PARADAS','PNEU','Apex Works','Vértice Racing'])assert(boardText.includes(label));
 assert.equal(await evaluate('apex.race.cars[2].bestLap'),null);await shot('leaderboard');report('full-roster-and-measured-fastest',{drivers:20,fastest:1,invalidFasterIgnored:true});

 await load();await start();await finish();const saved=await evaluate(`localStorage.getItem('apex-ghosts-v1')`);let records=JSON.parse(saved).records;assert.equal(records.length,1);assert.equal(records[0].time,100);
 assert.equal(await evaluate(`localStorage.getItem('apex-progress-v2')`),null);await click('sessionAnalysis');const analysisText=await evaluate(`document.getElementById('modalContent').textContent`);
 assert(analysisText.includes('Amplitude: +10.000 s'));assert(analysisText.includes('desvio padrão: +5.000 s'));assert(analysisText.includes('T1'));assert(analysisText.includes('S3'));await shot('analysis');
 report('ghost-save-and-lap-analysis',{reference:100,cleanLaps:2,spread:10,careerUntouched:true});

 await click('analysisBack');await click('resultContinue');assert.equal(await evaluate('apex.race.phase'),'race');assert.equal(await evaluate('apex.race.countdown'),0);assert.equal(await evaluate('apex.personal.reference.time'),100);assert.equal(await evaluate('apex.race.cars.length'),1);
 await evaluate(`(()=>{const r=apex.race;const saved=JSON.parse(localStorage.getItem('apex-ghosts-v1')).records[0],sample=ApexPersonal.atTime(saved,10);r.resetPlayer(sample.d-25,0,20);r.timing.begin(0,0);r.time=10;r.step=()=>{};})()`);await wait('apex.personal.ghostVisible');
 const ghost=await evaluate(`({pose:apex.personal.ghostPose,cars:apex.race.cars.length,delta:document.getElementById('lapDelta').textContent})`);assert.equal(ghost.cars,1);await shot('ghost');
 await click('pauseButton');await click('toggleGhost');await wait('!apex.personal.ghostVisible');await click('resume');report('quick-retry-and-render-only-ghost',{countdownSkipped:true,collisionCars:1,hiddenOnRequest:true});

 const liveUrl=await evaluate('location.href');await send('Page.navigate',{url:liveUrl});await ready(liveUrl);await start();assert.equal(await evaluate('apex.personal.reference.time'),100);
 await click('pauseButton');await click('leave');await evaluate(`document.getElementById('weather').value='storm';document.getElementById('weather').dispatchEvent(new Event('change'))`);await start();assert.equal(await evaluate('apex.personal.reference'),null);
 assert.equal(await evaluate(`localStorage.getItem('apex-ghosts-v1')`),saved);report('reload-and-weather-compatibility',{reloaded:100,stormReference:null});

 await load({'apex-ghosts-v1':saved});await start();await finish([90],true);assert.equal(await evaluate(`localStorage.getItem('apex-ghosts-v1')`),saved);assert.equal(await evaluate('apex.race.best'),null);report('invalid-faster-lap-rejected',{previousBest:100,rejected:90});

 await load();await start();await click('pauseButton');await evaluate(`(()=>{const r=apex.race;r.phase='race';function move(seconds,change){const from=ApexPersonal.pose(r);r.time+=seconds;change();r.analysis.tick(r,from);}move(2,()=>{r.pit=true;r.pitState='entry';});move(8,()=>{r.pitState='service';});move(3,()=>{r.pitState='exit';r.pitCount=1;r.player.tyre='hard';});move(6,()=>{r.pit=false;r.collisions=2;r.penalty=5;r.trackWarnings=1;});r.finish=true;r.phase='finished';r.analysis.tick(r,ApexPersonal.pose(r));})()`);await wait(`document.getElementById('resultContinue')!==null`);await click('sessionAnalysis');
 const pitText=await evaluate(`document.getElementById('modalContent').textContent`);assert(pitText.includes('+19.000 s'));assert(pitText.includes('+3.000 s'));assert(pitText.includes('2 contatos'));assert(pitText.includes('Penalidade: +5 s'));report('pit-service-and-incidents',{pitLane:19,service:3,contacts:2,penalty:5});

 await load({},true);await start('gp');await click('fullBoardButton');const layout=await evaluate(`({viewport:innerWidth,body:document.body.scrollWidth,modal:document.getElementById('modal').getBoundingClientRect().width,rows:document.querySelectorAll('.full-leaderboard tbody tr').length,scrollable:document.querySelector('.result-scroll').scrollWidth>document.querySelector('.result-scroll').clientWidth})`);
 assert.equal(layout.rows,20);assert(layout.body<=layout.viewport);assert(layout.modal<=layout.viewport);assert(layout.scrollable);await shot('leaderboard-mobile');await click('boardBack');await click('pauseButton');await click('pauseAnalysis');
 assert.equal(await evaluate(`document.body.scrollWidth<=innerWidth`),true);await shot('analysis-mobile');report('mobile-leaderboard-and-report',{layout});

 const future='{"version":999,"records":[]}';await load({'apex-ghosts-v1':future});await start();await finish([100]);assert.equal(await evaluate(`localStorage.getItem('apex-ghosts-v1')`),future);assert.equal(await evaluate('apex.personal.reference.time'),100);assert((await evaluate(`document.getElementById('modalContent').textContent`)).includes('apenas na sessão'));report('future-ghost-preserved',{storageUnchanged:true,sessionReference:100});
};
