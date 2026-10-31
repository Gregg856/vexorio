'use strict';
// RX QUEEN -> RX Developer Bridge: read-only review queue. No filesystem writes.
const {inspectAndPropose}=require('./rx-developer-patch-bridge.cjs');
const {collectSources}=require('./rx-source-reader.cjs');
function buildDeveloperReviewQueue({board,root=process.cwd(),maxReviews=20}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||board.tasks.length>100||
 !Number.isSafeInteger(maxReviews)||maxReviews<1||maxReviews>20)throw Error('Invalid RX task board');
 const limited={...board,tasks:board.tasks.slice(0,maxReviews)};
 const loaded=collectSources(limited,{root});
 const reviews=[];
 const cachedReviews=new Map();
 for(const task of limited.tasks){
  if(!task||typeof task.target!=='string')throw Error('Invalid RX task');
  if(!Object.hasOwn(loaded.sources,task.target))continue;
  let review=cachedReviews.get(task.target);
  if(!review){review=inspectAndPropose({target:task.target,source:loaded.sources[task.target]});cachedReviews.set(task.target,review);}
  reviews.push({target:task.target,priority:task.priority,action:task.action,
   analysis:review.analysis,suggestions:review.suggestions,
   status:'awaiting_review',approved:false,executed:false,requiresApproval:true});
 }
 return {schema:1,kind:'rx-queen-developer-review-queue',reviews,
  sourceLoad:{loaded:loaded.loaded,skipped:loaded.skipped},
  requiresApproval:true,productionModified:false,autoFixesApplied:0,automaticDeployment:false};
}
// Accept the RX Tester artifact as review-only developer tickets; never execute code.
function buildDialogueDeveloperReviews(queue){
 if(!queue||queue.kind!=='rx-developer-review-queue'||!Array.isArray(queue.items)||queue.items.length>200)throw Error('Invalid RX dialogue queue');
 const allowed=new Set(['assertion-failed','generic-fallback','math-answer-missing','profile-memory-missing']);
 const diagnoses={
  'generic-fallback':{target:'rx-chat-planner.mjs',reason:'Planner returned a generic response instead of addressing the question',suggestedCheck:'Add a focused dialogue regression and inspect intent routing'},
  'math-answer-missing':{target:'rx-chat-planner.mjs',reason:'Expected arithmetic result is absent from the answer',suggestedCheck:'Inspect math intent routing and rx-math-core.cjs; add a numeric assertion'},
  'profile-memory-missing':{target:'rx-chat-planner.mjs',reason:'Previously supplied profile fact was not recalled',suggestedCheck:'Inspect bounded session history and profile extraction'},
  'assertion-failed':{target:'tests/rx-bibi-auto-dialogue.mjs',reason:'A scenario expectation was not met',suggestedCheck:'Reproduce scenario, verify expectation, then inspect planner behavior'}
 };
 const regressionFor=(item)=>({
  target:'tests/rx-bibi-auto-dialogue.mjs',
  scenario:{message:item.message,expected:item.type==='math-answer-missing'?'Expected numeric result':item.type==='profile-memory-missing'?'Previously supplied profile fact':'Relevant non-generic answer'},
  proposedAction:'Add a focused regression reproducing this issue before modifying the planner',
  readyToApply:false,
  requiresApproval:true
 });
 const grouped=new Map();
 for(const item of queue.items){
  if(!item||!allowed.has(item.type)||typeof item.message!=='string'||item.message.length>8000||typeof item.answer!=='string'||item.answer.length>1000)throw Error('Invalid RX dialogue issue');
  const key=JSON.stringify([item.type,item.message,item.answer]);
  const existing=grouped.get(key);
  if(existing){existing.occurrences++;existing.priority=existing.priority==='high'||item.priority==='high'?'high':'normal';}
  else grouped.set(key,{...item,occurrences:1});
 }
 const ranked=[...grouped.values()].sort((a,b)=>{
  const score=item=>(item.priority==='high'?100:0)+Math.min(item.occurrences,100);
  return score(b)-score(a)||a.type.localeCompare(b.type)||a.message.localeCompare(b.message);
 });
 const reviews=ranked.map((item,index)=>{
  return {id:index+1,occurrences:item.occurrences,priorityScore:(item.priority==='high'?100:0)+Math.min(item.occurrences,100),source:'rx-bibi-auto-dialogue',category:item.type,priority:item.priority==='high'?'high':'normal',question:item.message,observedAnswer:item.answer,diagnosis:diagnoses[item.type],regressionProposal:regressionFor(item),status:'awaiting_review',approved:false,executed:false,requiresApproval:true};
 });
 return {schema:1,kind:'rx-dialogue-developer-review-queue',received:queue.items.length,uniqueIssues:reviews.length,reviews,requiresApproval:true,productionModified:false,autoFixesApplied:0,automaticDeployment:false};
}

// RX BIBI 7.5: verified GitHub Actions failure evidence becomes review-only tickets.
function buildTesterFailureReviews({run,jobs}={}){
 if(!run||!Number.isSafeInteger(run.id)||run.id<1||run.conclusion!=='failure'||!Array.isArray(jobs)||jobs.length>100)throw Error('Invalid failed RX Tester run');
 const reviews=[];
 for(const job of jobs){
  if(!job||typeof job.name!=='string'||job.name.length>200||!Array.isArray(job.steps)||job.steps.length>100)throw Error('Invalid RX Tester job');
  if(job.conclusion!=='failure')continue;
  for(const step of job.steps){
   if(!step||typeof step.name!=='string'||step.name.length>200)throw Error('Invalid RX Tester step');
   if(step.conclusion!=='failure')continue;
   reviews.push({source:'github-actions-rx-tester',runId:run.id,runUrl:typeof run.html_url==='string'&&/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/[0-9]+$/.test(run.html_url)?run.html_url:null,jobName:job.name,stepName:step.name,diagnosis:'Failed CI step; root cause not yet verified',proposedAction:'Inspect failed step logs and reproduce with a focused regression before proposing code changes',status:'awaiting_review',approved:false,executed:false,requiresApproval:true});
   if(reviews.length>=100)break;
  }
  if(reviews.length>=100)break;
 }
 return {schema:1,kind:'rx-tester-failure-developer-reviews',runId:run.id,reviews,requiresApproval:true,productionModified:false,autoFixesApplied:0,automaticDeployment:false};
}
module.exports={buildDeveloperReviewQueue,buildDialogueDeveloperReviews,buildTesterFailureReviews};
