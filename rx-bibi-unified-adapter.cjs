'use strict';
// RX BIBI Unified Adapter: read-only diagnostic integration for existing main modules.
const fs = require('node:fs');
const path = require('node:path');
const {routeSignals} = require('./rx-medusa-engine.cjs');
const {updateHistory} = require('./rx-signal-memory.cjs');
const {buildBoard} = require('./rx-ant-task-board.cjs');
const {collectSources} = require('./rx-source-reader.cjs');
const {buildDeveloperReviewQueue} = require('./rx-queen-developer-queue.cjs');
const RUN_ID = /^[-a-zA-Z0-9_]{1,80}$/;
function readReport(dir, name, optional=false) {
  const filename = path.join(dir, name);
  let fd;
  try {
    fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > 2000000) throw Error('Invalid RX report size/type');
    return JSON.parse(fs.readFileSync(fd, 'utf8'));
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw error;
  } finally { if (fd !== undefined) fs.closeSync(fd); }
}
function reviewBibiReports({dir='rx-bibi-reports',runId='local',root=process.cwd(),loadLocalSources=false}={}) {
  if (typeof runId !== 'string' || !RUN_ID.test(runId)) throw Error('Invalid RX run ID');
  const supervisor = readReport(dir, 'rx-queen-ant-supervisor.json');
  const previousMemory = readReport(dir, 'rx-signal-memory.json', true);
  const medusa = routeSignals(supervisor);
  const memory = updateHistory(previousMemory, medusa, runId);
  const board = buildBoard(supervisor, {medusa, memory});
  const reviewQueue = {schema:1,kind:'rx-bibi-review-queue',runId,
    tasks:board.tasks.map(task=>({...task,status:'awaiting_review',approved:false,executed:false})),
    requiresApproval:true,productionModified:false};
  const developerQueue = loadLocalSources
    ? buildDeveloperReviewQueue({board,root})
    : {schema:1,kind:'rx-queen-developer-review-queue',reviews:[],
       sourceLoad:{loaded:0,skipped:[]},requiresApproval:true,
       productionModified:false,autoFixesApplied:0,automaticDeployment:false};
  const reviews = developerQueue.reviews;
  const sourceLoad = developerQueue.sourceLoad;
  return {schema:1,kind:'rx-bibi-unified-adapter',runId,medusa,memory,board,reviewQueue,
    sourceLoad,reviews,developerQueue,
    summary:{signals:medusa.signals.length,tasks:board.tasks.length,recurring:board.tasks.filter(t=>t.recurrent).length,analyzed:reviews.length},
    requiresApproval:true,productionModified:false,autoFixesApplied:0};
}
if (require.main === module) {
  const result = reviewBibiReports({runId:process.env.GITHUB_RUN_ID || 'local',loadLocalSources:true});
  console.log('RX BIBI Unified Adapter:', JSON.stringify(result.summary), '(read-only)');
}
module.exports = {reviewBibiReports};
