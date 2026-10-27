'use strict';
// Safe standalone HTML dashboard for an already validated RX BIBI summary.
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const METRICS=[['signals','Sygnały'],['tasks','Zadania mrówek'],['recurring','Powracające problemy'],['reviewedFiles','Przeanalizowane pliki'],['proposedPatches','Propozycje napraw'],['awaitingApproval','Do zatwierdzenia']];
function renderQueenDashboard(summary){
 if(!summary||summary.kind!=='rx-bibi-dashboard-summary'||summary.requiresApproval!==true||summary.productionModified!==false||summary.automaticDeployment!==false||
 typeof summary.runId!=='string'||summary.runId.length>80||
 METRICS.some(([key])=>!Number.isSafeInteger(summary[key])||summary[key]<0||summary[key]>100000))throw Error('Invalid RX dashboard summary');
 const cards=METRICS.map(([key,label])=>'<article class="metric"><h2>'+escapeHtml(label)+'</h2><strong>'+summary[key]+'</strong></article>').join('');
 return '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>RX Queen — raport</title><style>:root{color-scheme:dark}body{font:16px system-ui,sans-serif;background:#101827;color:#f2f6ff;margin:0;padding:24px}main{max-width:1000px;margin:auto}h1{font-size:1.8rem}p{color:#b7c5d9}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.metric{background:#1c2940;border:1px solid #354763;border-radius:14px;padding:20px}.metric h2{font-size:1rem;font-weight:500;margin:0 0 16px}.metric strong{font-size:2.5rem}.notice{margin-top:24px;padding:14px;border:1px solid #64748b;border-radius:12px}</style></head><body><main><h1>RX Queen — panel diagnostyczny</h1><p>Przebieg: '+escapeHtml(summary.runId)+'</p><section class="grid" aria-label="Metryki RX">'+cards+'</section><p class="notice">Tylko odczyt. Propozycje napraw wymagają zatwierdzenia. Nie wykonano automatycznego wdrożenia.</p></main></body></html>';
}
module.exports={renderQueenDashboard};
