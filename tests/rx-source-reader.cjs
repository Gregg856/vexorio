'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {collectSources}=require('../rx-source-reader.cjs');
const {reviewBibiReports}=require('../rx-bibi-unified-adapter.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'rx-source-safe-'));
try{
 fs.mkdirSync(path.join(root,'src'));
 fs.writeFileSync(path.join(root,'src','good.js'),'debugger;\n');
 fs.symlinkSync('/etc/hosts',path.join(root,'src','escape.js'));
 const tasks=['src/good.js','../escape.js','.github/workflows/x.js','src/escape.js','src/missing.js'].map(target=>({target}));
 const loaded=collectSources({kind:'rx-ant-task-board',tasks},{root});
 assert.equal(loaded.loaded,1);
 assert.equal(loaded.sources['src/good.js'],'debugger;\n');
 assert.equal(loaded.skipped.length,4);
 assert.ok(loaded.skipped.some(x=>x.reason==='symlink_escape'));
 const reports=path.join(root,'reports');fs.mkdirSync(reports);
 fs.writeFileSync(path.join(reports,'rx-queen-ant-supervisor.json'),JSON.stringify({kind:'rx-queen-ant-supervisor',issues:[{source:'fast',action:'inspect_failed_test',target:'src/good.js',priority:'high'}]}));
 const review=reviewBibiReports({dir:reports,root,runId:'source-test',loadLocalSources:true});
 assert.equal(review.sourceLoad.loaded,1);
 assert.equal(review.summary.patchPreviews,1);
 assert.equal(review.productionModified,false);
 console.log('PASS RX safe source reader: allowlist, symlink containment, real report integration');
}finally{fs.rmSync(root,{recursive:true,force:true});}
