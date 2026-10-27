'use strict';
// Read-only bounded source loader for RX diagnostics. No path escapes or writes.
const fs=require('node:fs');
const path=require('node:path');
const SAFE=/^(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:js|cjs|mjs)$/i;
const BLOCKED=/(?:^|\/)(?:\.github|node_modules|secrets?|\.env)(?:\/|$)/i;
function collectSources(board,{root=process.cwd(),limit=20,maxBytes=500000}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||board.tasks.length>100)throw Error('Invalid RX board');
 if(!Number.isSafeInteger(limit)||limit<1||limit>20||!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>500000)throw Error('Invalid RX limits');
 const base=fs.realpathSync(root);
 const sources=Object.create(null),skipped=[];
 for(const task of board.tasks.slice(0,limit)){
  const target=task?.target;
  if(typeof target!=='string'||target.length>160||!SAFE.test(target)||target.includes('..')||BLOCKED.test(target)){skipped.push({target:String(target).slice(0,160),reason:'blocked_target'});continue;}
  const candidate=path.resolve(base,target);
  if(!candidate.startsWith(base+path.sep)){skipped.push({target,reason:'outside_root'});continue;}
  try{
   const actual=fs.realpathSync(candidate);
   if(!actual.startsWith(base+path.sep)){skipped.push({target,reason:'symlink_escape'});continue;}
   const stat=fs.statSync(actual);
   if(!stat.isFile()||stat.size>maxBytes){skipped.push({target,reason:'oversize_or_not_file'});continue;}
   sources[target]=fs.readFileSync(actual,'utf8');
  }catch(error){
   if(error.code==='ENOENT'){skipped.push({target,reason:'missing'});continue;}
   throw error;
  }
 }
 return {sources,skipped,loaded:Object.keys(sources).length,readOnly:true};
}
module.exports={collectSources};
