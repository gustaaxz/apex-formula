/* Shared by the game and its offline result review laboratory. */
(function(root){
'use strict';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function time(seconds){
 if(seconds===null||!Number.isFinite(seconds))return '—';
 return Math.floor(seconds/60)+':'+(seconds%60).toFixed(3).padStart(6,'0');
}
function table(rows,playerId){
 const leader=rows.find(row=>row.status==='finished'),fastest=rows.filter(row=>Number.isFinite(row.bestLap)&&row.bestLap>0).sort((a,b)=>a.bestLap-b.bestLap||a.id-b.id)[0];
 const body=rows.map(row=>{
  let gap='Em pista';
  if(row.status==='dnf')gap='Abandono';
  else if(row.status==='finished')gap=row.lapsBehind?`+${row.lapsBehind} volta${row.lapsBehind===1?'':'s'}`:
   row===leader?'Líder':`+${(row.correctedTime-leader.correctedTime).toFixed(3)} s`;
  return `<tr class="${row.id===playerId?'you':''}"><td>${row.position}</td><th scope="row">${escape(row.name)}${row.id===playerId?' · VOCÊ':''}</th><td>${row.laps}</td><td>${time(row.finishTime)}</td><td>${row.penalty?'+'+row.penalty.toFixed(1)+' s':'—'}</td><td>${time(row.correctedTime)}</td><td>${gap}${row.reason?`<small>${escape(row.reason)}</small>`:''}</td><td>${escape(row.team||'—')}</td><td>${row.number??'—'}</td><td class="${row===fastest?'fastest-time':''}">${time(row.bestLap)}${row===fastest?' · VR':''}</td></tr>`;
 }).join('');
 return `<div class="result-scroll" tabindex="0" aria-label="Classificação da corrida"><table class="result-table race-results"><caption>Classificação · tempos desde a largada</caption><thead><tr><th scope="col">POS.</th><th scope="col">PILOTO</th><th scope="col">VOLTAS</th><th scope="col">CHEGADA</th><th scope="col">PUNIÇÃO</th><th scope="col">CORRIGIDO</th><th scope="col">SITUAÇÃO</th><th scope="col">ESCUDERIA</th><th scope="col">Nº</th><th scope="col">MELHOR VOLTA</th></tr></thead><tbody>${body}</tbody></table></div>`;
}
root.ApexResultsView={table,time};
if(typeof module!=='undefined')module.exports=root.ApexResultsView;
})(typeof window!=='undefined'?window:globalThis);
