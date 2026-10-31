'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const worker=fs.readFileSync(require('node:path').join(__dirname,'../worker.js'),'utf8');
assert.ok(worker.includes('getRXKnowledgeFollowupPrior(message,history)'),'Client uses tested public knowledge helper');
assert.ok(worker.includes('searchWorldKnowledge(knowledgeFollowupPrior)'),'Client reuses sourced knowledge');
assert.ok(worker.includes("engine:'rx-bibi-client-world-knowledge-followup'"),'Sourced followup remains read-only');
assert.ok(worker.includes('adminToolsAvailable:false'),'No admin tools');
console.log('RX sourced followup routing OK');
