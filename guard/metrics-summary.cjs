'use strict';
// Privacy-preserving local metrics: no raw text, IDs, or personal data in output.
function summarizeGuardReports(reports){
 if(!Array.isArray(reports)||reports.length>10000)throw Error('Invalid report batch');
 const counts={total:0,high:0,normal:0,none:0,invalid:0,requiresHumanReview:0};
 const reasons=Object.create(null);
 for(const report of reports){
  counts.total++;
  if(!report||typeof report!=='object'||!['high','normal','none'].includes(report.priority)||!Array.isArray(report.reasonIds)){
   counts.invalid++;counts.high++;counts.requiresHumanReview++;continue;
  }
  counts[report.priority]++;
  if(report.requiresHumanReview||report.priority!=='none')counts.requiresHumanReview++;
  for(const id of new Set(report.reasonIds)){
   if(typeof id==='string'&&/^[a-z_]{1,64}$/.test(id))reasons[id]=(reasons[id]||0)+1;
  }
 }
 return {status:'synthetic_or_local_only',counts,reasons:Object.fromEntries(Object.entries(reasons).sort(([a],[b])=>a.localeCompare(b))),automaticAction:false};
}
module.exports={summarizeGuardReports};
