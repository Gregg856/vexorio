'use strict';
const assert=require('node:assert/strict');
const {respond}=require('../guard-commands.js');
assert.equal(respond('pomoc').kind,'help');
assert.equal(respond('STATUS').kind,'status');
assert.equal(respond('test').kind,'test');
assert.equal(respond('plan: popraw wyszukiwarkę').kind,'plan');
assert.equal(respond('plan: ').kind,'error');
assert.equal(respond('usuń bazę danych').kind,'unsupported');
assert.equal(respond(null).kind,'error');
assert.equal(respond('x'.repeat(2001)).kind,'error');
for(const command of ['pomoc','status','test','plan: zmiana','deploy produkcji']){
 const response=respond(command);
 assert.equal(typeof response.message,'string');
 assert.ok(!('command' in response));
 assert.ok(!('execute' in response));
}
console.log('PASS: Guard local chat commands remain inert, bounded and safe');
