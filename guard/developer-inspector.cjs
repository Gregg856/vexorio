'use strict';
// Strażak Developer 1.0 — pure, read-only source inspection, no network or execution.
const MAX_SOURCE=100000;
function inspectSource({path,source}={}){
 if(typeof path!=='string'||!/^[-\w./]+\.(?:js|cjs|mjs|html|css)$/.test(path)||path.includes('..')||path.startsWith('/')||typeof source!=='string'||source.length>MAX_SOURCE)throw Error('Invalid source input');
 const findings=[];
 const rules=[
  {id:'eval',severity:'high',pattern:/\beval\s*\(/g,message:'Dynamiczne wykonywanie kodu przez eval wymaga kontroli.'},
  {id:'function-constructor',severity:'high',pattern:/\bnew\s+Function\s*\(/g,message:'Dynamiczny konstruktor Function może wykonywać niezaufany kod.'},
  {id:'inner-html',severity:'medium',pattern:/\.innerHTML\s*=/g,message:'Sprawdź, czy HTML nie zawiera niezaufanych danych.'},
  {id:'console-log',severity:'low',pattern:/\bconsole\.log\s*\(/g,message:'Sprawdź, czy logi nie ujawniają danych.'}
 ];
 for(const rule of rules){
  for(const match of source.matchAll(rule.pattern)){
   const line=source.slice(0,match.index).split('\n').length;
   findings.push({rule:rule.id,severity:rule.severity,line,message:rule.message});
   if(findings.length>=50)break;
  }
  if(findings.length>=50)break;
 }
 findings.sort((a,b)=>a.line-b.line);
 return {path,lines:source.split('\n').length,findings,limited:findings.length>=50,readOnly:true};
}
module.exports={inspectSource};
