'use strict';
const assert=require('node:assert/strict');
const {renderQueenDashboard}=require('../rx-queen-dashboard-render.cjs');
const report={kind:'rx-bibi-dashboard-summary',runId:'ci_<script>alert(1)</script>',
 signals:2,tasks:3,recurring:1,reviewedFiles:2,proposedPatches:1,awaitingApproval:3,
 requiresApproval:true,productionModified:false,automaticDeployment:false};
const html=renderQueenDashboard(report);
assert.match(html,/RX Queen/);
assert.match(html,/Do zatwierdzenia/);
assert.match(html,/Content-Security-Policy/);
assert.ok(!html.includes('<script>'));
assert.ok(html.includes('&lt;script&gt;'));
assert.throws(()=>renderQueenDashboard({...report,tasks:-1}),/Invalid RX dashboard summary/);
assert.throws(()=>renderQueenDashboard({...report,productionModified:true}),/Invalid RX dashboard summary/);
console.log('PASS standalone RX Queen dashboard HTML renderer');
