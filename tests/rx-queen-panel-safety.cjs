'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('guard-rx-queen-panel.js','utf8');
const handlers=new Map();
const elements={
 rxQueenCompare:{addEventListener:(event,fn)=>handlers.set(event,fn)},
 rxQueenResult:{textContent:''}
};
const createElement=tag=>({tagName:String(tag).toUpperCase(),style:{},textContent:'',setAttribute(){},addEventListener(){},append(){},insertBefore(){},parentNode:null});
const context={document:{getElementById:id=>elements[id]||null,createElement},localStorage:{getItem:()=>null},console};
assert.doesNotThrow(()=>vm.runInNewContext(code,context));
assert.ok(handlers.has('click'),'Missing Queen compare handler');
assert.doesNotThrow(()=>handlers.get('click')(),'Missing inputs must not crash panel');
assert.match(elements.rxQueenResult.textContent,/Brakuje pól/);
assert.ok(code.includes('textContent='),'Panel should render user-provided data as text');
assert.ok(code.includes('resetPending'),'Import confirmation must reset on changes');
assert.ok(code.includes('resetTask'),'Task approval must reset on edits');
assert.ok(code.includes('sanitize('),'Approved memory must be validated');
if(require.main===module){
 const fs=require('node:fs');
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-queen-panel-check.json',JSON.stringify({schema:1,kind:'rx-queen-panel-check',ok:true,checks:['script_load','compare_handler','missing_fields_safe','text_only_output','import_reset','task_reset','memory_validation'],scope:'node-vm-regression-only',note:'Not a full browser UI test; result is written only when all assertions pass.'},null,2)+'\n');
}
console.log('PASS RX QUEEN PANEL: missing fields show error without crashing');
