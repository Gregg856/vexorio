'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createEnergyCore}=require('../rx-energy-core.cjs');
test('verified ant work charges shared RX credit pool once',()=>{
 const rx=createEnergyCore({capacity:100,initial:0});
 assert.equal(rx.earn({taskId:'ant-1',verified:true,passed:true,credit:20}).awarded,20);
 assert.equal(rx.earn({taskId:'ant-1',verified:true,passed:true,credit:20}).accepted,false);
 assert.equal(rx.status().balance,20);
 assert.equal(rx.reserve({taskId:'brain',cost:5}).accepted,false);
 assert.equal(rx.reserve({taskId:'brain',cost:5,approved:true}).accepted,true);
 assert.equal(rx.status().balance,15);
});
test('unverified results do not earn credits and capacity is bounded',()=>{
 const rx=createEnergyCore({capacity:10});
 assert.equal(rx.earn({taskId:'ant-2',verified:false,passed:true}).accepted,false);
 assert.equal(rx.status().balance,0);
 assert.equal(rx.earn({taskId:'ant-3',verified:true,passed:true,credit:30}).awarded,10);
 assert.equal(rx.status().balance,10);
 assert.equal(rx.status().physicalEnergyProduced,false);
});
