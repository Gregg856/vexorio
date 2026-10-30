'use strict';
const assert=require('node:assert/strict');
const {handleQueenCommand,COMMANDS}=require('../rx-queen-chat-router.cjs');
const report={kind:'rx-bibi-dashboard-summary',runId:'sample',signals:2,tasks:3,recurring:1,awaitingApproval:2,proposedPatches:4};
assert.equal(COMMANDS.length,6);
const research=handleQueenCommand('Znajdź informacje o komputerach kwantowych',report);
assert.equal(research.command,'research_info');
assert.equal(research.type,'proposal');
assert.equal(research.executed,0);
assert.equal(research.readOnly,true);
assert.match(research.message,/nie zostało uruchomione/);
for(const command of COMMANDS){
 const response=handleQueenCommand(command.words[0],report);
 assert.equal(response.type,'answer');
 assert.equal(response.command,command.id);
 assert.equal(response.readOnly,true);
}
assert.match(handleQueenCommand('testy',report).message,/nie zawiera wyniku GitHub Actions/);
assert.match(handleQueenCommand('poprawki',report).message,/bez zatwierdzenia/);
assert.equal(handleQueenCommand('usuń bazę',report).type,'help');
assert.throws(()=>handleQueenCommand('x'.repeat(501),report),/Invalid/);
console.log('PASS RX Queen read-only chat command router');
