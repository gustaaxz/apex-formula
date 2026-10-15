/* UI integration uses real listeners, synthetic gamepad readings and controlled telemetry.
   The runner owns an isolated temporary browser profile; no personal saves are used. */
module.exports=async function({send,evaluate,origin,ROOT,reports}){
 const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));let serial=0;
 async function wait(expression){for(let i=0;i<240;i++){if(await evaluate(expression))return;await sleep(100);}throw Error('Timeout: '+expression+'\n'+await evaluate(`document.getElementById('modalContent').textContent`));}
 async function load(seed={},mobile=false){
  await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1000,deviceScaleFactor:1,mobile});
  const source=`if(location.pathname==='/index.html'){localStorage.clear();${Object.entries(seed).map(([key,value])=>`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(value)});`).join('')}localStorage.setItem('apex-settings','{"quality":"low","shadows":false,"volume":25}');}`;
  const {identifier}=await send('Page.addScriptToEvaluateOnNewDocument',{source}),url=origin+'/index.html?stage5='+ ++serial;
  await send('Page.navigate',{url});await wait(`location.href===${JSON.stringify(url)}&&!!window.apex&&document.getElementById('loading').classList.contains('hidden')`);
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier});return url;
 }
 async function click(id){const result=await send('Runtime.evaluate',{expression:`document.getElementById(${JSON.stringify(id)}).click()`,userGesture:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);}
 async function press(code,type='keyDown'){await send('Input.dispatchKeyEvent',{type,code,key:code==='Space'?' ':code.replace(/^Key/,''),windowsVirtualKeyCode:code==='Escape'?27:code==='Space'?32:code.startsWith('Key')?code.charCodeAt(3):0});}
 async function tap(code){await press(code);await press(code,'keyUp');}
 async function controls(){await click('helpButton');await click('openControls');}
 async function startGP(){await click('race');await click('startGP');}
 async function holdTelemetry(values={}){
  await evaluate(`(()=>{const r=apex.race;r.phase='race';r.countdown=0;r.resetPlayer(100,0,20);Object.assign(r.player,{frontTemp:100,rearTemp:100,temp:100,...${JSON.stringify(values)}});const [low,high]=ApexVehicle.WINDOWS[r.player.tyre],cold=Math.min(r.player.frontTemp,r.player.rearTemp)<low,hot=Math.max(r.player.frontTemp,r.player.rearTemp)>high;r.player.temp=(r.player.frontTemp+r.player.rearTemp)/2;r.player.thermalState=cold&&hot?'misto':cold?'frio':hot?'quente':'ideal';r.step=function(dt){this.time+=dt;};})()`);
 }
 async function fakePad(){await evaluate(`window.testPad={index:0,id:'Gamepad simulado',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:32},()=>({value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.testPad?[window.testPad]:[]})`);}
 async function padButton(index,value){await evaluate(`testPad.buttons[${index}].value=${value}`);await send('Runtime.evaluate',{expression:'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))',awaitPromise:true});}
 async function school(id){await click('helpButton');await click('openSchool');await evaluate(`document.querySelector('[data-lesson="${id}"]').click()`);await click('beginLesson');}
 async function shot(name){const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(path.join(ROOT,'docs','learning-stage5-'+name+'.png'),Buffer.from(screenshot.data,'base64'));}
 function report(scenario,details={}){reports.push({stage:5,scenario,ok:true,...details});console.log('PASS stage5 '+scenario);}

 const url=await load();await controls();
 await evaluate(`document.querySelector('[data-control-key="throttle"]').click()`);await tap('KeyS');
 assert((await evaluate(`document.getElementById('bindingStatus').textContent`)).includes('Já utilizado'));
 await tap('KeyI');await evaluate(`(()=>{const el=document.querySelector('[data-control-range="steerRate"]');el.value=2;el.dispatchEvent(new Event('input'));const pad=document.querySelector('[data-pad-action="up"]');pad.value='7';pad.dispatchEvent(new Event('change'));})()`);
 assert.equal(await evaluate(`document.querySelector('[data-pad-action="up"]').value`),'5');
 await evaluate(`const up=document.querySelector('[data-pad-action="up"]');up.value='10';up.dispatchEvent(new Event('change'));`);
 await shot('controls');await click('applyControls');let config=await evaluate(`JSON.parse(localStorage.getItem('apex-controls-v1'))`);
 assert.equal(config.keyboard.throttle,'KeyI');assert.equal(config.gamepad.up,10);assert.equal(config.steerRate,2);
 assert((await evaluate(`document.getElementById('modalContent').textContent`)).includes('I'));
 report('remapping-and-conflicts',{throttle:'I',gamepadUp:10,steerRate:2});

 await click('closeModal');await startGP();await evaluate(`apex.race.phase='race';apex.race.resetPlayer(0,0,0)`);
 await press('KeyW');await sleep(500);assert.equal(await evaluate('apex.learning.input.throttle'),0);await press('KeyW','keyUp');
 await press('KeyI');await wait('apex.learning.input.throttle>.1&&apex.race.player.speed>0');await press('KeyI','keyUp');await wait('apex.learning.input.throttle===0');
 assert.equal(await evaluate('apex.race.config.steerRate'),2);await tap('Escape');await click('leave');
 await send('Page.navigate',{url});await wait(`location.href===${JSON.stringify(url)}&&!!window.apex`);await controls();
 assert.equal(await evaluate(`document.querySelector('[data-control-key="throttle"]').textContent`),'I');await click('cancelControls');await click('closeModal');
 report('keyboard-input-and-reload',{oldKeyInactive:true,newKeyDrives:true,persisted:true});

 await startGP();await holdTelemetry();await fakePad();await padButton(10,1);await wait('apex.race.player.gear===2');
 await sleep(400);assert.equal(await evaluate('apex.race.player.gear'),2);await padButton(10,0);await sleep(200);
 await evaluate('apex.race.player.shiftTimer=0');await padButton(10,1);await wait('apex.race.player.gear===3');await padButton(10,0);
 await padButton(9,1);await wait('apex.learning.paused');await padButton(9,0);await sleep(200);await padButton(9,1);await wait('!apex.learning.paused');await padButton(9,0);
 await evaluate('testPad.axes[0]=.1;testPad.buttons[7].value=.01');await sleep(300);assert.equal(await evaluate('apex.learning.input.steer'),0);assert.equal(await evaluate('apex.learning.input.throttle'),0);
 await evaluate('testPad.axes[0]=.6;testPad.buttons[7].value=.6');await wait('apex.learning.input.steer>.3&&apex.learning.input.throttle>.5');
 await evaluate('testPad=null');await wait('apex.learning.input.steer===0&&apex.learning.input.throttle===0');
 report('gamepad-edges-pause-deadzone-disconnect',{syntheticGamepad:true,pauseAndResume:true});

 await evaluate(`Object.assign(apex.race.player,{frontLocked:true,wheelspin:false});`);await wait(`document.querySelector('[data-feedback="lock"]')!==null`);
 assert((await evaluate(`document.getElementById('drivingFeedback').textContent`)).includes('Alivie o freio'));await wait('apex.learning.audio.tyreLevel>0');
 const audio=await evaluate('apex.learning.audio');assert(audio.available);await shot('lock');
 await evaluate(`Object.assign(apex.race.player,{frontLocked:false,wheelspin:true});`);await wait(`document.querySelector('[data-feedback="spin"]')!==null`);
 await tap('Escape');await click('pauseControls');await evaluate(`document.getElementById('feedbackAudio').checked=false`);await click('applyControls');await click('resume');await wait('apex.learning.audio.tyreLevel===0');
 report('grip-visual-and-audio',{audioGraph:audio.available,audioState:audio.state,independentAudioToggle:true});

 await load({},true);await controls();const controlLayout=await evaluate(`({viewport:innerWidth,body:document.body.scrollWidth,modal:document.getElementById('modal').getBoundingClientRect().width,scrollable:document.querySelector('.result-scroll').scrollWidth>document.querySelector('.result-scroll').clientWidth})`);
 assert(controlLayout.body<=controlLayout.viewport);assert(controlLayout.modal<=controlLayout.viewport);assert(controlLayout.scrollable);await shot('controls-mobile');await click('cancelControls');await click('closeModal');await startGP();await holdTelemetry({frontTemp:145,rearTemp:145,fuel:1.2});
 await wait(`document.querySelector('[data-feedback="hot"]')&&document.querySelector('[data-feedback="fuel"]')`);await shot('temperature-fuel-mobile');
 const feedbackLayout=await evaluate(`(()=>{const r=document.getElementById('drivingFeedback').getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height,viewport:innerWidth}})()`);
 assert(feedbackLayout.left>=0&&feedbackLayout.right<=feedbackLayout.viewport);
 const overlaps=await evaluate(`(()=>{const a=document.getElementById('drivingFeedback').getBoundingClientRect();return ['.telemetry','.map-wrap','#dashMirror','#touchControls','.classification .position','.lap-panel>span'].filter(selector=>{const b=document.querySelector(selector).getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});})()`);
 assert.deepEqual(overlaps,[],'Feedback must not cover telemetry, map, speed or touch controls');
 report('mobile-controls-temperature-fuel',{controlLayout,feedbackLayout});

 await load();await school('gears');await holdTelemetry({gear:1,speed:60/3.6});await wait('apex.learning.lesson.stage===1');
 await tap('KeyE');await evaluate('apex.race.player.speed=80/3.6');await wait('apex.learning.lesson.stage===2');await evaluate('apex.race.player.speed=30/3.6;apex.race.player.shiftTimer=0');await tap('KeyQ');await wait(`document.getElementById('retryLesson')!==null`);
 assert.equal(await evaluate('apex.learning.lesson.success'),true);assert.equal(await evaluate(`localStorage.getItem('apex-progress-v2')`),null);await click('retryLesson');
 assert.equal(await evaluate('apex.learning.lesson.stage'),0);assert.equal(await evaluate('apex.race.config.mode'),'training');assert.equal(await evaluate('apex.track.id'),'APX-01');assert.equal(await evaluate('apex.race.progressionEntry'),null);assert.equal(await evaluate('apex.race.player.speed'),0);assert.equal(await evaluate('apex.race.config.automatic'),false);await tap('Escape');await click('leave');
 report('gear-lesson-and-retry',{controlledTelemetry:true,manualKeyEvents:true,noCareerWrite:true});

 await school('braking');await holdTelemetry({speed:0});await fakePad();await padButton(6,.2);await evaluate('apex.race.player.d=150');await wait('apex.learning.lesson.finished');
 assert.equal(await evaluate('apex.learning.lesson.success'),true);await click('lessonList');await evaluate(`document.querySelector('[data-lesson="braking"]').click()`);await click('beginLesson');
 await holdTelemetry({speed:10,frontLocked:true});await sleep(1600);await evaluate('apex.race.player.speed=0');await wait('apex.learning.lesson.finished');assert.equal(await evaluate('apex.learning.lesson.success'),false);await click('lessonMenu');
 report('braking-lesson-success-and-lock-failure',{controlledTelemetry:true});

 await load({'apex-formula-v1':'{"name":"Veterano","round":2,"points":42,"season":3,"credits":220}'});
 await evaluate(`document.querySelector('[data-mode="career"]').click()`);const saved=await evaluate(`localStorage.getItem('apex-progress-v2')`);
 await school('pit');await holdTelemetry();await evaluate('apex.race.player.d=apex.track.length-420');await tap('KeyB');await wait('apex.learning.lesson.stage===1');await tap('KeyL');
 await evaluate(`apex.race.pit=true;apex.race.pitRequested=false;apex.race.pitState='entry';apex.race.player.speed=10`);await wait('apex.learning.lesson.stage===2');
 await evaluate(`apex.race.pitState='service';apex.race.player.speed=0;apex.race.pitTimer=3.1`);await wait('apex.learning.lesson.stage===3');
 await evaluate(`apex.race.pitState='exit';apex.race.pitCount=1`);await wait('apex.learning.lesson.stage===4');
 await evaluate(`apex.race.pit=false`);await wait('apex.learning.lesson.finished');assert.equal(await evaluate('apex.learning.lesson.success'),true);await click('lessonMenu');
 assert.equal(await evaluate(`document.querySelector('[data-mode="career"]').classList.contains('selected')`),true);
 assert.equal(await evaluate('apex.track.id'),'APX-03');assert.equal(await evaluate(`localStorage.getItem('apex-progress-v2')`),saved);
 report('pit-lesson-and-career-preservation',{controlledTelemetry:true,restoredTrack:'APX-03',careerUnchanged:true});

 await load({},true);await school('pit');await shot('lesson-mobile');const lessonLayout=await evaluate(`(()=>{const r=document.getElementById('trainingNotice').getBoundingClientRect();return {left:r.left,right:r.right,viewport:innerWidth,text:document.getElementById('trainingInstruction').textContent}})()`);
 assert(lessonLayout.left>=0&&lessonLayout.right<=lessonLayout.viewport);assert(lessonLayout.text.includes('Solicite'));
 const target=await evaluate(`(()=>{const b=document.querySelector('[data-key="KeyW"]').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...target,id:0}]});await wait('apex.learning.input.throttle>.05');
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('apex.learning.input.throttle===0');report('mobile-lesson',{lessonLayout,touchPedalReleased:true});
 await load();await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await startGP();await holdTelemetry({frontLocked:true});await wait(`document.querySelector('[data-feedback="lock"]')!==null`);
 const landscape=await evaluate(`(()=>{const a=document.getElementById('drivingFeedback').getBoundingClientRect(),b=document.querySelector('.corner-guide');return {left:a.left,right:a.right,bottom:a.bottom,height:innerHeight,width:innerWidth,cornerHidden:getComputedStyle(b).display==='none'};})()`);
 assert(landscape.left>=0&&landscape.right<=landscape.width&&landscape.bottom<=landscape.height);assert(landscape.cornerHidden);await shot('landscape');report('landscape-feedback',{landscape});
};
