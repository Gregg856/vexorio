'use strict';
// Offline experiment only: never changes production settings or writes user data.
const {createLearner}=require('./rx-text-learner.cjs');
const {HOLDOUT,CHALLENGE}=require('./rx-text-evaluation.cjs');
const SETTINGS=Object.freeze([
 Object.freeze({epochs:120,hidden:24,rate:0.06}),
 Object.freeze({epochs:180,hidden:24,rate:0.06}),
 Object.freeze({epochs:120,hidden:32,rate:0.06}),
 Object.freeze({epochs:180,hidden:32,rate:0.06}),
 Object.freeze({epochs:120,hidden:24,rate:0.04})
]);
function evaluateSet(learner,set){
 const cases=set.map(([phrase,expected])=>({expected,predicted:learner.classify(phrase).label}));
 return {correct:cases.filter(x=>x.expected===x.predicted).length,total:cases.length,errors:set.flatMap(([phrase,expected],i)=>cases[i].predicted===expected?[]:[{phrase,expected,predicted:cases[i].predicted}])};
}
function benchmark(){
 return {kind:'rx-offline-training-benchmark',productionConnected:false,settingsChanged:false,
  runs:SETTINGS.map(settings=>{
   const learner=createLearner(settings);
   return {settings,training:{initialLoss:learner.metrics.initialLoss,finalLoss:learner.metrics.finalLoss},
    holdout:evaluateSet(learner,HOLDOUT),challenge:evaluateSet(learner,CHALLENGE)};
  })};
}
if(require.main===module)console.log(JSON.stringify(benchmark(),null,2));
module.exports={SETTINGS,benchmark};
