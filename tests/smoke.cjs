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

// Guard against regressions in core listing workflows.
const flows=[
 ['Owner-scoped delete',/\.delete\(\)\.eq\('id',x\.id\)\.eq\('owner_id',session\.user\.id\)/],
 ['Owner-scoped status update',/\.update\(\{status:next\}\)\.eq\('id',x\.id\)\.eq\('owner_id',session\.user\.id\)/],
 ['Public closed-listing filter',/rows\.filter\(x=>x\.status!=='closed'\)/],
 ['Owned listing status selection',/created_at,status,view_count'\)\.eq\('owner_id'/],
 ['Paginated owner listings',/Math\.ceil\(matches\.length\/size\)/],
 ['Latest request wins',/request!==myListingsRequest/],
 ['Loading error recovery',/box\.removeAttribute\('aria-busy'\)/],
 ['Listing view deduplication',/viewedListingsThisSession\.has\(String\(x\.id\)\)/],
 ['Refresh failure messaging',/Błąd odświeżania:/],
 ['Status operation failure messaging',/Nie udało się zmienić statusu:/]
];
for(const [name,pattern] of flows)assert.match(html,pattern,'Workflow regression: '+name);
// Protect mobile city suggestions and radius-filter fixes from accidental regressions.
const searchGuards=[
 ['City dialog input',/id="vexCityDialogInput"[^>]*enterkeyhint="search"/],
 ['City suggestion dropdown',/id="vexorioCitySuggestions"/],
 ['City prefix matching',/searchText\(p\.name\)\.startsWith\(needle\)/],
 ['City request race guard',/request!==citySuggestRequest/],
 ['Radius pending scope',/originReady&&radiusCandidatePending/],
 ['Radius empty-state scope',/radiusActive&&radiusCandidateCount>0&&!radiusLoading/],
 ['Radius alternatives',/\[10,25,50,100,200,500\]\.filter\(km=>km>radiusKm\)\.slice\(0,3\)/],
 ['Warsaw radius geocoding alias',/searchText\(city\)==='warszawa'\?'Warsaw':city/],
 ['Airport suggestions excluded',/!\/\(airport\|lotnisko\|flughafen\|aéroport\)\/i\.test\(p\.name\)/],
 ['Ambiguous city names rejected',/found=distinct\.size===1\?matches\[0\]:null/],
 ['Temporary geocoding errors retryable',/geoRetryAfter\.set\(key,Date\.now\(\)\+30000\)/],
 ['Failed lookup not permanently cached',/catch\(e\)\{geoRetryAfter\.set\(key,/],
 ['Country change clears city and radius',/\$\('country'\)\.addEventListener\('change',[\s\S]{0,350}\$\('radiusFilter'\)\.value='0'/],
 ['City selection refreshes listings',/function selectCity\(name,label,selectedCountry\)[\s\S]{0,950}render\(\)/],
 ['Radius uses postal fallback',/function listingGeoLocation\(item\)/],
 ['Radius loading respects listing errors',/if\(!listingLoadError&&!invalidPriceRange&&radiusLoading\)/],
 ['Missing radius location respects listing errors',/else if\(!listingLoadError&&!invalidPriceRange&&radiusNotFound\)/],
 ['Radius empty state excludes loading',/radiusCandidateCount>0&&!radiusLoading&&!radiusNotFound/],
 ['City fallback remains loading',/geoPending\.has\(geoKey\(item\.city,item\.country\)\)/]

];
for(const [name,pattern] of searchGuards)assert.match(html,pattern,'Search regression: '+name);
// Regression locks for the mobile listing-card issues reported on 24 October 2026.
const mobileCardGuards=[
 ['Mobile cards keep natural height',/#cards \.card\{[^}]*height:auto!important/],
 ['Mobile grid does not stretch cards',/#cards\{align-items:start!important\}/],
 ['Listing price does not create empty vertical space',/#cards \.card \.price\{margin-top:0!important/],
 ['Mobile photo uses approved cover crop',/#cards \.card \.listing-photo\{[^}]*object-fit:cover!important/],
 ['Mobile photo keeps approved vertical framing',/#cards \.card \.listing-photo\{[^}]*object-position:center 25%!important/],
 ['Report actions remain available',/photoReport\.textContent=/],
 ['Inbox sorts by most recent message',/const lastA=previewByConversation\.get\(String\(a\.id\)\)\?\.created_at/],
 ['Unread badges are updated',/function updateUnreadBadges\(count\)/]
];
for(const [name,pattern] of mobileCardGuards)assert.match(html,pattern,'Mobile/inbox regression: '+name);
const htmlIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const duplicates=htmlIds.filter((id,index)=>htmlIds.indexOf(id)!==index);
assert.deepEqual([...new Set(duplicates)],[],'Duplicate HTML IDs');
console.log('VEXORIO smoke tests passed: '+scripts.length+' inline scripts, '+required.length+' feature checks, 7 core IDs, 10 workflow guards and all unique HTML IDs.');
