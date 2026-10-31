'use strict';
// Read-only adapter between persisted RX Brain records and BIBI panel API.
// This does not expose evidence, perform learning, or execute actions.
function toBrainMemoryApi(snapshot){
 if(!snapshot||snapshot.schema!==1||snapshot.kind!=='rx-brain-memory'||snapshot.trainedModel!==false||snapshot.autoExecuted!==0||!Array.isArray(snapshot.records)||snapshot.records.length>200)throw Error('Invalid Brain snapshot');
 const seen=new Set();
 const records=snapshot.records.map(r=>{
  if(!r||typeof r.key!=='string'||!/^[a-z0-9_-]{1,80}$/.test(r.key)||seen.has(r.key)||typeof r.action!=='string'||r.action.length<1||r.action.length>120||!Number.isSafeInteger(r.successes)||!Number.isSafeInteger(r.failures)||r.successes<0||r.failures<0||r.successes+r.failures<1||r.successes+r.failures>1000000||typeof r.lastEvidence!=='string'||r.lastEvidence.length<8||r.lastEvidence.length>300)throw Error('Invalid Brain record');
  seen.add(r.key);
  const samples=r.successes+r.failures;
  return {key:r.key,action:r.action,samples,successRate:r.successes/samples};
 });
 return {ok:true,kind:'rx-brain-memory',records};
}
module.exports={toBrainMemoryApi};
