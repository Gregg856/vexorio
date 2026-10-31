'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {score,run}=require('./rx-queen-candidate-selection.cjs');
test('approved response beats unsupported answer',()=>assert.ok(score('Cześć! W czym mogę pomóc?','Cześć! W czym mogę pomóc?')>score('Nie wiem','Cześć! W czym mogę pomóc?')));
test('unknown topic must preserve uncertainty',()=>assert.equal(score('Wiem wszystko',null),0));
test('five comparisons produce no regression',()=>{const r=run();assert.equal(r.evaluated,5);assert.equal(r.regressions,0);assert.equal(r.status,'PASS');});
test('no production writes or deployment claims',()=>{const r=run();assert.equal(r.autoApplied,0);assert.equal(r.productionConnected,false);});
