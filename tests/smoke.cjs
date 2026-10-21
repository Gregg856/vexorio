// VEXORIO static smoke tests: no dependencies, run with node tests/smoke.cjs
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
assert.ok(scripts.length>0,'Inline JavaScript exists');
for(const [index,source] of scripts.entries()){
 try{new Function(source)}catch(error){throw new Error('Invalid inline script '+(index+1)+': '+error.message)}
}
const required=[
 ['Owner listings panel','id="myListings"'],
 ['Dashboard stats','id="myListingsStats"'],
 ['Listing status filter','id="myListingsStatus"'],
 ['Pagination','id="myListingsPager"'],
 ['Manual refresh','id="myListingsRefresh"'],
 ['Safe deletion','Nie udało się usunąć wpisu:'],
 ['Safe status update','Nie udało się zmienić statusu:'],
 ['Listing view RPC','record_listing_view'],
 ['Account loading','async function loadMine()'],
 ['Public listings loading','async function loadListings()']
];
for(const [name,needle] of required)assert.ok(html.includes(needle),'Missing '+name);
for(const id of ['myListings','myListingsStats','myListingsStatus','myListingsPager','myListingsRefresh','myListingsReset','myListingsPageSize']) {
 const matches=html.match(new RegExp('id="'+id+'"','g'))||[];
 assert.equal(matches.length,1,'Duplicate/missing id '+id);
}
console.log('VEXORIO smoke tests passed: '+scripts.length+' inline scripts, '+required.length+' feature checks, 7 unique IDs.');
