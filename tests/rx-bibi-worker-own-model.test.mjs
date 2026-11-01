import assert from 'node:assert/strict';
import {ownWorkerAnswer} from '../rx-bibi-worker-own-model.mjs';
const data=JSON.stringify([{input:'witaj bibi',answer:'Witaj w RX!'},{input:'status serwera',answer:'Status lokalny.'}]);
assert.equal(ownWorkerAnswer('WITAJ BIBI',data),'Witaj w RX!');
assert.equal(ownWorkerAnswer('status serwera',data),'Status lokalny.');
assert.equal(ownWorkerAnswer('nieznane',data),null);
assert.equal(ownWorkerAnswer('cokolwiek','invalid'),null);
assert.equal(ownWorkerAnswer('witaj',JSON.stringify([{input:'witaj',answer:'A'},{input:'WITAJ',answer:'B'}])),null);
console.log('RX own Worker model tests: PASS');
