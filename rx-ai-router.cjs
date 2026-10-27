'use strict';
// RX AI 2.0: shared capability registry and safe routing, not a generative language model.
const CAPABILITIES=Object.freeze({
 classify_task:{module:'rx-ant-ai-trainer.cjs',mode:'synthetic-model',automatic:false},
 rank_candidates:{module:'rx-ai-core.cjs',mode:'heuristic',automatic:false},
 inspect_tests:{module:'rx-queen-ant-supervisor.cjs',mode:'ci-report',automatic:true},
 record_screen:{module:'rx-screen-recorder.html',mode:'user-consent',automatic:false},
 edit_video:{module:'rx-bibi-studio.html',mode:'local-browser',automatic:false},
 plan_cloud_checks:{module:'rx-cloud-computer.cjs',mode:'bounded-planner',automatic:false}
});
function route(intent){
 if(typeof intent!=='string'||intent.length>120)throw Error('Invalid intent');
 const key=intent.trim().toLowerCase().replace(/[ -]+/g,'_');
 if(!Object.hasOwn(CAPABILITIES,key))return {schema:1,kind:'rx-ai-route',supported:false,intent:key,requiresApproval:true,note:'Unknown capability; no execution'};
 const cap=CAPABILITIES[key];
 return {schema:1,kind:'rx-ai-route',supported:true,intent:key,...cap,requiresApproval:!cap.automatic,note:'Capability discovery only; routing does not execute code, record media or deploy changes'};
}
function report(){return {schema:1,kind:'rx-ai-capability-registry',version:'2.0',languageModel:false,capabilities:Object.keys(CAPABILITIES).map(intent=>route(intent)),productionModified:false};}
module.exports={route,report};
if(require.main===module){process.stdout.write(JSON.stringify(report(),null,2)+'\n');}
