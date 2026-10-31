'use strict';
// RX Brain memory: bounded, deterministic recommendations; no execution or LLM claim.
const MAX=200;
function createBrainMemory({initialRecords=[]}={}){
 const records=new Map();
 if(!Array.isArray(initialRecords)||initialRecords.length>MAX)throw Error('Invalid memory snapshot');
 for(const r of initialRecords){
  if(!r||typeof r.key!=='string'||!/^[a-z0-9_-]{1,80}$/.test(r.key)||typeof r.action!=='string'||r.action.length<1||r.action.length>120||![r.successes,r.failures].every(n=>Number.isSafeInteger(n)&&n>=0)||r.successes+r.failures<1||r.successes+r.failures>1000000||typeof r.lastEvidence!=='string'||r.lastEvidence.length<8||r.lastEvidence.length>300||records.has(r.key))throw Error('Invalid memory snapshot');
  records.set(r.key,{key:r.key,action:r.action,successes:r.successes,failures:r.failures,lastEvidence:r.lastEvidence});
 }
 function learn({key,action,success,evidence}){
  if(typeof key!=='string'||!/^[a-z0-9_-]{1,80}$/.test(key)||typeof action!=='string'||action.length<1||action.length>120||typeof success!=='boolean'||typeof evidence!=='string'||evidence.length<8||evidence.length>300)throw Error('Invalid learning record');
  if(!records.has(key)&&records.size>=MAX)throw Error('Memory full');
  const old=records.get(key)||{key,action,successes:0,failures:0,lastEvidence:''};
  if(old.action!==action)throw Error('Conflicting action');
  if(old.lastEvidence===evidence)throw Error('Duplicate learning evidence');
  const next={...old,successes:old.successes+Number(success),failures:old.failures+Number(!success),lastEvidence:evidence};
  records.set(key,next);return structuredClone(next);
 }
 function recommend(key){
  if(typeof key!=='string')throw Error('Invalid key');
  const r=records.get(key);
  if(!r)return {key,known:false,requiresApproval:true,action:null};
  const samples=r.successes+r.failures;
  const successRate=r.successes/samples;
  const confidence=samples<3?'insufficient':samples<10?'limited':'observed';
  const warning=r.failures>r.successes?'more_failures_than_successes':null;
  return {key,known:true,action:r.action,samples,successRate,confidence,warning,requiresApproval:true,advisoryOnly:true};
 }
 function snapshot(){return {schema:1,kind:'rx-brain-memory',trainedModel:false,autoExecuted:0,records:[...records.values()].map(x=>structuredClone(x))};}
 return Object.freeze({learn,recommend,snapshot});
}
module.exports={createBrainMemory};
