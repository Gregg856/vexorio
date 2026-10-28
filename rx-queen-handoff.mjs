// RX Brain Chat 2.0 — proposal handoff; no execution or persistence.
import {planRXChat} from './rx-chat-planner.mjs';

export function prepareQueenHandoff(message, history = []) {
 const proposal = planRXChat(message, history);
 const tasks = proposal.tasks.map((task, index) => Object.freeze({
  id: 'rx-' + String(index + 1).padStart(3, '0'),
  action: task.action,
  module: task.module,
  role: task.role,
  status: 'awaiting_approval',
  requiresApproval: true
 }));
 return Object.freeze({
  kind: 'rx-queen-handoff-v2',
  status: 'awaiting_approval',
  queen: Object.freeze({status: 'awaiting_approval', requiresApproval: true}),
  tasks: Object.freeze(tasks),
  executed: 0,
  executionConnected: false
 });
}
