'use strict';
// Versioned local curriculum: explicit approval, no automatic ingestion from chat.
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const path=require('node:path');
const {train,infer}=require('./rx-bibi-own-inference.cjs');
const VERSION=1;
function validate(data){
 if(!data||data.version!==VERSION||!Array.isArray(data.samples))throw Error('Invalid curriculum version');
 train(data.samples);
 const keys=new Set();
 for(const sample of data.samples){
  const key=sample.input.trim().toLocaleLowerCase('pl');
  if(keys.has(key))throw Error('Duplicate training input');
  keys.add(key);
 }
 return data;
}
async function read(file){
 const data=JSON.parse(await fs.readFile(file,'utf8'));
 return validate(data);
}
async function save(file,data){
 validate(data);
 const target=path.resolve(file);
 const temp=target+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
 try{
  await fs.writeFile(temp,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
  await fs.rename(temp,target);
 }finally{await fs.rm(temp,{force:true});}
}
function evaluate(samples,cases){
 if(!Array.isArray(cases)||cases.length<1)throw Error('No evaluation cases');
 const model=train(samples);
 let correct=0,abstained=0;
 const results=[];
 for(const c of cases){
  if(typeof c?.input!=='string'||typeof c?.answer!=='string')throw Error('Invalid evaluation case');
  const prediction=infer(model,c.input);
  const predicted=prediction?.answer||null;
  if(predicted===c.answer)correct++;
  if(!predicted)abstained++;
  results.push({input:c.input,expected:c.answer,predicted,correct:predicted===c.answer});
 }
 return {total:cases.length,correct,abstained,accuracy:correct/cases.length,results};
}
module.exports={VERSION,validate,read,save,evaluate};
