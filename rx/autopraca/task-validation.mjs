// RX AUTOPRACA 2.0 — dependency-free, side-effect-free task validation.
// Server-only use. Authorization and persistence are separate responsibilities.
export const RX_TASK_TYPES = Object.freeze(['repository_audit', 'ci_status', 'safe_test']);
export const RX_TASK_SOURCES = Object.freeze(['queen_chat', 'tech_help', 'coordinator', 'admin']);
export const RX_TASK_STATUSES = Object.freeze([
  'pending_approval', 'approved', 'running', 'succeeded', 'failed', 'cancelled'
]);

const allowedPayloadKeys = Object.freeze({
  repository_audit: ['scope'],
  ci_status: ['workflow'],
  safe_test: ['workflow']
});
const safeWorkflows = Object.freeze(['rx-coordinator-cloud.yml']);

export function validateAntTask(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Zadanie musi być obiektem.' };
  }
  const { source, task_type, title, payload = {} } = input;
  if (!RX_TASK_SOURCES.includes(source)) return { ok: false, error: 'Nieznane źródło zadania.' };
  if (!RX_TASK_TYPES.includes(task_type)) return { ok: false, error: 'Niedozwolony typ zadania.' };
  if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 240) {
    return { ok: false, error: 'Tytuł musi mieć od 1 do 240 znaków.' };
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Parametry muszą być obiektem.' };
  }
  if (Object.keys(payload).some(key => !allowedPayloadKeys[task_type].includes(key))) {
    return { ok: false, error: 'Niedozwolone parametry zadania.' };
  }
  if (task_type === 'repository_audit' && payload.scope !== undefined &&
      !['rx', 'workflows', 'admin_panel'].includes(payload.scope)) {
    return { ok: false, error: 'Nieznany zakres audytu.' };
  }
  if (task_type === 'ci_status' && payload.workflow !== undefined &&
      !safeWorkflows.includes(payload.workflow)) {
    return { ok: false, error: 'Nieznany workflow.' };
  }
  if (task_type === 'safe_test' && !safeWorkflows.includes(payload.workflow)) {
    return { ok: false, error: 'Test wymaga dozwolonego workflow.' };
  }
  return {
    ok: true,
    task: {
      source, task_type, title: title.trim(),
      payload: Object.fromEntries(Object.entries(payload))
    }
  };
}

export function canApproveAntTask(task, actorId) {
  return Boolean(task && task.status === 'pending_approval' &&
    typeof actorId === 'string' && actorId.length > 0);
}

export function canStartAntTask(task) {
  return Boolean(task && task.status === 'approved' &&
    typeof task.approved_by === 'string' && task.approved_by.length > 0 &&
    typeof task.approved_at === 'string' && !Number.isNaN(Date.parse(task.approved_at)));
}
