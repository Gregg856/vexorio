'use strict';
// Strażak Developer 1.0 — pure, read-only source inspection, no network or execution.
const MAX_SOURCE=100000;
function inspectSource({path,source}={}){
 if(typeof path!=='string'||!/^[-\w./]+\.(?:js|cjs|mjs|html|css)$/.test(path)||path.includes('..')||path.startsWith('/')||typeof source!=='string'||source.length>MAX_SOURCE)throw Error('Invalid source input');
 const findings=[];
 // Mask comments without changing offsets or line numbers. String literals remain
 // intact so hardcoded-secret and insecure-http checks still work.
 const scanSource=source.replace(/\/\*[\s\S]*?\*\/|(^|\n)[ \t]*\/\/[^\n]*/g,match=>match.replace(/[^\n]/g,' '));
 const rules=[
  {id:'eval',severity:'high',pattern:/\beval\s*\(/g,message:'Dynamiczne wykonywanie kodu przez eval wymaga kontroli.'},
  {id:'function-constructor',severity:'high',pattern:/\bnew\s+Function\s*\(/g,message:'Dynamiczny konstruktor Function może wykonywać niezaufany kod.'},
  {id:'inner-html',severity:'medium',pattern:/\.innerHTML\s*=/g,message:'Sprawdź, czy HTML nie zawiera niezaufanych danych.'},
  {id:'console-log',severity:'low',pattern:/\bconsole\.log\s*\(/g,message:'Sprawdź, czy logi nie ujawniają danych.'},
  {id:'document-write',severity:'medium',pattern:/\bdocument\.write\s*\(/g,message:'document.write może wprowadzić niebezpieczny HTML.'},
  {id:'insecure-http',severity:'medium',pattern:/\bfetch\s*\(\s*['"]http:\/\//g,message:'Żądanie HTTP bez szyfrowania. Sprawdź, czy wymagane jest HTTPS.'},
  {id:'tls-verification-disabled',severity:'high',pattern:/\brejectUnauthorized\s*:\s*false\b/g,message:'Wyłączona weryfikacja certyfikatu TLS. Sprawdź bezpieczeństwo połączenia.'},
  {id:'postmessage-wildcard',severity:'medium',pattern:/\.postMessage\s*\([^;\n]*,\s*['"]\*['"]\s*\)/g,message:'postMessage z odbiorcą * może ujawniać dane innym oknom.'},
  {id:'hardcoded-secret',severity:'high',pattern:/\b(?:api[_-]?key|secret|access[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_-]{24,}['"]/gi,message:'Możliwy sekret wpisany bezpośrednio w kodzie. Nie umieszczaj go w publicznym repozytorium.'}
 ];
 for(const rule of rules){
  for(const match of scanSource.matchAll(rule.pattern)){
   const lineStart=source.lastIndexOf('\n',match.index-1)+1;
   // Ignore matches in full-line JavaScript comments; keep executable lines unchanged.
   if(/^\s*\/\//.test(source.slice(lineStart,match.index)))continue;
   const line=source.slice(0,match.index).split('\n').length;
   findings.push({rule:rule.id,severity:rule.severity,line,message:rule.message});
   if(findings.length>=50)break;
  }
  if(findings.length>=50)break;
 }
 findings.sort((a,b)=>a.line-b.line);
 return {path,lines:source.split('\n').length,findings,limited:findings.length>=50,readOnly:true};
}
if(typeof module!=='undefined'&&module.exports)module.exports={inspectSource};
if(typeof window!=='undefined')window.GuardDeveloperInspector={inspectSource};
