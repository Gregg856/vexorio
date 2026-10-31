'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');

// Static integration contract: guards against disconnecting the existing admin chat.
// This does not replace a real authenticated HTTP/browser end-to-end test.
test('RX NAUKA 4.3 existing BIBI admin memory contract',async()=>{
 const root=path.resolve(__dirname,'..');
 const [worker,panel]=await Promise.all([
  fs.readFile(path.join(root,'worker.js'),'utf8'),
  fs.readFile(path.join(root,'rx-bibi-manager.html'),'utf8')
 ]);
 assert.match(worker,/url\.pathname==='\/api\/rx\/admin\/brain-memory'/);
 assert.match(panel,/fetch\('\/api\/rx\/admin\/brain-memory'/);
 assert.match(worker,/data\.trainedModel!==false/);
 assert.match(worker,/data\.autoExecuted!==0/);
 assert.match(worker,/seenKeys\.has\(item\.key\)/);
 assert.match(worker,/requiresApproval:true/);
 assert.match(panel,/Za mało prób/);
 assert.match(panel,/więcej niepowodzeń niż sukcesów/);
 assert.match(panel,/Niczego nie wykonałam/);
});
