// RX Brain Chat 2.5 — portable export/import with strict validation; no remote writes.
const MAX_ENTRIES=100;
export function exportQueenHistory(history) {
 if(!Array.isArray(history)||history.length>MAX_ENTRIES) throw new TypeError('Invalid history');
 for(const item of history) validateEntry(item);
 return JSON.stringify({format:'rx-queen-history-v1',entries:history});
}
function validateEntry(entry) {
 if(!entry || entry.kind!=='rx-queen-history-entry-v2' || !Number.isSafeInteger(entry.sequence) || entry.sequence<1 || typeof entry.label!=='string' || !entry.label.trim() || entry.label.length>100 || !entry.report || entry.report.kind!=='rx-queen-report-v2') throw new TypeError('Invalid history entry');
 const summary=entry.report.summary;
 if(!summary || !['total','pending','ready','rejected','dispatched'].every(k=>Number.isSafeInteger(summary[k])&&summary[k]>=0)) throw new TypeError('Invalid report summary');
 if(summary.total!==summary.pending+summary.ready+summary.rejected || summary.dispatched!==0 || entry.report.executionConnected!==false || !Array.isArray(entry.report.tasks) || entry.report.tasks.length!==summary.total) throw new TypeError('Inconsistent report');
 if(!Array.isArray(entry.report.tasks) || entry.report.tasks.length!==summary.total || !Array.isArray(entry.report.alerts) || entry.report.alerts.some(a=>typeof a!=='string'||a.length>300)) throw new TypeError('Invalid report details');
 const allowed=new Set(['awaiting_approval','ready_for_manual_dispatch','rejected']);
 const ids=new Set();
 let pending=0,ready=0,rejected=0;
 for(const task of entry.report.tasks) {
  if(!task || typeof task.id!=='string' || !/^rx-[0-9]{3,}$/.test(task.id) || ids.has(task.id) || typeof task.action!=='string' || !task.action || task.action.length>100 || typeof task.module!=='string' || !task.module || task.module.length>100 || !allowed.has(task.status)) throw new TypeError('Invalid task detail');
  ids.add(task.id);
  if(task.status==='awaiting_approval')pending++;
  else if(task.status==='ready_for_manual_dispatch')ready++;
  else rejected++;
 }
 if(pending!==summary.pending || ready!==summary.ready || rejected!==summary.rejected) throw new TypeError('Inconsistent task counts');
}
export function importQueenHistory(serialized) {
 if(typeof serialized!=='string'||serialized.length>200000) throw new TypeError('Invalid export');
 const parsed=JSON.parse(serialized);
 if(!parsed || parsed.format!=='rx-queen-history-v1'||!Array.isArray(parsed.entries)||parsed.entries.length>MAX_ENTRIES) throw new TypeError('Unsupported history');
 parsed.entries.forEach((entry,index)=>{validateEntry(entry);if(entry.sequence!==index+1)throw new TypeError('Invalid sequence');});
 return Object.freeze(parsed.entries.map(entry=>Object.freeze({...entry,report:Object.freeze({...entry.report,summary:Object.freeze({...entry.report.summary}),tasks:Object.freeze(entry.report.tasks.map(t=>Object.freeze({...t}))),alerts:Object.freeze([...(entry.report.alerts||[])])})})));
}
