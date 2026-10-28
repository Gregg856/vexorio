// RX Brain Chat 2.2 — read-only queue projection, no dispatch or persistence.
export function buildQueenQueue(reviewedHandoff) {
 if(!reviewedHandoff || reviewedHandoff.kind!=='rx-queen-handoff-v2' || !Array.isArray(reviewedHandoff.tasks)) throw new TypeError('Invalid handoff');
 const allowed=new Set(['awaiting_approval','approved','rejected']);
 if(reviewedHandoff.tasks.some(t=>!t || !allowed.has(t.status) || typeof t.id!=='string' || typeof t.action!=='string')) throw new TypeError('Invalid task');
 const tasks=reviewedHandoff.tasks.map(t=>Object.freeze({
  id:t.id, action:t.action, module:t.module, role:t.role,
  status:t.status==='approved'?'ready_for_manual_dispatch':t.status,
  requiresManualDispatch:true
 }));
 return Object.freeze({
  kind:'rx-queen-queue-v2',
  tasks:Object.freeze(tasks),
  pending:tasks.filter(t=>t.status==='awaiting_approval').length,
  ready:tasks.filter(t=>t.status==='ready_for_manual_dispatch').length,
  rejected:tasks.filter(t=>t.status==='rejected').length,
  dispatched:0,
  executionConnected:false
 });
}
