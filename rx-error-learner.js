'use strict';
// RX LEARNER 1.0: tiny deterministic lookup classifier, not a neural network.
// Trains only from explicitly approved, sanitized examples. No external calls.
function trainErrorClassifier(examples,{maxExamples=1000}={}){
 if(!Array.isArray(examples)||examples.length<1||examples.length>maxExamples||
    !Number.isSafeInteger(maxExamples)||maxExamples<1||maxExamples>1000)
  throw new TypeError('Invalid training dataset');
 const valid=x=>typeof x==='string'&&/^[a-z0-9_-]{1,64}$/i.test(x);
 const votes=new Map();
 for(const item of examples){
  if(!item||item.approvedForTraining!==true||!item.input||
     !valid(item.input.cell)||!valid(item.input.errorCode)||!valid(item.expectedFixId))
   throw new TypeError('Training example not approved or invalid');
  const key=item.input.cell+':'+item.input.errorCode;
  const counts=votes.get(key)||new Map();
  counts.set(item.expectedFixId,(counts.get(item.expectedFixId)||0)+1);
  votes.set(key,counts);
 }
 const rules=[...votes].map(([key,counts])=>{
  const [fixId,count]=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
  return Object.freeze({key,fixId,count});
 });
 const lookup=new Map(rules.map(rule=>[rule.key,rule.fixId]));
 return Object.freeze({
  version:1,kind:'rx_error_lookup',status:'trained_locally',examplesUsed:examples.length,
  ruleCount:rules.length,requiresHumanApproval:true,deployable:false,
  predict(input){
   if(!input||!valid(input.cell)||!valid(input.errorCode))return null;
   const fixId=lookup.get(input.cell+':'+input.errorCode);
   return fixId?{fixId,requiresApproval:true}:null;
  }
 });
}
if(typeof module!=='undefined'&&module.exports)module.exports={trainErrorClassifier};
if(typeof window!=='undefined')window.RXErrorLearner={trainErrorClassifier};
