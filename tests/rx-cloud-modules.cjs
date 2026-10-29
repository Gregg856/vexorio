'use strict';
// RX CLOUD 3.9: integration contract checks without launching agents or touching production.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const queen=read('rx-admin-prototype.html');
const catalog=require('../rx-task-catalog.cjs');
const math=require('../rx-math-core.cjs');
assert(queen.includes('async function loadCloudWatch()'),'Queen cloud monitoring missing');
assert(queen.includes('async function loadBibiQueenWatch()'),'Queen BIBI monitoring missing');
assert(queen.includes("else if(label==='☁️ RX CLOUD — monitoring')loadCloudWatch();"),'Queen menu not connected');
assert(Array.isArray(catalog.RULES)&&catalog.RULES.length>=3,'Ant task catalog missing');
const ids=new Set();
for(const rule of catalog.RULES){
 assert(typeof rule.id==='string'&&!ids.has(rule.id),'Duplicate or missing task ID');
 ids.add(rule.id);
 assert(Array.isArray(rule.modules)&&rule.modules.includes('queen'),'Task lacks Queen coordination');
 assert(typeof rule.kind==='string'&&typeof rule.target==='string','Task missing action contract');
}
assert(catalog.RULES.some(r=>r.modules.includes('ants')),'Ants not registered');
assert(catalog.RULES.some(r=>r.modules.includes('cloud')),'Cloud not registered');
assert.equal(typeof math.matmul,'function','RX math kernel unavailable');
const result=math.matmul(new Float32Array([2,3]),new Float32Array([4,5]),1,2,1);
assert.equal(result[0],23,'RX math kernel failed');
assert(fs.existsSync(path.join(root,'rx-cloud-server.cjs')),'Self-host server missing');
console.log('RX CLOUD 3.9 Queen, ants, cloud, math integration contracts passed (static/offline)');
