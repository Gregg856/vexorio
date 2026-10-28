'use strict';
const assert=require('node:assert/strict');
const {createNetwork,forward,loss,train}=require('./rx-neural-core.cjs');
// Learn simple nonnegative mapping y = 2*x1 + x2.
const x=new Float32Array([0,0,1,0,0,1,1,1,2,1,1,2,2,2,3,1]);
const y=new Float32Array([0,2,1,3,5,4,6,7]);
const net=createNetwork(2,12,1);
const before=loss(net,x,y);
const result=train(net,x,y,{epochs:1800,rate:0.015});
const after=loss(net,x,y);
assert.ok(Number.isFinite(after),'Loss must be finite');
assert.ok(after<before*0.15,'Learning must reduce loss significantly: '+before+' -> '+after);
assert.ok(after<0.2,'Training must fit simple synthetic mapping: '+after);
assert.equal(result.finalLoss,after);
assert.throws(()=>train(createNetwork(2,4,1),new Float32Array([1,2]),new Float32Array([1]),{rate:0}));
assert.throws(()=>forward(net,new Float32Array(3)));
console.log(JSON.stringify({kind:'rx-neural-core-test',status:'passed',initialLoss:before,finalLoss:after,reductionPercent:(1-after/before)*100,epochs:result.epochs,samples:result.count,note:'Synthetic learning test; not a language model'},null,2));
