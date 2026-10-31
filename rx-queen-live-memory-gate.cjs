'use strict';
// Testable authenticated-response gate for the existing self-hosted RX chat.
// This does not authenticate users: the worker must already have done so.
const path=require('node:path');
async function applyApprovedMemory({response,message,enabled,file}){
 if(!enabled||!response||response.status!==200||typeof message!=='string'||!message.trim()||message.length>160)return response;
 try{
  const original=await response.clone().json();
  if(original?.ok!==true||typeof original.answer!=='string')return response;
  const {load,lookup}=require('./rx-queen-approved-memory.cjs');
  const entry=lookup(await load(path.resolve(file)),message);
  if(!entry)return response;
  const headers=new Headers(response.headers);
  for(const h of ['content-length','content-encoding','etag'])headers.delete(h);
  headers.set('content-type','application/json');headers.set('cache-control','no-store');
  return new Response(JSON.stringify({...original,answer:entry.answer,approvedResponse:true,reviewId:entry.reviewId}),{status:200,headers});
 }catch{return response;}
}
module.exports={applyApprovedMemory};
