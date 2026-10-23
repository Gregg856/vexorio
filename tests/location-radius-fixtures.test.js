// VEXORIO: isolated location-filter fixtures. Never publish these as real listings.
// Run: node tests/location-radius-fixtures.test.js
const assert = require('node:assert/strict');
const rad=Math.PI/180;
function distanceKm(a,b){const dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad;const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
const places={
 berlin:{lat:52.532,lon:13.384},potsdam:{lat:52.4,lon:13.067},
 erftstadt:{lat:50.814,lon:6.775},cologne:{lat:50.938,lon:6.96},
 warsaw:{lat:52.23,lon:21.012}
};
const fixtures=[
 {title:'TEST Berlin',country:'DE',postal_code:'10115',city:'Berlin',point:places.berlin},
 {title:'TEST Potsdam',country:'DE',city:'Potsdam',point:places.potsdam},
 {title:'TEST Erftstadt',country:'DE',postal_code:'50374',city:'Erftstadt',point:places.erftstadt},
 {title:'TEST Cologne',country:'DE',city:'Köln',point:places.cologne},
 {title:'TEST Warsaw',country:'PL',postal_code:'00-001',city:'Warszawa',point:places.warsaw}
];
function nearby(origin,country,radius){return fixtures.filter(x=>x.country===country&&distanceKm(origin,x.point)<=radius).map(x=>x.city)}
assert.deepEqual(nearby(places.berlin,'DE',10),['Berlin']);
assert.deepEqual(nearby(places.berlin,'DE',50),['Berlin','Potsdam']);
assert.deepEqual(nearby(places.erftstadt,'DE',30),['Erftstadt','Köln']);
assert.deepEqual(nearby(places.warsaw,'PL',50),['Warszawa']);
assert.deepEqual(nearby(places.berlin,'DE',5),['Berlin']);
assert.deepEqual(nearby(places.berlin,'DE',100).includes('Erftstadt'),false);
console.log('PASS: 6 isolated distance and country fixture checks; production geocoding/UI must be tested separately.');
