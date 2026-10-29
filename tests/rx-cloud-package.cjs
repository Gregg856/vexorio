'use strict';
// RX CLOUD 4.0: offline release gate. No deployment or service start.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const required=['rx-cloud-server.cjs','worker.js','index.html','manifest.webmanifest','rx-admin-prototype.html','rx-task-catalog.cjs','rx-math-core.cjs','deploy/rxcloud-install.sh','deploy/rxcloud.service','deploy/rxcloud.env.example','deploy/Caddyfile.rxcloud.example','deploy/RX-CLOUD-MIGRATION.md'];
for(const file of required)assert(fs.statSync(path.join(root,file)).isFile(),'Missing release file: '+file);
const installer=read('deploy/rxcloud-install.sh');
assert(installer.includes('Existing installation detected. Refusing to overwrite.'),'Must refuse overwrites');
assert(installer.includes('No service started, no DNS modified, no production migration.'),'Must remain staging-only');
assert(!/systemctl\s+(?:start|enable|restart)\b/.test(installer),'Installer must not activate services');
assert(!/wrangler\s+deploy|supabase\s+db\s+push/.test(installer),'Installer must not deploy production');
const unit=read('deploy/rxcloud.service');
assert(/User=rxcloud/.test(unit),'Service must not run as root');
assert(/Restart=on-failure/.test(unit),'Service restart policy required');
const proxy=read('deploy/Caddyfile.rxcloud.example');
assert(/reverse_proxy 127\.0\.0\.1:8787/.test(proxy),'Proxy must use loopback');
const server=read('rx-cloud-server.cjs');
assert(server.includes('/__rxcloud/health'),'Health endpoint missing');
for(const script of ['deploy/rxcloud-install.sh','deploy/rxcloud-preflight.sh']){
 const result=cp.spawnSync('bash',['-n',path.join(root,script)],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||script);
}
const dry=cp.spawnSync('bash',[path.join(root,'deploy/rxcloud-install.sh'),'--dry-run'],{cwd:root,encoding:'utf8'});
assert.equal(dry.status,0,dry.stderr);
assert.match(dry.stdout,/Would NOT start services/);
console.log('RX CLOUD 4.0 offline release gate: PASS (files, service, proxy, installer safety)');
