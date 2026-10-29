'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {inspectAndPropose}=require('./rx-developer-patch-bridge.cjs');
const allowed=['rx-command-bridge.cjs','rx-coordinator.cjs','rx-developer-patch-bridge.cjs'];
const target=process.env.RX_TARGET||allowed[0];
if(!allowed.includes(target))throw Error('RX target not allowed');
const report=inspectAndPropose({target,source:fs.readFileSync(path.join(__dirname,target),'utf8')});
const proposals=report.suggestions.map(item=>({
 rule:item.rule,
 target,
 oldText:item.proposal.oldText,
 newText:item.proposal.newText,
 preview:item.preview.preview,
 syntaxCheck:report.syntaxChecks.find(check=>check.rule===item.rule)||null,
 readyForReview:report.syntaxChecks.some(check=>check.rule===item.rule&&check.syntax==='valid'),
 requiresApproval:true,
 applied:false
}));
// BIBI validates each candidate in memory; no source file is changed.
const original=fs.readFileSync(path.join(__dirname,target),'utf8');
const {previewPatch}=require('./rx-patch-drafter.cjs');
const {Script}=require('node:vm');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const verified=proposals.map((candidate,index)=>{
 const proposal=report.suggestions[index].proposal;
 try{
  const preview=previewPatch(proposal,original).preview;
  if(preview!==candidate.preview)throw Error('Preview mismatch');
  new Script(preview,{filename:target});
  // Run the real Node syntax checker against a temporary file, never the repository.
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'rx-bibi-patch-'));
  let check;
  try{
   const tempFile=path.join(sandbox,target);
   fs.writeFileSync(tempFile,preview,{flag:'wx'});
   check=spawnSync(process.execPath,['--check',tempFile],{encoding:'utf8',timeout:10000,maxBuffer:65536});
  }finally{fs.rmSync(sandbox,{recursive:true,force:true});}
  if(check.error||check.status!==0)throw Error('Sandbox syntax check failed: '+String(check.error?.message||check.stderr||check.status).slice(0,160));
  return {...candidate,bibiValidation:'passed',sandboxValidation:'node-check-passed',readyForReview:true};
 }catch(error){
  return {...candidate,bibiValidation:'failed',readyForReview:false,validationError:String(error.message).slice(0,160)};
 }
});
const output=path.join(__dirname,'rx-bibi-reports','rx-developer-review.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({...report,reviewStatus:'completed',patchCandidates:verified,bibiTest:'rx-developer-bridge-isolated.cjs',changesApplied:false},null,2)+'\n');
console.log('RX Developer reviewed',target,'suggestions',report.suggestions.length);
