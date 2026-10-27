'use strict';
// RX ANT BUILDER: safe, deterministic build plans. Never edits code or deploys.
const fs=require('node:fs');
const path=require('node:path');
const {draftPatch,previewPatch}=require('./rx-patch-drafter.cjs');
function draftTestSpecification(task){
 const safe=x=>String(x).replace(/[\r\n\t]/g,' ').slice(0,120);
 return {kind:'test-specification',status:'draft_only',title:'Verify '+safe(task.target),scenario:'Reproduce: '+safe(task.request),checks:['Reproduce failure in isolated test','Assert expected behavior after proposed change','Run regression suite before review'],testCodeGenerated:false,requiresApproval:true};
}
function generateRegressionTestDraft(task){
 if(!task||typeof task.target!=='string'||typeof task.request!=='string')throw Error('Invalid draft task');
 const target=task.target.replace(/[^a-zA-Z0-9 ._/-]/g,' ').replace(/\s+/g,' ').slice(0,120);
 const request=task.request.replace(/[^a-zA-Z0-9 .,:_-]/g,' ').replace(/\s+/g,' ').slice(0,80);
 // Generated code is a deliberately skipped test, not a fabricated passing assertion.
 const source=["'use strict';","const {test}=require('node:test');","test.skip("+JSON.stringify('RX draft: '+target)+",()=>{","  // TODO: reproduce "+request.replace(/[\r\n]/g,' '),"});",""].join(String.fromCharCode(10));
 return {filename:'rx-generated-regression-draft.cjs',source,status:'draft_requires_implementation',requiresApproval:true};
}
function generatePatchProposal(task){
 if(!task||typeof task.target!=='string'||typeof task.request!=='string')throw Error('Invalid patch proposal task');
 const target=task.target.slice(0,120);
 const request=task.request.replace(/[^a-zA-Z0-9 .,:_-]/g,' ').replace(/\s+/g,' ').slice(0,80);
 return {kind:'patch-proposal',target,summary:'Investigate and patch: '+request,steps:['Inspect target and existing tests','Reproduce failure in isolated test','Prepare minimal diff on review branch','Run focused checks and request review'],diff:null,codeChangesGenerated:false,status:'needs_developer_or_agent_implementation',requiresApproval:true};
}
function prepareTaskPatchPreview(task,source,{oldText,newText}={}){
 if(!task||typeof task.target!=='string'||typeof task.action!=='string')throw Error('Invalid task for patch');
 const proposal=draftPatch({target:task.target,oldText,newText,reason:task.action.slice(0,200)});
 return {proposal,preview:previewPatch(proposal,source),status:'review_only',requiresApproval:true};
}
function prepareBuildQueue(board,{limit=10}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||board.tasks.length>100||!Number.isSafeInteger(limit)||limit<1||limit>20)throw Error('Invalid build queue input');
 const queue=[];
 for(const task of board.tasks){
  if(queue.length>=limit)break;
  if(!task||typeof task.source!=='string'||typeof task.target!=='string'||typeof task.action!=='string'||!['critical','high','medium','low'].includes(task.priority))throw Error('Invalid task');
  if(!task.recurrent)continue;
  queue.push({id:queue.length+1,source:task.source.slice(0,40),target:task.target.slice(0,120),request:task.action.slice(0,80),priority:task.priority,historyOccurrences:task.historyOccurrences||0,status:'proposal_pending',requiresApproval:true,allowedActions:['review','draft-test','draft-patch'],forbiddenActions:['push-main','deploy','secrets','paid-compute'],testDraft:draftTestSpecification(task),codeDraft:generateRegressionTestDraft({target:task.target,request:task.action}),patchProposal:generatePatchProposal({target:task.target,request:task.action})});
 }
 return {schema:1,kind:'rx-ant-builder-queue',total:queue.length,queue,autoChangesApplied:0,requiresApproval:true};
}
if(require.main===module){
 const dir='rx-bibi-reports';
 const board=JSON.parse(fs.readFileSync(path.join(dir,'rx-ant-task-board.json'),'utf8'));
 const result=prepareBuildQueue(board);
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'rx-ant-builder-queue.json'),JSON.stringify(result,null,2)+'\n');
 console.log('RX ANT BUILDER:',result.total,'proposals queued, no code changes');
}
module.exports={prepareBuildQueue,draftTestSpecification,generateRegressionTestDraft,generatePatchProposal,prepareTaskPatchPreview};
