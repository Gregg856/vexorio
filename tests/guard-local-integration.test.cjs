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
 assert.throws(()=>createLocalGuard(examples,{minimumConfidence:2}));
 assert.throws(()=>createLocalGuard(examples,{minimumCoverage:-0.1}),/coverage/);
 console.log('PASS: self-trained Guard integrates without external API or autonomous moderation');
})().catch(error=>{console.error(error);process.exitCode=1});
