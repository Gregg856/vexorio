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

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
// RX Queen regression: a previously reviewed incident is not queued again,
// while a new failure still reaches the existing Developer handoff.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'rx-queen-memory-test-'));
try{
 const reports=path.join(temp,'rx-bibi-reports');
 fs.mkdirSync(reports,{recursive:true});
 const failure={ok:false,checks:[{id:'synthetic-check',ok:false,error:'Synthetic regression failure'}]};
 fs.writeFileSync(path.join(reports,'rx-live-panel.json'),JSON.stringify(failure));
 const queen=path.join(__dirname,'..','rx-queen-bibi-triage.cjs');
 const run=()=>{const p=spawnSync(process.execPath,[queen],{cwd:temp,encoding:'utf8',timeout:5000});assert.equal(p.status,0,p.stderr);return JSON.parse(fs.readFileSync(path.join(reports,'rx-queen-bibi-triage.json'),'utf8'));};
 const first=run();
 const incident=first.incidents.find(x=>x.source==='rx-live-panel.json'&&x.check==='synthetic-check');
 assert.ok(incident,'First run must detect synthetic failure');
 assert.ok(first.nextWork.some(x=>x.incidentId===incident.id),'New failure must be queued');
 const historyPath=path.join(reports,'rx-bibi-incident-history.json');
 const history=JSON.parse(fs.readFileSync(historyPath,'utf8'));
 history.history.find(x=>x.id===incident.id).developerReview={incidentId:incident.id,status:'NO_PATCH_CANDIDATES',requiresApproval:true,changesApplied:false};
 fs.writeFileSync(historyPath,JSON.stringify(history));
 const second=run();
 assert.ok(second.incidents.some(x=>x.id===incident.id&&x.developerReview?.incidentId===incident.id),'Prior review must survive next run');
 assert.ok(!second.nextWork.some(x=>x.incidentId===incident.id),'Reviewed failure must not be queued twice');
 failure.checks.push({id:'new-check',ok:false,error:'New synthetic failure'});
 fs.writeFileSync(path.join(reports,'rx-live-panel.json'),JSON.stringify(failure));
 const third=run();
 assert.ok(third.nextWork.some(x=>x.check==='new-check'),'New failure must still be queued');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('PASS RX Queen: persistent review deduplication and new incident handoff');

 // RX BIBI regression: Queen must pass build planning through the existing Turbine.
 // This is a queued proposal, never an automatic code change.
 const {planCommand}=require('../rx-command-bridge.cjs');
 const {coordinateRX}=require('../rx-coordinator.cjs');
 const build=planCommand('Zbuduj nowa funkcje',{energyBalance:100});
 assert.ok(build.steps.some(x=>x.intent==='build_feature'&&x.supported),'Queen must recognize a build request');
 const coordinated=coordinateRX('Zbuduj nowa funkcje',{initialCredits:100});
 assert.ok(coordinated.ants.some(x=>x.intent==='build_feature'),'Turbine must accept the build task');
 assert.ok(coordinated.turbine.waves.flat().some(x=>x.kind==='plan_build'),'Build task must reach the existing Turbine queue');
 assert.equal(coordinated.executed,0);
 assert.equal(coordinated.productionModified,false);
 console.log('PASS RX BIBI: Queen -> Ants -> Turbine build proposal; no automatic writes');

 // RX BIBI: actual bounded executor must distinguish a failed handler from success.
 const {createTurbine,executeApproved}=require('../rx-turbine-engine.cjs');
 (async()=>{
  const t=createTurbine();
  t.submit({id:'RXJOB-bibi-fail',kind:'run_unit_tests',target:'tests/rx-ai-core.cjs'});
  const failed=await executeApproved(t,{approved:true,handlers:{run_unit_tests:async()=>false}});
  assert.equal(failed.executed,1);
  assert.equal(failed.results[0].status,'failed');
  assert.equal(failed.results[0].ok,false);
  assert.equal(failed.results[0].errorCode,'handler_returned_failure');
  const ok=await executeApproved(t,{approved:true,handlers:{run_unit_tests:async()=>true}});
  assert.equal(ok.results[0].status,'completed');
  console.log('PASS RX BIBI: real Turbine executor differentiates failed and completed handlers');
 })().catch(error=>{console.error(error);process.exitCode=1;});
