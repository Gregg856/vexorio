// Explicit, administrator-only persistent notes via Supabase RLS.
// Commands: "Zapamiętaj: temat | treść" and "Przypomnij: temat".
export async function handleRXMemory(message,{base,apikey,auth,userId,fetcher=fetch}){
 const save=/^zapamiętaj:\s*(.{3,160}?)\s*\|\s*(.{1,4000})$/is.exec(message.trim());
 const read=/^przypomnij:\s*(.{3,160})$/is.exec(message.trim());
 if(!save&&!read)return null;
 const topic=(save?.[1]||read?.[1]).trim().toLocaleLowerCase('pl-PL');
 if(!topic||topic.length>160)return {ok:false,answer:'👑 Temat jest za długi.'};
 const endpoint=new URL('/rest/v1/rx_knowledge_memory',base);
 const headers={apikey,Authorization:auth,'Content-Type':'application/json'};
 if(save){
   const content=save[2].trim();
   if(!content)return {ok:false,answer:'👑 Wpisz treść do zapamiętania.'};
   endpoint.searchParams.set('on_conflict','owner_id,topic');
   const response=await fetcher(endpoint,{method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([{owner_id:userId,topic,content,updated_at:new Date().toISOString()}]),signal:AbortSignal.timeout(7000)});
   if(!response.ok)throw new Error('memory_save_failed');
   return {ok:true,answer:'🧠 Zapamiętałam temat: '+topic+'. Możesz zapytać „Przypomnij: '+topic+'”.',memoryAction:'saved'};
 }
 endpoint.searchParams.set('select','content,updated_at');
 endpoint.searchParams.set('owner_id','eq.'+userId);
 endpoint.searchParams.set('topic','eq.'+topic);
 endpoint.searchParams.set('limit','1');
 const response=await fetcher(endpoint,{headers,signal:AbortSignal.timeout(7000)});
 if(!response.ok)throw new Error('memory_read_failed');
 const rows=await response.json();
 const entry=Array.isArray(rows)?rows[0]:null;
 return {ok:true,answer:entry?'🧠 '+topic+': '+entry.content:'👑 Nie mam jeszcze zapisanej informacji o temacie: '+topic+'.',memoryAction:entry?'found':'missing'};
}
