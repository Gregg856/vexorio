'use strict';
// Strażak Developer: deterministic, privacy-conscious CI summary.
const fs=require('node:fs');
const {scan}=require('./repository-scan.cjs');
function summarize(report){
 const severity={high:0,medium:0,low:0};
 const files=[];
 const ruleCounts=new Map();
 const ruleSeverity=new Map();
 const byScope={application:{high:0,medium:0,low:0},tests:{high:0,medium:0,low:0}};
 for(const file of report.files){
  if(file.error){files.push({path:file.path,status:file.error});continue;}
  const scope=file.path.startsWith('tests/')?'tests':'application';
  for(const finding of file.findings)if(Object.hasOwn(severity,finding.severity)){
   severity[finding.severity]++;
   byScope[scope][finding.severity]++;
  }
  for(const finding of file.findings){
   if(typeof finding.rule==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(finding.rule)){
    ruleCounts.set(finding.rule,(ruleCounts.get(finding.rule)||0)+1);
    if(['high','medium','low'].includes(finding.severity)){
     const counts=ruleSeverity.get(finding.rule)||{high:0,medium:0,low:0};
     counts[finding.severity]++;
     ruleSeverity.set(finding.rule,counts);
    }
   }
  }
  const counts={high:0,medium:0,low:0};
  for(const finding of file.findings)if(Object.hasOwn(counts,finding.severity))counts[finding.severity]++;
  files.push({path:file.path,status:'scanned',signals:file.findings.length,severity:counts});
 }
 const topRules=[...ruleCounts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,10).map(([rule,count])=>({rule,count}));
 const priorityRules=[...ruleSeverity.entries()].sort((a,b)=>b[1].high-a[1].high||b[1].medium-a[1].medium||b[1].low-a[1].low||a[0].localeCompare(b[0])).slice(0,10).map(([rule,severity])=>({rule,severity}));
 const RULE_GUIDANCE={eval:'Zastąp eval jawnym wywołaniem lub bezpiecznym parserem.', 'function-constructor':'Usuń dynamiczne tworzenie funkcji z tekstu.', 'inner-html':'Użyj textContent lub sanitizacji zaufanym narzędziem.', 'console-log':'Usuń logowanie danych wrażliwych z produkcji.', 'hardcoded-secret':'Przenieś sekret do konfiguracji serwera i zmień ujawniony klucz.', 'insecure-http':'Użyj HTTPS, jeśli punkt końcowy go obsługuje.', 'outer-html':'Unikaj wstawiania niezaufanego HTML; użyj bezpiecznych operacji DOM.', 'insert-adjacent-html':'Przed wstawieniem HTML sprawdź i oczyść niezaufane dane.', 'document-write':'Zastąp document.write bezpiecznym tworzeniem elementów DOM.', 'tls-verification-disabled':'Włącz weryfikację certyfikatu TLS i usuń rejectUnauthorized:false.', 'postmessage-wildcard':'Zastąp docelowe * konkretnym, zaufanym origin.', 'timer-string-code':'Przekaż funkcję zamiast tekstu wykonywanego przez timer.'};
 const suggestedFixes=priorityRules.filter(item=>Object.hasOwn(RULE_GUIDANCE,item.rule)).slice(0,5).map(item=>({rule:item.rule,action:RULE_GUIDANCE[item.rule]}));
 const priorityFiles=files.filter(f=>f.status==='scanned'&&f.signals>0)
  .sort((a,b)=>b.severity.high-a.severity.high||b.severity.medium-a.severity.medium||b.severity.low-a.severity.low||a.path.localeCompare(b.path))
  .slice(0,10).map(f=>({path:f.path,signals:f.signals,severity:f.severity}));
 const affectedFiles={high:0,medium:0,low:0};
 for(const file of files)if(file.status==='scanned')for(const level of Object.keys(affectedFiles))if(file.severity[level]>0)affectedFiles[level]++;
 const filesWithSignals=files.filter(f=>f.status==='scanned'&&f.signals>0).length;
 const cleanFiles=files.filter(f=>f.status==='scanned'&&f.signals===0).length;
 const cleanPercent=filesWithSignals+cleanFiles?Math.round(cleanFiles/(filesWithSignals+cleanFiles)*100):0;
 const scanStatus=filesWithSignals>0?'review_required':files.some(f=>f.status!=='scanned')?'incomplete':cleanFiles>0?'no_signals':'no_files_scanned';
 const scanComplete=files.every(f=>f.status==='scanned')&&files.length>0;
 const reviewFiles=files.filter(f=>f.status==='scanned'&&f.severity.high>0).length;
 const mediumReviewFiles=files.filter(f=>f.status==='scanned'&&f.severity.high===0&&f.severity.medium>0).length;
 const lowReviewFiles=files.filter(f=>f.status==='scanned'&&f.severity.high===0&&f.severity.medium===0&&f.severity.low>0).length;
 const reviewQueueTotal=filesWithSignals;
 const reviewQueue=files.filter(f=>f.status==='scanned'&&f.signals>0).map(f=>({path:f.path,priority:f.severity.high>0?'high':f.severity.medium>0?'medium':f.severity.low>0?'low':'unknown',signals:f.signals})).sort((a,b)=>({high:0,medium:1,low:2,unknown:3}[a.priority]-{high:0,medium:1,low:2,unknown:3}[b.priority])||b.signals-a.signals||a.path.localeCompare(b.path)).slice(0,20);
 const filesScanned=files.filter(f=>f.status==='scanned').length;
 const filesSkipped=files.length-filesScanned;
 const coveragePercent=files.length?Math.round(filesScanned/files.length*100):0;
 const skippedByReason={};
 const knownSkipReasons=new Set(['missing','unreadable','unsafe_file_type','too_large','empty_file']);
 for(const file of files)if(file.status!=='scanned'){
  const reason=knownSkipReasons.has(file.status)?file.status:'other';
  skippedByReason[reason]=(skippedByReason[reason]||0)+1;
 }
 const recommendations=[];
 if(severity.high>0)recommendations.push({priority:'high',action:'Najpierw przejrzyj problemy wysokiego ryzyka w plikach z listy priorityFiles.'});
 if(severity.medium>0)recommendations.push({priority:'medium',action:'Zweryfikuj miejsca użycia niebezpiecznych operacji DOM i innych ostrzeżeń średniego ryzyka.'});
 if(severity.low>0)recommendations.push({priority:'low',action:'Ogranicz zbędne logowanie i pozostałe ostrzeżenia niskiego ryzyka.'});
 if(skippedByReason.empty_file)recommendations.push({priority:'review',action:'Sprawdź puste pliki źródłowe — mogą oznaczać nieukończony moduł.'});
 if(files.some(f=>f.status!=='scanned'))recommendations.push({priority:'review',action:'Sprawdź pominięte pliki — skanowanie nie objęło całego zakresu.'});
 return {version:1,filesScanned,filesSkipped,filesWithSignals,cleanFiles,cleanPercent,scanStatus,scanComplete,coveragePercent,signals:report.signals,severity,byScope,affectedFiles,reviewFiles,mediumReviewFiles,lowReviewFiles,reviewQueueTotal,reviewQueue,priorityFiles,topRules,priorityRules,suggestedFixes,recommendations,skippedByReason,files,disclaimer:'Static heuristic matches; manually review each finding. No automated edits.'};
}
if(require.main===module){
 const summary=summarize(scan());
 fs.writeFileSync('guard-developer-summary.json',JSON.stringify(summary,null,2)+'\n',{mode:0o600});
 console.log('Strażak Developer summary: '+JSON.stringify({scanned:summary.filesScanned,skipped:summary.filesSkipped,severity:summary.severity,byScope:summary.byScope}));
}
module.exports={summarize};
