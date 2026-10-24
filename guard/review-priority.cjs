'use strict';
// Offline, deterministic review priority. Signals are not proof of misconduct.
const SEVERITY=Object.freeze({high:3,medium:2,low:1});
function prioritizeGuardReport(report){
 if(!report||typeof report!=='object'||report.mode!=='advisory'||report.decision!=='none'||!Array.isArray(report.explanations))
  return {priority:'high',reasonIds:['invalid_guard_report'],requiresHumanReview:true,automaticAction:false};
 const reasons=[...new Set(report.explanations.filter(x=>x&&typeof x.id==='string'&&/^[a-z_]{1,64}$/.test(x.id)).map(x=>x.id))];
 const maxSeverity=report.explanations.reduce((max,x)=>Math.max(max,SEVERITY[x?.severity]||0),0);
 const priority=maxSeverity===3||report.fraud?.score>=60?'high':report.requiresHumanReview||maxSeverity>0?'normal':'none';
 return {priority,reasonIds:reasons,requiresHumanReview:priority!=='none',automaticAction:false};
}
module.exports={prioritizeGuardReport};
