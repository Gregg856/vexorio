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
module.exports={buildDeveloperReviewQueue};
