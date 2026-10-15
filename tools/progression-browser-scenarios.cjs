/* Runs only inside the isolated browser profile created by results-browser-check. */
module.exports=async function({send,evaluate,origin,ROOT,reports}){
 const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
 const P=require('../progression.js'),S=require('../simulation.js');
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const fixtures=await fs.readFile(path.join(ROOT,'tests/course-fixtures.js'),'utf8');
 let serial=0;
 async function ready(url){
  for(let i=0;i<160;i++){
   if(await evaluate(`location.href===${JSON.stringify(url)}&&!!window.apex&&document.getElementById('loading').classList.contains('hidden')`)){
    await evaluate(fixtures);return;
   }
   await sleep(100);
  }
  throw Error('Game did not load: '+url);
 }
 async function load(seed={},mobile=false){
  await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1000,deviceScaleFactor:1,mobile});
  const source=`if(location.pathname==='/index.html'){localStorage.clear();${Object.entries(seed).map(([key,value])=>`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(value)});`).join('')}localStorage.setItem('apex-settings','{"quality":"low","shadows":false,"volume":0}');}`;
  const {identifier}=await send('Page.addScriptToEvaluateOnNewDocument',{source});
  const url=origin+'/index.html?stage4='+ ++serial;
  await send('Page.navigate',{url});await ready(url);
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
  return url;
 }
 async function click(id){await evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);}
 async function mode(value){await evaluate(`document.querySelector('[data-mode="${value}"]').click()`);}
 const text=()=>evaluate(`document.getElementById('modalContent').textContent`);
 const saved=()=>evaluate(`JSON.parse(localStorage.getItem('apex-progress-v2'))`);
 async function start(value){await mode(value);await click('race');if(value==='career')await click('careerContinue');if(value==='championship')await click('championshipContinue');await click('startGP');}
 async function finish(penalty=0){
  await evaluate(`(()=>{const r=apex.race;r.config.laps=1;r.phase='race';r.countdown=0;r.time=160;r.results=new ApexResults.Classification(r.track.length,1);r.penalty=${penalty};r.results.setPenalty(r.player,r.penalty);for(const car of [r.player,...r.cars.filter(car=>car!==r.player)])ApexCourseFixtures.cross(r.results,car,1,car.id===9?100:car.id===0?102:120+car.id);r.updateResults([],r.time);})()`);
  for(let i=0;i<120;i++){if((await text()).includes('RESULTADO DEFINITIVO'))return;await sleep(100);}
  throw Error('No definitive result: '+JSON.stringify(await evaluate(`({text:document.getElementById('modalContent').textContent,finish:apex.race.finish,rows:apex.race.classification().map(r=>({id:r.id,status:r.status}))})`)));
 }
 async function screenshot(name){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(ROOT,'docs','season-stage4-'+name+'.png'),Buffer.from(shot.data,'base64'));}
 function report(scenario,details={}){reports.push({stage:4,scenario,ok:true,...details});console.log('PASS stage4 '+scenario);}

 const legacy=JSON.stringify({name:'<b>Veterano</b>',round:2,season:3,points:42,credits:220,reputation:35,upgrades:{energy:2}});
 await load({[P.LEGACY_KEY]:legacy});await mode('career');await click('race');await click('careerStandings');
 assert((await text()).includes('Histórico parcial'));assert((await text()).includes('<b>Veterano</b>'));
 assert.equal(await evaluate(`document.querySelectorAll('.season-standings tbody tr').length`),20);
 assert.equal(await evaluate(`document.querySelector('.season-standings .you td:nth-child(2)').children.length`),0);
 assert.equal(await evaluate(`document.querySelector('.season-calendar .current').textContent.includes(ApexSim.TRACKS[2].name)`),true);
 assert.equal(await evaluate(`localStorage.getItem('apex-formula-v1')`),legacy);
 assert.equal((await saved()).championship.points,0);await screenshot('migration');
 report('migration',{careerPoints:42,careerRound:2,championshipPoints:0,legacyPreserved:true,escapedName:true});

 const url=await load();await start('career');
 assert.equal(await evaluate('apex.race.progressionEntry.mode'),'career');await finish(5);
 let data=await saved();assert.deepEqual([data.career.points,data.career.credits,data.career.round],[18,112,1]);
 const original=JSON.stringify(data);await click('resultStandings');await screenshot('standings');await click('seasonBack');await click('resultStandings');await click('seasonBack');
 assert.equal(JSON.stringify(await saved()),original);await click('resultMenu');await start('championship');
 assert.equal(await evaluate('apex.race.config.energyUpgrade||0'),0);await finish();data=await saved();
 assert.deepEqual([data.championship.points,data.championship.round,data.championship.credits],[25,1,0]);
 assert.deepEqual([data.career.points,data.career.round,data.career.credits],[18,1,112]);
 report('independent-rounds',{careerPoints:18,championshipPoints:25,duplicateReopen:false,rivals:data.championship.results[0].rows.length});
 await send('Page.navigate',{url});await ready(url);await mode('career');await click('race');
 assert((await text()).includes('ETAPA 2 DE 6'));await click('closeModal');await mode('championship');await click('race');await click('championshipStandings');
 assert((await text()).includes('25 pontos'));assert.equal(await evaluate(`document.querySelector('.season-calendar .current').textContent.includes(ApexSim.TRACKS[1].name)`),true);
 assert.equal(await evaluate(`document.getElementById('nextTrack').disabled`),true);
 await click('closeModal');await mode('gp');assert.equal(await evaluate(`document.getElementById('nextTrack').disabled`),false);
 await start('gp');await finish();assert.equal(JSON.stringify(await saved()),JSON.stringify(data));
 report('reload-calendar-and-gp',{careerRound:1,championshipRound:1,gpUnchanged:true});

 const store=new P.Store({getItem:()=>null,setItem(){}},S.DRIVERS);
 const list=S.DRIVERS.map((_,id)=>({id,position:id===9?1:id<9?id+2:id+1,status:'finished',finishTime:100+id,penalty:0,laps:1}));
 for(let i=0;i<5;i++)store.record(store.context('championship'),list,{position:1,points:25,credits:0,reputation:0,advanceRound:true});
 await load({[P.KEY]:JSON.stringify(store.data)});await start('championship');await finish();data=await saved();
 assert.deepEqual([data.championship.season,data.championship.round,data.championship.points],[2,0,0]);
 assert.equal(data.championship.history[0].points,150);assert.equal(data.career.season,1);
 assert((await text()).includes('Temporada 1 concluída'));await click('resultStandings');
 assert((await text()).includes('Temporada 1: P1'));await screenshot('rollover');await click('seasonBack');await click('resultContinue');
 assert.equal(await evaluate('apex.race.progressionEntry.season'),2);assert.equal(await evaluate('apex.race.progressionEntry.round'),0);
 report('rollover',{archivedPoints:150,newSeason:2,careerSeason:1});

 await load({[P.KEY]:JSON.stringify(store.data)},true);await mode('championship');await click('race');await click('championshipStandings');
 const layout=await evaluate(`({viewport:document.documentElement.clientWidth,body:document.body.scrollWidth,modal:document.getElementById('modal').getBoundingClientRect().width,tableScrollable:document.querySelector('.result-scroll').scrollWidth>document.querySelector('.result-scroll').clientWidth,rows:document.querySelectorAll('.season-standings tbody tr').length})`);
 assert.equal(layout.rows,20);assert(layout.body<=layout.viewport);assert(layout.modal<=layout.viewport);assert(layout.tableScrollable);
 await screenshot('mobile');report('mobile-standings',{layout});

 const future='{"version":999,"career":{"points":123}}';await load({[P.KEY]:future});
 await start('career');assert.equal(await evaluate(`localStorage.getItem('apex-progress-v2')`),future);await finish();
 assert.equal(await evaluate(`localStorage.getItem('apex-progress-v2')`),future);report('future-save-preserved');
 await load({[P.KEY]:'corrupt',[P.LEGACY_KEY]:legacy});
 assert.equal(await evaluate(`localStorage.getItem('apex-progress-v2-recovery')`),'corrupt');
 assert.equal((await saved()).career.points,42);report('corrupt-save-recovery');
};
