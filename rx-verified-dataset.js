'use strict';
// RX DATASET 1.0: deterministic, minimal, approved metadata only.
// This creates evaluation/training candidates; it does not train a model.
function buildVerifiedDataset(rx,{maxExamples=200}={}){
 if(!Number.isSafeInteger(maxExamples)||maxExamples<1||maxExamples>1000)throw new RangeError('Invalid dataset limit');
 if(!rx||typeof rx.exportFailureMemory!=='function')throw new TypeError('RX memory required');
 const patterns=rx.exportFailureMemory().patterns;
 const safe=x=>typeof x==='string'&&/^[a-z0-9_-]{1,64}$/i.test(x);
 const examples=patterns.filter(p=>p.verifiedFix&&safe(p.cell)&&safe(p.code)&&safe(p.verifiedFix))
  .slice(0,maxExamples).map(p=>Object.freeze({
   input:Object.freeze({cell:p.cell,errorCode:p.code}),
   expectedFixId:p.verifiedFix,
   source:'verified_rx_pattern',
   approvedForTraining:false
  }));
 return {version:1,status:'candidate_only',requiresDataApproval:true,
  examples,excluded:patterns.length-examples.length,
  note:'No raw messages, secrets, source code or personal data included. Approval and independent validation required.'};
}
if(typeof module!=='undefined'&&module.exports)module.exports={buildVerifiedDataset};
if(typeof window!=='undefined')window.RXVerifiedDataset={buildVerifiedDataset};
