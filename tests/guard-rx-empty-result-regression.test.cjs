'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('guard-chat.js', 'utf8');
const match = source.match(/const message=typeof result\?\.message==='string'\?result\.message:'';\s*const unavailable=id==='changes-report'&&message\.includes\('nie jest jeszcze dostępny'\);\s*outcomes\.push\(id\+': '\+\(unavailable\?'BRAK RAPORTU':!message\?'BRAK WYNIKU':'OK'\)\);/);
assert.ok(match, 'Missing safe RX result handling');
const classify = new Function('result','id','outcomes', match[0]);
for(const [result,id,expected] of [
 [undefined,'task-analyzer','task-analyzer: BRAK WYNIKU'],
 [null,'code-audit','code-audit: BRAK WYNIKU'],
 [{},'task-analyzer','task-analyzer: BRAK WYNIKU'],
 [{message:42},'code-audit','code-audit: BRAK WYNIKU'],
 [{message:'nie jest jeszcze dostępny'},'changes-report','changes-report: BRAK RAPORTU'],
 [{message:'Gotowe'},'task-analyzer','task-analyzer: OK']
]){
 const outcomes=[];
 classify(result,id,outcomes);
 assert.deepEqual(outcomes,[expected]);
}
console.log('PASS: RX missing, malformed and valid plugin results');
