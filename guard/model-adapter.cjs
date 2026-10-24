'use strict';
// VEXORIO Guard: opt-in model adapter contract. No external model calls or writes.
const {evaluateListing}=require('./evaluate.cjs');
const VERSION='0.1.0';
async function evaluateWithModel(listing,options={}){
 const base=evaluateListing(listing,options);
 const adapter=options.modelAdapter;
 if(adapter==null)return {...base,model:{status:'not_configured',version:VERSION}};
 if(typeof adapter!=='function')return {...base,model:{status:'invalid_adapter',version:VERSION},requiresHumanReview:true};
 try{
  const result=await adapter({title:listing?.title,description:listing?.description});
  const labels=Array.isArray(result?.labels)?result.labels.filter(v=>typeof v==='string'&&/^[a-z_]{1,40}$/.test(v)).slice(0,10):[];
  const confidence=Number.isFinite(result?.confidence)&&result.confidence>=0&&result.confidence<=1?result.confidence:null;
  if(confidence===null)return {...base,model:{status:'invalid_response',version:VERSION},requiresHumanReview:true};
  return {...base,model:{status:'advisory',version:VERSION,labels,confidence},flags:[...new Set([...base.flags,...labels.map(x=>'model_'+x)])],requiresHumanReview:base.requiresHumanReview||labels.length>0};
 }catch(_error){
  return {...base,model:{status:'unavailable',version:VERSION},requiresHumanReview:true};
 }
}
module.exports={VERSION,evaluateWithModel};
