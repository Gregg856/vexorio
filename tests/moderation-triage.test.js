const assert=require('node:assert/strict');
const {evaluate}=require('../staging/moderation-triage.js');
const clean=evaluate({title:'Rower miejski',description:'Sprzedam sprawny rower'});
assert.equal(clean.level,'low');assert.equal(clean.requiresHumanReview,false);
const flagged=evaluate({title:'Usługi seksualne',description:'Oferta'});
assert.equal(flagged.level,'review-high');assert.equal(flagged.requiresHumanReview,true);
assert.ok(flagged.reasons.includes('sexual-services'));
const photos=evaluate({title:'Kanapa',hasImages:true});assert.equal(photos.photoReviewRequired,true);
assert.equal(photos.requiresHumanReview,false);
const suspicious=evaluate({description:'Podaj hasło do konta'});assert.equal(suspicious.requiresHumanReview,true);
assert.deepEqual(evaluate({}),evaluate({}));
console.log('PASS: moderation triage deterministic advisory checks');

assert.equal(evaluate({title:'Escort service'}).level,'review-high');
assert.equal(evaluate({title:'Zwykły rower',imageCount:2}).photoReviewRequired,true);
console.log('PASS: word-boundary and photo count regression checks');
