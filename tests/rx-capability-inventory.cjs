'use strict';
const assert=require('node:assert/strict');
const {inventory,summarizeCapabilities}=require('../rx-capability-inventory.cjs');
const report=inventory();
assert.equal(report.kind,'rx-capability-inventory');
assert.equal(report.productionModified,false);
for(const id of ['queen','cloud-planner','mega-computer','cloud-gateway','cloud-memory','signal-memory','unified']){
 const component=report.components.find(x=>x.id===id);
 assert.ok(component&&component.exists,id+' must exist');
}
const inbox=report.components.find(x=>x.id==='inbox');
assert.equal(inbox.exists,false);
assert.equal(inbox.status,'not-identified');
assert.ok(report.components.every(x=>typeof x.role==='string'&&typeof x.status==='string'));
console.log('PASS RX capability inventory: cloud, computer, memory and honest inbox status');

const overview=summarizeCapabilities();
assert.equal(overview.kind,'rx-capability-summary');
assert.equal(overview.live,false);
assert.equal(overview.productionModified,false);
assert.equal(Object.values(overview.summary).reduce((a,b)=>a+b,0),overview.total);
assert.ok(overview.summary.missing>=1);
console.log('PASS RX Queen capability summary');
