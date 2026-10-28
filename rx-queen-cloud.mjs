import {exportQueenHistory,importQueenHistory} from './rx-queen-history-export.mjs';

// Client must be an authenticated, user-scoped Supabase client. Never use service_role here.
async function authenticatedId(client) {
 if(!client || typeof client.from!=='function' || typeof client.auth?.getUser!=='function') throw new TypeError('Supabase client required');
 const {data,error}=await client.auth.getUser();
 if(error || !data?.user?.id) throw new Error('Authentication required');
 return data.user.id;
}
export async function saveQueenHistory(client,history,label) {
 if(typeof label!=='string'||!label.trim()||label.length>100) throw new TypeError('Invalid label');
 const report=JSON.parse(exportQueenHistory(history));
 const owner_id=await authenticatedId(client);
 const {data,error}=await client.from('rx_queen_history').insert({owner_id,label:label.trim(),report}).select('id').single();
 if(error || !data?.id) throw new Error('Save failed');
 return data.id;
}
export async function loadQueenHistory(client,id) {
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new TypeError('Invalid id');
 const owner_id=await authenticatedId(client);
 const {data,error}=await client.from('rx_queen_history').select('report').eq('id',id).eq('owner_id',owner_id).single();
 if(error || !data?.report) throw new Error('History not accessible');
 return importQueenHistory(JSON.stringify(data.report));
}
