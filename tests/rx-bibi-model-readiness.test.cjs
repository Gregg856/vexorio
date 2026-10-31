'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
test('model readiness: deployment cannot silently enable an unconfigured inference service',()=>{
 const deploy=fs.readFileSync(path.join(root,'.github/workflows/deploy.yml'),'utf8');
 const bridge=fs.readFileSync(path.join(root,'rx-bibi-model-bridge.mjs'),'utf8');
 assert.match(deploy,/workflow_dispatch:/);
 assert.match(deploy,/\[ai\]/);
 assert.match(bridge,/RX_BIBI_MODEL_ENABLED/);
 assert.match(bridge,/RX_BIBI_MODEL_SERVICE/);
 // If the service is added later, require a new explicit integration review.
 assert.doesNotMatch(deploy,/RX_BIBI_MODEL_SERVICE/);
 assert.doesNotMatch(deploy,/RX_BIBI_MODEL_ENABLED\s*=/);
});
