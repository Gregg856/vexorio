'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {collectSources}=require('../rx-source-reader.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'rx-source-isolated-'));
try{
 fs.mkdirSync(path.join(root,'src'));
 fs.writeFileSync(path.join(root,'src','good.js'),'debugger;\n');
 fs.symlinkSync('/etc/hosts',path.join(root,'src','escape.js'));
 const targets=['src/good.js','../escape.js','.github/workflows/x.js','src/escape.js','src/missing.js'];
 const result=collectSources({kind:'rx-ant-task-board',tasks:targets.map(target=>({target}))},{root});
 assert.equal(result.loaded,1);
 assert.equal(result.sources['src/good.js'],'debugger;\n');
 assert.equal(result.skipped.length,4);
 assert.ok(result.skipped.some(x=>x.reason==='symlink_escape'));
 assert.ok(result.skipped.some(x=>x.reason==='blocked_target'));
 assert.equal(result.readOnly,true);
 assert.throws(()=>collectSources({kind:'bad',tasks:[]},{root}),/Invalid RX board/);
 assert.throws(()=>collectSources({kind:'rx-ant-task-board',tasks:[]},{root,limit:21}),/Invalid RX limits/);
 console.log('PASS isolated RX source reader: path safety, symlinks, bounds, read-only');
}finally{fs.rmSync(root,{recursive:true,force:true});}
