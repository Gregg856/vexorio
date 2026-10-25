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
function summarizeIncidents(runs){
 if(!Array.isArray(runs)||runs.length>100)throw Error('Invalid runs');
 const counts={success:0,failure:0,pending:0,other:0};
 const failures=[];
 for(const run of runs){
  if(!run||typeof run!=='object'||Array.isArray(run))throw Error('Invalid run');
  const {status,conclusion,html_url}=run;
  if(!['queued','in_progress','completed'].includes(status))throw Error('Invalid run');
  if(status!=='completed')counts.pending++;
  else if(conclusion==='success')counts.success++;
  else if(conclusion==='failure'){
   counts.failure++;
   failures.push(Object.freeze({url:typeof html_url==='string'&&html_url.startsWith('https://github.com/Gregg856/vexorio/actions/runs/')&&/^\d+$/.test(html_url.slice('https://github.com/Gregg856/vexorio/actions/runs/'.length))?html_url:null,reason:'unconfirmed'}));
  }else counts.other++;
 }
 return Object.freeze({total:runs.length,counts:Object.freeze(counts),failures:Object.freeze(failures)});
}
function classifyFailure(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid failure');
 const {step='',errorCode=null}=input;
 if(typeof step!=='string'||step.length>160||!(errorCode===null||typeof errorCode==='string'&&errorCode.length<=64))throw Error('Invalid failure');
 const normalized=step.toLowerCase();
 if(/test|regresj|skladni|składni|lint/.test(normalized))return Object.freeze({category:'test-failure',action:'inspect-test-logs',confidence:'step-only'});
 if(/cloudflare|publikuj|deploy worker|wrangler/.test(normalized))return Object.freeze({category:errorCode==='10013'?'cloudflare-upload-error':'deployment-failure',action:'inspect-deployment-logs',confidence:'step-only'});
 if(/github api|pobierz histori|fetch workflow/.test(normalized))return Object.freeze({category:'github-api-error',action:'check-api-response',confidence:'step-only'});
 return Object.freeze({category:'unclassified-failure',action:'inspect-logs',confidence:'unknown'});
}
module.exports={assessDeployment,summarizeIncidents,classifyFailure,MAX_ATTEMPTS};
