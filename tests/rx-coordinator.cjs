'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coordinateRX}=require('../rx-coordinator.cjs');
test('integrates existing RX command, DNA, turbine and energy',()=>{
 const p=coordinateRX('Sprawdź testy w chmurze i model AI',{initialCredits:25,maxParallel:2});
 assert.ok(p.ants.length>=2);
 assert.ok(p.turbine.waves.length>=1);
 assert.ok(p.ants.every(a=>/^RX-\d{6}$/.test(a.dna)));
 assert.equal(p.energy.balance,25);
 assert.equal(p.executed,0);
 assert.equal(p.cloud.executionConnected,false);
});
test('unrecognized command produces no tasks',()=>{
 const p=coordinateRX('napisz opowiadanie');
 assert.equal(p.ants.length,0);
 assert.equal(p.turbine.planned,0);
});
