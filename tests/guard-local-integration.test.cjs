'use strict';
const assert=require('node:assert/strict');
const {createLocalGuard}=require('../guard/local-integration.cjs');
const examples=[
 {label:'safe',text:'rower odbiór osobisty sprawny rower'},
 {label:'safe',text:'rower miejski używany odbiór'},
 {label:'safe',text:'fahrrad abholung gebraucht'},
 {label:'safe',text:'bicycle local pickup'},
 {label:'suspicious',text:'wyślij hasło kod sms'},
 {label:'suspicious',text:'wyślij hasło kod sms'},
 {label:'suspicious',text:'wyślij hasło kod sms'},
 {label:'suspicious',text:'wyślij hasło kod sms'}
];
(async()=>{
 assert.throws(()=>createLocalGuard(examples,{minimumConfidence:NaN}),/Invalid confidence threshold/);
 assert.throws(()=>createLocalGuard(examples,{minimumConfidence:Infinity}),/Invalid confidence threshold/);
 assert.throws(()=>createLocalGuard(examples,{minimumConfidence:-Infinity}),/Invalid confidence threshold/);
 const conservative=createLocalGuard(examples,{minimumConfidence:1});
 const uncertain=await conservative.evaluate({title:'Rower',description:'rower odbiór osobisty sprawny rower'});
 assert.equal(uncertain.decision,'none');
 assert.equal(uncertain.requiresHumanReview,true);
 assert.ok(uncertain.flags.includes('model_insufficient_model_knowledge'));
 const guard=createLocalGuard(examples,{minimumConfidence:0.5});
 const flagged=await guard.evaluate({title:'Oferta',description:'wyślij hasło kod sms'});
 assert.equal(flagged.model.status,'advisory');
 assert.equal(flagged.decision,'none');
 assert.ok(flagged.flags.includes('model_suspected_fraud'));
 assert.equal(flagged.requiresHumanReview,true);
 const clean=await guard.evaluate({title:'Rower',description:'rower odbiór osobisty sprawny rower'});
 assert.equal(clean.model.status,'advisory');
 assert.equal(clean.decision,'none');
 assert.ok(!clean.flags.includes('model_suspected_fraud'));
 const unfamiliar=await guard.evaluate({title:'quasar',description:'xenolith nebula'});
 assert.equal(unfamiliar.model.status,'advisory');
 assert.ok(unfamiliar.flags.includes('model_insufficient_model_knowledge'));
 assert.equal(unfamiliar.requiresHumanReview,true);
 assert.equal(unfamiliar.decision,'none');
 assert.ok(!unfamiliar.flags.includes('model_suspected_fraud'));
 const partial=await guard.evaluate({title:'quasar',description:'xenolith nebula rower'});
 assert.ok(partial.flags.includes('model_insufficient_model_knowledge'));
 assert.equal(partial.requiresHumanReview,true);
 assert.equal(partial.decision,'none');
 // Synthetic threshold sweep: measure escalation rate, not real-world accuracy.
 const probes=[
  {title:'Rower',description:'rower odbiór osobisty sprawny'},
  {title:'Fahrrad',description:'fahrrad abholung gebraucht'},
  {title:'Quasar',description:'xenolith nebula'},
  {title:'Rower',description:'quasar xenolith nebula rower'},
  {title:'Oferta',description:'wyślij hasło kod sms'},
  {title:'Bicycle',description:'bicycle local pickup'}
 ];
 const sweep=[];
 for(const minimumCoverage of [0,0.1,0.25,0.5,0.75]){
  const candidate=createLocalGuard(examples,{minimumConfidence:0.5,minimumCoverage});
  let escalated=0;
  for(const probe of probes){
   const report=await candidate.evaluate(probe);
   if(report.flags.includes('model_insufficient_model_knowledge'))escalated++;
   assert.equal(report.decision,'none');
  }
  sweep.push({minimumCoverage,escalated,total:probes.length});
 }
 assert.ok(sweep.every((row,i)=>i===0||row.escalated>=sweep[i-1].escalated));
 console.log('Guard SYNTHETIC coverage threshold sweep:',JSON.stringify(sweep));
 assert.throws(()=>createLocalGuard(examples,{minimumConfidence:2}));
 assert.throws(()=>createLocalGuard(examples,{minimumCoverage:-0.1}),/coverage/);
 console.log('PASS: self-trained Guard integrates without external API or autonomous moderation');
})().catch(error=>{console.error(error);process.exitCode=1});
