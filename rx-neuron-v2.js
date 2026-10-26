'use strict';
// RX NEURON 2.0 — safety-gated coordination; no training or deployments.
const {buildModelPlan}=require('./rx-ai-builder.js');
const {buildVerifiedDataset}=require('./rx-verified-dataset.js');
const {evaluateModel}=require('./rx-evaluator.js');
function reviewModelCandidate(rx,{evaluation,goal='classification',minExamples=10,minImprovement=0}={}){
 const plan=buildModelPlan(rx,{goal});
 const dataset=buildVerifiedDataset(rx);
 const blockers=[...plan.blockers];
 if(dataset.examples.length===0)blockers.push('No verified candidate examples');
 let metrics=null;
 if(evaluation){
  metrics=evaluateModel({...evaluation,minExamples,minImprovement});
  if(!metrics.passed||metrics.candidateAccuracy<=metrics.baselineAccuracy)blockers.push('Independent evaluation did not demonstrate improvement');
 }else blockers.push('Independent evaluation not provided');
 // A candidate dataset is never silently reused as a held-out evaluation set.
 return Object.freeze({
  version:2,status:blockers.length?'blocked':'ready_for_human_review',
  plan,datasetSummary:{candidateExamples:dataset.examples.length,approvedForTraining:false},
  evaluation:metrics,blockers,requiresHumanApproval:true,
  mayTrain:false,mayDeploy:false
 });
}
module.exports={reviewModelCandidate};
