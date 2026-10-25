'use strict';
// Read-only pattern-based findings; never edits source or executes it.
function diagnose(source){
 if(typeof source!=='string')throw Error('Invalid source');
 const rules=[
  {rule:'dynamic-code-execution',pattern:new RegExp('(?:\\beval\\s*\\(|new\\s+Function\\s*\\()', 'g'),advice:'Review dynamic code execution.'},
  {rule:'unsafe-html-sink',pattern:new RegExp('\\.innerHTML\\s*=', 'g'),advice:'Use textContent for untrusted text.'},
  {rule:'insecure-http',pattern:new RegExp('http:', 'g'),advice:'Review insecure HTTP URLs.'}
 ];
 const findings=[];
 for(const rule of rules){
  for(const match of source.matchAll(rule.pattern)){
   const line=source.slice(0,match.index).split('\n').length;
   findings.push({rule:rule.rule,line,advice:rule.advice,automaticFix:false});
  }
 }
 return findings.sort((a,b)=>a.line-b.line);
}
module.exports={diagnose};
