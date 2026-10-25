'use strict';
(function(root){
 function installTaskAnalyzer(registry,analyze){
  if(!registry||typeof registry.register!=='function'||typeof analyze!=='function')throw Error('Analyzer unavailable');
  return registry.register({
   id:'task-analyzer',description:'Bezpieczna analiza poleceń i poziomu ryzyka',permissions:['read:task'],
   run:({task})=>{
    const result=analyze(task);
    if(!result.ok)return {message:result.error||'Nie można przeanalizować polecenia.'};
    const names={security:'bezpieczeństwo',deployment:'publikacja',testing:'testy',translation:'tłumaczenia',development:'programowanie',general:'ogólne'};
    const risks={high:'wysokie',medium:'średnie',low:'niskie'};
    return {message:'Analiza: '+(names[result.intent]||result.intent)+'. Ryzyko: '+(risks[result.risk]||result.risk)+'.\nPlan:\n'+result.steps.map((x,i)=>(i+1)+'. '+x).join('\n')+'\nTo tylko analiza. Nie wykonano żadnych zmian.'};
   }
  });
 }
 const api={installTaskAnalyzer};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardTaskAnalyzerPlugin=api;
})(typeof window!=='undefined'?window:null);
