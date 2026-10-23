// Protect the user-approved public seller profile layout from regressions.
// Run from repository root: node tests/public-profile-regression.test.js
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const checks=[
 ['Public profile dialog exists',html.includes('id="sellerProfileDialog"')],
 ['Public profile is accessible without login gate',/async function openSellerProfile\(ownerId\)\{[\s\S]*?dialog\.showModal\(\);/.test(html)],
 ['Seller name from public profile',html.includes("select('display_name,city,country,bio,avatar_url')")],
 ['Seller avatar is displayed',html.includes('avatar.replaceChildren(image)')],
 ['Profile has listing tabs',html.includes("className='seller-profile-tabs'")],
 ['Profile has offer cards',html.includes("btn.className='btn seller-profile-listing'")],
 ['Full screen mobile profile',html.includes('height:100dvh!important;max-height:100dvh!important')],
 ['Mobile profile has native scrolling',html.includes('overflow-y:auto!important;overscroll-behavior-y:contain!important')],
 ['Full thumbnail without crop',html.includes('object-fit:contain!important;object-position:center!important')],
 ['Listing detail still has seller profile action',html.includes('openSellerProfile(x.owner_id)')],
 ['Other seller listings absent from detail',!html.includes('Inne ogłoszenia tego użytkownika')],
 ['Related listings absent from detail',!html.includes('const candidates=allListings.filter(item=>String(item.id)')]
];
for(const [name,passed] of checks){assert.ok(passed,name);console.log('PASS: '+name)}
console.log('PASS: approved public profile static regression guards (not a browser test)');
