'use strict';
// RX MEGA CLOUD COMPUTER: runs bounded, local, allowlisted Node checks in GitHub Actions.
// No shell, arbitrary commands, cloud provisioning, credentials, spending or deployment.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {createRXCloudComputer}=require('./rx-cloud-computer.cjs');
const {simulateRing}=require('./rx-cosmic-collider.cjs');
const {estimateSolar}=require('./rx-energy-lab.cjs');
const {syntheticDemo}=require('./rx-higgs-lab.cjs');
const CHECKS=Object.freeze([
 'tests/rx-ai-core.cjs','tests/rx-cloud-computer.cjs','tests/rx-integration.cjs',
 'tests/rx-higgs-lab.cjs','tests/rx-cosmic-collider.cjs','tests/rx-energy-lab.cjs',
 'tests/rx-ant-ai-trainer.cjs','tests/rx-ant-task-board.cjs','tests/rx-medusa-engine.cjs',
 'tests/rx-queen-memory-chat-bridge.test.cjs','tests/rx-queen-live-memory-gate.test.cjs'
]);
function runCloudComputer({execute=false,selectedChecks=CHECKS,maxChecks=CHECKS.length}={}){
 if(!Array.isArray(selectedChecks)||selectedChecks.length>CHECKS.length||!Number.isSafeInteger(maxChecks)||maxChecks<0||maxChecks>CHECKS.length)throw Error('Invalid RX ant check budget');
 if(selectedChecks.some(file=>typeof file!=='string'||!CHECKS.includes(file))||new Set(selectedChecks).size!==selectedChecks.length)throw Error('RX ant check not allowlisted or duplicate');
 const selected=selectedChecks.slice(0,maxChecks);
 const planner=createRXCloudComputer({maxTasks:20});
 for(let i=0;i<selected.length;i++)planner.enqueue({id:'RXJOB-check-'+i,kind:'run_unit_tests',target:selected[i]});
 const checks=selected.map(file=>{
  if(!execute)return {file,status:'planned'};
  const started=Date.now();
  const result=spawnSync(process.execPath,[file],{cwd:__dirname,encoding:'utf8',timeout:20000,maxBuffer:65536,env:{PATH:process.env.PATH||''}});
  return {file,durationMs:Date.now()-started,status:result.status===0&&!result.error?'passed':'failed',exitCode:result.status,error:result.error?String(result.error.message).slice(0,200):null};
 });
 return {schema:1,kind:'rx-mega-cloud-computer',executionEnvironment:'github-actions-or-local-node',cloudServerProvisioned:false,physicalHardwareOwned:false,checks,requested:selectedChecks.length,deferred:selectedChecks.length-selected.length,limit:maxChecks,executed:execute?checks.length:0,passed:checks.filter(x=>x.status==='passed').length,failed:checks.filter(x=>x.status==='failed').length,planned:checks.filter(x=>x.status==='planned').length,totalTestDurationMs:checks.reduce((sum,x)=>sum+(x.durationMs||0),0),queue:planner.report(),labs:{collider:simulateRing(),energy:estimateSolar(),higgs:syntheticDemo()},note:'Only fixed repository tests execute. Lab inputs are synthetic or estimates. No live CERN data, trained model, physical collider or automatic deployment.'};
}

function runAntQueue(queue,{approvedIds=[],execute=false,maxChecks=3}={}){
 if(!queue||queue.kind!=='rx-cosmos-ant-queue'||queue.schema!==1||!Array.isArray(queue.planned)||queue.planned.length>20||!Array.isArray(approvedIds)||approvedIds.length>20||new Set(approvedIds).size!==approvedIds.length||!Number.isSafeInteger(maxChecks)||maxChecks<0||maxChecks>CHECKS.length)throw Error('Invalid RX ant queue budget or approvals');
 const ids=new Set(), eligible=[];
 for(const task of queue.planned){
  if(!task||typeof task.id!=='string'||ids.has(task.id)||task.status!=='needs_review'||task.requiresApproval!==true||typeof task.action!=='string'||typeof task.target!=='string')throw Error('Invalid RX ant queue task');
  ids.add(task.id);
  if(task.action==='run_unit_tests'&&CHECKS.includes(task.target)&&!eligible.includes(task.target))eligible.push(task.target);
 }
 if(approvedIds.some(id=>typeof id!=='string'||!ids.has(id)))throw Error('Unknown RX ant approval');
 // Never let unapproved tasks sharing a test target be reported as executed.
 // Preserve the queue's explicit approval order and map each unique check to its approved task ID.
 const approvedTargets=new Set();
 const approved=queue.planned.filter(task=>approvedIds.includes(task.id)&&task.action==='run_unit_tests'&&CHECKS.includes(task.target));
 const uniqueApproved=approved.filter(task=>{if(approvedTargets.has(task.target))return false;approvedTargets.add(task.target);return true;});
 const selected=uniqueApproved.map(task=>task.target);
 const report=runCloudComputer({execute,selectedChecks:selected,maxChecks});
 return {...report,kind:'rx-cosmos-ant-check-report',queueTasks:queue.planned.length,approvedTasks:approved.length,eligibleTasks:eligible.length,skippedTasks:queue.planned.length-approved.length,approvalRequired:true,executedTaskIds:execute?uniqueApproved.slice(0,maxChecks).map(task=>task.id):[],note:'Only explicitly approved, fixed allowlisted Node checks can run. No arbitrary task execution, edits or deployments.'};
}

