/* Reproducible audit of the unmodified 0.1.0 model. Failing criteria are findings,
 * not regression-test successes. Run: node tests/realism-audit.cjs
 * Writes measured evidence to docs/realism-measurements.json; exits 1 on findings.
 */
const fs=require('node:fs'),path=require('node:path'),S=require('../docs/simulation-v0.1.0.cjs');
const DT=1/120,G=9.80665,round=(v,n=3)=>Number(v.toFixed(n));
const tracks=S.TRACKS.map((_,i)=>S.makeTrack(i));
const straight={length:1e7,at:d=>({x:0,z:-d,y:0,tx:0,tz:-1,nx:1,nz:0,k:0})};
const results=[],measurements={};
function race(config={},track=straight){const r=new S.Race(track,{mode:'time',laps:58,assists:false,brakeAssist:false,consumption:false,wear:false,damage:false,...config});r.phase='race';r.player.d=0;r.player.lane=0;return r;}
function run(r,seconds,input={throttle:1},dt=DT){for(let i=0;i<Math.round(seconds/dt)&&!r.finish;i++)r.step(dt,typeof input==='function'?input(r,i):input);return r;}
function check(id,title,pass,evidence){results.push({id,title,status:pass?'PASS':'FAIL',evidence});}
function acceleration(config={},player={}){const r=race(config);Object.assign(r.player,player);const times={};for(let i=0;i<120*120;i++){r.step(DT,{throttle:1});for(const kph of [100,200,300])if(!times[kph]&&r.player.speed*3.6>=kph)times[kph]=round((i+1)*DT); }return {times,terminalKph:round(r.player.speed*3.6),gear:r.player.gear};}
function braking(config={},player={},startKph=300,endKph=100){const r=race(config);Object.assign(r.player,{speed:startKph/3.6},player);let seconds=0;const start=r.player.d;while(r.player.speed>endKph/3.6&&seconds<30){r.step(DT,{brake:1});seconds+=DT;}return {seconds:round(seconds),metres:round(r.player.d-start),finalKph:round(r.player.speed*3.6)};}
function firstDecel(config={},player={},steer=0){const r=race(config);Object.assign(r.player,{speed:80,steer},player);r.step(DT,{brake:1,steer});return (80-r.player.speed)/DT;}

