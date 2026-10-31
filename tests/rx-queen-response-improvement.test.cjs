'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {improve,PROBES}=require('./rx-queen-response-improvement.cjs');
test('improvement probes include unseen deployment and verification questions',()=>assert.equal(PROBES.length,4));
test('review reports all probes without automatically changing answers',()=>{const r=improve();assert.equal(r.tested,10);assert.equal(r.autoApplied,0);assert.equal(r.productionConnected,false);});
test('proposals require review',()=>{for(const p of improve().proposals){assert.equal(p.approved,false);assert.equal(p.autoApplied,false);assert.ok(p.reason);}});
