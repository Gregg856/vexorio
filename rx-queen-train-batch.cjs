'use strict';
// RX Queen: explicit opt-in training batches, never harvested from user chats.
const fs=require('node:fs/promises');
const {trainQueen}=require('./rx-queen-training-selection.cjs');
const LABELS=new Set(['greeting','tests','memory','math']);
async function trainQueenFromBatch(file){
 if(typeof file!=='string'||!file.trim())throw Error('Training batch path required');
 const stat=await fs.lstat(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('Invalid training batch file');
 const batch=JSON.parse(await fs.readFile(file,'utf8'));
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
module.exports={trainQueenFromBatch};
