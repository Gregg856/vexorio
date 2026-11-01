// Optional, explicitly invoked model adapter. No external URL, admin tools, or private memory.
export async function askClientModel(message,env,{direct=false}={}){
 if(typeof message!=='string'||!message.trim())return null;
 const match=direct?(/^[\s\S]{1,1000}$/u.test(message.trim())?[null,message.trim()]:null):/^(?:zapytaj model|zapytaj ai):\s*(.{1,1000})$/isu.exec(message.trim());
 if(!match)return null;
 const prompt=match[1].trim();
 // Never forward invisible control characters to the model service.
 if(/[\u0000-\u001f\u007f]/u.test(prompt))return null;
 if(!prompt||prompt.length>1000)return null;
 if(!env||typeof env!=='object')env={};
 if(env.RX_BIBI_MODEL_ENABLED!=='true'||typeof env.RX_BIBI_MODEL_SERVICE?.fetch!=='function')
  return {answer:'Silnik AI nie jest jeszcze podłączony do tego czatu.',modelInferenceUsed:false,engine:'rx-bibi-model-unavailable'};
 try{
  const response=await env.RX_BIBI_MODEL_SERVICE.fetch('https://rx-bibi-model.internal/infer',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({message:prompt}),signal:AbortSignal.timeout(8000)
  });
  if(!response||response.ok!==true)return {answer:'Silnik AI nie odpowiedział. Spróbuj ponownie później.',modelInferenceUsed:false,engine:'rx-bibi-model-error'};
  const result=await response.json();
  if(typeof result?.answer!=='string'||!result.answer.trim()||result.answer.length>4000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(result.answer))
   throw Error('invalid_model_reply');
  const cleanAnswer=result.answer.trim();
  if(cleanAnswer.length>4000||/[\u007f\u202a-\u202e\u2066-\u2069]/u.test(cleanAnswer))throw Error('invalid_model_reply');
  return {answer:cleanAnswer,modelInferenceUsed:true,engine:'rx-bibi-model-service'};
 }catch{
  return {answer:'Silnik AI jest chwilowo niedostępny.',modelInferenceUsed:false,engine:'rx-bibi-model-error'};
 }
}
