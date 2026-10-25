'use strict';
const assert=require('node:assert/strict');
const {createRegistry}=require('../guard/plugin-core.cjs');
const {installTaskAnalyzer}=require('../guard-task-analyzer-plugin.js');
const {installChangesReport}=require('../guard-changes-report-plugin.js');
const {installCodeAudit}=require('../guard-code-audit-plugin.js');
(async()=>{
 const registry=createRegistry();
 installTaskAnalyzer(registry,()=>({ok:true,intent:'testing',risk:'low',steps:['Sprawdź wynik']}));
 installChangesReport(registry,async()=>({status:'ok',changedFiles:2,summary:{high:0,medium:1,low:0}}));
 installCodeAudit(registry,()=>({lines:1,findings:[]}));
 assert.deepEqual(registry.list().map(p=>p.id).sort(),['changes-report','code-audit','task-analyzer']);
 for(const id of ['task-analyzer','changes-report','code-audit']){
  const result=await registry.execute(id,{task:'bezpieczny test'},true);
  assert.equal(typeof result.message,'string');
  assert.ok(result.message.length>0);
 }
 const health=registry.diagnostics();
 assert.equal(health.length,3);
 for(const item of health){assert.equal(item.status,'ok');assert.equal(item.checks,1);assert.equal(item.failures,0);}
 console.log('PASS: three RX plugins registered, executed and diagnosed');
})().catch(error=>{console.error(error);process.exitCode=1;});
