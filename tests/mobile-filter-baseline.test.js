const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const checks=[
 ['Mobile filters collapsed CSS',html.includes('.top-filters:not(.mobile-filters-open) .tools#listingFilterTools{display:none!important}')],
 ['Mobile filters expanded CSS',html.includes('.top-filters.mobile-filters-open .tools#listingFilterTools{display:grid!important}')],
 ['Mobile toggle initially collapsed',/id="mobileFilterToggle" aria-expanded="false" aria-controls="listingFilterTools"/.test(html)],
 ['Toggle updates CSS state',html.includes("panel.classList.toggle('mobile-filters-open')")],
 ['Toggle updates accessibility state',html.includes("toggle.setAttribute('aria-expanded',String(open))")],
 ['Toggle restricted to mobile',html.includes("if(!window.matchMedia('(max-width:600px)').matches)return")],
 ['Country filter retained',html.includes('id="country"')],
 ['City filter retained',html.includes('id="cityFilter"')],
 ['Radius filter retained',html.includes('id="radiusFilter"')],
 ['Search action retained',html.includes('id="applyListingFilters"')],
 ['Approved seller profile unchanged',html.includes('object-fit:contain!important;object-position:center!important')]
];
for(const [label,pass] of checks){assert.ok(pass,label);console.log('PASS: '+label)}
console.log('PASS: approved mobile filter static baseline (not a browser test)');
