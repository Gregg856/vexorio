'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {queenDiagnosticsReport}=require('../rx-queen-diagnostics-report.cjs');
test('Queen preview does not execute',()=>{const r=queenDiagnosticsReport();assert.equal(r.executed,0);assert.equal(r.queen.status,'awaiting_approval')});
test('Queen cannot execute without approval',()=>{const r=queenDiagnosticsReport({execute:true});assert.equal(r.executed,0)});
test('approved Queen executes a bounded test and reports result',()=>{const r=queenDiagnosticsReport({approved:true,execute:true,maxChecks:1});assert.equal(r.executed,1);assert.equal(r.failed,0);assert.equal(r.passed,1);assert.equal(r.productionModified,false)});
test('invalid approval and budget rejected',()=>{assert.throws(()=>queenDiagnosticsReport({approved:'yes'}));assert.throws(()=>queenDiagnosticsReport({maxChecks:5}))});
