'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {reviewBibiReports}=require('../rx-bibi-unified-adapter.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rx-bibi-unified-'));
try{
 const supervisor={kind:'rx-queen-ant-supervisor',issues:[{source:'fast',action:'inspect_failed_test',target:'src/example.js',priority:'high'}]};
 fs.writeFileSync(path.join(dir,'rx-queen-ant-supervisor.json'),JSON.stringify(supervisor));
 const first=reviewBibiReports({dir,runId:'ci-1'});
 assert.equal(first.summary.tasks,1);
 assert.equal(first.productionModified,false);
 assert.equal(first.summary.patchPreviews,0);
 const withSource=reviewBibiReports({dir,runId:'ci-2',sources:{'src/example.js':'debugger;'}});
 assert.equal(withSource.summary.patchPreviews,1);
 assert.equal(withSource.review.reviews[0].review.requiresApproval,true);
 assert.throws(()=>reviewBibiReports({dir,runId:'../bad'}),/Invalid RX run ID/);
 console.log('PASS RX BIBI unified report adapter');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
