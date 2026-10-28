// RX Brain Chat 2.4 — bounded, immutable report history; caller owns persistence.
import {reportQueenTasks} from './rx-queen-report.mjs';
export function appendQueenReport(history, handoff, label) {
 if(!Array.isArray(history) || history.length>99) throw new TypeError('Invalid history');
 if(typeof label!=='string' || !label.trim() || label.length>100) throw new TypeError('Invalid label');
 if(history.some(item=>!item || item.kind!=='rx-queen-history-entry-v2' || typeof item.label!=='string')) throw new TypeError('Invalid history entry');
 const report=reportQueenTasks(handoff);
 const entry=Object.freeze({kind:'rx-queen-history-entry-v2',sequence:history.length+1,label:label.trim(),report});
 return Object.freeze([...history,entry]);
}
export function compareQueenReports(previous,current) {
 if(!previous || !current || previous.kind!=='rx-queen-report-v2' || current.kind!=='rx-queen-report-v2') throw new TypeError('Invalid reports');
 return Object.freeze({
  pendingChange:current.summary.pending-previous.summary.pending,
  readyChange:current.summary.ready-previous.summary.ready,
  rejectedChange:current.summary.rejected-previous.summary.rejected,
  executed:0
 });
}
