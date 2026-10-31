'use strict';
// Supervised exercise -> approved candidate -> holdout check -> local persistence.
const {read}=require('./rx-bibi-training-store.cjs');
const {approve}=require('./rx-bibi-quality-gate.cjs');
const {readHistory,select,markCompleted,key}=require('./rx-bibi-exercise-rotation.cjs');
async function preview(trainingFile,historyFile,cases){
 const current=await read(trainingFile);
 const history=await readHistory(historyFile);
 return select(current.samples,cases,history);
}
async function apply({trainingFile,historyFile,cases,exerciseId,candidate,expectedCurrent}){
 if(!expectedCurrent)throw Error('Expected current training data required');
 const current=await read(trainingFile);
 const history=await readHistory(historyFile);
 const selected=select(current.samples,cases,history);
 const exercise=selected.pending.find(item=>item.id===exerciseId);
 if(!exercise)throw Error('Exercise is not pending');
 if(!candidate||!Array.isArray(candidate.samples))throw Error('Invalid candidate');
 if(!candidate.samples.some(s=>s.input===exercise.input&&s.answer===exercise.expected))throw Error('Candidate must include reviewed correction');
 const decision=await approve(trainingFile,candidate,cases,{expectedCurrent});
 if(!decision.saved)return {...decision,exerciseCompleted:false};
 // The history is only advanced after the validated curriculum was persisted.
 await markCompleted(historyFile,exerciseId);
 return {...decision,exerciseCompleted:true,remaining:(await preview(trainingFile,historyFile,cases)).pending.length};
}
module.exports={preview,apply};
