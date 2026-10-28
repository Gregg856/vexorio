// RX Brain Chat 2.1 — approval decisions are immutable records, never execution.
import {prepareQueenHandoff} from './rx-queen-handoff.mjs';
const DECISIONS = new Set(['approve','reject']);
export function decideQueenTask(handoff, taskId, decision, actor, reason='') {
 if(!handoff || handoff.kind!=='rx-queen-handoff-v2' || handoff.status!=='awaiting_approval' || !Array.isArray(handoff.tasks)) throw new TypeError('Invalid handoff');
 if(typeof taskId!=='string' || !handoff.tasks.some(t=>t.id===taskId && t.status==='awaiting_approval')) throw new TypeError('Unknown or already decided task');
 if(!DECISIONS.has(decision)) throw new TypeError('Invalid decision');
 if(typeof actor!=='string' || !actor.trim() || actor.length>100) throw new TypeError('Actor required');
 if(typeof reason!=='string' || reason.length>500) throw new TypeError('Invalid reason');
 const tasks=handoff.tasks.map(t=>Object.freeze(t.id===taskId?{...t,status:decision==='approve'?'approved':'rejected',requiresApproval:false}:t));
 return Object.freeze({
  ...handoff,
  status:tasks.every(t=>t.status!=='awaiting_approval')?'reviewed':'awaiting_approval',
  tasks:Object.freeze(tasks),
  decisions:Object.freeze([...(handoff.decisions||[]),Object.freeze({taskId,decision,actor:actor.trim(),reason})]),
  executed:0,
  executionConnected:false
 });
}
export {prepareQueenHandoff};
