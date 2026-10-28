'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {queenDiagnosticsPlan}=require('../rx-queen-diagnostics-plan.cjs');
test('Queen plans only allowlisted checks',()=>{const p=queenDiagnosticsPlan();assert.equal(p.checks.length,3);assert.equal(p.executed,0);assert.equal(p.approvalRequired,true);assert.equal(p.productionModified,false)});
test('Queen respects zero budget and rejects oversized budgets',()=>{assert.equal(queenDiagnosticsPlan({maxChecks:0}).checks.length,0);assert.throws(()=>queenDiagnosticsPlan({maxChecks:4}))});
