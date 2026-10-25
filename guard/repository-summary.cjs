'use strict';
// Strażak Developer: deterministic, privacy-conscious CI summary.
const fs=require('node:fs');
const {scan}=require('./repository-scan.cjs');
function summarize(report){
 const severity={high:0,medium:0,low:0};
 const files=[];
 const byScope={application:{high:0,medium:0,low:0},tests:{high:0,medium:0,low:0}};
 for(const file of report.files){
  if(file.error){files.push({path:file.path,status:file.error});continue;}
  const scope=file.path.startsWith('tests/')?'tests':'application';
  for(const finding of file.findings)if(Object.hasOwn(severity,finding.severity)){
   severity[finding.severity]++;
   byScope[scope][finding.severity]++;
  }
  files.push({path:file.path,status:'scanned',signals:file.findings.length});
 }
 return {version:1,filesScanned:files.filter(f=>f.status==='scanned').length,filesSkipped:files.filter(f=>f.status!=='scanned').length,signals:report.signals,severity,byScope,files,disclaimer:'Static heuristic matches; manually review each finding. No automated edits.'};
}
if(require.main===module){
 const summary=summarize(scan());
 fs.writeFileSync('guard-developer-summary.json',JSON.stringify(summary,null,2)+'\n',{mode:0o600});
 console.log('Strażak Developer summary: '+JSON.stringify({scanned:summary.filesScanned,skipped:summary.filesSkipped,severity:summary.severity,byScope:summary.byScope}));
}
module.exports={summarize};
