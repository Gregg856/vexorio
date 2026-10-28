'use strict';
const RULES=Object.freeze([
 {id:'inspect_tests',topic:'diagnostyka',module:'queen',role:'tests',kind:'inspect_ci',target:'github-actions',words:['test','błąd','blad','awari','sprawdź','sprawdz'],modules:['queen','ants','ci'],cost:5},
 {id:'plan_cloud_checks',topic:'chmura',module:'cloud',role:'diagnostics',kind:'run_unit_tests',target:'tests/rx-cloud-computer.cjs',words:['chmur','komputer','cloud'],modules:['queen','cloud'],cost:8},
 {id:'classify_task',topic:'model AI',module:'ants',role:'memory',kind:'run_unit_tests',target:'tests/rx-ant-ai-trainer.cjs',words:['model','trening','uczen','uczeń','ai'],modules:['queen','brain','ants'],cost:10},
 {id:'rank_candidates',topic:'porównanie',module:'brain',role:'code',kind:'run_unit_tests',target:'tests/rx-ai-core.cjs',words:['porówn','porown','wybierz'],modules:['brain','queen'],cost:4}
]);
module.exports={RULES};
