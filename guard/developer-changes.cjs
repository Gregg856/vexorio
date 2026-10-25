'use strict';
// Strażak Developer 2.1: inspect the latest commit locally in GitHub Actions.
// Never contacts GitHub APIs, executes changed code, or modifies repository files.
const cp=require('node:child_process');
const fs=require('node:fs');
const {reviewDiff}=require('./developer-diff.cjs');
function inspectLatest({exec=cp.execFileSync,write=fs.writeFileSync}={}){
 const options={encoding:'utf8',maxBuffer:1024*1024,timeout:15000};
 let patch;
 try{
  patch=exec('git',['diff','--no-ext-diff','--no-textconv','--unified=3','HEAD^','HEAD','--','*.js','*.cjs','*.mjs','*.html'],options);
 }catch(error){
  if(error.status===128||error.status===129)return {status:'skipped',reason:'Previous commit unavailable',readOnly:true};
  throw error;
 }
 const result=reviewDiff(patch);
 const report={version:'2.1',status:'ok',commit:exec('git',['rev-parse','HEAD'],options).trim(),...result};
 write('guard-developer-changes.json',JSON.stringify(report,null,2)+'\n',{encoding:'utf8'});
 return report;
}
if(require.main===module){
 try{const r=inspectLatest();console.log('Strażak Developer 2.1: '+JSON.stringify({status:r.status,changedFiles:r.changedFiles||0,summary:r.summary||{}}));}
 catch(e){console.error('Strażak Developer 2.1 failed: '+e.message);process.exitCode=1;}
}
module.exports={inspectLatest};
