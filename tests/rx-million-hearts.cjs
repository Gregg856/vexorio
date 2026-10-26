'use strict';
const assert=require('node:assert/strict');
const {RXMillionHearts,createRXHearts}=require('../rx-million-hearts.js');
(async()=>{
 const rx=createRXHearts();
 assert.equal(rx.snapshot().registeredCells,10);
 assert.equal(rx.snapshot().logicalHeads,1000);
 const million=new RXMillionHearts({logicalHeads:1000000,maxConcurrent:2,maxQueue:3});
 assert.equal(million.snapshot().logicalHeads,1000000);
 assert.equal(million.headId(0),'RX-000001');
 assert.equal(million.headId(999999),'RX-1000000');
 assert.throws(()=>million.headId(1000000),/Invalid logical head/);
 assert.equal(million.snapshot().active,0);
 assert.equal(million.snapshot().queued,0);

 assert.equal((await rx.dispatch('tests',{id:1})).status,'needs-integration');
 const bounded=new RXMillionHearts({maxConcurrent:1,maxQueue:1});
 let release;
 bounded.register('slow',()=>new Promise(resolve=>{release=resolve;}));
 const first=bounded.dispatch('slow');
 await Promise.resolve();await Promise.resolve();
 const second=bounded.dispatch('slow');
 await assert.rejects(bounded.dispatch('slow'),/queue full/);
 release('one');assert.equal(await first,'one');
 await Promise.resolve();await Promise.resolve();
 release('two');assert.equal(await second,'two');
 assert.equal(bounded.snapshot().stats.completed,2);
 console.log('RX MILION SERC 1.0: PASS');
})().catch(err=>{console.error(err);process.exitCode=1;});
