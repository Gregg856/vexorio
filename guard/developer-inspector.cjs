'use strict';
// Strażak Developer 1.0 — pure, read-only source inspection, no network or execution.
const MAX_SOURCE=100000;
function inspectSource({path,source}={}){
 if(typeof path!=='string'||!/^[-\w./]+\.(?:js|cjs|mjs|html|css)$/.test(path)||path.includes('..')||path.startsWith('/')||typeof source!=='string'||source.length>MAX_SOURCE)throw Error('Invalid source input');
 const findings=[];
 // Mask comments and quoted text in executable-code rules, preserving offsets.
 const code=source.split(''),literals=source.split('');
 let mode='code';
 for(let i=0;i<source.length;i++){
  const ch=source[i],next=source[i+1];
  if(mode==='code'){
   if(ch==='/'&&next==='/'){code[i]=code[i+1]=' ';literals[i]=literals[i+1]=' ';i++;mode='line';continue;}
   if(ch==='/'&&next==='*'){code[i]=code[i+1]=' ';literals[i]=literals[i+1]=' ';i++;mode='block';continue;}
   if(ch==='"'||ch==="'"||ch===String.fromCharCode(96)){code[i]=' ';mode=ch;continue;}
  }else if(mode==='line'){
   if(ch==='\n'){mode='code';continue;}code[i]=' ';literals[i]=' ';
  }else if(mode==='block'){
   if(ch==='*'&&next==='/'){code[i]=code[i+1]=' ';literals[i]=literals[i+1]=' ';i++;mode='code';continue;}
   if(ch!=='\n'){code[i]=' ';literals[i]=' ';}
  }else{
   if(ch==='\\'){code[i]=' ';if(i+1<source.length){i++;if(source[i]!=='\n')code[i]=' ';}continue;}
   if(ch===mode){code[i]=' ';mode='code';continue;}
   if(ch!=='\n')code[i]=' ';
  }
 }
 const codeSource=code.join(''),scanSource=literals.join('');
 const newlinePositions=[];
 for(let i=0;i<source.length;i++)if(source[i]==='\n')newlinePositions.push(i);
 function lineAt(offset){
  let lo=0,hi=newlinePositions.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(newlinePositions[mid]<offset)lo=mid+1;else hi=mid;}
  return lo+1;
 }
 const rules=[
  {id:'eval',severity:'high',pattern:/\beval\s*\(/g,message:'Dynamiczne wykonywanie kodu przez eval wymaga kontroli.'},
  {id:'timer-string-code',severity:'high',pattern:/\b(?:setTimeout|setInterval)\s*\(\s*['"`]/g,message:'Timer otrzymał tekst zamiast funkcji. Może wykonywać kod dynamicznie.'},
  {id:'javascript-url',severity:'high',pattern:/\b(?:location\s*(?:\.\s*href)?|window\s*\.\s*open)\s*(?:=|\()\s*['"`]javascript\s*:/gi,message:'Adres javascript: może uruchamiać kod w kontekście strony.'},
  {id:'unsafe-iframe-srcdoc',severity:'medium',pattern:/\.srcdoc\s*=/g,message:'Przypisanie iframe.srcdoc wymaga kontroli niezaufanego HTML.'},
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
  const target=['insecure-http','postmessage-wildcard','hardcoded-secret','timer-string-code','javascript-url'].includes(rule.id)?scanSource:codeSource;
  for(const match of target.matchAll(rule.pattern)){
   // Text inside quoted strings is not executable code; keep real argument literals scannable.
   if(target===scanSource&&codeSource[match.index]===' ')continue;
   const line=lineAt(match.index);
   findings.push({rule:rule.id,severity:rule.severity,line,message:rule.message});
  }
 }
 const severityRank={high:0,medium:1,low:2};
 findings.sort((a,b)=>severityRank[a.severity]-severityRank[b.severity]||a.line-b.line);
 const omitted=Math.max(0,findings.length-50);
 const limited=omitted>0;
 const visibleFindings=findings.slice(0,50);
 const summary={high:0,medium:0,low:0,total:visibleFindings.length};
 for(const finding of visibleFindings)summary[finding.severity]++;
 return {path,lines:newlinePositions.length+1,findings:visibleFindings,summary,limited,omitted,readOnly:true};
}
if(typeof module!=='undefined'&&module.exports)module.exports={inspectSource};
if(typeof window!=='undefined')window.GuardDeveloperInspector={inspectSource};
