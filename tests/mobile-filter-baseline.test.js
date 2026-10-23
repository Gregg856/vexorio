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

// Regression: desktop category/subcategory selector must retain translated labels.
const translations=html.match(/const quickSubcategoryTranslations=\{([\s\S]*?)\n\};/);
assert.ok(translations,'Desktop subcategory translation dictionary exists');
for(const [category,german] of [['Praca','Festanstellung'],['Elektronika','Computer'],['Firma i przemysł','Maschinen']]){
 assert.ok(translations[1].includes("'"+category+"':"),'Translation category: '+category);
 assert.ok(translations[1].includes("'"+german+"'"),'German subcategory: '+german);
}
assert.ok(html.includes("language==='de'?'Alle Unterkategorien'"),'German default subcategory label');
assert.ok(html.includes('label:quickSubcategoryLabel(category,name)'),'Translated labels used in desktop selector');
assert.ok(html.includes('opt.value=item.value;opt.textContent=item.label'),'Underlying filter values are preserved');
console.log('PASS: desktop subcategory translations and filter values');
