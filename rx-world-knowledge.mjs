// RX WIEDZA ŚWIATA 1.0: on-demand, attributed open encyclopedia lookup.
// No bulk Wikipedia copy, no credentials, no paid model.
const CACHE=new Map();
const MAX_CACHE_ENTRIES=100;
const CACHE_TTL_MS=60*60*1000;
export async function searchWorldKnowledge(question,{fetcher=fetch}={}){
 if(typeof question!=='string'||question.length>300||!question.trim())return null;
 const query=question.trim().replace(/^(co to jest|kim jest|kto to|co oznacza|opowiedz o|powiedz mi o|gdzie leży|gdzie jest|czym jest|wyjaśnij mi|wyjasnij mi|wyjaśnij|wyjasnij|chciałbym się dowiedzieć(?: o)?|chcialbym sie dowiedziec(?: o)?|chciałabym się dowiedzieć(?: o)?|chcialabym sie dowiedziec(?: o)?|znajdź informacje(?: o)?|znajdz informacje(?: o)?|wyszukaj informacje(?: o)?|poszukaj informacji(?: o)?|sprawdź w internecie(?: o)?|sprawdz w internecie(?: o)?|wyszukaj w internecie(?: o)?|poszukaj w internecie(?: o)?|szukaj w internecie(?: o)?|sprawdź w sieci(?: o)?|sprawdz w sieci(?: o)?)\s+/i,'').replace(/[?!.]+$/,'').trim();
 if(query.length<3||query.length>160)return null;
 const cacheKey=query.toLocaleLowerCase('pl-PL');
 const cached=CACHE.get(cacheKey);
 if(cached&&Date.now()-cached.savedAt<CACHE_TTL_MS)return {...cached.result,cached:true};
 if(cached)CACHE.delete(cacheKey);
 const url=new URL('https://pl.wikipedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',format:'json',generator:'search',gsrsearch:query,gsrlimit:'1',prop:'extracts|info',inprop:'url',exintro:'1',explaintext:'1',exchars:'700',redirects:'1'}).toString();
 const response=await fetcher(url.toString(),{headers:{'User-Agent':'VEXORIO-RX-Knowledge/1.0 (public educational lookup; Wikimedia API)'},signal:AbortSignal.timeout(6500)});
 if(!response.ok)return null;
 const data=await response.json();
 const page=Object.values(data?.query?.pages||{})[0];
 if(!page||page.missing!==undefined||typeof page.extract!=='string'||!page.extract.trim())return null;
 const title=String(page.title||'').slice(0,180);
 const summary=page.extract.replace(/\s+/g,' ').trim().slice(0,700);
 const link=typeof page.fullurl==='string'&&page.fullurl.startsWith('https://pl.wikipedia.org/')?page.fullurl:'https://pl.wikipedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));
 const result={title,summary,url:link,source:'Wikipedia (CC BY-SA; autorzy artykułu na stronie źródłowej)',retrievedAt:new Date().toISOString()};
 if(CACHE.size>=MAX_CACHE_ENTRIES)CACHE.delete(CACHE.keys().next().value);
 CACHE.set(cacheKey,{savedAt:Date.now(),result});
 return result;
}

export function getRXKnowledgeFollowupPrior(message,history){
 if(typeof message!=='string'||!Array.isArray(history)||history.length<2)return null;
 if(!/^(?:a )?(?:dlaczego|czemu|jak to działa|jak to dziala|opowiedz więcej|opowiedz wiecej|więcej|wiecej)[?!. ]*$/i.test(message.trim()))return null;
 // Read only the latest contiguous sourced conversation, never jump over a new topic.
 for(let i=history.length-2;i>=0&&i>=history.length-8;i-=2){
  const prior=typeof history[i]==='string'?history[i].trim():'';
  const answer=typeof history[i+1]==='string'?history[i+1].trim():'';
  if(!/^📚[\s\S]{0,1800}Źródło:\s*https:\/\/pl\.wikipedia\.org\//i.test(answer))return null;
  if(/\b(?:rx|bibi|mrówek|mrówki|wirnik|vexorio|królowa)\b/i.test(prior))return null;
  if(/^(?:co to jest|kim jest|kto to|co oznacza|opowiedz o|powiedz mi o|gdzie leży|gdzie jest|czym jest|wyjaśnij mi|wyjasnij mi|wyjaśnij|wyjasnij|chciałbym się dowiedzieć(?: o)?|chcialbym sie dowiedziec(?: o)?|chciałabym się dowiedzieć(?: o)?|chcialabym sie dowiedziec(?: o)?)\s+.{3,160}[?!.]?$/i.test(prior))return prior;
  if(!/^(?:a )?(?:dlaczego|czemu|jak to działa|jak to dziala|opowiedz więcej|opowiedz wiecej|więcej|wiecej)[?!. ]*$/i.test(prior))return null;
 }
 return null;
}

export function formatRXKnowledgeFollowup(knowledge,previousAnswers){
 if(!knowledge||typeof knowledge.summary!=='string')return null;
 const summary=knowledge.summary.trim();
 if(!summary)return null;
 const sentences=summary.match(/[^.!?]+[.!?](?=\s|$)/g)||[];
 const clean=sentences.map(x=>x.trim()).filter(Boolean);
 const previous=Array.isArray(previousAnswers)?previousAnswers.filter(x=>typeof x==='string').join('\n'):(typeof previousAnswers==='string'?previousAnswers:'');
 // Prefer material that was not already included in the previous sourced answer.
 const unseen=clean.filter(sentence=>!previous.includes(sentence));
 const detail=unseen.slice(0,2).join(' ').trim();
 if(detail)return detail.slice(0,440);
 // Do not pretend repeated encyclopedia text answers a causal "why" question.
 return null;
}
