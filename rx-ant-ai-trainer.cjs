'use strict';
// RX ANT AI TRAINER 1.0: real small supervised classifier, NOT an LLM.
// Synthetic training examples; weights learned on each GitHub Actions run.
const fs=require('node:fs');
const path=require('node:path');
const DATA=Object.freeze([
 [0,0,0],[0,1,0],[1,0,0],[1,1,1],
 [0.1,0.2,0],[0.2,0.9,0],[0.9,0.2,0],[0.8,0.9,1],
 [0.7,0.8,1],[0.1,0.8,0],[0.8,0.1,0],[0.9,0.95,1]
]);
function sigmoid(z){return 1/(1+Math.exp(-Math.max(-40,Math.min(40,z))));}
function train({epochs=600,learningRate=0.4,checkpoint=null}={}){
 if(!Number.isSafeInteger(epochs)||epochs<1||epochs>2000||!Number.isFinite(learningRate)||learningRate<=0||learningRate>1)throw Error('Invalid training parameters');
 if(checkpoint!==null&&(!checkpoint||checkpoint.schema!==1||checkpoint.kind!=='rx-ant-ai-trained-classifier'||checkpoint.dataset!=='synthetic-toy'||!Array.isArray(checkpoint.weights)||checkpoint.weights.length!==2||!checkpoint.weights.every(x=>Number.isFinite(x)&&Math.abs(x)<100)||!Number.isFinite(checkpoint.bias)||Math.abs(checkpoint.bias)>=100))throw Error('Invalid checkpoint');
 let weights=checkpoint?[...checkpoint.weights]:[0,0],bias=checkpoint?checkpoint.bias:0;
 for(let epoch=0;epoch<epochs;epoch++){
  let dw=[0,0],db=0;
  for(const [x,y,label] of DATA){const e=sigmoid(weights[0]*x+weights[1]*y+bias)-label;dw[0]+=e*x;dw[1]+=e*y;db+=e;}
  weights=weights.map((w,i)=>w-learningRate*dw[i]/DATA.length);
  bias-=learningRate*db/DATA.length;
 }
 const predict=(x,y)=>sigmoid(weights[0]*x+weights[1]*y+bias);
 const correct=DATA.filter(([x,y,label])=>(predict(x,y)>=0.5?1:0)===label).length;
 return {schema:1,kind:'rx-ant-ai-trained-classifier',modelType:'logistic-regression',modelTrained:true,languageModel:false,dataset:'synthetic-toy',datasetSize:DATA.length,epochs,continuedFromCheckpoint:checkpoint!==null,weights,bias,trainingAccuracy:correct/DATA.length,independentValidationAccuracy:null,source:'github-actions-or-local-node',note:'Real parameter optimization on tiny synthetic data. No language understanding, external validation, continual training, or autonomous self-improvement.'};
}
if(require.main===module){
 let checkpoint=null;
 const checkpointFile=path.join('rx-ai-checkpoints','latest.json');
 if(fs.existsSync(checkpointFile)){
  try{checkpoint=JSON.parse(fs.readFileSync(checkpointFile,'utf8'));}catch(e){throw Error('Invalid checkpoint JSON: '+e.message);}
 }
 const report=train({checkpoint});
 fs.mkdirSync('rx-ai-checkpoints',{recursive:true});
 fs.writeFileSync(checkpointFile,JSON.stringify(report,null,2)+'\n');
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync(path.join('rx-bibi-reports','rx-ant-ai-training.json'),JSON.stringify(report,null,2)+'\n');
 console.log('RX ANT AI TRAINER:',report.datasetSize,'examples, training accuracy',report.trainingAccuracy);
}
module.exports={train,DATA};
