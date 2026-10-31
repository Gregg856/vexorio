'use strict';
// Private RX learning metrics store for the existing self-hosted Node server.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const filename=()=>path.resolve(process.env.RX_LEARNING_CLOUD_FILE||path.join(__dirname,'rx-cloud-private-inbox','rx-learning-history.json'));
function validate(data){
 if(!data||data.schema!==1||!Array.isArray(data.runs)||data.runs.length>20)throw Error('Invalid history');
 return {schema:1,kind:'rx-learning-history',runs:data.runs.map(r=>{
  if(!r||typeof r.id!=='string'||r.id.length>80||typeof r.at!=='string'||r.at.length>80||
   !Number.isSafeInteger(r.correct)||!Number.isSafeInteger(r.total)||r.total<1||r.correct<0||r.correct>r.total||
   typeof r.winner!=='string'||r.winner.length>80||!['PASS','FAIL'].includes(r.status))throw Error('Invalid training metric');
  return {id:r.id,at:r.at,status:r.status,correct:r.correct,total:r.total,winner:r.winner};
 })};
}
async function read(){
 try{return validate(JSON.parse(await fs.readFile(filename(),'utf8')));}
 catch(e){if(e.code==='ENOENT')return {schema:1,kind:'rx-learning-history',runs:[]};throw e;}
}
async function write(data){
 const valid=validate(data),file=filename(),dir=path.dirname(file);
 await fs.mkdir(dir,{recursive:true,mode:0o700});
 const temp=file+'.'+crypto.randomUUID()+'.tmp';
 try{await fs.writeFile(temp,JSON.stringify(valid,null,2)+'\n',{mode:0o600,flag:'wx'});await fs.rename(temp,file);}
 finally{await fs.rm(temp,{force:true}).catch(()=>{});}
 return {count:valid.runs.length};
}
module.exports={validate,read,write};
