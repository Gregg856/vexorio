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
 assert.throws(()=>createLocalGuard(examples,{minimumConfidence:2}));
 console.log('PASS: self-trained Guard integrates without external API or autonomous moderation');
})().catch(error=>{console.error(error);process.exitCode=1});
