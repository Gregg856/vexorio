'use strict';
// RX Queen reads RX BIBI reports and proposes actions. Never edits or deploys code.
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const dir='rx-bibi-reports';
const inputs=['rx-live-panel.json','rx-queen-dialogue.json','browser-agent/report.json','rx-visual-audit.json'];
const findings=[];
const historyFile=path.join(dir,'rx-bibi-incident-history.json');
let known=[];
try{const memory=JSON.parse(fs.readFileSync(historyFile,'utf8'));known=Array.isArray(memory)?memory:Array.isArray(memory.history)?memory.history:[];}catch{}
for(const file of inputs){
 const full=path.join(dir,file);
 if(!fs.existsSync(full)){findings.push({source:file,severity:'warning',problem:'Missing report',suggestion:'Check whether the corresponding test ran and saved its artifact',requiresApproval:true});continue;}
 try{
  const data=JSON.parse(fs.readFileSync(full,'utf8'));
  if(data.ok===false) findings.push({source:file,severity:'error',problem:'Test report indicates failure',suggestion:'Inspect individual checks and CI logs before proposing a fix',requiresApproval:true});
  for(const c of (data.checks||[])){
   if(c.ok===false)findings.push({source:file,check:c.id||c.name,severity:'error',problem:String(c.error||c.detail||('Failed check: '+(c.path||c.kind||c.name||'unknown'))).slice(0,240),suggestion:'Reproduce the failure and review the relevant module',requiresApproval:true});
  }
 }catch(e){findings.push({source:file,severity:'error',problem:'Unreadable report: '+e.message.slice(0,180),suggestion:'Verify report JSON format',requiresApproval:true});}
}
// Stable incident fingerprints: avoid repeated repair proposals within this run.
const previous=new Map(known.filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x]));
const unique=new Map();
for(const f of findings){
 const id=crypto.createHash('sha256').update([f.source,f.check||'',f.problem].join('|')).digest('hex').slice(0,16);
 const old=previous.get(id);
 const priority=f.severity==='error'?'HIGH':'MEDIUM';
 const incident={...f,id,priority,occurrences:(old?.occurrences||0)+1,firstSeen:old?.firstSeen||new Date().toISOString(),lastSeen:new Date().toISOString(),previouslySeen:!!old};
 if(unique.has(id))unique.get(id).occurrences++;
 else unique.set(id,incident);
}
const incidents=[...unique.values()].sort((a,b)=>Number(b.priority==='HIGH')-Number(a.priority==='HIGH')||b.occurrences-a.occurrences);
const updatedHistory=[...new Map([...known.filter(x=>x&&x.id).map(x=>[x.id,x]),...incidents.map(x=>[x.id,x])]).values()].slice(-300);
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(historyFile,JSON.stringify({history:updatedHistory},null,2)+'\n');
// Route each incident to an existing RX worker instead of leaving it as a passive report.
const routeIncident=f=>f.source.includes('browser-agent')?'RX Browser Agent':f.source.includes('visual')?'RX Visual':f.source.includes('live-panel')?'RX Admin':'RX Developer';
const nextWork=incidents.filter(f=>f.severity==='error').slice(0,5).map(f=>({
 incidentId:f.id,worker:routeIncident(f),priority:f.priority,
 action:'reproduce-and-isolate',check:f.check||null,source:f.source,
 requiresApproval:true,executed:false
}));
const developerHandoff=incidents.map(f=>({id:f.id,priority:f.priority,occurrences:f.occurrences,previouslySeen:f.previouslySeen,module:f.source.includes('browser-agent')?'RX Browser Agent':f.source.includes('visual')?'RX Visual':f.source.includes('live-panel')?'RX Admin':'RX Queen',source:f.source,check:f.check||null,problem:f.problem,proposedAction:f.suggestion,requiresApproval:true}));
// RX Queen learning feed: only verified test outcomes, never unapproved fixes.
const learningFeed={
 kind:'rx-queen-verified-learning',schema:1,createdAt:new Date().toISOString(),
 policy:'TEST_EVIDENCE_ONLY_NO_AUTONOMOUS_PATCHES',
 lessons:incidents.map(f=>({
  incidentId:f.id,source:f.source,priority:f.priority,occurrences:f.occurrences,
  observation:f.problem,verifiedResolution:false,
  panelArea:f.source.includes('live-panel')?'rx-admin-prototype.html':f.source.includes('browser-agent')?'RX Browser Agent / RX Admin preview':'RX BIBI tests',
  nextStep:'Reproduce in isolated test, propose smallest patch, require approval and passing regression tests'
 })),
 healthyChecks:inputs.filter(file=>!findings.some(f=>f.source===file)).map(source=>({source,observation:'No findings in current triage',verifiedResolution:false})),
 learningStatus:'EVIDENCE_COLLECTED_NOT_MODEL_RETRAINING'
};
fs.writeFileSync(path.join(dir,'rx-queen-learning-feed.json'),JSON.stringify(learningFeed,null,2)+'\n');
const report={kind:'rx-queen-bibi-triage',createdAt:new Date().toISOString(),sources:inputs,findings,incidents,developerHandoff,nextWork,historyEntriesAvailable:known.length,findingsCount:findings.length,status:findings.length?'REVIEW_REQUIRED':'NO_FINDINGS',automaticFixes:0,automaticDeploys:0};
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'rx-queen-bibi-triage.json'),JSON.stringify(report,null,2)+'\n');
console.log('RX QUEEN BIBI TRIAGE',JSON.stringify(report));
