// Own RX BIBI classifier running inside the existing Worker. No external AI.
export function ownWorkerAnswer(message,raw){
 if(typeof raw!=='string'||raw.length>120000)return null;
 let samples;try{samples=JSON.parse(raw)}catch{return null}
 if(!Array.isArray(samples)||samples.length<2||samples.length>500)return null;
 const tok=s=>(String(s).toLocaleLowerCase('pl').match(/[\p{L}\p{N}]+/gu)||[]).slice(0,64);
 const exact=new Map(),weights=new Map();
 for(const s of samples){
  if(typeof s?.input!=='string'||typeof s?.answer!=='string'||!s.input.trim()||!s.answer.trim()||s.input.length>1000||s.answer.length>1000)return null;
  const key=tok(s.input).join(' ');
  if(exact.has(key)&&exact.get(key)!==s.answer)return null;
  exact.set(key,s.answer);
  for(const word of new Set(tok(s.input))){
   if(!weights.has(word))weights.set(word,new Map());
   const row=weights.get(word);row.set(s.answer,(row.get(s.answer)||0)+1);
  }
 }
 const words=tok(message),key=words.join(' ');
 if(exact.has(key))return exact.get(key);
 const scores=new Map();
 for(const word of new Set(words))for(const [answer,n] of weights.get(word)||[])scores.set(answer,(scores.get(answer)||0)+n);
 const ranked=[...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'));
 return ranked.length&&!(ranked.length>1&&ranked[0][1]===ranked[1][1])?ranked[0][0]:null;
}
