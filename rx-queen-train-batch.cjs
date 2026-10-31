'use strict';
// RX Queen: explicit opt-in training batches, never harvested from user chats.
const fs=require('node:fs/promises');
const {trainQueen}=require('./rx-queen-training-selection.cjs');
const LABELS=new Set(['greeting','tests','memory','math']);
function convertAntReviews(input){
 if(!Array.isArray(input.reviews)||input.reviews.length<4||input.reviews.length>128||!Array.isArray(input.validation))throw Error('Invalid ant reviews');
 const seen=new Set();
 const training=input.reviews.map(row=>{
  if(!row||row.humanApproved!==true||typeof row.testReference!=='string'||row.testReference.trim().length<8||typeof row.text!=='string'||!row.text.trim()||row.text.length>256||!LABELS.has(row.label))throw Error('Unapproved ant review');
  const key=row.text.normalize('NFC').toLocaleLowerCase('pl').trim();
  if(seen.has(key))throw Error('Duplicate ant review');
  seen.add(key);
  return {text:row.text,label:row.label,approvedForTraining:true};
 });
 return {schema:1,approvedForTraining:true,training,validation:input.validation};
}
async function trainQueenFromBatch(file){
 if(typeof file!=='string'||!file.trim())throw Error('Training batch path required');
 const stat=await fs.lstat(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('Invalid training batch file');
 const input=JSON.parse(await fs.readFile(file,'utf8'));
 // One existing training entrypoint accepts both approved batches and reviewed ant samples.
 // Ants cannot self-approve: each review needs explicit human approval and evidence reference.
 const batch=Array.isArray(input?.reviews)?convertAntReviews(input):input;
 if(!batch||batch.schema!==1||batch.approvedForTraining!==true||!Array.isArray(batch.training)||batch.training.length<4||batch.training.length>128||!Array.isArray(batch.validation))throw Error('Approved training batch required');
 const approvedTraining=batch.training.map(row=>{
  if(!row||typeof row.text!=='string'||!row.text.trim()||row.text.length>256||!LABELS.has(row.label)||row.approvedForTraining!==true)throw Error('Training example not approved');
  return [{text:row.text,approvedForTraining:true},row.label];
 });
 const result=trainQueen({approvedTraining,validation:batch.validation});
 return {...result,trainingExamples:approvedTraining.length,validationExamples:batch.validation.length};
}
if(require.main===module){
 trainQueenFromBatch(process.argv[2]).then(result=>process.stdout.write(JSON.stringify(result,null,2)+'\n')).catch(error=>{process.stderr.write('RX Queen training rejected: '+error.message+'\n');process.exitCode=1;});
}
module.exports={trainQueenFromBatch,convertAntReviews};
