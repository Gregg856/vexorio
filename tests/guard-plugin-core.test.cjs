'use strict';
const assert=require('node:assert/strict');
const {createRegistry}=require('../guard/plugin-core.cjs');
(async()=>{
 const registry=createRegistry();
 registry.register({id:'task-summary',description:'Local task summary',permissions:['read:task'],run:({task})=>({message:'Zadanie: '+task})});
 assert.equal(registry.list()[0].id,'task-summary');
 assert.equal(registry.list()[0].permissions[0],'read:task');
 assert.throws(()=>registry.register({id:'task-summary',permissions:[],run:()=>({message:'x'})}),/Invalid or duplicate/);
 assert.throws(()=>registry.register({id:'unsafe-plugin',permissions:['write:production'],run:()=>({message:'x'})}),/Permission denied/);
 await assert.rejects(()=>registry.execute('task-summary',{task:'Test'}),/approval required/);
 assert.deepEqual(await registry.execute('task-summary',{task:'Test'},true),{plugin:'task-summary',message:'Zadanie: Test'});
 await assert.rejects(()=>registry.execute('missing',{task:'Test'},true),/Unknown plugin/);
 console.log('PASS: Strażak Plugin Core permissions, registry and approval');
})().catch(e=>{console.error(e);process.exitCode=1;});
