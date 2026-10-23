const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const queue=fs.readFileSync(path.join(__dirname,'../staging/moderation-queue.js'),'utf8');
const triage=fs.readFileSync(path.join(__dirname,'../staging/moderation-triage.js'),'utf8');
assert.ok(queue.includes('window.VexorioModerationTriage'));
assert.ok(queue.includes('items.sort((a,b)'));
assert.ok(queue.includes('b._risk?.score'));
assert.ok(queue.includes('Sygnały: '));
assert.ok(queue.includes('is_vexorio_admin'));
assert.ok(queue.includes('owkjdlpawczrnwyszduj'));
assert.ok(!queue.includes('window.sb.rpc'));
assert.ok(triage.includes('requiresHumanReview'));
console.log('PASS: staging risk-prioritized moderation queue structure');

assert.ok(queue.includes('result===false'),'Server refusal must be handled');
assert.ok(queue.includes('catch(err){e=err}'),'Network failure must be handled');
console.log('PASS: moderation decision failure handling');

assert.ok(queue.includes('function hasPhoto(item)'));
assert.ok(queue.includes('photoConfirmed&&!photoConfirmed.checked'));
assert.ok(queue.includes('ze zdjęciami: '));
console.log('PASS: photo review gating and count checks');

assert.ok(queue.includes("vexorio_admin_pending_listings_v2"),'Queue must use image-aware server RPC');
assert.ok(queue.includes("'listing_images'"),'Image payload must be checked');
assert.ok(queue.includes('Object.keys(item[key]).length>0'),'JSON image objects must count');
console.log('PASS: server image metadata is required for moderation decisions');
