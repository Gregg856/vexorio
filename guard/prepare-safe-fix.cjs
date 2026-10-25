'use strict';
// Deterministic and narrowly scoped Strażak patch generator.
// No shell execution, no remote input, no edits outside root guard-*.js.
const fs=require('node:fs');
const path=require('node:path');
const {preview}=require('../guard-patch-preview.js');
const file=process.argv[2];
if(!file||!/^guard-[a-z0-9-]+\.js$/.test(file))throw Error('Only root-level guard-*.js allowed');
const absolute=path.resolve(process.cwd(),file);
const before=fs.readFileSync(absolute,'utf8');
const proposal=preview({path:file,source:before});
const findings=proposal.changes;
const report={file,readOnly:false,changed:false,rule:'tls-verification-disabled',findings:findings.map(({line})=>({line})),diagnostics:[],approval:'Pull Request review required'};
// Read-only security diagnostics: do not rewrite these patterns automatically.
const diagnosticRules=[
 {id:'dynamic-code-execution',pattern:/\\b(?:eval\\s*\\(|new\\s+Function\\s*\\()/g,advice:'Review dynamic code execution and replace with explicit safe parsing.'},
 {id:'unsafe-html-sink',pattern:/\\.innerHTML\\s*=/g,advice:'Verify trusted input or use textContent for untrusted text.'},
 {id:'insecure-http',pattern:/http:\\/\\//g,advice:'Check whether HTTPS is available; do not replace URLs blindly.'}
];
for(const rule of diagnosticRules){
 const re=new RegExp(rule.pattern.source,rule.pattern.flags);
 for(const match of before.matchAll(re)){
  const line=before.slice(0,match.index).split('\\n').length;
  report.diagnostics.push({rule:rule.id,line,advice:rule.advice,automaticFix:false});
 }
}
if(findings.length){
 fs.writeFileSync(absolute,proposal.proposedSource);
 report.changed=true;
}
fs.writeFileSync('strazak-fix-report.json',JSON.stringify(report,null,2)+'\n');
console.log('Strażak findings:',findings.length,'file:',file,'changed:',report.changed);
