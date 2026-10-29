'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {inspectAndPropose}=require('./rx-developer-patch-bridge.cjs');
const allowed=['rx-command-bridge.cjs','rx-coordinator.cjs','rx-developer-patch-bridge.cjs'];
const target=process.env.RX_TARGET||allowed[0];
if(!allowed.includes(target))throw Error('RX target not allowed');
const report=inspectAndPropose({target,source:fs.readFileSync(path.join(__dirname,target),'utf8')});
const proposals=report.suggestions.map(item=>({
 rule:item.rule,
 target,
 oldText:item.proposal.oldText,
 newText:item.proposal.newText,
 preview:item.preview.preview,
 syntaxCheck:report.syntaxChecks.find(check=>check.rule===item.rule)||null,
 readyForReview:report.syntaxChecks.some(check=>check.rule===item.rule&&check.syntax==='valid'),
 requiresApproval:true,
 applied:false
}));
const output=path.join(__dirname,'rx-bibi-reports','rx-developer-review.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({...report,reviewStatus:'completed',patchCandidates:proposals,bibiTest:'rx-developer-bridge-isolated.cjs',changesApplied:false},null,2)+'\n');
console.log('RX Developer reviewed',target,'suggestions',report.suggestions.length);
