'use strict';
// RX INTEGRATION 1.0 — joins existing components without external side effects.
const {createRXCloudComputer}=require('./rx-cloud-computer.cjs');
const {createRXAICore}=require('./rx-ai-core.cjs');
const {runExperiment}=require('./rx-ant-lab.cjs');
function createRXIntegration(){
 const cloud=createRXCloudComputer({maxTasks:20});
 const ai=createRXAICore({maxCandidates:20});
 function planVexorioChecks(){
  cloud.enqueue({id:'RXJOB-vexorio-ci',kind:'inspect_ci',target:'vexorio'});
  cloud.enqueue({id:'RXJOB-rx-core',kind:'run_unit_tests',target:'tests/rx-ai-core.cjs'});
  cloud.enqueue({id:'RXJOB-rx-cloud',kind:'run_unit_tests',target:'tests/rx-cloud-computer.cjs'});
  cloud.enqueue({id:'RXJOB-rx-browser',kind:'run_browser_tests',target:'tests/rx-bibi-browser.cjs'});
  const experiment=runExperiment();
  ai.submit({id:'RXDNA-ant-lab-synthetic',metrics:{passed:experiment.passingVariants,total:experiment.testedVariants,errors:experiment.testedVariants-experiment.passingVariants},source:'ci_unverified'});
  return {schema:1,kind:'rx-integration-plan',project:'VEXORIO',cloud:cloud.report(),ai:ai.report(),lab:{dataset:experiment.dataset,testedVariants:experiment.testedVariants,passingVariants:experiment.passingVariants},productionModified:false,note:'Planning and synthetic scoring only. No real CI results fetched, no autonomous agent, deployment or training.'};
 }
 return Object.freeze({planVexorioChecks});
}
module.exports={createRXIntegration};
