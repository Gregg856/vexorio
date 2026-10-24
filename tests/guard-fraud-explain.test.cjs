'use strict';
const assert=require('node:assert/strict');
const {analyzeFraudHints}=require('../guard/fraud-explain.cjs');
for(const description of ['Wyślij mi kod SMS','Send your verification code','Schick mir dein Passwort','Надішліть пароль']){
 const r=analyzeFraudHints({title:'Oferta',description});
 assert.equal(r.status,'review_priority');
 assert.ok(r.indicators.some(x=>x.id==='credential_phishing'));
 assert.equal(r.automaticAction,false);
 assert.equal(r.requiresHumanReview,true);
}
const benign=analyzeFraudHints({title:'Rower',description:'Sprawny rower, odbiór osobisty'});
assert.equal(benign.score,0);
assert.equal(benign.status,'no_rule_match');
assert.equal(benign.automaticAction,false);
const combined=analyzeFraudHints({title:'Oferta',description:'Wyślij mi kod SMS i kup gift card'});
assert.equal(combined.score,90);
assert.equal(combined.indicators.length,2);
assert.equal(analyzeFraudHints(null).reason,'invalid_input');
assert.equal(analyzeFraudHints({title:' ',description:'ok'}).reason,'invalid_content');
console.log('PASS: multilingual explainable fraud signals, safe fallback, no automatic moderation');
