// Optional, explicitly invoked model adapter. No external URL, admin tools, or private memory.
export async function askClientModel(message,env,{direct=false}={}){
 const match=direct?(/^[\s\S]{1,1000}$/u.test(message.trim())?[null,message.trim()]:null):/^(?:zapytaj model|zapytaj ai):\s*(.{1,1000})$/isu.exec(message.trim());
 if(!match)return null;
 if(env.RX_BIBI_MODEL_ENABLED!=='true'||typeof env.RX_BIBI_MODEL_SERVICE?.fetch!=='function')
  return {answer:'Silnik AI nie jest jeszcze podłączony do tego czatu.',modelInferenceUsed:false,engine:'rx-bibi-model-unavailable'};
 try{
  const response=await env.RX_BIBI_MODEL_SERVICE.fetch('https://rx-bibi-model.internal/infer',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({message:match[1]}),signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)return {answer:'Silnik AI nie odpowiedział. Spróbuj ponownie później.',modelInferenceUsed:false,engine:'rx-bibi-model-error'};
  const result=await response.json();
  if(typeof result?.answer!=='string'||!result.answer.trim()||result.answer.length>4000)
   throw Error('invalid_model_reply');
  return {answer:result.answer,modelInferenceUsed:true,engine:'rx-bibi-model-service'};
 }catch{
  return {answer:'Silnik AI jest chwilowo niedostępny.',modelInferenceUsed:false,engine:'rx-bibi-model-error'};
 }
}
