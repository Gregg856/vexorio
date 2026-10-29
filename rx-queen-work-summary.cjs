'use strict';
// Read-only overview for RX Queen. Never approves, edits or deploys tasks.
function summarizeQueenWork({board,queue,reviews}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks))throw Error('Invalid RX board');
 if(!queue||queue.kind!=='rx-cosmos-ant-queue'||!Array.isArray(queue.planned))throw Error('Invalid RX COSMOS queue');
 if(!reviews||reviews.kind!=='rx-queen-developer-review-queue'||!Array.isArray(reviews.reviews))throw Error('Invalid RX developer review queue');
 const priorities={critical:0,high:0,medium:0,low:0};
 for(const task of board.tasks){
  if(!task||!Object.hasOwn(priorities,task.priority))throw Error('Invalid task priority');
  priorities[task.priority]++;
 }
 const reviewTargets=new Set(reviews.reviews.map(item=>item.target));
 return {
  schema:1,kind:'rx-queen-work-summary',
  totalTasks:board.tasks.length,
  planned:queue.planned.length,
  deferred:queue.deferred,
  developerReviews:reviews.reviews.length,
  distinctReviewTargets:reviewTargets.size,
  awaitingApproval:reviews.reviews.filter(item=>item.requiresApproval===true&&item.approved===false).length,
  priorities,
  sourceLoad:reviews.sourceLoad||null,
  executed:0,autoFixesApplied:0,automaticDeployment:false,
  note:'Read-only overview. No background code execution or automatic approval.'
 };
}
// Bounded, read-only performance handoff for RX Queen and Developer.
function summarizeQueenFastTiming(report){
 if(!report||report.kind!=='rx-fast-queen-timing'||!Array.isArray(report.samples)||
 report.samples.length<3||report.samples.length>30||
 report.samples.some(n=>!Number.isFinite(n)||n<0||n>120000)||
 !Array.isArray(report.details)||report.details.length!==report.samples.length||
 !Number.isFinite(report.medianMs)||report.medianMs<0||report.medianMs>120000||
 !Number.isFinite(report.variabilityPct)||report.variabilityPct<0||report.variabilityPct>100000)
 throw Error('Invalid RX FAST timing report');
 const slowest=new Map();
 for(const detail of report.details){
  if(!detail||!Array.isArray(detail.slowest)||detail.slowest.length>3)throw Error('Invalid RX FAST test details');
  for(const test of detail.slowest){
   if(!test||typeof test.file!=='string'||!/^tests\/[a-z0-9-]+\.cjs$/.test(test.file)||
    !Number.isFinite(test.ms)||test.ms<0||test.ms>120000)throw Error('Invalid RX FAST test timing');
   const old=slowest.get(test.file)||{file:test.file,samples:0,totalMs:0,maxMs:0};
   old.samples++;old.totalMs+=test.ms;old.maxMs=Math.max(old.maxMs,test.ms);slowest.set(test.file,old);
  }
 }
 if(report.samples.slice().sort((a,b)=>a-b)[Math.floor(report.samples.length/2)]!==report.medianMs && report.samples.length%2===1)throw Error('Invalid RX FAST median');
 const ranked=[...slowest.values()].map(t=>({file:t.file,samples:t.samples,meanMs:Number((t.totalMs/t.samples).toFixed(1)),maxMs:t.maxMs}))
 .sort((a,b)=>b.meanMs-a.meanMs).slice(0,3);
 return {schema:1,kind:'rx-queen-fast-performance-handoff',medianMs:report.medianMs,
  variabilityPct:report.variabilityPct,slowestTests:ranked,
  nextAction:report.variabilityPct>25?'repeat_measurements':'review_slowest_test',
  developerTask:ranked.length?{kind:'performance_review',target:ranked[0].file,approved:false,executed:false}:null,
  requiresApproval:true,productionModified:false,automaticDeployment:false};
}
module.exports={summarizeQueenWork,summarizeQueenFastTiming};
