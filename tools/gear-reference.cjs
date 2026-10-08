/* Rebuild effective gearing from the saved public OpenF1 data.
   Default is offline. --refresh explicitly downloads the same public session. */
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const docs=path.resolve(__dirname,'../docs'),rawFile=path.join(docs,'sainz-singapore-2023-fp2.json.gz'),summaryFile=path.join(docs,'car-reference-data.json');
const origin='https://api.openf1.org/v1/',session=9159,driver=55;
async function get(route){const response=await fetch(origin+route);if(!response.ok)throw Error('HTTP '+response.status);return response.json();}
(async()=>{
 const previous=JSON.parse(fs.readFileSync(summaryFile,'utf8'));let data,meta=previous.session,identity=previous.driver,fetched=previous.fetched;
 if(process.argv.includes('--refresh')){const result=await Promise.all([get('sessions?session_key='+session),get('drivers?session_key='+session+'&driver_number='+driver),get('car_data?session_key='+session+'&driver_number='+driver)]);meta=result[0][0];identity=result[1][0];data=result[2];fetched=new Date().toISOString().slice(0,10);fs.writeFileSync(rawFile,zlib.gzipSync(JSON.stringify(data)));}
 else data=JSON.parse(zlib.gunzipSync(fs.readFileSync(rawFile)).toString('utf8'));
 const quantile=(values,p)=>values[Math.round((values.length-1)*p)],gears=[];
 for(let gear=1;gear<=8;gear++){
  const samples=data.filter((d,i)=>d.n_gear===gear&&d.speed>40&&d.rpm>5000&&d.throttle>25&&!d.brake&&data[i-1]?.n_gear===gear&&data[i+1]?.n_gear===gear);
  const median=quantile(samples.map(d=>d.rpm/d.speed).sort((a,b)=>a-b),.5),clean=samples.filter(d=>Math.abs(d.rpm/d.speed/median-1)<.08),speeds=clean.map(d=>d.speed).sort((a,b)=>a-b),rpmPerKph=quantile(clean.map(d=>d.rpm/d.speed).sort((a,b)=>a-b),.5);
  if(!clean.length)throw Error('No samples for gear '+gear);
  gears.push({gear,samples:clean.length,rpmPerKph:+rpmPerKph.toFixed(4),observedSpeedKph:{min:speeds[0],p10:quantile(speeds,.1),median:quantile(speeds,.5),p90:quantile(speeds,.9),max:speeds.at(-1)},inferredSpeedAt11500rpmKph:+(11500/rpmPerKph).toFixed(1),evidence:clean.filter((_,i)=>i%Math.max(1,Math.floor(clean.length/3))===0).slice(0,3).map(({date,speed,rpm,n_gear,throttle})=>({date,speed,rpm,n_gear,throttle}))});
 }
 fs.writeFileSync(summaryFile,JSON.stringify({...previous,fetched,session:meta,driver:identity,gears},null,2)+'\n');console.log('Rebuilt 8 gear references from '+data.length+' saved telemetry samples.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
