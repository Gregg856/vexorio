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
const context={document:{getElementById:id=>elements[id]||null},localStorage:{getItem:()=>null},console};
assert.doesNotThrow(()=>vm.runInNewContext(code,context));
assert.ok(handlers.has('click'),'Missing Queen compare handler');
assert.doesNotThrow(()=>handlers.get('click')(),'Missing inputs must not crash panel');
assert.match(elements.rxQueenResult.textContent,/Brakuje pól/);
console.log('PASS RX QUEEN PANEL: missing fields show error without crashing');
