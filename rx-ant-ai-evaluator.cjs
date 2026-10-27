'use strict';
// RX ANT AI EVALUATOR: independent, fixed synthetic validation samples.
// It does not claim real-world generalization or deploy models.
const fs=require('node:fs');
const path=require('node:path');
const {train}=require('./rx-ant-ai-trainer.cjs');
const VALIDATION=Object.freeze([
 [0.05,0.05,0],[0.15,0.65,0],[0.65,0.15,0],
 [0.85,0.85,1],[0.95,0.75,1],[0.75,0.95,1],
 [0.35,0.35,0],[0.6,0.6,1]
]);
function accuracy(model){
 if(!model||!Array.isArray(model.weights)||model.weights.length!==2||!model.weights.every(Number.isFinite)||!Number.isFinite(model.bias))throw Error('Invalid model');
 let correct=0;
 for(const [x,y,label] of VALIDATION){
  const z=model.weights[0]*x+model.weights[1]*y+model.bias;
  if((z>=0?1:0)===label)correct++;
 }
 return correct/VALIDATION.length;
}
function evaluate({previous=null}={}){
 const candidate=train({checkpoint:previous});
 const candidateAccuracy=accuracy(candidate);
 const previousAccuracy=previous?accuracy(previous):null;
 const improved=previousAccuracy===null||candidateAccuracy>previousAccuracy;
 const selected=previousAccuracy!==null&&candidateAccuracy<=previousAccuracy?previous:candidate;
 return {schema:1,kind:'rx-ant-ai-evaluation',dataset:'synthetic-heldout-toy',validationExamples:VALIDATION.length,candidateAccuracy,previousAccuracy,improved,selectedModel:selected,modelChanged:selected===candidate,realWorldValidated:false,note:'Held-out synthetic examples only; no independent real-world dataset or LLM. Tie or regression retains previous model.'};
}
if(require.main===module){
 const checkpointPath=path.join('rx-ai-checkpoints','latest.json');
 let previous=null;
 if(fs.existsSync(checkpointPath))previous=JSON.parse(fs.readFileSync(checkpointPath,'utf8'));
 const result=evaluate({previous});
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.mkdirSync('rx-ai-checkpoints',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-ant-ai-evaluation.json',JSON.stringify({...result,selectedModel:undefined},null,2)+'\n');
 fs.writeFileSync(checkpointPath,JSON.stringify(result.selectedModel,null,2)+'\n');
 console.log('RX AI EVALUATOR:',result.candidateAccuracy,'previous:',result.previousAccuracy,'model changed:',result.modelChanged);
}
module.exports={accuracy,evaluate,VALIDATION};
