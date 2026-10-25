'use strict';
const assert=require('node:assert/strict');
const {createRegistry}=require('../guard/plugin-core.cjs');
const {installChangesReport}=require('../guard-changes-report-plugin.js');
(async()=>{
 const registry=createRegistry();
 installChangesReport(registry,async()=>({status:'ok',changedFiles:2,summary:{high:1,medium:0,low:3}}));
 assert.equal(registry.list()[0].id,'changes-report');
 await assert.rejects(registry.execute('changes-report',{task:'github'}),/approval/i);
 const result=await registry.execute('changes-report',{task:'github'},true);
 assert.match(result.message,/2 plików/);
 assert.match(result.message,/Wysokie: 1/);
 const missing=createRegistry();
 installChangesReport(missing,async()=>null);
 assert.match((await missing.execute('changes-report',{task:'github'},true)).message,/nie jest jeszcze dostępny/);
 console.log('PASS: Strażak GitHub report plugin read-only and approval');
})().catch(e=>{console.error(e);process.exitCode=1});
