'use strict';
const {planCommand}=require('./rx-command-bridge.cjs');
function chatRX(message){
 const plan=planCommand(message,{energyBalance:100});
 return {answer:plan.steps.length?'Rozpoznano zadania RX. Wymagają zatwierdzenia.':'Nie rozpoznano zadania. Zapytaj o testy, chmurę lub model AI.',plan,executed:0};
}
module.exports={chatRX};
