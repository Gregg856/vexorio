'use strict';
const assert=require('node:assert/strict');
const {respond}=require('../guard-commands.js');
for(const word of ['Czesc','Cześć','Hej','Dzień dobry','Hello']){const r=respond(word);assert.equal(r.kind,'greeting',word);assert.match(r.message,/Strażak AI/);}
assert.equal(respond('Dzięki').kind,'conversation');
assert.equal(respond('plan: sprawdź portal').kind,'plan');
assert.equal(respond('pomoc').kind,'help');
assert.equal(respond('usuń bazę').kind,'unsupported');
console.log('PASS: Strażak greeting and conversation regressions');
