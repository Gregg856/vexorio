'use strict';
const assert=require('node:assert/strict');
const {similarity,checkDataset}=require('../guard/dataset-check.cjs');
assert.equal(similarity('Sprzedam rower miejski','rower miejski sprzedam'),1);
assert.equal(similarity('rower osobisty','hasło płatność'),0);
const training=[
 {label:'safe',text:'Sprzedam rower miejski odbiór osobisty'},
 {label:'suspicious',text:'Wyślij hasło i kod weryfikacyjny'}
];
const testing=[
 {label:'safe',text:'Odbiór osobisty sprzedam miejski rower'},
 {label:'suspicious',text:'Nowa oferta inwestycyjna'}
];
const result=checkDataset(training,testing);
assert.equal(result.clean,false);
assert.equal(result.overlaps.length,1);
assert.equal(result.overlaps[0].testIndex,0);
assert.equal(result.overlaps[0].trainIndex,0);
assert.equal(checkDataset(training,[{text:'Inny zupełnie niezwiązany opis'}]).clean,true);
assert.throws(()=>checkDataset(training,testing,{threshold:2}));
console.log('PASS: Guard detects near-duplicate train/test examples before quality claims');