// Queen-to-executor bridge: explicit approval allows only existing allowlisted tests.
// Code edits and deployments are never performed by this bridge.
function runQueenApprovedChecks(plan,{approved=false,execute=false,maxChecks=2}={}){
 if(!plan||!['rx-ordered-work-proposal','rx-queen-work-order'].includes(plan.kind)||!Array.isArray(plan.stages)||plan.stages.length<1||plan.stages.length>10||plan.requiresApproval!==true||plan.executed!==false)throw Error('Invalid Queen work plan');
 if(typeof approved!=='boolean'||typeof execute!=='boolean'||!Number.isSafeInteger(maxChecks)||maxChecks<0||maxChecks>2)throw Error('Invalid Queen execution options');
 const stageModules=plan.stages.map(stage=>{
  if(!stage||!['RX Queen','RX BIBI','RX Developer'].includes(stage.module)||typeof stage.action!=='string'||stage.action.length>500)throw Error('Queen stage not allowlisted');
  return stage.module;
 });
 const checks=[...new Set(stageModules.map(module=>module==='RX BIBI'?'tests/rx-integration.cjs':module==='RX Developer'?'tests/rx-ai-core.cjs':null).filter(Boolean))];
 if(checks.some(check=>!CHECKS.includes(check)))throw Error('Queen check not allowlisted');
 const authorized=approved&&execute;
 const result=runCloudComputer({execute:authorized,selectedChecks:authorized?checks:[],maxChecks});
 return {kind:'rx-queen-approved-checks',approved,executed:result.executed,checks:result.checks,productionModified:false,codePatched:false,deployed:false,requiresApproval:!approved};
}


function previewQueenBuild(plan,{approved=false,target='rx-command-bridge.cjs',verify=false}={}){
 const allowed=['rx-command-bridge.cjs','rx-coordinator.cjs','rx-developer-patch-bridge.cjs'];
 if(!allowed.includes(target)||typeof verify!=='boolean')throw Error('Invalid RX build options');
 const checks=runQueenApprovedChecks(plan,{approved,execute:approved&&verify,maxChecks:2});
 if(!approved)return {kind:'rx-queen-build-preview',checks,candidates:[],changesApplied:false};
 if(verify&&checks.checks.some(x=>x.status!=='passed'))return {kind:'rx-queen-build-preview',checks,candidates:[],blocked:'bibi-check-failed',changesApplied:false};
 const {inspectAndPropose}=require('./rx-developer-patch-bridge.cjs');
 const {previewPatch}=require('./rx-patch-drafter.cjs');
 const {Script}=require('node:vm');
 const source=fs.readFileSync(path.join(__dirname,target),'utf8');
 const review=inspectAndPropose({target,source});
 const candidates=review.suggestions.map(x=>{
  try{
   const patched=previewPatch(x.proposal,source).preview;
   new Script(patched,{filename:target});
   return {target,rule:x.rule,syntax:'valid',bibiVerified:verify&&checks.checks.length>0&&checks.checks.every(c=>c.status==='passed'),draft:x.proposal,sourceSha256:require('node:crypto').createHash('sha256').update(source).digest('hex'),requiresApproval:true,applied:false};
  }catch(error){return {target,rule:x.rule,syntax:'invalid',bibiVerified:false,error:String(error.message).slice(0,160),requiresApproval:true,applied:false};}
 });
 return {kind:'rx-queen-build-preview',checks,candidates,changesApplied:false};
}


function prepareQueenPullRequest(staged,{approved=false,base='main'}={}){
 if(!approved||base!=='main'||!staged||staged.kind!=='rx-queen-staged-patch'||
    staged.changesApplied!==false||staged.deployed!==false||
    staged.bibiPatchedSyntax?.passed!==true||staged.bibiPatchInvariant?.passed!==true||
    staged.readyForPullRequest!==true)throw Error('Queen PR requires approved verified staging');
 const allowed=['rx-command-bridge.cjs','rx-coordinator.cjs','rx-developer-patch-bridge.cjs'];
 if(!allowed.includes(staged.target))throw Error('Queen PR target not allowlisted');
 const hash=require('node:crypto').createHash('sha256').update(staged.content).digest('hex');
 if(hash!==staged.patchedSha256)throw Error('Queen PR content integrity failed');
 return {kind:'rx-queen-pr-proposal',base,head:null,target:staged.target,
  title:'RX: verified Queen/BIBI patch for '+staged.target,
  content:staged.content,sourceSha256:staged.sourceSha256,
  patchedSha256:staged.patchedSha256,requiresHumanReview:true,
  branchCreated:false,pullRequestCreated:false,merged:false,deployed:false};
}

