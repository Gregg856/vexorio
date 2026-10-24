// Static regression guard for the approved VEXORIO mobile search UI.
// Run: node tests/search-location-regression.test.js
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
function check(label,condition){assert.ok(condition,label);console.log('PASS: '+label)}
check('Country selector',html.includes('id="country"'));
check('Readonly mobile city picker',/id="cityFilter"[^>]*readonly/.test(html));
check('Mobile city dialog',html.includes('id="vexCityDialog"'));
check('Postal lookup provider',html.includes('api.zippopotam.us/'));
check('Postal city is displayed in the city field',/field\.value=label&&label!==name\?String\(label\)/.test(html));
check('Postal code retained separately for distance calculations',html.includes('field.dataset.postalValue='));
check('Radius filtering reads postal code instead of display label',html.includes('function locationFilterValue()')&&/function render\(\)[\s\S]{0,250}locationFilterValue\(\)/.test(html));
check('Radius selector',html.includes('id="radiusFilter"'));
check('Radius options', ['value="0"','value="10"','value="25"','value="50"','value="100"'].every(x=>html.includes(x)));
check('No extra city label created',!html.includes("createElement('div');hint.id='vexSelectedPostalCity'"));
check('No pin prefix in radius default',html.includes('<option value="0">Bez ograniczenia odległości</option>'));
check('City suggestions retain country-specific keys',html.includes("searchText(name)+(country==='all'?'|'+p.country_code:'')"));
check('City suggestion uses country from exact entry',html.includes('const code=cityCountries.get(key)'));
check('All-country suggestions include preferred cities',html.includes("country==='all'?[...new Set(Object.values(priorityCities).flat())]"));
check('English singular listing grammar',html.includes("filtered.length===1?' listing'"));
check('Polish singular listing grammar',html.includes("filtered.length===1?' ogłoszenie'"));
check('Suggested city selection passes the country explicitly',html.includes("selectCity(name,undefined,country==='all'?code:undefined)"));
check('German singular listing grammar',html.includes("filtered.length===1?' Anzeige'"));
console.log('PASS: mobile search static regression guards. Live browser and geocoding API still require end-to-end checks.');
