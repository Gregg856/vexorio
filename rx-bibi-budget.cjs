'use strict';
// Bounded RX task planner; does not execute jobs or measure provider credits.
function allocate(board,{maxTasks=30}={}){
 if(!board||board.kind!=='rx-ant-task-board'||!Array.isArray(board.tasks)||!Number.isSafeInteger(maxTasks)||maxTasks<0||maxTasks>100)throw Error('Invalid task board or limit');
 return {schema:1,kind:'rx-bibi-budget',planned:board.tasks.slice(0,maxTasks),deferred:board.tasks.slice(maxTasks),limit:maxTasks,autoExecuted:0,actualProviderUsage:null};
}
module.exports={allocate};
