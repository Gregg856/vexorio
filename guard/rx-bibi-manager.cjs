'use strict';
// RX BIBI Manager 1.0 — read-only deployment decision engine.
// No network, credentials, retry side effects or production writes.
const MAX_ATTEMPTS=2;
function assessDeployment(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid deployment');
 const {provider,workflowStatus,conclusion,attempt=1,errorCode=null}=input;
 if(provider!=='cloudflare'||!['queued','in_progress','completed'].includes(workflowStatus)||!Number.isInteger(attempt)||attempt<1||attempt>100||!(errorCode===null||typeof errorCode==='string'&&errorCode.length<=64))throw Error('Invalid deployment');
 if(workflowStatus!=='completed'){
  if(conclusion!==null&&conclusion!==undefined)throw Error('Invalid deployment');
  return Object.freeze({status:'pending',category:'awaiting-result',retryRecommended:false,requiresApproval:true,action:'wait'});
 }
 if(!['success','failure','cancelled','skipped'].includes(conclusion))throw Error('Invalid deployment');
 if(conclusion==='success')return Object.freeze({status:'healthy',category:'published',retryRecommended:false,requiresApproval:true,action:'none'});
 if(conclusion!=='failure')return Object.freeze({status:'attention',category:'not-published',retryRecommended:false,requiresApproval:true,action:'review'});
 const transient=errorCode==='10013';
 return Object.freeze({status:'failed',category:transient?'cloudflare-upload-error':'unclassified-failure',retryRecommended:transient&&attempt<MAX_ATTEMPTS,requiresApproval:true,action:transient&&attempt<MAX_ATTEMPTS?'propose-retry':'review-logs'});
}
module.exports={assessDeployment,MAX_ATTEMPTS};
