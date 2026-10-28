// RX Brain Chat 2.3 — deterministic report from approved queue, no execution.
import {buildQueenQueue} from './rx-queen-queue.mjs';
export function reportQueenTasks(handoff) {
 const queue=buildQueenQueue(handoff);
 const tasks=queue.tasks.map(task=>Object.freeze({
  id:task.id, module:task.module, action:task.action, status:task.status
 }));
 return Object.freeze({
  kind:'rx-queen-report-v2',
  summary:Object.freeze({total:tasks.length,pending:queue.pending,ready:queue.ready,rejected:queue.rejected,dispatched:0}),
  tasks:Object.freeze(tasks),
  alerts:Object.freeze(queue.pending?['Tasks await owner approval']:[]),
  executionConnected:false
 });
}
