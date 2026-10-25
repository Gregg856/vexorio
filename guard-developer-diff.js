'use strict';
// Strażak Developer Diff — local, read-only unified diff review.
(function(root){
 const MAX_LENGTH=200000;
 const MAX_FINDINGS=50;
 function reviewDiff(diff){
  if(typeof diff!=='string'||!diff.trim()||diff.length>MAX_LENGTH)throw Error('Invalid diff');
  const lines=diff.split(/\r?\n/);
  let file='',line=0,changedFiles=0,hasHunk=false;
  const findings=[];
  const summary={high:0,medium:0,low:0};
  const rules=[
   {rule:'tls-verification-disabled',severity:'high',pattern:/\brejectUnauthorized\s*:\s*false\b/,advice:'Włącz weryfikację certyfikatu TLS.'},
   {rule:'eval',severity:'high',pattern:/\beval\s*\(/,advice:'Unikaj wykonywania dynamicznego kodu.'},
   {rule:'function-constructor',severity:'high',pattern:/\bnew\s+Function\s*\(/,advice:'Unikaj dynamicznego tworzenia funkcji.'},
   {rule:'hardcoded-secret',severity:'high',pattern:/\b(?:api[_-]?key|secret|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_-]{24,}['"]/i,advice:'Usuń sekret z kodu i unieważnij ujawniony klucz.'},
   {rule:'inner-html',severity:'medium',pattern:/\.innerHTML\s*=/,advice:'Zweryfikuj sanitację danych przed użyciem innerHTML.'},
   {rule:'insecure-http',severity:'medium',pattern:/\bfetch\s*\(\s*['"]http:\/\//,advice:'Sprawdź, czy możliwe jest użycie HTTPS.'},
   {rule:'console-log',severity:'low',pattern:/\bconsole\.log\s*\(/,advice:'Sprawdź, czy logi nie ujawniają danych.'}
  ];
  for(const raw of lines){
   if(raw.startsWith('diff --git ')){
    changedFiles++;file=raw.slice(11).split(' b/').pop()||'unknown';line=0;hasHunk=false;continue;
   }
   if(raw.startsWith('+++ b/')){file=raw.slice(6);continue;}
   const hunk=raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
   if(hunk){line=Number(hunk[1]);hasHunk=true;continue;}
   if(!hasHunk)continue;
   if(raw.startsWith('+++')||raw.startsWith('---')||raw.startsWith('\\ No newline'))continue;
   if(raw.startsWith('+')){
    for(const r of rules){
     if(r.pattern.test(raw.slice(1))){
      summary[r.severity]++;
      if(findings.length<MAX_FINDINGS)findings.push({file:file||'unknown',line,severity:r.severity,rule:r.rule,advice:r.advice});
     }
    }
    line++;
   }else if(raw.startsWith(' '))line++;
  }
  if(!changedFiles&&!lines.some(x=>x.startsWith('+++ b/')))throw Error('Not a unified diff');
  if(!changedFiles)changedFiles=new Set(lines.filter(x=>x.startsWith('+++ b/')).map(x=>x.slice(6))).size;
  return {changedFiles,summary,findings,limited:findings.length>=MAX_FINDINGS,readOnly:true};
 }
 const api=Object.freeze({reviewDiff});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardDeveloperDiff=api;
})(typeof window!=='undefined'?window:null);
