'use strict';
// RX AI CORE 1.0: deterministic, bounded candidate selection; NOT a trained model.
// Inputs are untrusted unless independently verified by a trusted CI source.
function createRXAICore({maxCandidates=100}={}){
 if(!Number.isSafeInteger(maxCandidates)||maxCandidates<1||maxCandidates>1000)throw Error('Invalid capacity');
 const candidates=new Map();
 const validId=x=>typeof x==='string'&&/^RXDNA-[A-Za-z0-9_-]{1,64}$/.test(x);
 function submit({id,parentId=null,metrics,source='manual'}){
  if(!validId(id)||(parentId!==null&&!validId(parentId))||candidates.has(id)||candidates.size>=maxCandidates||!metrics||typeof metrics!=='object'||Array.isArray(metrics)||!['manual','ci_unverified'].includes(source))throw Error('Invalid candidate');
  const {passed,total,errors}=metrics;
  if(![passed,total,errors].every(Number.isSafeInteger)||total<1||total>100000||passed<0||passed>total||errors<0||errors>total||passed+errors>total)throw Error('Invalid metrics');
  const candidate=Object.freeze({id,parentId,metrics:Object.freeze({passed,total,errors}),source,score:Math.round(10000*(passed-errors)/total)/100,status:'awaiting_verified_evidence'});
  candidates.set(id,candidate);return structuredClone(candidate);
 }
 function rank(){return [...candidates.values()].sort((a,b)=>b.score-a.score||b.metrics.passed-a.metrics.passed||a.id.localeCompare(b.id)).map(structuredClone);}
 function report(){return {schema:1,kind:'rx-ai-core-candidate-ranking',modelTrained:false,verifiedCandidates:0,candidates:rank(),note:'Heuristic scoring only; no learned weights, authenticated CI attestations or automatic deployment'};}
 return Object.freeze({submit,rank,report});
}
module.exports={createRXAICore};