measurements.acceleration={automatic:acceleration(),firstGear:acceleration({automatic:false}),eighthGear:acceleration({automatic:false},{gear:8}),wetSlick:acceleration({weather:'storm',tc:true,tyre:'soft'}),drySlick:acceleration({weather:'sunset',tc:true,tyre:'soft'}),emptyBattery:acceleration({}, {battery:0})};
check('R01','Primeira marcha tem limite de velocidade coerente com relações de transmissão',measurements.acceleration.firstGear.terminalKph<200,measurements.acceleration.firstGear);
check('R02','Tração na chuva limita a aceleração com slicks',measurements.acceleration.wetSlick.times[100]>measurements.acceleration.drySlick.times[100]*1.1,{dry:measurements.acceleration.drySlick,wet:measurements.acceleration.wetSlick,note:'10% é critério de sensibilidade da auditoria, não especificação oficial.'});
measurements.braking={dryABS:braking(),dryNoABS:braking({abs:false}),wetSlick:braking({weather:'storm',tyre:'soft'}),wetTyre:braking({weather:'storm',tyre:'wet'}),cold:braking({}, {temp:20}),warm:braking({}, {temp:85}),worn:braking({}, {condition:.2}),bremboComparison:braking({abs:false,tyre:'soft'}, {},337,89)};
check('R03','Pneus frios perdem aderência de frenagem',firstDecel({}, {temp:20})<firstDecel({}, {temp:85})*.98,{cold:round(firstDecel({}, {temp:20})),warm:round(firstDecel({}, {temp:85})),unit:'m/s²'});
check('R04','Pneu de chuva freia melhor que slick em pista muito molhada',measurements.braking.wetTyre.metres<measurements.braking.wetSlick.metres,measurements.braking);
check('R05','Desgaste aumenta distância de frenagem',measurements.braking.worn.metres>measurements.braking.dryABS.metres,{fresh:measurements.braking.dryABS,worn:measurements.braking.worn});
check('R06','Frear e esterçar compartilham a aderência disponível',firstDecel({}, {},1)<firstDecel({}, {},0)*.98,{straightDecel:round(firstDecel()),fullSteerDecel:round(firstDecel({}, {},1)),note:'Critério qualitativo; não há orçamento combinado de forças no modelo.'});
const stationary=race({assists:true});run(stationary,2,{steer:1});check('R07','Carro parado não se desloca lateralmente ao girar o volante',Math.abs(stationary.player.lane)<.01,{speed:stationary.player.speed,lateralMetres:round(stationary.player.lane)});
const bank=race();bank.player.battery=0;run(bank,20,{brake:1});check('R08','ERS não recupera energia de frenagem com carro parado',bank.player.battery<5,{batteryStart:0,batteryEnd:round(bank.player.battery),speed:bank.player.speed});
const flat=race(),uphill=race({}, {...straight,at:d=>({...straight.at(d),y:d*.1})});flat.player.speed=uphill.player.speed=60;run(flat,3,{});run(uphill,3,{});check('R09','Aclive altera a desaceleração do carro',uphill.player.speed<flat.player.speed-.5,{flatKph:round(flat.player.speed*3.6),uphill10PercentKph:round(uphill.player.speed*3.6)});
const base=race(),engineUpgrade=race({powerBoost:1.25});run(base,10);run(engineUpgrade,10);check('R10','Melhoria de motor afeta aceleração',engineUpgrade.player.speed>base.player.speed+.1,{baseKph:round(base.player.speed*3.6),upgradeKph:round(engineUpgrade.player.speed*3.6)});
const curve={length:1e7,at:d=>{const a=d/200;return {x:200*(1-Math.cos(a)),z:-200*Math.sin(a),y:0,tx:Math.sin(a),tz:-Math.cos(a),nx:Math.cos(a),nz:Math.sin(a),k:.005};}};
const handsOff=race({},curve);handsOff.player.speed=30;run(handsOff,1,{});const headingChange=handsOff.player.d/200+handsOff.player.yaw;
check('R11','Sem assistência nem esterço, orientação não se alinha sozinha à curva',Math.abs(headingChange)<.005,{headingChangeDegrees:round(headingChange*180/Math.PI),yawDegrees:round(handsOff.player.yaw*180/Math.PI),note:'Curva sintética de raio 200 m; orientação global = direção da pista + yaw.'});
const off=race({assists:true,laps:1},tracks[0]);off.player.lane=8;run(off,300);check('R12','Volta inteiramente fora da pista é invalidada',off.best===null,{best:off.best,lapCount:off.laps.length,warnings:off.trackWarnings,penalty:off.penalty,collisions:off.collisions});
const penalty=race({mode:'gp',laps:1},tracks[0]);penalty.cars.forEach((a,i)=>a.d=-1000-i*10);penalty.player.d=tracks[0].length;penalty.player.speed=50;penalty.cars[0].d=tracks[0].length-10;penalty.cars[0].speed=50;penalty.penalty=10;penalty.finish=true;penalty.phase='finished';
check('R13','Penalidade de tempo entra na classificação final',penalty.rank()[0]!==penalty.player,{leader:penalty.rank()[0].name,penaltySeconds:10,gapMetres:10,note:'rank() também é usado na tela de resultado e na atribuição de pontos.'});
const spin=race();spin.player.speed=30;let maxYaw=0;run(spin,10,r=>{maxYaw=Math.max(maxYaw,Math.abs(r.player.yaw));return {throttle:1,steer:1};});check('R14','Dinâmica permite rotação contínua e recuperação de um giro completo',maxYaw>Math.PI/2,{maxRelativeYawDegrees:round(maxYaw*180/Math.PI),collisions:spin.collisions,modelClampDegrees:round(1.15*180/Math.PI)});
const massLow=firstDecel({}, {fuel:3}),massHigh=firstDecel({}, {fuel:110});check('R15','Massa de combustível influencia frenagem',massHigh<massLow*.995,{light:round(massLow),heavy:round(massHigh),unit:'m/s²',note:'Não substitui calibração com massa total, pneus e downforce.'});

measurements.tracks=tracks.map(t=>{const ys=t.samples.map(p=>p.y);let area=0,maxK=0,intersections=0;const poly=t.samples.filter((_,i)=>i%4===0);
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];area+=a.x*b.z-b.x*a.z;}
 const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 for(let i=0;i<poly.length;i++)for(let j=i+2;j<poly.length;j++){if(i===0&&j===poly.length-1)continue;const a=poly[i],b=poly[(i+1)%poly.length],c=poly[j],d=poly[(j+1)%poly.length];if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)intersections++;}
 t.samples.forEach(p=>maxK=Math.max(maxK,Math.abs(p.k)));
 return {name:t.name,lengthM:round(t.length),declaredTurns:t.turns,controlPoints:t.points.length,elevationRangeM:round(Math.max(...ys)-Math.min(...ys)),minimumRadiusM:round(1/maxK),directionOnMap:area>0?'horário':'anti-horário',centrelineIntersections:intersections,roadWidthM:14.5};});
