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
// BIBI validates each candidate in memory; no source file is changed.
const original=fs.readFileSync(path.join(__dirname,target),'utf8');
const {previewPatch}=require('./rx-patch-drafter.cjs');
const {Script}=require('node:vm');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const incidentId=process.env.RX_INCIDENT_ID||null;
if(incidentId&&!/^[a-f0-9]{16}$/.test(incidentId))throw Error('Invalid RX incident id');
const verified=proposals.map((candidate,index)=>{
 const proposal=report.suggestions[index].proposal;
 try{
  const preview=previewPatch(proposal,original).preview;
  if(preview!==candidate.preview)throw Error('Preview mismatch');
  new Script(preview,{filename:target});
  // Run the real Node syntax checker against a temporary file, never the repository.
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'rx-bibi-patch-'));
  let check;
  try{
   const tempFile=path.join(sandbox,target);
   fs.writeFileSync(tempFile,preview,{flag:'wx'});
   check=spawnSync(process.execPath,['--check',tempFile],{encoding:'utf8',timeout:10000,maxBuffer:65536});
  }finally{fs.rmSync(sandbox,{recursive:true,force:true});}
  if(check.error||check.status!==0)throw Error('Sandbox syntax check failed: '+String(check.error?.message||check.stderr||check.status).slice(0,160));
  // Run actual exported behavior in a restricted child process against the patch.
  // Only the three allowlisted modules are eligible. The child has no network,
  // subprocess, filesystem or process.env access; require is a fixed mock map.
  const harness = `
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2],'utf8');
const target=process.argv[3];
const mock={
 './rx-ai-router.cjs':{route:()=>({supported:true,module:'mock'})},
 './rx-task-catalog.cjs':{RULES:[{id:'test',words:['test'],modules:['mock'],cost:1,kind:'test',target:'mock',role:'test'}]},
 './rx-command-bridge.cjs':{planCommand:()=>({steps:[],requiresApproval:true})},
 './rx-turbine-engine.cjs':{createTurbine:()=>({submit:()=>({accepted:true}),plan:()=>({})})},
 './rx-energy-core.cjs':{createEnergyCore:()=>({status:()=>({balance:0})})},
 './rx-dna-core.js':{createAntDNA:()=>({id:'1',role:'test'})},
 './guard/rx-developer-core.cjs':{analyzeJavaScript:()=>({ok:true})},
 './rx-patch-drafter.cjs':{suggestPatch:()=>{throw Error('Rule match missing or ambiguous');}}
};
const context={module:{exports:{}},exports:{},require:(id)=>{if(!Object.hasOwn(mock,id))throw Error('Dependency blocked: '+id);return mock[id];}};
vm.runInNewContext(source,context,{filename:target,timeout:1000});
const api=context.module.exports;
if(target==='rx-command-bridge.cjs'){
 assert.equal(typeof api.planCommand,'function');
 const result=api.planCommand('test',{energyBalance:2});
 assert.equal(result.requiresApproval,true);
 assert.equal(result.productionModified,false);
 assert.equal(result.autoExecuted,0);
 assert.throws(()=>api.planCommand(''),/Invalid RX command/);
}else if(target==='rx-coordinator.cjs'){
 assert.equal(typeof api.coordinateRX,'function');
 const result=api.coordinateRX('test');
 assert.equal(result.productionModified,false);
 assert.equal(result.executed,0);
 assert.equal(result.queen.requiresApproval,true);
}else if(target==='rx-developer-patch-bridge.cjs'){
 assert.equal(typeof api.inspectAndPropose,'function');
 const result=api.inspectAndPropose({target:'src/test.js',source:'const a=1;'});
 assert.equal(result.requiresApproval,true);
 assert.equal(result.productionModified,false);
 assert.equal(result.automaticDeployment,false);
}else throw Error('Target not allowlisted');
console.log('FUNCTIONAL_PASS');
`;
  let functional;
  const functionalSandbox=fs.mkdtempSync(path.join(os.tmpdir(),'rx-bibi-functional-'));
  try{
   const patched=path.join(functionalSandbox,target);
   const runner=path.join(functionalSandbox,'harness.cjs');
   fs.writeFileSync(patched,preview,{flag:'wx'});
   fs.writeFileSync(runner,harness,{flag:'wx'});
   functional=spawnSync(process.execPath,['--no-network-inspection','--disallow-code-generation-from-strings',runner,patched,target],{
    encoding:'utf8',timeout:3000,maxBuffer:16384,env:{NODE_OPTIONS:''},cwd:functionalSandbox
   });
  }finally{fs.rmSync(functionalSandbox,{recursive:true,force:true});}
  const functionalPassed=!functional.error&&functional.status===0&&functional.stdout.includes('FUNCTIONAL_PASS');
  return {...candidate,incidentId,bibiValidation:'passed',sandboxValidation:'node-check-passed',
   functionalChecks:[{name:'isolated-export-behavior',passed:functionalPassed}],
   functionalValidation:functionalPassed?'passed':'failed',
   functionalError:functionalPassed?null:String(functional.error?.message||functional.stderr||functional.status).slice(0,160),
   readyForReview:functionalPassed};

 }catch(error){
  return {...candidate,incidentId,bibiValidation:'failed',readyForReview:false,validationError:String(error.message).slice(0,160)};
 }
});
const output=path.join(__dirname,'rx-bibi-reports','rx-developer-review.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({...report,reviewStatus:'completed',incidentId,patchCandidates:verified,bibiTest:'rx-developer-bridge-isolated.cjs',changesApplied:false},null,2)+'\n');
console.log('RX Developer reviewed',target,'suggestions',report.suggestions.length);
