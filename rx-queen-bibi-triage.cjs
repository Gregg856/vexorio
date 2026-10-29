'use strict';
// RX Queen reads RX BIBI reports and proposes actions. Never edits or deploys code.
const fs=require('node:fs');
const path=require('node:path');
const dir='rx-bibi-reports';
const inputs=['rx-live-panel.json','rx-queen-dialogue.json','browser-agent/report.json','rx-visual-audit.json'];
const findings=[];
for(const file of inputs){
 const full=path.join(dir,file);
 if(!fs.existsSync(full)){findings.push({source:file,severity:'warning',problem:'Missing report',suggestion:'Check whether the corresponding test ran and saved its artifact',requiresApproval:true});continue;}
 try{
  const data=JSON.parse(fs.readFileSync(full,'utf8'));
  if(data.ok===false) findings.push({source:file,severity:'error',problem:'Test report indicates failure',suggestion:'Inspect individual checks and CI logs before proposing a fix',requiresApproval:true});
  for(const c of (data.checks||[])){
   if(c.ok===false)findings.push({source:file,check:c.id||c.name,severity:'error',problem:String(c.error||'Failed check').slice(0,240),suggestion:'Reproduce the failure and review the relevant module',requiresApproval:true});
  }
 }catch(e){findings.push({source:file,severity:'error',problem:'Unreadable report: '+e.message.slice(0,180),suggestion:'Verify report JSON format',requiresApproval:true});}
}
const report={kind:'rx-queen-bibi-triage',createdAt:new Date().toISOString(),sources:inputs,findings,findingsCount:findings.length,status:findings.length?'REVIEW_REQUIRED':'NO_FINDINGS',automaticFixes:0,automaticDeploys:0};
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'rx-queen-bibi-triage.json'),JSON.stringify(report,null,2)+'\n');
console.log('RX QUEEN BIBI TRIAGE',JSON.stringify(report));
