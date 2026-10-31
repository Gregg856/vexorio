'use strict';
// Explicit approval gate for local training updates; no chat ingestion.
const {read,save,evaluate,validate}=require('./rx-bibi-training-store.cjs');
function compare(current,candidate,cases){
 validate(current);validate(candidate);
 const before=evaluate(current.samples,cases);
 const after=evaluate(candidate.samples,cases);
 const regressions=after.results.filter((r,i)=>before.results[i].correct&&!r.correct);
 const improvements=after.results.filter((r,i)=>!before.results[i].correct&&r.correct);
 return {before,after,regressions,improvements,accepted:regressions.length===0&&after.correct>=before.correct};
}
async function approve(file,candidate,cases,{expectedCurrent}={}){
 if(!expectedCurrent)throw Error('Expected current curriculum required');
 const current=await read(file);
 validate(expectedCurrent);
 if(JSON.stringify(current)!==JSON.stringify(expectedCurrent))throw Error('Curriculum changed; reload before approval');
 const result=compare(current,candidate,cases);
 if(!result.accepted)return {...result,saved:false};
 await save(file,candidate);
 return {...result,saved:true};
}
module.exports={compare,approve};
