/* Input mapping and fixed-step digital pedal response; never drives the car. */
(function(root){
'use strict';
const KEY='apex-controls-v1',VERSION=1;
const ACTIONS=[
 ['throttle','Acelerar','KeyW',7],['brake','Frear','KeyS',6],['left','Virar à esquerda','KeyA',null],['right','Virar à direita','KeyD',null],
 ['up','Subir marcha','KeyE',5],['down','Reduzir marcha','KeyQ',4],['reverse','Ré / primeira','KeyZ',13],
 ['limiter','Limitador de boxes','KeyL',14],['boost','ERS de ultrapassagem','Space',0],['ers','Modo de energia','KeyV',12],
 ['drs','DRS','KeyF',2],['pit','Solicitar boxes','KeyB',1],['camera','Câmera','KeyC',15],['radio','Engenheiro','KeyR',3],
 ['hud','Mostrar / ocultar HUD','KeyH',null],['recover','Reposicionar (+5 s)','KeyX',8],['pause','Pausar / voltar','Escape',9]
].map(([id,label,key,button])=>Object.freeze({id,label,key,button}));
const ALIASES={ArrowUp:'throttle',ArrowDown:'brake',ArrowLeft:'left',ArrowRight:'right',Escape:'pause'};
const HELD=new Set(['throttle','brake','left','right','boost']);
const ranges={sensitivity:[.5,2,1],steerRate:[1,8,3.5],deadzone:[0,.4,.12],lookDeadzone:[0,.4,.12],pedalDeadzone:[0,.3,.02],pedalRate:[.5,8,1.5]};
const finite=(v,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function defaults(){return {version:VERSION,keyboard:Object.fromEntries(ACTIONS.map(a=>[a.id,a.key])),gamepad:Object.fromEntries(ACTIONS.map(a=>[a.id,a.button])),...Object.fromEntries(Object.entries(ranges).map(([key,range])=>[key,range[2]])),feedbackAudio:true};}
function validKey(code){return typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight|BracketLeft|BracketRight|Comma|Period|Slash|Semicolon|Quote|Minus|Equal)$/.test(code);}
function normalize(value){
 const out=defaults();if(!value||value.version!==VERSION)return out;
 for(const [key,[min,max,fallback]] of Object.entries(ranges))out[key]=clamp(finite(value[key],fallback),min,max);
 if(typeof value.feedbackAudio==='boolean')out.feedbackAudio=value.feedbackAudio;
 const keyboard={},gamepad={};
 for(const action of ACTIONS){
  keyboard[action.id]=action.id==='pause'?'Escape':validKey(value.keyboard?.[action.id])?value.keyboard[action.id]:action.key;
  const button=value.gamepad?.[action.id];gamepad[action.id]=button===null&&!['throttle','brake'].includes(action.id)?null:Number.isInteger(button)&&button>=0&&button<=31?button:action.button;
 }
 // Invalid duplicate maps are reset as a group, keeping a complete usable layout.
 if(new Set(Object.values(keyboard)).size===ACTIONS.length)out.keyboard=keyboard;
 const buttons=Object.values(gamepad).filter(v=>v!==null);
 if(new Set(buttons).size===buttons.length)out.gamepad=gamepad;
 return out;
}
function bindingError(config,device,id,value){
 const action=ACTIONS.find(a=>a.id===id);if(!action)return 'Comando desconhecido.';
 if(device==='keyboard'){
  if(id==='pause'||!validKey(value))return 'Use letras, números, espaço, Shift ou pontuação. Setas e Esc são comandos de reserva.';
 }else if(device==='gamepad'){
  if(value===null){if(['throttle','brake'].includes(id))return 'Acelerador e freio precisam de um botão.';return '';}
  if(!Number.isInteger(value)||value<0||value>31)return 'Escolha um botão entre 0 e 31.';
 }else return 'Dispositivo desconhecido.';
 const other=ACTIONS.find(a=>a.id!==id&&config[device][a.id]===value);
 return other?'Já utilizado por '+other.label.toLowerCase()+'.':'';
}
function actionForCode(config,code){return ALIASES[code]||ACTIONS.find(a=>config.keyboard[a.id]===code)?.id||null;}
function keyLabel(code){return ({Space:'ESPAÇO',Escape:'ESC',ShiftLeft:'SHIFT ESQ.',ShiftRight:'SHIFT DIR.',BracketLeft:'[',BracketRight:']',Comma:',',Period:'.',Slash:'/',Semicolon:';',Quote:"'",Minus:'−',Equal:'='})[code]||String(code).replace(/^Key|^Digit/,'');}
function axis(value,deadzone=0,sensitivity=1){const v=clamp(finite(value),-1,1),m=Math.abs(v),d=clamp(finite(deadzone),0,.9);return m<=d?0:Math.sign(v)*Math.pow((m-d)/(1-d),1/clamp(finite(sensitivity,1),.5,2));}
function pedal(value,deadzone){return Math.max(0,axis(value,deadzone));}
class Input{
 constructor(config=defaults()){this.configure(config);}
 configure(config){this.config=normalize(config);this.throttle=0;this.brake=0;this.previous={};this.padId=null;}
 reset(){this.throttle=this.brake=0;}
 sample(keys={},touch={},pad=null){
  const c=this.config,held=id=>!!(keys[c.keyboard[id]]||Object.entries(ALIASES).some(([code,action])=>action===id&&keys[code])||touch[id]);
  const connected=pad&&pad.connected!==false,button=index=>connected&&index!==null?clamp(finite(pad.buttons?.[index]?.value),0,1):0;
  const raw={digitalThrottle:held('throttle')?1:0,digitalBrake:held('brake')?1:0,analogThrottle:pedal(button(c.gamepad.throttle),c.pedalDeadzone),analogBrake:pedal(button(c.gamepad.brake),c.pedalDeadzone),steer:(held('right')?1:0)-(held('left')?1:0),boost:held('boost')||button(c.gamepad.boost)>.5,look:0,actions:[]};
  if(this.padId!==(connected?pad.index??pad.id??0:null)){this.previous={};this.padId=connected?pad.index??pad.id??0:null;}
  raw.steer=clamp(raw.steer+(button(c.gamepad.right)>.5?1:0)-(button(c.gamepad.left)>.5?1:0),-1,1);
  if(connected){
   const steering=axis(pad.axes?.[0],c.deadzone,c.sensitivity);
   if(Math.abs(steering)>Math.abs(raw.steer))raw.steer=steering;
   raw.look=axis(pad.axes?.[2],c.lookDeadzone);
  }
  for(const a of ACTIONS){if(HELD.has(a.id))continue;const down=button(c.gamepad[a.id])>.5;if(down&&!this.previous[a.id])raw.actions.push(a.id);this.previous[a.id]=down;}
  return raw;
 }
 step(raw,dt){
  const h=clamp(finite(dt),0,.1),rate=this.config.pedalRate;
  this.throttle=raw.digitalThrottle?Math.min(1,this.throttle+rate*h):0;
  this.brake=raw.digitalBrake?Math.min(1,this.brake+rate*h):0;
  return {throttle:Math.max(this.throttle,raw.analogThrottle||0),brake:Math.max(this.brake,raw.analogBrake||0),steer:raw.steer||0,boost:!!raw.boost};
 }
}
function load(storage){try{const raw=storage?.getItem(KEY);return normalize(raw?JSON.parse(raw):null);}catch{return defaults();}}
function save(storage,config){try{if(!storage)return false;storage.setItem(KEY,JSON.stringify(normalize(config)));return true;}catch{return false;}}
root.ApexControls={KEY,VERSION,ACTIONS,ALIASES,defaults,normalize,bindingError,actionForCode,keyLabel,axis,pedal,Input,load,save};
if(typeof module!=='undefined')module.exports=root.ApexControls;
})(typeof window!=='undefined'?window:globalThis);
