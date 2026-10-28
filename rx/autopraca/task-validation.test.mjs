import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAntTask, canApproveAntTask, canStartAntTask } from './task-validation.mjs';

const base = { source: 'queen_chat', task_type: 'ci_status', title: 'Sprawdź CI', payload: {} };
test('accepts a read-only status task', () => {
  const result = validateAntTask(base);
  assert.equal(result.ok, true);
  assert.equal(result.task.title, 'Sprawdź CI');
});
test('rejects arbitrary command execution', () => {
  assert.equal(validateAntTask({ ...base, payload: { command: 'rm -rf /' } }).ok, false);
  assert.equal(validateAntTask({ ...base, task_type: 'shell' }).ok, false);
});
test('rejects unknown workflow and arbitrary test payload', () => {
  assert.equal(validateAntTask({ ...base, task_type: 'safe_test', payload: { workflow: 'deploy-production.yml' } }).ok, false);
  assert.equal(validateAntTask({ ...base, task_type: 'safe_test', payload: { workflow: 'rx-coordinator-cloud.yml' } }).ok, true);
});
test('rejects malformed title and parameters', () => {
  assert.equal(validateAntTask({ ...base, title: '' }).ok, false);
  assert.equal(validateAntTask({ ...base, payload: [] }).ok, false);
});
test('requires explicit approval before starting', () => {
  assert.equal(canApproveAntTask({ status: 'pending_approval' }, 'admin-id'), true);
  assert.equal(canApproveAntTask({ status: 'approved' }, 'admin-id'), false);
  assert.equal(canStartAntTask({ status: 'approved' }), false);
  assert.equal(canStartAntTask({ status: 'approved', approved_by: 'admin-id', approved_at: '2026-10-28T10:00:00Z' }), true);
});

test('rejects hidden execution metadata and unexpected top-level fields', () => {
  assert.equal(validateAntTask({ ...base, approved_by: 'someone' }).ok, false);
  assert.equal(validateAntTask({ ...base, payload: { workflow: 'rx-coordinator-cloud.yml', args: ['--deploy'] } }).ok, false);
});
