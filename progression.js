/* Independent local seasons, validated persistence and legacy migration. */
(function(root){
'use strict';
const VERSION=2,KEY='apex-progress-v2',LEGACY_KEY='apex-formula-v1',BACKUP_KEY=KEY+'-recovery';
const PLAYER_ID=9,POINTS=[25,18,15,12,10,8,6,4,2,1];
const UPGRADE_KEYS=['engine','aero','suspension','brakes','energy','reliability'];
const TEAMS=['Vértice Racing','Nova Motorsport','Apex Works'];
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const num=(v,fallback,min,max)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
const integer=(v,fallback,min,max)=>Math.floor(num(v,fallback,min,max));
const text=(v,fallback,max=32)=>typeof v==='string'&&v.trim()?v.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max):fallback;
function calendar(value){return Array.isArray(value)&&value.length===6&&new Set(value).size===6&&value.every(v=>Number.isInteger(v)&&v>=0&&v<6)?[...value]:[0,1,2,3,4,5];}
function resultRows(rows,roster){
 if(!Array.isArray(rows)||!rows.length||rows.length>roster.length)return null;
 const ids=new Set(),positions=new Set(),clean=[];
 for(const row of rows){
  if(!plain(row)||!Number.isInteger(row.id)||row.id<0||row.id>=roster.length||ids.has(row.id)||
   !Number.isInteger(row.position)||row.position<1||row.position>rows.length||positions.has(row.position)||!['finished','dnf'].includes(row.status))return null;
  if(row.status==='finished'&&(typeof row.finishTime!=='number'||!Number.isFinite(row.finishTime)||row.finishTime<0))return null;
  ids.add(row.id);positions.add(row.position);
  const penalty=num(row.penalty,0,0,36000),finishTime=row.status==='finished'?num(row.finishTime,0,0,1e9):null;
  clean.push({id:row.id,position:row.position,status:row.status,laps:integer(row.laps,0,0,100000),finishTime,penalty,
   correctedTime:finishTime===null?null:finishTime+penalty,points:row.status==='finished'?(POINTS[row.position-1]||0):0});
 }
 return clean.sort((a,b)=>a.position-b.position);
}
function compare(a,b){
 if(a.points!==b.points)return b.points-a.points;
 for(let i=0;i<20;i++)if(a.finishes[i]!==b.finishes[i])return b.finishes[i]-a.finishes[i];
 return a.id-b.id;
}
function standings(profile,roster){
 const rows=roster.map((name,id)=>({id,name:id===PLAYER_ID?profile.name:name,points:id===PLAYER_ID?profile.legacyPoints:0,finishes:Array(20).fill(0),starts:0,retirements:0}));
 for(const result of profile.results)for(const row of result.rows){
  const driver=rows[row.id];driver.points+=row.points;driver.starts++;
  if(row.status==='finished')driver.finishes[row.position-1]++;else driver.retirements++;
 }
 rows.sort(compare);
 return rows.map((row,index)=>({...row,position:index+1,gap:rows[0].points-row.points}));
}
function normalizeHistory(value,roster,currentSeason){
 if(!Array.isArray(value))return [];
 return value.filter(item=>plain(item)&&Number.isInteger(item.season)&&item.season>0&&item.season<currentSeason&&Array.isArray(item.standings)).slice(-5).map(item=>{
  const rows=roster.map((name,id)=>{
   const old=item.standings.find(row=>plain(row)&&row.id===id)||{};
   return {id,name:text(old.name,name),points:integer(old.points,0,0,1000000),finishes:Array.from({length:20},(_,i)=>integer(old.finishes?.[i],0,0,6)),starts:integer(old.starts,0,0,6),retirements:integer(old.retirements,0,0,6)};
  }).sort(compare).map((row,i)=>({...row,position:i+1}));
  return {season:item.season,partial:!!item.partial,calendar:calendar(item.calendar),standings:rows,points:rows.find(row=>row.id===PLAYER_ID).points,position:rows.find(row=>row.id===PLAYER_ID).position};
 });
}
function createMode(roster,source={},legacy=false){
 const src=plain(source)?source:{},season=integer(src.season,1,1,100000);
 const profile={
  name:text(src.name,'Piloto',24),nationality:text(src.nationality,'Brasil',25),number:integer(src.number,27,2,99),
  team:TEAMS.includes(src.team)?src.team:TEAMS[0],helmet:typeof src.helmet==='string'&&/^#[0-9a-f]{6}$/i.test(src.helmet)?src.helmet:'#d8ff3e',
  reputation:integer(src.reputation,0,0,100),credits:integer(src.credits,0,0,10000000),
  upgrades:Object.fromEntries(UPGRADE_KEYS.map(key=>[key,integer(src.upgrades?.[key],0,0,3)])),
  season,round:0,points:0,calendar:calendar(src.calendar),
  legacyRound:integer(legacy?src.round:src.legacyRound,0,0,5),legacyPoints:integer(legacy?src.points:src.legacyPoints,0,0,1000000),
  historyIncomplete:false,results:[],history:normalizeHistory(src.history,roster,season),lastSeasonPoints:num(src.lastSeasonPoints,null,0,1000000)
 };
 profile.historyIncomplete=profile.legacyRound>0||profile.legacyPoints>0;
 if(!legacy&&Array.isArray(src.results))for(const result of src.results.slice(0,6)){
  const round=profile.legacyRound+profile.results.length,rows=resultRows(result?.rows,roster);
  if(!plain(result)||result.round!==round||round>=6||result.track!==profile.calendar[round]||!rows?.some(row=>row.id===PLAYER_ID))break;
  profile.results.push({round,track:result.track,rows});
 }
 profile.round=profile.legacyRound+profile.results.length;
 profile.points=standings(profile,roster).find(row=>row.id===PLAYER_ID).points;
 if(profile.round===6)finishSeason(profile,roster);
 return profile;
}
function createData(roster){return {version:VERSION,career:createMode(roster),championship:createMode(roster)};}
function normalizeData(value,roster){return {version:VERSION,career:createMode(roster,value.career),championship:createMode(roster,value.championship)};}
function entry(profile,mode){return Object.freeze({mode,season:profile.season,round:profile.round,track:profile.calendar[profile.round],key:mode+':'+profile.season+':'+profile.round});}
function applyRound(profile,roster,context,rows,reward){
 if(!context||!['career','championship'].includes(context.mode)||context.season!==profile.season||context.round!==profile.round||context.track!==profile.calendar[profile.round]||!reward)return null;
 const clean=resultRows(rows,roster),player=clean?.find(row=>row.id===PLAYER_ID);
 if(!player||reward.advanceRound!==true||reward.points!==player.points||reward.position!==player.position)return null;
 profile.results.push({round:profile.round,track:context.track,rows:clean});
 if(context.mode==='career'&&player.status==='finished'){
  profile.credits=Math.min(10000000,profile.credits+integer(reward.credits,0,0,10000));
  profile.reputation=Math.max(0,Math.min(100,profile.reputation+num(reward.reputation,0,-100,100)));
 }
 profile.points=standings(profile,roster).find(row=>row.id===PLAYER_ID).points;
 profile.round++;
 if(profile.round<6)return {message:'',seasonFinished:false};
 return finishSeason(profile,roster);
}
function finishSeason(profile,roster){
 const table=standings(profile,roster),playerStanding=table.find(row=>row.id===PLAYER_ID);
 const archived={season:profile.season,partial:profile.historyIncomplete,calendar:[...profile.calendar],standings:table,points:profile.points,position:playerStanding.position};
 profile.history.push(archived);profile.history=profile.history.slice(-5);profile.lastSeasonPoints=profile.points;
 const message=`Temporada ${profile.season} concluída: P${playerStanding.position}, ${profile.points} pontos.${profile.historyIncomplete?' A tabela anterior dos rivais não está completa.':''} Uma nova temporada está disponível.`;
 profile.season++;profile.round=0;profile.points=0;profile.legacyRound=0;profile.legacyPoints=0;profile.historyIncomplete=false;profile.results=[];
 return {message,seasonFinished:true,archived};
}
class Store{
 constructor(storage,roster){
  this.storage=storage;this.roster=[...roster];this.data=createData(roster);this.notice='';this.readOnly=false;this.backup=null;
  let raw,old;
  try{raw=storage?.getItem(KEY)??null;old=storage?.getItem(LEGACY_KEY)??null;}catch{this.readOnly=true;this.notice='O navegador não permitiu ler o progresso. Esta sessão não será salva.';return;}
  if(!storage){this.readOnly=true;this.notice='O navegador não disponibilizou o salvamento. Esta sessão não será salva.';return;}
  if(raw!==null){
   try{
    const parsed=JSON.parse(raw);
    if(plain(parsed)&&typeof parsed.version==='number'&&parsed.version>VERSION){this.readOnly=true;this.notice='Este salvamento é de uma versão mais recente. Os dados foram preservados; esta sessão não será salva.';return;}
    if(!plain(parsed)||parsed.version!==VERSION)throw Error('schema');
    this.data=normalizeData(parsed,roster);
    if(JSON.stringify(this.data)!==JSON.stringify(parsed)){this.backup=raw;this.notice='O salvamento foi validado e ajustado. O original será preservado na próxima gravação.';}
    return;
   }catch{this.backup=raw;this.notice='O salvamento atual não pôde ser carregado. O original será preservado na próxima gravação.';}
  }
  if(old!==null){
   try{
    const legacy=JSON.parse(old);if(!plain(legacy))throw Error('legacy');
    this.data.career=createMode(roster,legacy,true);
    const identity=Object.fromEntries(['name','nationality','number','helmet'].map(key=>[key,this.data.career[key]]));
    this.data.championship=createMode(roster,identity);
    this.notice='Progresso antigo preservado na carreira. O campeonato agora tem progresso independente.';
    if(!this.save())this.notice+=' O navegador não permitiu gravar a migração.';
   }catch{this.notice='O salvamento antigo não pôde ser carregado. Seus dados foram mantidos.';}
  }
 }
 profile(mode){return this.data[mode==='championship'?'championship':'career'];}
 context(mode){return entry(this.profile(mode),mode);}
 record(context,rows,reward){
  if(!context||!['career','championship'].includes(context.mode))return null;
  return applyRound(this.profile(context.mode),this.roster,context,rows,reward);
 }
 save(){
  if(this.readOnly||!this.storage)return false;
  try{
   const serialized=JSON.stringify(normalizeData(this.data,this.roster));
   if(this.backup!==null){this.storage.setItem(BACKUP_KEY,this.backup);this.backup=null;}
   this.storage.setItem(KEY,serialized);return true;
  }catch{return false;}
 }
}
root.ApexProgression={VERSION,KEY,LEGACY_KEY,BACKUP_KEY,PLAYER_ID,Store,createMode,createData,standings,entry,applyRound,resultRows};
if(typeof module!=='undefined')module.exports=root.ApexProgression;
})(typeof window!=='undefined'?window:globalThis);
