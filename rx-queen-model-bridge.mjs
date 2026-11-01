// Private, opt-in Queen model adapter. No network URL or credentials exposed to browser.
export async function askQueenModel(message,env){
 const match=/^zapytaj (?:model|ai):\s*([\s\S]{1,1000})$/iu.exec(message.trim());
 if(!match)return {answer:'Wpisz „Zapytaj model:”, a następnie pytanie do Królowej.',modelInferenceUsed:false,engine:'rx-queen-model-input'};
 if(env.RX_QUEEN_MODEL_ENABLED!=='true'||typeof env.RX_QUEEN_MODEL_SERVICE?.fetch!=='function')
  return {answer:'Model Królowej RX nie jest jeszcze podłączony. Podstawowy czat nadal działa.',modelInferenceUsed:false,engine:'rx-queen-model-unavailable'};
 try{
  const response=await env.RX_QUEEN_MODEL_SERVICE.fetch('https://rx-queen-model.internal/infer',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({message:match[1]}),signal:AbortSignal.timeout(30000)
  });
  if(!response.ok)return {answer:'Model Królowej nie odpowiedział.',modelInferenceUsed:false,engine:'rx-queen-model-error'};
  const result=await response.json();
  if(typeof result?.answer!=='string'||!result.answer.trim()||result.answer.length>4000)throw Error('invalid_model_reply');
  return {answer:result.answer,modelInferenceUsed:true,engine:'rx-queen-model-service'};
 }catch{
  return {answer:'Model Królowej jest chwilowo niedostępny.',modelInferenceUsed:false,engine:'rx-queen-model-error'};
 }
}
