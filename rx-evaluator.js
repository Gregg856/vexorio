'use strict';
// RX EVALUATOR 1.0: compare candidate predictions against an independently
// supplied held-out, approved evaluation set. No training or deployment here.
function evaluateModel({examples,baselinePredictions,candidatePredictions,minExamples=10,minImprovement=0}={}){
 if(!Array.isArray(examples)||!Array.isArray(baselinePredictions)||!Array.isArray(candidatePredictions)||
    examples.length!==baselinePredictions.length||examples.length!==candidatePredictions.length||
    !Number.isSafeInteger(minExamples)||minExamples<1||
    typeof minImprovement!=='number'||!Number.isFinite(minImprovement)||minImprovement<0||minImprovement>1)
   throw new TypeError('Invalid evaluation inputs');
 const validId=x=>typeof x==='string'&&/^[a-z0-9_-]{1,64}$/i.test(x);
 let baselineCorrect=0,candidateCorrect=0;
 for(let i=0;i<examples.length;i++){
  const e=examples[i];
  if(!e||e.approvedForEvaluation!==true||!validId(e.expectedFixId)||
     !validId(baselinePredictions[i])||!validId(candidatePredictions[i]))
   throw new TypeError('Unapproved or invalid evaluation example');
  baselineCorrect+=Number(baselinePredictions[i]===e.expectedFixId);
  candidateCorrect+=Number(candidatePredictions[i]===e.expectedFixId);
 }
 const n=examples.length;
 const baselineAccuracy=n?baselineCorrect/n:0;
 const candidateAccuracy=n?candidateCorrect/n:0;
 const improvement=candidateAccuracy-baselineAccuracy;
 const sufficient=n>=minExamples;
 return Object.freeze({
  version:1,status:'evaluation_only',sampleSize:n,baselineAccuracy,candidateAccuracy,improvement,
  passed:sufficient&&improvement>=minImprovement&&candidateAccuracy>=baselineAccuracy,
  blockers:sufficient?[]:['Insufficient independently approved evaluation examples'],
  requiresHumanApproval:true,
  note:'A passing evaluation does not authorize training, release or automatic model changes.'
 });
}
if(typeof module!=='undefined'&&module.exports)module.exports={evaluateModel};
if(typeof window!=='undefined')window.RXEvaluator={evaluateModel};
