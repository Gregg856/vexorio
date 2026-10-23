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
// Preview-only UI improvements; keep production HTML unchanged.
const previewUiFixes = [
  ["function setLang(v){language=v;", "function setLang(v){language=v;const searchButton=document.getElementById('applyListingFilters');if(searchButton)searchButton.textContent=v==='de'?'🔎 Anzeigen suchen':v==='en'?'🔎 Search listings':'🔎 Szukaj ogłoszeń';"],
  ['id="vexCityDialogClose" aria-label="Zamknij wybór miasta"', 'id="vexCityDialogClose" aria-label="Zamknij wybór miasta"'],
];
for(const [before,after] of previewUiFixes){if(!output.includes(before))throw Error('Missing preview UI marker');output=output.replace(before,after)}
// Keep a clear, readable hint for users choosing a radius without a city.
// Localize city dialog labels and make the search action accessible on small screens.
const languageUi = "const cityClose=document.getElementById('vexCityDialogClose');if(cityClose)cityClose.setAttribute('aria-label',v==='de'?'Stadtauswahl schließen':v==='en'?'Close city picker':'Zamknij wybór miasta');const citySearch=document.getElementById('vexCityDialogInput');if(citySearch){citySearch.placeholder=v==='de'?'Stadt oder Postleitzahl':v==='en'?'City or postal code':'Wpisz miasto lub kod pocztowy';citySearch.setAttribute('aria-label',citySearch.placeholder)}";
const langMarker="const searchButton=document.getElementById('applyListingFilters');";
if(!output.includes(langMarker))throw Error('Missing language UI marker');
output=output.replace(langMarker,languageUi+langMarker);
output=output.replace('</style>', '#radiusInfo:not(:empty){display:block;padding:9px 12px;border:1px solid #35677b;border-radius:10px;line-height:1.4;margin-top:5px} </style>');
if(output.includes('https://lfytoxcnutduahshbsko.supabase.co')||!output.includes(stagingUrl))throw new Error('Production backend reference found in staging preview');
fs.writeFileSync(path.join(__dirname,'staging-preview.html'),output);
console.log('Generated staging/staging-preview.html (STAGING Supabase only). Do not deploy to production.');
