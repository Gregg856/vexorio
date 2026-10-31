'use strict';
// RX Ants prepare, but never approve, data for Queen neural training.
const fs=require('node:fs/promises');
const {trainQueenFromBatch}=require('./rx-queen-train-batch.cjs');
const LABELS=new Set(['greeting','tests','memory','math']);
function prepareAntBatch({reviews,validation}={}){
 if(!Array.isArray(reviews)||reviews.length<4||reviews.length>128||!Array.isArray(validation))throw Error('Invalid ant review batch');
 const seen=new Set();
 const training=reviews.map(review=>{
  if(!review||review.humanApproved!==true||typeof review.testReference!=='string'||review.testReference.length<8||typeof review.text!=='string'||!review.text.trim()||review.text.length>256||!LABELS.has(review.label))throw Error('Unapproved or invalid ant review');
  const key=review.text.normalize('NFC').toLocaleLowerCase('pl').trim();
  if(seen.has(key))throw Error('Duplicate ant review');
  seen.add(key);
  return {text:review.text,label:review.label,approvedForTraining:true};
 });
 return {schema:1,approvedForTraining:true,training,validation};
}
async function trainFromAntReviews(reviewFile,batchFile){
 if(typeof reviewFile!=='string'||!reviewFile.trim()||typeof batchFile!=='string'||!batchFile.trim())throw Error('Input and output paths required');
 const stat=await fs.lstat(reviewFile);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('Invalid review file');
 const source=JSON.parse(await fs.readFile(reviewFile,'utf8'));
 const batch=prepareAntBatch(source);
 // Do not write a persistent approved batch before validation and training succeed.
 const {trainQueen}=require('./rx-queen-training-selection.cjs');
 const approvedTraining=batch.training.map(x=>[{text:x.text,approvedForTraining:true},x.label]);
 const result=trainQueen({approvedTraining,validation:batch.validation});
 await fs.writeFile(batchFile,JSON.stringify(batch,null,2)+'\n',{flag:'wx',mode:0o600});
 return {kind:'rx-ant-queen-training',trainingExamples:batch.training.length,selected:result.selected,productionConnected:false,output:batchFile};
}
module.exports={prepareAntBatch,trainFromAntReviews};
