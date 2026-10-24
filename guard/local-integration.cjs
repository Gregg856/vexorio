'use strict';
// Bridge our own locally trained model into the existing advisory-only Guard.
const {train}=require('./local-model.cjs');
const {evaluateWithModel}=require('./model-adapter.cjs');
function createLocalGuard(examples,{minimumConfidence=0.85}={}){
 if(typeof minimumConfidence!=='number'||minimumConfidence<0.5||minimumConfidence>1)throw Error('Invalid confidence threshold');
 const model=train(examples);
 const modelAdapter=async ({title,description})=>{
  const prediction=model.predict([title,description].filter(x=>typeof x==='string').join(' '));
  return {labels:prediction.label==='unknown'?['insufficient_model_knowledge']:prediction.label==='suspicious'&&prediction.confidence>=minimumConfidence?['suspected_fraud']:[],confidence:prediction.confidence};
 };
 return Object.freeze({
  version:model.version,
  evaluate(listing,options={}){return evaluateWithModel(listing,{...options,modelAdapter})}
 });
}
module.exports={createLocalGuard};
