'use strict';
// RX AUTOPRACA 2.0 — staging-only DB queue adapter.
// Use only on a trusted server after independent admin authentication.
const SCHEMA = 'rx_private';
const TABLE = 'ant_task_queue';
const EVENTS = 'ant_task_events';
const VALID_TYPES = new Set(['repository_audit', 'ci_status', 'safe_test']);
const VALID_SOURCES = new Set(['queen_chat', 'tech_help', 'coordinator', 'admin']);
const VALID_WORKFLOW = 'rx-coordinator-cloud.yml';
function assertTask(task) {
  if (!task || typeof task !== 'object' || Array.isArray(task)) throw Error('Invalid task');
  if (!VALID_SOURCES.has(task.source) || !VALID_TYPES.has(task.task_type)) throw Error('Task not allowlisted');
  if (typeof task.title !== 'string' || !task.title.trim() || task.title.length > 240) throw Error('Invalid title');
  const payload = task.payload ?? {};
  if (!payload || Object.getPrototypeOf(payload) !== Object.prototype) throw Error('Invalid payload');
  const keys = Object.keys(payload);
  const allowed = task.task_type === 'repository_audit' ? ['scope'] : ['workflow'];
  if (keys.some(k => !allowed.includes(k))) throw Error('Unknown payload key');
  if (task.task_type === 'repository_audit') {
    if (payload.scope !== undefined && !['rx', 'workflows', 'admin_panel'].includes(payload.scope)) throw Error('Invalid audit scope');
  } else if (payload.workflow !== undefined && payload.workflow !== VALID_WORKFLOW) throw Error('Workflow not allowlisted');
  return {source:task.source, task_type:task.task_type, title:task.title.trim(), payload};
}
function queueClient(supabase) {
  if (!supabase || typeof supabase.schema !== 'function') throw Error('Trusted Supabase server client required');
  const db = supabase.schema(SCHEMA);
  return {
    async enqueue(task, requestedBy) {
      if (!requestedBy || typeof requestedBy !== 'string') throw Error('Authenticated requester required');
      const clean = assertTask(task);
      const {data,error} = await db.from(TABLE).insert({...clean,requested_by:requestedBy,status:'pending_approval'}).select('id,status,created_at').single();
      if (error) throw error;
      return data;
    },
    async list(limit=20) {
      if (!Number.isInteger(limit) || limit<1 || limit>50) throw Error('Invalid limit');
      const {data,error} = await db.from(TABLE).select('id,source,task_type,title,status,created_at,approved_at,finished_at').order('created_at',{ascending:false}).limit(limit);
      if (error) throw error;
      return data;
    },
    async approve(id, adminId) {
      if (!/^[0-9a-f-]{36}$/i.test(id) || !adminId) throw Error('Invalid approval');
      // Conditional update prevents two approvals from racing.
      const {data,error} = await db.from(TABLE).update({status:'approved',approved_by:adminId,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('status','pending_approval').select('id,status').maybeSingle();
      if (error) throw error;
      if (!data) throw Error('Task is not pending approval');
      return data;
    }
  };
}
module.exports={queueClient,assertTask,SCHEMA,TABLE,EVENTS};
