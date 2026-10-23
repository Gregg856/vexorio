'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const generator=fs.readFileSync(path.join(root,'staging/build-preview.cjs'),'utf8');
assert.match(generator,/stagingUrl=/);
assert.match(generator,/productionSelect/);
cp.execFileSync(process.execPath,[path.join(root,'staging/build-preview.cjs')],{cwd:root});
const preview=fs.readFileSync(path.join(root,'staging/staging-preview.html'),'utf8');
const checks=[
  ['isolated staging backend',preview.includes('https://owkjdlpawczrnwyszduj.supabase.co')],
  ['no production backend',!preview.includes('https://lfytoxcnutduahshbsko.supabase.co')],
  ['no production publishable key',!preview.includes((source.match(/const SUPABASE_PUBLISHABLE_KEY='([^']+)'/)||[])[1])],
  ['moderation column queried',preview.includes("Images,moderation_status').order('created_at'")],
  ['legacy query removed',!preview.includes("Images,status,view_count').order('created_at'")],
  ['listing posting control',preview.includes('newPhonePublic')],
  ['photo upload support',/type=["']file["']/.test(preview)],
  ['login dialog',preview.includes('authDialog')],
  ['search control',preview.includes('applyListingFilters')],
  ['city picker',preview.includes('vexCityDialogInput')],
  ['staging language translation',preview.includes('Gespeicherte Suchen anzeigen')],
];
for(const [name,ok] of checks)assert.ok(ok,'STAGING preview check failed: '+name);
assert.ok(!/sb_secret_[A-Za-z0-9_-]+/.test(preview),'Secret API key must never appear in browser HTML');
console.log('PASS: '+checks.length+' staging preview isolation and UI checks');
