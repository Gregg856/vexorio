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
  const counts={high:0,medium:0,low:0};
  for(const finding of file.findings)if(Object.hasOwn(counts,finding.severity))counts[finding.severity]++;
  files.push({path:file.path,status:'scanned',signals:file.findings.length,severity:counts});
 }
 const priorityFiles=files.filter(f=>f.status==='scanned'&&f.signals>0)
  .sort((a,b)=>b.severity.high-a.severity.high||b.severity.medium-a.severity.medium||b.severity.low-a.severity.low||a.path.localeCompare(b.path))
  .slice(0,10).map(f=>({path:f.path,signals:f.signals,severity:f.severity}));
 const filesScanned=files.filter(f=>f.status==='scanned').length;
 const filesSkipped=files.length-filesScanned;
 const coveragePercent=files.length?Math.round(filesScanned/files.length*100):0;
 const skippedByReason={};
 for(const file of files)if(file.status!=='scanned')skippedByReason[file.status]=(skippedByReason[file.status]||0)+1;
 const recommendations=[];
 if(severity.high>0)recommendations.push({priority:'high',action:'Najpierw przejrzyj problemy wysokiego ryzyka w plikach z listy priorityFiles.'});
 if(severity.medium>0)recommendations.push({priority:'medium',action:'Zweryfikuj miejsca użycia niebezpiecznych operacji DOM i innych ostrzeżeń średniego ryzyka.'});
 if(severity.low>0)recommendations.push({priority:'low',action:'Ogranicz zbędne logowanie i pozostałe ostrzeżenia niskiego ryzyka.'});
 if(skippedByReason.empty_file)recommendations.push({priority:'review',action:'Sprawdź puste pliki źródłowe — mogą oznaczać nieukończony moduł.'});
 if(files.some(f=>f.status!=='scanned'))recommendations.push({priority:'review',action:'Sprawdź pominięte pliki — skanowanie nie objęło całego zakresu.'});
 return {version:1,filesScanned,filesSkipped,coveragePercent,signals:report.signals,severity,byScope,priorityFiles,recommendations,skippedByReason,files,disclaimer:'Static heuristic matches; manually review each finding. No automated edits.'};
}
if(require.main===module){
 const summary=summarize(scan());
 fs.writeFileSync('guard-developer-summary.json',JSON.stringify(summary,null,2)+'\n',{mode:0o600});
 console.log('Strażak Developer summary: '+JSON.stringify({scanned:summary.filesScanned,skipped:summary.filesSkipped,severity:summary.severity,byScope:summary.byScope}));
}
module.exports={summarize};
