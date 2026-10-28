'use strict';
// RX COMMAND BRIDGE 1.0: one free-form request -> bounded coordinated plan.
// No AI model inference, execution, deployment or network calls.
const {route}=require('./rx-ai-router.cjs');
const RULES=Object.freeze([
 {id:'inspect_tests',words:['test','błąd','blad','awari','sprawdź','sprawdz'],modules:['queen','ants','ci'],cost:5},
 {id:'plan_cloud_checks',words:['chmur','komputer','cloud'],modules:['queen','cloud'],cost:8},
 {id:'classify_task',words:['model','trening','uczen','uczeń','ai'],modules:['queen','brain','ants'],cost:10},
 {id:'rank_candidates',words:['porówn','porown','wybierz'],modules:['brain','queen'],cost:4}
]);
function planCommand(input,{energyBalance=0}={}){
 if(typeof input!=='string'||input.trim().length<3||input.length>1000||!Number.isSafeInteger(energyBalance)||energyBalance<0||energyBalance>10000)throw Error('Invalid RX command');
 const normalized=input.toLocaleLowerCase('pl-PL');
 const found=RULES.filter(r=>r.words.some(word=>normalized.includes(word)));
 const steps=found.map(rule=>{const cap=route(rule.id);return {intent:rule.id,modules:[...rule.modules],handler:cap.supported?cap.module:null,supported:cap.supported,cost:rule.cost,requiresApproval:true,status:'proposed'};});
 const cost=steps.reduce((sum,s)=>sum+s.cost,0);
 return {schema:1,kind:'rx-command-plan',request:input.trim(),steps,totalCost:cost,energyBalance,canReserve:cost>0&&cost<=energyBalance,requiresApproval:true,autoExecuted:0,productionModified:false,modelInferenceUsed:false,status:steps.length?'awaiting_review':'unrecognized',note:'Plan only. RX Energy credits do not execute work; execution adapter and verified permissions are not connected.'};
}
module.exports={planCommand};
