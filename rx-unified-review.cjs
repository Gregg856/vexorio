'use strict';
// RX unified read-only pipeline: Queen -> Medusa -> Memory -> Ant Board -> Developer.
// Input reports are evidence, never commands; no source writes or deployments.
const {routeSignals}=require('./rx-medusa-engine.cjs');
const {updateHistory}=require('./rx-signal-memory.cjs');
const {buildBoard}=require('./rx-ant-task-board.cjs');
const {prepareBuildQueue}=require('./rx-ant-builder.cjs');
const {inspectAndPropose}=require('./rx-developer-patch-bridge.cjs');
function reviewRX({supervisor,previousMemory=null,previousQueue=null,runId,sources={}}={}){
 if(typeof runId!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(runId))throw Error('Invalid RX run ID');
 if(!sources||typeof sources!=='object'||Array.isArray(sources))throw Error('Invalid sources');
 const medusa=routeSignals(supervisor);
 const memory=updateHistory(previousMemory,medusa,runId);
 const board=buildBoard(supervisor,{medusa,memory});
 const builder=prepareBuildQueue(board);
 const reviewQueue={schema:1,kind:'rx-bibi-review-queue',runId,tasks:board.tasks.map(task=>({...task,status:'awaiting_review',approved:false,executed:false})),requiresApproval:true,productionModified:false};
 const reviews=[];
 for(const task of board.tasks.slice(0,20)){
  if(!Object.hasOwn(sources,task.target))continue;
  const source=sources[task.target];
  if(typeof source!=='string'||source.length>500000)throw Error('Invalid source content');
  reviews.push({task:{source:task.source,target:task.target,priority:task.priority,recurrent:task.recurrent},review:inspectAndPropose({target:task.target,source})});
 }
 return {schema:1,kind:'rx-unified-review',medusa,memory,board,builder,reviewQueue,reviews,requiresApproval:true,productionModified:false,autoFixesApplied:0};
}
module.exports={reviewRX};
