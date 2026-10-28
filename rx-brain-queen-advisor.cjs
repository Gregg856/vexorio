'use strict';
// Advisory-only planner: converts Queen proposals into memory-backed suggestions.
function adviseQueen(queenReport,brain){
 if(!queenReport||queenReport.kind!=='rx-queen-ai-bridge'||!Array.isArray(queenReport.tasks)||queenReport.tasks.length>100||!brain||typeof brain.recommend!=='function')throw Error('Invalid planner input');
 const tasks=queenReport.tasks.map(task=>{
  if(!task||typeof task.id!=='string'||typeof task.intent!=='string'||typeof task.supported!=='boolean')throw Error('Invalid task');
  const key=task.intent.toLowerCase().replace(/[^a-z0-9_-]/g,'_').slice(0,80);
  const memory=key?brain.recommend(key):{known:false};
  return {id:task.id,intent:task.intent,originalAction:task.action,originalTarget:task.target,
   recommendation:task.supported&&memory.known?memory.action:null,
   evidenceSamples:memory.known?memory.samples:0,
   successRate:memory.known?memory.successRate:null,
   requiresApproval:true,status:'advisory_only'};
 });
 return {schema:1,kind:'rx-brain-queen-advice',tasks,autoExecuted:0,productionChanges:0};
}
module.exports={adviseQueen};
