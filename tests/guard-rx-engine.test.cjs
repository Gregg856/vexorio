'use strict';
const assert=require('node:assert/strict');
const {evaluateRX}=require('../guard/rx-engine.cjs');
const {train}=require('../guard/local-model.cjs');
const examples=[
 {label:'safe',text:'Sprzedam rower odbiór osobisty'},
 {label:'safe',text:'Rower używany dobry stan'},
 {label:'safe',text:'Fahrrad Abholung Zustand'},
 {label:'safe',text:'Used bike local pickup'},
 {label:'suspicious',text:'Wyślij hasło kod SMS western union'},
 {label:'suspicious',text:'Send password verification code'},
 {label:'suspicious',text:'Gwarantowany zysk wpłać natychmiast'},
 {label:'suspicious',text:'Pay immediately gift card'}
];
const model=train(examples);
const safe={title:'Sprzedam rower',description:'Rower używany odbiór osobisty'};
const fraud={title:'Oferta',description:'Wyślij hasło kod SMS western union'};
const normal=evaluateRX(safe,{model});
assert.equal(normal.decision,'none');
assert.equal(normal.mode,'advisory');
assert.equal(normal.ruleScore,0);
const risky=evaluateRX(fraud,{model});
assert.equal(risky.requiresHumanReview,true);
assert.equal(risky.priority,'high');
assert.ok(risky.flags.includes('credential_request'));
const unknown=evaluateRX({title:'Quasar',description:'Xenolith nebula'},{model});
assert.equal(unknown.modelStatus,'uncertain');
assert.ok(unknown.flags.includes('rx_model_uncertain'));
assert.equal(evaluateRX(safe).modelStatus,'not_configured');
assert.equal(evaluateRX(safe,{model:{predict(){throw Error('offline')}}}).modelStatus,'unavailable');
assert.equal(evaluateRX(safe,{model:{predict(){return {label:'safe',confidence:2,coverage:1}}}}).modelStatus,'invalid_response');
const disagreement=evaluateRX(fraud,{model:{predict(){return {label:'safe',confidence:0.99,coverage:1}}}});
assert.ok(disagreement.flags.includes('rx_disagreement'));
assert.equal(disagreement.requiresHumanReview,true);
const suspicious=evaluateRX(safe,{model:{predict(){return {label:'suspicious',confidence:0.99,coverage:1}}}});
assert.equal(suspicious.priority,'high');
assert.equal(suspicious.decision,'none');
console.log('PASS: RX Strazak offline advisory fusion, uncertainty, disagreement, fail-safe');
