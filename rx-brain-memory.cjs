'use strict';
// RX Brain memory: bounded, deterministic recommendations; no execution or LLM claim.
const MAX=200;
function createBrainMemory(){
 const records=new Map();
 function learn({key,action,success,evidence}){
  if(typeof key!=='string'||!/^[a-z0-9_-]{1,80}$/.test(key)||typeof action!=='string'||action.length<1||action.length>120||typeof success!=='boolean'||typeof evidence!=='string'||evidence.length<8||evidence.length>300)throw Error('Invalid learning record');
  if(!records.has(key)&&records.size>=MAX)throw Error('Memory full');
  const old=records.get(key)||{key,action,successes:0,failures:0,lastEvidence:''};
  if(old.action!==action)throw Error('Conflicting action');
  const next={...old,successes:old.successes+Number(success),failures:old.failures+Number(!success),lastEvidence:evidence};
  records.set(key,next);return structuredClone(next);
 }
 function recommend(key){
  if(typeof key!=='string')throw Error('Invalid key');
  const r=records.get(key);
  if(!r)return {key,known:false,requiresApproval:true,action:null};
  const samples=r.successes+r.failures;
  return {key,known:true,action:r.action,samples,successRate:r.successes/samples,requiresApproval:true,advisoryOnly:true};
 }
 function snapshot(){return {schema:1,kind:'rx-brain-memory',trainedModel:false,autoExecuted:0,records:[...records.values()].map(x=>structuredClone(x))};}
 return Object.freeze({learn,recommend,snapshot});
}
module.exports={createBrainMemory};
