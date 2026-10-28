'use strict';
// One RX command -> Queen plan -> DNA-identified Ants -> Turbine waves -> Energy estimate.
// Advisory-only; no network, server, actual AI inference or execution.
const {planCommand}=require('./rx-command-bridge.cjs');
const {createTurbine}=require('./rx-turbine-engine.cjs');
const {createEnergyCore}=require('./rx-energy-core.cjs');
const {createAntDNA}=require('./rx-dna-core.js');
const TASKS=Object.freeze({
 inspect_tests:{kind:'inspect_ci',target:'github-actions',role:'tests'},
 plan_cloud_checks:{kind:'run_unit_tests',target:'tests/rx-cloud-computer.cjs',role:'diagnostics'},
 classify_task:{kind:'run_unit_tests',target:'tests/rx-ant-ai-trainer.cjs',role:'memory'},
 rank_candidates:{kind:'run_unit_tests',target:'tests/rx-ai-core.cjs',role:'code'}
});
function coordinateRX(input,{initialCredits=0,maxParallel=2}={}){
 const energy=createEnergyCore({capacity:1000,initial:initialCredits});
 const command=planCommand(input,{energyBalance:energy.status().balance});
 const turbine=createTurbine({maxParallel});
 const ants=[];
 for(const step of command.steps){
  const task=TASKS[step.intent];if(!step.supported||!task)continue;
  const dna=createAntDNA(ants.length,{role:task.role});
  const submitted=turbine.submit({id:'RXJOB-'+dna.id,kind:task.kind,target:task.target});
  if(submitted.accepted)ants.push({dna:dna.id,role:dna.role,intent:step.intent,task:task.target});
 }
 return {schema:1,kind:'rx-coordinated-plan',queen:{status:'awaiting_approval',requiresApproval:true},command,ants,turbine:turbine.plan(),energy:energy.status(),cloud:{existingModule:'rx-mega-cloud-computer.cjs',executionConnected:false},cosmos:{executionConnected:false},executed:0,modelInferenceUsed:false,productionModified:false};
}
module.exports={coordinateRX};
