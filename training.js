/* Guided challenges observe real vehicle telemetry and successful manual actions. */
(function(root){
'use strict';
const LESSONS={
 gears:{name:'Marchas e retomada',intro:'Comece parado em primeira. Acelere até 60 km/h, suba para segunda e alcance 80 km/h. Depois freie até 40 km/h e reduza para primeira.',limit:120},
 braking:{name:'Frenagem progressiva',intro:'Você começa a 80 km/h em segunda. Pare em até 100 m; são tolerados no máximo 0,35 s de rodas travadas. Module o pedal ou dê toques no freio.',limit:60},
 pit:{name:'Entrada e saída dos boxes',intro:'Você começa a 40 km/h antes da entrada. Solicite os boxes, ative o limitador, entre à direita, pare na marca amarela e volte à pista após o serviço. Não ultrapasse 80 km/h nos boxes.',limit:180}
};
function setup(r,id){
 if(!LESSONS[id])throw Error('Unknown lesson');
 r.phase='race';r.countdown=0;r.player.gear=id==='braking'?2:1;
 r.resetPlayer(id==='pit'?r.track.length-430:id==='braking'?100:-40,0,id==='pit'?40/3.6:id==='braking'?80/3.6:0);
 r.player.temp=r.player.frontTemp=r.player.rearTemp=r.player._thermalAverage=100;
 return new Lesson(id,r);
}
class Lesson{
 constructor(id,r){this.id=id;this.stage=0;this.time=0;this.start=r.player.d;this.collisions=r.collisions;this.lockTime=0;this.brakeTime=0;this.stopTime=0;this.up=0;this.down=0;this.finished=false;this.success=false;this.reason='';}
 action(id,success){if(!this.finished&&success){if(id==='up')this.up++;if(id==='down')this.down++;}}
 end(success,reason){this.finished=true;this.success=success;this.reason=reason;}
 tick(r,dt,input){
  if(this.finished)return;
  const p=r.player,speed=p.speed*3.6,travel=p.d-this.start;this.time+=dt;
  if(r.collisions>this.collisions){this.end(false,'Houve contato. Reinicie e mantenha o carro no corredor da pista.');return;}
  if(this.time>LESSONS[this.id].limit){this.end(false,'O tempo do exercício terminou. Reinicie para tentar novamente.');return;}
  if(this.id==='gears'){
   if(Math.abs(p.lane)>7.4||travel>590){this.end(false,'Você saiu do trecho de treino. Reinicie e reduza o ritmo.');return;}
   if(this.stage===0&&p.gear===1&&speed>=60)this.stage=1;
   if(this.stage===1&&p.gear===2&&speed>=80&&this.up>0){this.stage=2;this.down=0;}
   if(this.stage===2&&p.gear===1&&speed<=40&&speed>2&&this.down>0)this.end(true,'Trocas manuais concluídas: primeira, segunda e redução com velocidade compatível.');
  }else if(this.id==='braking'){
   if(p.frontLocked||p.rearLocked)this.lockTime+=dt;
   if(input.brake>.05)this.brakeTime+=dt;
   this.stopTime=p.speed<.5?this.stopTime+dt:0;
   if(Math.abs(p.lane)>7.4||travel>100){this.end(false,'Você ultrapassou o limite de 100 m ou saiu da pista. Tente começar a frear antes.');return;}
   if(this.stopTime>=.5){const success=this.brakeTime>=.2&&this.lockTime<=.35;this.end(success,success?`Parada em ${Math.max(0,travel).toFixed(1)} m, com ${this.lockTime.toFixed(2)} s de travamento.`:this.brakeTime<.2?'Use o freio para realizar a parada.':`Rodas travadas por ${this.lockTime.toFixed(2)} s. Alivie o pedal; a tolerância é 0,35 s.`);}
  }else{
   if(r.pitPenalty||r.pit&&speed>80.5){this.end(false,'Velocidade acima de 80 km/h nos boxes. Reduza antes de entrar. O limitador não freia o carro.');return;}
   if(this.stage===0&&(r.pitRequested||r.pit))this.stage=1;
   if(this.stage===1&&r.pit){if(!p.pitLimiter){this.end(false,'Entre com o limitador ativado. Reinicie para praticar a sequência.');return;}this.stage=2;}
   if(this.stage===2&&r.pitState==='service')this.stage=3;
   if(this.stage===3&&r.pitCount>0)this.stage=4;
   if(this.stage===4&&!r.pit&&r.pitCount>0)this.end(true,'Entrada, parada, serviço e retorno à pista concluídos com controle manual.');
   if(this.stage<2&&p.d>r.track.length-255||this.stage===2&&p.d>r.track.length-80||this.stage===4&&p.d>r.track.length+180)this.end(false,'Você passou pelo ponto de entrada, parada ou saída. Reinicie e observe as instruções.');
  }
 }
 instruction(r,label){
  const speed=Math.round(r.player.speed*3.6),key=id=>label(id);
  if(this.id==='gears')return [
   `Acelere com ${key('throttle')} até 60 km/h em primeira · ${speed}/60 km/h`,
   `Suba com ${key('up')} para segunda e alcance 80 km/h · ${speed}/80 km/h`,
   `Freie com ${key('brake')} até 40 km/h e reduza com ${key('down')} para primeira`
  ][this.stage];
  if(this.id==='braking')return `Freie com ${key('brake')} até parar · ${Math.max(0,r.player.d-this.start).toFixed(0)}/100 m · travamento ${this.lockTime.toFixed(2)}/0,35 s`;
  return [
   `Solicite os boxes com ${key('pit')} · entrada em ${Math.max(0,r.track.length-360-r.player.d).toFixed(0)} m`,
   `Ative ${key('limiter')}, entre à direita no corredor dos boxes · até 80 km/h`,
   `Pare na marca amarela · faltam ${Math.max(0,r.track.length-90-r.player.d).toFixed(0)} m · volante e freio manuais`,
   `Aguarde o serviço · ${Math.max(0,r.pitTimer).toFixed(1)} s`,
   'Acelere para sair. Após a linha, volte à pista pela esquerda no trecho de saída.'
  ][this.stage];
 }
}
root.ApexTraining={LESSONS,setup,Lesson};
if(typeof module!=='undefined')module.exports=root.ApexTraining;
})(typeof window!=='undefined'?window:globalThis);
