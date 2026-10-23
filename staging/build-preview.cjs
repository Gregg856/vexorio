#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const stagingUrl='https://owkjdlpawczrnwyszduj.supabase.co';
const stagingKey='sb_publishable_ok5FaQ2s3HqMKZNQoBisRQ_we9Tiszs';
const urlPattern=/const SUPABASE_URL='https:\/\/[^']+\.supabase\.co';/;
const keyPattern=/const SUPABASE_PUBLISHABLE_KEY='sb_publishable_[^']+';/;
if(!urlPattern.test(source)||!keyPattern.test(source))throw new Error('Missing Supabase config: refusing to generate preview');
let output=source.replace(urlPattern,"const SUPABASE_URL='"+stagingUrl+"';").replace(keyPattern,"const SUPABASE_PUBLISHABLE_KEY='"+stagingKey+"';");
// Staging schema has moderation_status but no legacy status/view_count columns.
const productionSelect="Images,status,view_count').order('created_at'";
const stagingSelect="Images,moderation_status').order('created_at'";
if(!output.includes(productionSelect))throw new Error('Expected listings query missing: refusing unsafe preview');
output=output.replace(productionSelect,stagingSelect);
if(output.includes('https://lfytoxcnutduahshbsko.supabase.co')||!output.includes(stagingUrl))throw new Error('Production backend reference found in staging preview');
fs.writeFileSync(path.join(__dirname,'staging-preview.html'),output);
console.log('Generated staging/staging-preview.html (STAGING Supabase only). Do not deploy to production.');
