'use strict';
// RX Queen: reproducible training-only model selection.
// Never select hyperparameters on HOLDOUT or CHALLENGE.
const {createLearner}=require('./rx-text-learner.cjs');
const {SETTINGS}=require('./rx-text-training-benchmark.cjs');
const {HOLDOUT,CHALLENGE}=require('./rx-text-evaluation.cjs');
function score(learner,cases){return cases.reduce((n,[phrase,label])=>n+Number(learner.classify(phrase).label===label),0);}
function trainCandidate(settings,additionalExamples=[]){return createLearner({...settings,additionalExamples});}
function trainQueen({approvedTraining=[],validation=[]}={}){
 if(!Array.isArray(approvedTraining)||!Array.isArray(validation)||validation.length<4||validation.length>100)throw Error('Independent validation examples required');
 if(validation.some(x=>!Array.isArray(x)||x.length!==2||typeof x[0]!=='string'||!x[0].trim()||!['greeting','tests','memory','math'].includes(x[1])))throw Error('Invalid validation data');
 const normalized=s=>s.normalize('NFC').toLocaleLowerCase('pl').trim();
 const forbidden=new Set([...HOLDOUT,...CHALLENGE].map(x=>normalized(x[0])));
 const trainTexts=new Set(approvedTraining.map(x=>normalized(x?.[0]?.text||'')));
 const seen=new Set();
 for(const [phrase] of validation){
  const key=normalized(phrase);
  if(forbidden.has(key)||trainTexts.has(key)||seen.has(key))throw Error('Validation overlap or benchmark leakage');
  seen.add(key);
 }
 const baseModel=createLearner(SETTINGS[0]);
 const baseline={correct:score(baseModel,validation),total:validation.length};
 const results=SETTINGS.map(settings=>{
  const model=trainCandidate(settings,approvedTraining);
  return {settings,correct:score(model,validation),total:validation.length,finalLoss:model.metrics.finalLoss};
 });
 const ranked=[...results].sort((a,b)=>b.correct-a.correct||a.finalLoss-b.finalLoss);
 return {kind:'rx-queen-training-selection',selected:ranked[0],baseline,improvement:ranked[0].correct-baseline.correct,candidates:results,productionConnected:false,trainedModelType:'neural-intent-classifier',benchmarkSetsUntouched:true};
}
module.exports={trainQueen};
