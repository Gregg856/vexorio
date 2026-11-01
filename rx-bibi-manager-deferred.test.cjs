'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'rx-bibi-manager.html'),'utf8');
test('BIBI existing manager contains local deferred storage and explicit cloud limitation',()=>{
 assert.match(html,/rx-bibi-deferred-v1/);
 assert.match(html,/const deferRxTask=/);
 assert.match(html,/const resumeRxTask=/);
 assert.match(html,/Nie zapisano w RX CLOUD/);
});
test('defer and resume commands are handled before generic task commands',()=>{
 const defer=html.indexOf('const deferMatch=message.match(');
 const resume=html.indexOf('const task=resumeRxTask();');
 const generic=html.indexOf('const taskMatch=message.match(');
 assert.ok(defer>0&&resume>defer&&generic>resume);
});
test('deferred topics persist locally and cannot claim cloud sync',()=>{
 assert.match(html,/localStorage\.setItem\(rxDeferredKey/);
 assert.match(html,/localStorage\.getItem\(rxDeferredKey/);
 assert.match(html,/task\.status='active'/);
});
