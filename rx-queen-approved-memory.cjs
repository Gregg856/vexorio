'use strict';
// Explicit approval-only Queen response memory; never store raw private chats.
const fs=require('node:fs/promises'),path=require('node:path');
const MAX=100;
function validate(data){
 if(!data||data.schema!==1||data.kind!=='rx-queen-approved-responses'||!Array.isArray(data.entries)||data.entries.length>MAX)throw Error('Invalid approved response memory');
 const seen=new Set();
 const entries=data.entries.map(x=>{
  if(!x||typeof x.prompt!=='string'||!x.prompt.trim()||x.prompt.length>160||typeof x.answer!=='string'||!x.answer.trim()||x.answer.length>600||x.approved!==true||typeof x.reviewId!=='string'||!/^[a-zA-Z0-9_-]{4,80}$/.test(x.reviewId))throw Error('Invalid approved entry');
  const key=x.prompt.trim().toLocaleLowerCase('pl');if(seen.has(key))throw Error('Duplicate approved prompt');seen.add(key);
  return {prompt:x.prompt.trim(),answer:x.answer.trim(),approved:true,reviewId:x.reviewId};
 });
 return {schema:1,kind:'rx-queen-approved-responses',entries};
}
async function load(file){
 try{return validate(JSON.parse(await fs.readFile(file,'utf8')));}
 catch(e){if(e.code==='ENOENT')return {schema:1,kind:'rx-queen-approved-responses',entries:[]};throw e;}
}
async function save(file,data){
 const safe=validate(data),dir=path.dirname(path.resolve(file));
 await fs.mkdir(dir,{recursive:true,mode:0o700});
 const tmp=path.join(dir,'.rx-queen-approved-'+process.pid+'-'+Date.now()+'.tmp');
 try{await fs.writeFile(tmp,JSON.stringify(safe,null,2)+'\n',{flag:'wx',mode:0o600});await fs.rename(tmp,file);}
 finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
 return safe;
}
function approve(data,{prompt,answer,reviewId,approved}={}){
 if(approved!==true)throw Error('Explicit approval required');
 const safe=validate(data),entry={prompt,answer,reviewId,approved:true};
 const updated=safe.entries.filter(x=>x.prompt.toLocaleLowerCase('pl')!==String(prompt).trim().toLocaleLowerCase('pl'));
 updated.push(entry);
 return validate({...safe,entries:updated});
}
// Promote a reviewed writing exercise into the same approved memory used by RX CLOUD chat.
// Exercises alone are never approval; the reviewer must explicitly approve the exact answer.
function approveWritingExercise(data,{exercise,reviewId,approved}={}){
 if(!exercise||typeof exercise!=='object'||Array.isArray(exercise))throw Error('Invalid writing exercise');
 if(!['message','reply','summary','answer'].includes(exercise.mode))throw Error('Invalid writing mode');
 if(typeof exercise.prompt!=='string'||typeof exercise.text!=='string')throw Error('Invalid writing exercise');
 if(exercise.productionConnected===true||exercise.autoApplied===true)throw Error('Untrusted writing exercise');
 const mode={message:'wiadomość',reply:'odpowiedź',summary:'streszczenie',answer:'odpowiedź'}[exercise.mode];
 const prompt='Napisz '+mode+': '+exercise.prompt.trim();
 return approve(data,{prompt,answer:exercise.text,reviewId,approved});
}
function lookup(data,prompt){
 const safe=validate(data);
 if(typeof prompt!=='string'||prompt.length>160)return null;
 return safe.entries.find(x=>x.prompt.toLocaleLowerCase('pl')===prompt.trim().toLocaleLowerCase('pl'))||null;
}
module.exports={validate,load,save,approve,approveWritingExercise,lookup};