check('T01','Seis pistas fechadas e sem auto-interseção da linha central',measurements.tracks.every(t=>t.centrelineIntersections===0),measurements.tracks);
measurements.noSteeringLaps=[];
for(const t of tracks){const r=race({assists:true,brakeAssist:false,laps:1,consumption:true,wear:true,fuel:25},t);let peakG=0;run(r,200,(r)=>{peakG=Math.max(peakG,r.player.speed**2*Math.abs(t.at(r.player.d).k)/G);return {throttle:1};});measurements.noSteeringLaps.push({track:t.name,finished:r.finish,time:round(r.time),collisions:r.collisions,peakRequiredLateralG:round(peakG),steeringCommands:0,brakingCommands:0});}
check('R16','Pé embaixo sem esterçar/frear não completa seis pistas intacto',!measurements.noSteeringLaps.every(x=>x.finished&&x.collisions===0),measurements.noSteeringLaps);
measurements.sessions=[];
for(const t of tracks)for(const weather of ['sunset','light','storm'])for(const assists of [true,false]){const r=race({laps:1,assists,brakeAssist:assists,weather,tyre:weather==='storm'?'wet':weather==='light'?'inter':'medium',consumption:true,wear:true,fuel:25},t);let peakG=0,maxLane=0,finite=true;
 run(r,220,r=>{const p=r.player;maxLane=Math.max(maxLane,Math.abs(p.lane));peakG=Math.max(peakG,p.speed**2*Math.abs(t.at(p.d).k)/G);finite&&=[p.d,p.speed,p.lane,p.yaw,p.temp,p.condition,p.fuel,p.battery].every(Number.isFinite);
  if(assists)return {throttle:1};
  const k=t.at(p.d+20).k,target=Math.min(52,r.targetSpeed(p.d,.8)),desiredYawRate=k*p.speed-p.yaw*2-p.lane*.055;
  return {throttle:p.speed<target?1:0,brake:S.clamp((p.speed-target)/8,0,1),steer:S.clamp(Math.atan(desiredYawRate*3.5/Math.max(p.speed,5))*(1+p.speed*.05)/.36,-1,1)};
 });measurements.sessions.push({track:t.name,weather,assists,driver:assists?'accelerator only':'synthetic feedback controller, not a human',finished:r.finish,time:round(r.time),laps:r.laps.length,collisions:r.collisions,maxLane:round(maxLane),peakRequiredLateralG:round(peakG),finite});}
check('F01','36 sessões permanecem numericamente estáveis',measurements.sessions.every(x=>x.finite),{sessions:measurements.sessions.length,finished:measurements.sessions.filter(x=>x.finished).length});
measurements.pits=tracks.map(t=>{const r=race({assists:true},t);Object.assign(r.player,{d:t.length-350,lane:6,speed:18,condition:.3,damage:.3});r.nextTyre='hard';r.requestPit();let service=false;for(let i=0;i<120*60;i++){r.step(DT,{throttle:1});service||=r.pitState==='service';if(r.pitCount&&!r.pit)break;}return {track:t.name,service,stops:r.pitCount,exited:!r.pit,tyre:r.player.tyre};});
check('F02','Entrada, serviço e saída de boxes funcionam nas seis pistas',measurements.pits.every(p=>p.service&&p.stops===1&&p.exited&&p.tyre==='hard'),measurements.pits);
measurements.timestep=[30,60,120].map(hz=>{const r=race();run(r,10,{throttle:1},1/hz);return {hz,speed:r.player.speed,distance:r.player.d};});
check('F03','Resultado em 30, 60 e 120 Hz varia menos de 1%',Math.max(...measurements.timestep.map(x=>x.distance))/Math.min(...measurements.timestep.map(x=>x.distance))<1.01,measurements.timestep);
const paused=race();paused.player.speed=50;paused.phase='paused';run(paused,10);check('F04','Pausa do modelo congela tempo e movimento',paused.time===0&&paused.player.d===0,{time:paused.time,distance:paused.player.d});
measurements.ai=tracks.map(t=>{const r=race({mode:'gp',laps:5,assists:true,brakeAssist:true,pitLap:2,consumption:true,wear:true,fuel:30},t);let peakG=0;run(r,650,r=>{for(const a of r.cars)if(a!==r.player&&a.aiMode!=='pit')peakG=Math.max(peakG,a.speed**2*Math.abs(t.at(a.d).k)/G);return {throttle:1};});return {track:t.name,finished:r.finish,lapCount:r.laps.length,finite:r.cars.every(a=>Number.isFinite(a.d)&&Number.isFinite(a.speed)),aiPitStops:r.cars.filter(a=>a!==r.player&&a.pitted).length,peakRequiredLateralG:round(peakG)};});
check('F05','Seis corridas de cinco voltas com IA encerram e fazem paradas',measurements.ai.every(x=>x.finished&&x.lapCount===5&&x.finite&&x.aiPitStops===19),measurements.ai);
const output={date:'2026-10-06',model:'APEX Formula 0.1.0; game/simulation not modified',dt:DT,criteriaNotice:'Functional PASS does not establish real-world fidelity; FAIL is a reproducible gap. Synthetic fixtures isolate causes and are not official telemetry.',summary:{total:results.length,pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length},results,measurements};
const file=path.join(__dirname,'../docs/realism-measurements.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(output,null,2)+'\n');
for(const r of results)console.log(`${r.status} ${r.id}: ${r.title}`);console.log(JSON.stringify(output.summary));console.log('Evidence: docs/realism-measurements.json');process.exitCode=output.summary.fail?1:0;
