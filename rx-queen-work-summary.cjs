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
module.exports={summarizeQueenWork};
