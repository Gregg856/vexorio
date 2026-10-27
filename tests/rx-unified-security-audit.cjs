'use strict';
// RX security policy: audit proposals, never perform autonomous source changes.
const assert=require('node:assert/strict');
const {reviewRX}=require('../rx-unified-review.cjs');
const {draftPatch,previewPatch,suggestPatch}=require('../rx-patch-drafter.cjs');
const supervisor={kind:'rx-queen-ant-supervisor',issues:[{source:'fast',priority:'high',action:'inspect_failed_test',target:'src/test.js'}]};
const result=reviewRX({supervisor,runId:'security-audit-1',sources:{'src/test.js':'debugger;'}});
assert.equal(result.productionModified,false);
assert.equal(result.autoFixesApplied,0);
assert.equal(result.reviews[0].review.suggestions[0].proposal.requiresApproval,true);
for(const target of ['.github/workflows/publish.js','../outside.js','node_modules/pkg.js','secrets/key.js']){
 assert.throws(()=>draftPatch({target,oldText:'debugger;',newText:'',reason:'Security review'}),/Invalid patch target/);
}
assert.throws(()=>previewPatch(draftPatch({target:'src/test.js',oldText:'debugger;',newText:'',reason:'Security review'}),'debugger;\ndebugger;'),/ambiguous/);
assert.throws(()=>suggestPatch({target:'src/test.js',source:'\x60debugger;\x60',rule:'remove-debugger'}),/missing/);
console.log('PASS RX security policy: review only, blocked targets, ambiguous anchors, inert strings');
