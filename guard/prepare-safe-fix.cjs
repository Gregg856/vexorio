'use strict';
// Deterministic and narrowly scoped Strażak patch generator.
// No shell execution, no remote input, no edits outside root guard-*.js.
const fs=require('node:fs');
const path=require('node:path');
const {preview}=require('../guard-patch-preview.js');
const {diagnose}=require('./security-diagnostics.cjs');
const file=process.argv[2];
if(!file||!/^guard-[a-z0-9-]+\.js$/.test(file))throw Error('Only root-level guard-*.js allowed');
const absolute=path.resolve(process.cwd(),file);
const before=fs.readFileSync(absolute,'utf8');
const proposal=preview({path:file,source:before});
const findings=proposal.changes;
const report={file,readOnly:false,changed:false,rule:'tls-verification-disabled',findings:findings.map(({line})=>({line})),diagnostics:diagnose(before),approval:'Pull Request review required'};
if(findings.length){
 fs.writeFileSync(absolute,proposal.proposedSource);
 report.changed=true;
}
fs.writeFileSync('strazak-fix-report.json',JSON.stringify(report,null,2)+'\n');
console.log('Strażak findings:',findings.length,'file:',file,'changed:',report.changed);
