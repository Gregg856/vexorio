'use strict';
const assert=require('node:assert/strict');
const {inspectAndPropose}=require('../rx-developer-patch-bridge.cjs');
const {draftPatch,previewPatch,suggestPatch}=require('../rx-patch-drafter.cjs');
const source='const safe=true;\ndebugger;\nconsole.debug("test");\n';
const result=inspectAndPropose({target:'src/example.js',source});
assert.equal(result.requiresApproval,true);
assert.equal(result.productionModified,false);
assert.equal(result.automaticDeployment,false);
assert.equal(result.suggestions.length,2);
for(const item of result.suggestions){
 assert.equal(item.proposal.applied,false);
 assert.equal(item.preview.applied,false);
 assert.equal(item.proposal.requiresApproval,true);
}
assert.throws(()=>draftPatch({target:'.github/workflows/x.js',oldText:'a',newText:'b',reason:'safe'}),/Invalid patch target/);
assert.throws(()=>draftPatch({target:'../secret.js',oldText:'a',newText:'b',reason:'safe'}),/Invalid patch target/);
assert.throws(()=>previewPatch(draftPatch({target:'src/x.js',oldText:'a',newText:'b',reason:'safe'}),'aaa'),/ambiguous/);
assert.throws(()=>suggestPatch({target:'src/x.js',source:'debugger;\ndebugger;\n',rule:'remove-debugger'}),/ambiguous/);
assert.equal(inspectAndPropose({target:'src/x.js',source:'// debugger;\nconst s="console.debug(1)";\n'}).suggestions.length,0);
// Negative regression tests: malformed input must fail closed.
assert.throws(()=>inspectAndPropose({target:'src/x.js',source:null}),/Invalid RX input/);
assert.throws(()=>inspectAndPropose({target:'src/x.js',source:'x'.repeat(500001)}),/Invalid RX input/);
assert.throws(()=>suggestPatch({target:'src/x.js',source:'debugger;',rule:'unknown'}),/Unsupported safe rule/);
assert.throws(()=>draftPatch({target:'node_modules/a.js',oldText:'a',newText:'b',reason:'safe'}),/Invalid patch target/);
assert.throws(()=>draftPatch({target:'src/x.js',oldText:'a',newText:'a',reason:'safe'}),/Invalid patch contents/);
assert.throws(()=>previewPatch(draftPatch({target:'src/x.js',oldText:'missing',newText:'new',reason:'safe'}),'const x=1;'),/missing or ambiguous/);
const noMatch=inspectAndPropose({target:'src/x.js',source:'const x=1;'});
assert.equal(noMatch.suggestions.length,0);
assert.equal(noMatch.productionModified,false);
console.log('PASS RX Developer Bridge: proposals only, no writes, blocked targets, ambiguity, comment/string safety');