function matchesBibiFunctionalReview(candidate,review,patched){
 return !!candidate&&!!review&&typeof patched==='string'&&
  review.target===candidate.target&&review.rule===candidate.rule&&
  review.functionalValidation==='passed'&&review.bibiValidation==='passed'&&
  review.readyForReview===true&&review.preview===patched;
}

function stageQueenPatch(candidate,{approved=false,functionalReview=null}={}){
 if(functionalReview!==null){
  if(!functionalReview||functionalReview.target!==candidate?.target||functionalReview.rule!==candidate?.rule||functionalReview.functionalValidation!=='passed'||functionalReview.bibiValidation!=='passed'||functionalReview.readyForReview!==true)throw Error('Invalid BIBI functional review');
 }
 if(!approved||!candidate||candidate.syntax!=='valid'||candidate.bibiVerified!==true||candidate.applied!==false)throw Error('Queen patch requires verified explicit approval');
 const allowed=['rx-command-bridge.cjs','rx-coordinator.cjs','rx-developer-patch-bridge.cjs'];
 if(!allowed.includes(candidate.target)||candidate.draft?.target!==candidate.target)throw Error('Invalid Queen patch target');
 const crypto=require('node:crypto');
 const source=fs.readFileSync(path.join(__dirname,candidate.target),'utf8');
 if(crypto.createHash('sha256').update(source).digest('hex')!==candidate.sourceSha256)throw Error('Stale Queen patch source');
 const {previewPatch}=require('./rx-patch-drafter.cjs');
 const patched=previewPatch(candidate.draft,source).preview;
 if(functionalReview!==null&&!matchesBibiFunctionalReview(candidate,functionalReview,patched))throw Error('BIBI reviewed different patch bytes');
 new (require('node:vm').Script)(patched,{filename:candidate.target});
 // BIBI checks the exact patched bytes using Node's syntax checker in isolation.
 const os=require('node:os');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'rx-queen-stage-'));
 let syntaxResult;
 try{
  const candidatePath=path.join(temp,'candidate.cjs');
  fs.writeFileSync(candidatePath,patched,{flag:'wx',mode:0o600});
  const check=spawnSync(process.execPath,['--check',candidatePath],{
   cwd:temp,encoding:'utf8',timeout:10000,maxBuffer:16384,
   env:{PATH:process.env.PATH||''}
  });
  syntaxResult={passed:check.status===0&&!check.error,
   error:check.status===0&&!check.error?null:String(check.error?.message||check.stderr||check.status).slice(0,240)};
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 if(!syntaxResult.passed)throw Error('BIBI patched source check failed: '+syntaxResult.error);

 // BIBI verifies the intended behavioral invariant of these bounded cleanup rules:
 // only the single approved debug statement may disappear.
 const draft=candidate.draft;
 if(!['remove-debugger','remove-console-debug'].includes(candidate.rule)||
    !draft||draft.operation!=='replace-exact-once'||draft.newText!==''||
    !((candidate.rule==='remove-debugger'&&/^\\s*debugger;?\\s*$/.test(draft.oldText))||
      (candidate.rule==='remove-console-debug'&&/^\\s*console\\.debug\\([^\\r\\n]*\\);?\\s*$/.test(draft.oldText))))throw Error('BIBI patch invariant rejected');
 const occurrences=source.split(draft.oldText).length-1;
 if(occurrences!==1||patched!==source.replace(draft.oldText,''))throw Error('BIBI patch changed unexpected code');
 const bibiPatchInvariant={passed:true,kind:'single-debug-statement-removal',sourcePreservedExceptApprovedEdit:true};

 // Staging only: no filesystem writes, commits, or deployment.
 return {kind:'rx-queen-staged-patch',target:candidate.target,sourceSha256:candidate.sourceSha256,
  patchedSha256:crypto.createHash('sha256').update(patched).digest('hex'),
  content:patched,bibiPatchedSyntax:syntaxResult,bibiPatchInvariant,readyForPullRequest:true,changesApplied:false,deployed:false};
}

if(require.main===module){
 const report=runCloudComputer({execute:true});
 const file=path.join('rx-bibi-reports','rx-mega-cloud-computer.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log('RX MEGA CLOUD COMPUTER:',report.passed,'passed,',report.failed,'failed');
 if(report.failed)process.exitCode=1;
}
module.exports={runCloudComputer,runAntQueue,runQueenApprovedChecks,previewQueenBuild,stageQueenPatch,matchesBibiFunctionalReview,prepareQueenPullRequest,CHECKS};
