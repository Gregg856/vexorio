'use strict';
// Pure, bounded read-only RX dashboard summary. No file or production access.
function summarizeRxBibi(report){
 if(!report||report.kind!=='rx-bibi-unified-adapter'||!report.summary||
 !report.board||!Array.isArray(report.board.tasks)||report.board.tasks.length>100||
 !report.reviewQueue||!Array.isArray(report.reviewQueue.tasks)||report.reviewQueue.tasks.length>100||
 !report.developerQueue||!Array.isArray(report.developerQueue.reviews)||report.developerQueue.reviews.length>20)
 throw Error('Invalid RX BIBI report');
 const reviews=report.developerQueue.reviews;
 const proposals=reviews.reduce((n,r)=>{
  if(!r||!Array.isArray(r.suggestions)||r.suggestions.length>20)throw Error('Invalid RX developer review');
  return n+r.suggestions.length;
 },0);
 const pending=report.reviewQueue.tasks.filter(t=>t&&t.approved===false&&t.executed===false).length;
 return {schema:1,kind:'rx-bibi-dashboard-summary',runId:report.runId,
  signals:report.summary.signals,tasks:report.board.tasks.length,
  recurring:report.board.tasks.filter(t=>t.recurrent===true).length,
  reviewedFiles:reviews.length,proposedPatches:proposals,awaitingApproval:pending,
  requiresApproval:true,productionModified:false,autoFixesApplied:0,
  automaticDeployment:false};
}
module.exports={summarizeRxBibi};
