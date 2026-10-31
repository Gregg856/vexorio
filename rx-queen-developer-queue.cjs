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
 const reviews=queue.items.map((item,index)=>{
  if(!item||!allowed.has(item.type)||typeof item.message!=='string'||item.message.length>8000||typeof item.answer!=='string'||item.answer.length>1000)throw Error('Invalid RX dialogue issue');
  return {id:index+1,source:'rx-bibi-auto-dialogue',category:item.type,priority:item.priority==='high'?'high':'normal',question:item.message,observedAnswer:item.answer,diagnosis:diagnoses[item.type],status:'awaiting_review',approved:false,executed:false,requiresApproval:true};
 });
 return {schema:1,kind:'rx-dialogue-developer-review-queue',reviews,requiresApproval:true,productionModified:false,autoFixesApplied:0,automaticDeployment:false};
}
module.exports={buildDeveloperReviewQueue,buildDialogueDeveloperReviews};
