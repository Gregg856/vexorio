'use strict';
// RX AI BUILDER: bounded proposals for improving an existing model.
// No model is trained or deployed by this module; approval and evaluation are required.
function buildModelPlan(rx,{goal='classification',datasetId='rx_verified',baselineId='rx_baseline'}={}){
 const valid=x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{1,63}$/i.test(x);
 if(!valid(goal)||!valid(datasetId)||!valid(baselineId))throw new TypeError('Invalid model plan input');
 const snapshot=rx.snapshot();
 const verified=rx.exportFailureMemory().patterns.filter(x=>x.verifiedFix);
 return Object.freeze({
  version:1,goal,datasetId,baselineId,
  status:'proposal_only',requiresApproval:true,
  evidence:{verifiedPatterns:verified.length,registeredCells:snapshot.registeredCells},
  steps:[
   {id:'curate',owner:'memory',action:'Prepare permissioned, anonymized training examples'},
   {id:'evaluate',owner:'tests',action:'Compare baseline with candidate on held-out examples'},
   {id:'security',owner:'security',action:'Check privacy, licensing, prompt injection and data leakage'},
   {id:'approve',owner:'moderation',action:'Human approval before any model change'},
   {id:'release',owner:'deploy',action:'Canary release with rollback and monitoring'}
  ],
  blockers:verified.length===0?['No verified examples available']:[],
  note:'Logical RX heads coordinate tasks; this is not automatic AI training.'
 });
}
// Queen creates a bounded work order using existing registered RX cells.
// Handlers may return needs-integration; this must never be reported as completed training.
async function coordinateModelPlan(rx,options={}, {signal}={}){
 if(!rx||typeof rx.dispatch!=='function')throw new TypeError('RX scheduler required');
 const plan=buildModelPlan(rx,options);
 if(plan.blockers.length)return {plan,status:'blocked',tasks:[],requiresApproval:true};
 const tasks=[];
 for(const step of plan.steps){
  if(signal?.aborted)throw signal.reason||new Error('Aborted');
  if(step.id==='approve'||step.id==='release'){
   tasks.push({id:step.id,owner:step.owner,status:'awaiting-human-approval'});
   continue;
  }
  try{
   const result=await rx.dispatch(step.owner,{taskId:step.id,goal:plan.goal,datasetId:plan.datasetId},{signal,priority:step.id==='security'?9:7});
   const status=result?.status||'unknown';
   tasks.push({id:step.id,owner:step.owner,status});
  }catch{
   tasks.push({id:step.id,owner:step.owner,status:'failed'});
  }
 }
 return {plan,status:'awaiting-human-approval',tasks,requiresApproval:true};
}
if(typeof module!=='undefined'&&module.exports)module.exports={buildModelPlan,coordinateModelPlan};
if(typeof window!=='undefined')window.RXAIBuilder={buildModelPlan,coordinateModelPlan};
