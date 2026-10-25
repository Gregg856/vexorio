'use strict';
// Strażak Developer 2.0 — read-only review of a GitHub unified diff.
// No credentials, network calls, file writes or code execution.
const MAX_DIFF=200000;
const MAX_FILES=80;
const MAX_LINES=3000;
const RULES=[
 {id:'secret',severity:'high',pattern:/\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/i,advice:'Usuń sekret z kodu; użyj bezpiecznych zmiennych środowiskowych i unieważnij ujawniony klucz.'},
 {id:'eval',severity:'high',pattern:/\beval\s*\(/,advice:'Zastąp eval bezpiecznym parserem lub jawną logiką.'},
 {id:'dynamic-function',severity:'high',pattern:/\bnew\s+Function\s*\(/,advice:'Unikaj wykonywania dynamicznie zbudowanego kodu.'},
 {id:'unsafe-html',severity:'medium',pattern:/\.innerHTML\s*=/,advice:'Rozważ textContent lub bezpieczną sanitację HTML.'},
 {id:'insecure-http',severity:'medium',pattern:/\bfetch\s*\(\s*['"]http:\/\//i,advice:'Stosuj HTTPS dla żądań sieciowych.'},
 {id:'debug-log',severity:'low',pattern:/\bconsole\.log\s*\(/,advice:'Sprawdź, czy logowanie nie ujawnia danych i jest potrzebne w produkcji.'}
];
function reviewDiff(diff){
 if(typeof diff!=='string'||diff.length>MAX_DIFF)throw new Error('Diff missing or too large');
 const lines=diff.split(/\r?\n/);
 if(lines.length>MAX_LINES)throw new Error('Diff has too many lines');
 const findings=[];let file=null;let line=0;let changedFiles=0;
 for(const row of lines){
  if(row.startsWith('diff --git ')){file=null;line=0;continue;}
  if(row.startsWith('+++ b/')){file=row.slice(6);changedFiles++;if(changedFiles>MAX_FILES)throw new Error('Too many changed files');continue;}
  if(row.startsWith('+++ /dev/null')){file=null;continue;}
  const h=/^@@ -\d+(?:,\d+)? \+(\d+)/.exec(row);
  if(h){line=Number(h[1]);continue;}
  if(!file||row.startsWith('--- ')||row.startsWith('\\ No newline'))continue;
  if(row.startsWith('+')&&!row.startsWith('+++')){
   const added=row.slice(1);
   for(const rule of RULES)if(rule.pattern.test(added))findings.push({file,line,rule:rule.id,severity:rule.severity,advice:rule.advice});
   line++;
  }else if(row.startsWith(' '))line++;
 }
 return {readOnly:true,changedFiles,findings,summary:{high:findings.filter(f=>f.severity==='high').length,medium:findings.filter(f=>f.severity==='medium').length,low:findings.filter(f=>f.severity==='low').length}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={reviewDiff,MAX_DIFF,MAX_FILES,MAX_LINES};
if(typeof window!=='undefined')window.GuardDeveloperDiff={reviewDiff};
