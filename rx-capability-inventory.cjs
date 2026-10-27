'use strict';
// Verified source inventory. Names are capabilities, not independent cloud services.
const fs=require('node:fs');
const path=require('node:path');
const COMPONENTS=Object.freeze([
 {id:'queen',file:'rx-queen-ant-supervisor.cjs',role:'report-triage',status:'tested'},
 {id:'queen-computer',file:'rx-queen-computer-status.cjs',role:'computer-status-report',status:'tested'},
 {id:'cloud-planner',file:'rx-cloud-computer.cjs',role:'bounded-local-task-planner',status:'tested'},
 {id:'mega-computer',file:'rx-mega-cloud-computer.cjs',role:'allowlisted-ci-test-executor',status:'tested'},
 {id:'cloud-gateway',file:'rx-dna-cloud-gateway.cjs',role:'supabase-staging-adapter',status:'adapter-only'},
 {id:'cloud-transport',file:'rx-dna-cloud-transport.cjs',role:'authenticated-http-transport',status:'adapter-only'},
 {id:'cloud-memory',file:'rx-dna-cloud-memory.cjs',role:'backend-dependent-dna-storage',status:'adapter-only'},
 {id:'signal-memory',file:'rx-signal-memory.cjs',role:'recurrent-diagnostic-memory',status:'tested'},
 {id:'medusa',file:'rx-medusa-engine.cjs',role:'signal-routing',status:'tested'},
 {id:'ant-board',file:'rx-ant-task-board.cjs',role:'bounded-task-queue',status:'tested'},
 {id:'ant-builder',file:'rx-ant-builder.cjs',role:'review-only-task-drafts',status:'tested'},
 {id:'developer',file:'guard/rx-developer-core.cjs',role:'source-analysis',status:'tested'},
 {id:'unified',file:'rx-unified-review.cjs',role:'read-only-pipeline',status:'prototype'},
 {id:'bibi-adapter',file:'rx-bibi-unified-adapter.cjs',role:'ci-report-reader',status:'prototype'},
 {id:'source-reader',file:'rx-source-reader.cjs',role:'bounded-local-source-reader',status:'prototype'},
 {id:'inbox',file:null,role:'dedicated-rx-inbox',status:'not-identified'}
]);
function inventory({root=process.cwd()}={}){
 const base=fs.realpathSync(root);
 return {schema:1,kind:'rx-capability-inventory',components:COMPONENTS.map(x=>({...x,exists:x.file?fs.existsSync(path.join(base,x.file)):false})),notes:['An RX inbox module was not identified by repository path inventory.','Cloud computer is not a provisioned VM.','No deployment or autonomous source edits.'],productionModified:false};
}
function summarizeCapabilities({root=process.cwd()}={}){
 const data=inventory({root});
 const summary={tested:0,prototype:0,adapterOnly:0,missing:0};
 for(const component of data.components){
  if(!component.exists)summary.missing++;
  else if(component.status==='tested')summary.tested++;
  else if(component.status==='adapter-only')summary.adapterOnly++;
  else summary.prototype++;
 }
 return {schema:1,kind:'rx-capability-summary',summary,total:data.components.length,components:data.components,live:false,productionModified:false};
}
module.exports={inventory,summarizeCapabilities};
if(require.main===module)console.log(JSON.stringify(inventory(),null,2));
