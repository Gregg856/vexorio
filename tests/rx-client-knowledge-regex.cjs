'use strict';
// Guard the existing client's natural-knowledge routing against accidental double escaping.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../worker.js'),'utf8');
const match=source.match(/const clientResearch=([^\n]+);/);
assert.ok(match,'Client knowledge routing exists');
const expressions=match[1];
assert.ok(expressions.includes('\\s+'),'Whitespace matching must be present');
assert.ok(!expressions.includes('\\\\s+'),'Regex must not match a literal backslash');
const guard=source.match(/const rxInternalTopic=([^\n]+);/);
assert.ok(guard,'Internal-topic guard exists');
assert.ok(guard[1].includes('\\b'),'Word boundary required');
assert.ok(!guard[1].includes('\\\\b'),'Word boundary must not be double escaped');
console.log('RX client knowledge regex regression OK');
