'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const test=require('node:test');
const html=fs.readFileSync('rx-admin-prototype.html','utf8');
const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
test('RX ADMIN has valid inline JavaScript',()=>{assert.ok(inlineScripts.length);for(const s of inlineScripts)new vm.Script(s)});
test('RX app is hidden by default and CSS cannot override hidden',()=>{assert.match(html,/<div class="layout" id="rxApp" hidden>/);assert.match(html,/\[hidden\]\s*\{\s*display\s*:\s*none\s*!important/);assert.match(html,/gate\.hidden=true;app\.hidden=false/)});
test('admin check requires verified user and admin RPC',()=>{assert.match(html,/rxClient\.auth\.getUser\(\)/);assert.match(html,/rxClient\.rpc\('is_vexorio_admin'\)/);assert.match(html,/allowed!==true/);assert.match(html,/confirmed\?\.id!==user\.id/)});
test('all nine categories and chat form exist',()=>{for(const label of ['Czat RX','Królowa','Mrówki','RX AI','Komputer i chmura','COSMOS','MEDUSA','Raporty','Ustawienia'])assert.ok(html.includes(label),label);for(const id of ['menu','sub','messages','form','input','rxGate'])assert.match(html,new RegExp('id="'+id+'"'))});
test('report routing is read-only and bounded',()=>{assert.match(html,/Object\.freeze\(\{/);assert.match(html,/raw\.githubusercontent\.com/);assert.match(html,/cache:'no-store'/);assert.doesNotMatch(html,/eval\s*\(/);assert.doesNotMatch(html,/new Function\s*\(/)});
test('mobile composer has keyboard and safe-area protections',()=>{assert.match(html,/font-size:16px/);assert.match(html,/env\(safe-area-inset-bottom\)/);assert.match(html,/@media\(max-width:720px\)/)});

test('RX CLOUD probe is present in primary RX Admin and cannot leak server token',()=>{
 assert.match(html,/id="rxAdminCloudCheck"/);
 assert.match(html,/fetch\('\/__rxcloud\/health'/);
 assert.match(html,/data\?\.service==='rx-cloud-2'/);
 assert.doesNotMatch(html,/RX_QUEEN_LOCAL_TOKEN/);
 assert.doesNotMatch(html,/__rxcloud\/queen\/status/);
});
test('RX Admin preserves Queen workbench, approval gates and no arbitrary code execution',()=>{
 for(const id of ['rxWorkbench','rxWorkQueue','rxWorkRunApproved','rxRunApprovedTests','rxCheckTests'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/is_vexorio_admin/);
 assert.doesNotMatch(html,/\beval\s*\(/);
});
