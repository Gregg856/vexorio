'use strict';
// Generates a review-only proposal artifact; never writes repository files.
const fs=require('node:fs');
const path=require('node:path');
const {preview}=require('../guard-patch-preview.js');
const target=process.argv[2];
if(!target||!/^guard-[a-z0-9-]+\.js$/.test(target))throw Error('Only root-level guard-*.js files are allowed');
const full=path.resolve(process.cwd(),target);
const original=fs.readFileSync(full,'utf8');
const result=preview({path:target,source:original});
const lines=['Strażak Patch Proposal — tylko do przeglądu','Plik: '+target,'Liczba propozycji: '+result.changes.length,'Nie zapisano żadnej zmiany w repozytorium.'];
for(const change of result.changes){
 lines.push('@@ linia '+change.line+' @@','- '+change.before,'+ '+change.after);
}
lines.push(result.warning);
fs.writeFileSync('strazak-patch-proposal.txt',lines.join('\n')+'\n',{flag:'w',mode:0o600});
console.log('Prepared '+result.changes.length+' proposal(s) for '+target);
