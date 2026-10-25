'use strict';
const assert=require('node:assert/strict');
const {createRegistry}=require('../guard/plugin-core.cjs');
const {installTaskAnalyzer}=require('../guard-task-analyzer-plugin.js');
const {analyzeTask}=require('../guard-engine-2.js');
(async()=>{
 const registry=createRegistry();
 installTaskAnalyzer(registry,analyzeTask);
 assert.equal(registry.list()[0].id,'task-analyzer');
 await assert.rejects(()=>registry.execute('task-analyzer',{task:'usuń bazę danych'}),/approval required/);
 const result=await registry.execute('task-analyzer',{task:'usuń bazę danych'},true);
 assert.match(result.message,/Ryzyko: wysokie/);
 assert.match(result.message,/Nie wykonano żadnych zmian/);
 const safe=await registry.execute('task-analyzer',{task:'sprawdź testy'},true);
 assert.match(safe.message,/Ryzyko: niskie/);
 console.log('PASS: Strażak analyzer plugin requires approval and reports risk without execution');
})().catch(e=>{console.error(e);process.exitCode=1;});
