// RX WIEDZA ŚWIATA 1.0: on-demand, attributed open encyclopedia lookup.
// No bulk Wikipedia copy, no credentials, no paid model.
const CACHE=new Map();
const MAX_CACHE_ENTRIES=100;
const CACHE_TTL_MS=60*60*1000;
export async function searchWorldKnowledge(question,{fetcher=fetch}={}){
 if(typeof question!=='string'||question.length>300||!question.trim())return null;
 const query=question.trim().replace(/^(co to jest|kim jest|kto to|co oznacza|opowiedz o|powiedz mi o|gdzie leży|gdzie jest|czym jest)\s+/i,'').replace(/[?!.]+$/,'').trim();
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
