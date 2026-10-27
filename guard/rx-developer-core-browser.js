// Browser adapter for RX Developer Core; do not edit independently.
'use strict';
// RX Developer Core: lexical scanner; never executes input.
function maskJavaScript(source) {
 if(typeof source!=='string')throw new TypeError('Expected source text');
 const out=Array(source.length).fill(' ');
 const frames=[{type:'code',interpolation:false,braces:0}];
 const emit=i=>{out[i]=source[i];};
 const blank=i=>{if(source[i]==='\n'||source[i]==='\r')emit(i);};
 for(let i=0;i<source.length;){
  const c=source[i],n=source[i+1],f=frames[frames.length-1];
  if(f.type==='line'){if(c==='\n'||c==='\r'){emit(i);frames.pop();}i++;continue;}
  if(f.type==='block'){if(c==='*'&&n==='/'){i+=2;frames.pop();continue;}blank(i++);continue;}
  if(f.type==='string'||f.type==='template'){
   if(c==='\\'){blank(i);if(i+1<source.length)blank(i+1);i+=2;continue;}
   if(f.type==='template'&&c==='$'&&n==='{'){frames.push({type:'code',interpolation:true,braces:0});i+=2;continue;}
   if(c===f.quote){frames.pop();i++;continue;}
   blank(i++);continue;
  }
  if(c==='/'&&n==='/'){frames.push({type:'line'});i+=2;continue;}
  if(c==='/'&&n==='*'){frames.push({type:'block'});i+=2;continue;}

  // Mask regex literals after expression starters; leave division operators visible.
  if(c==='/'&&n!=='/'&&n!=='*'){
   let k=i-1;
   while(k>=0&&/\s/.test(out[k]))k--;
   const previous=k>=0?out[k]:'';
   if(!previous||/[=(:,!&|?;{\[+*%-]/.test(previous)){
    let j=i+1,escaped=false,inClass=false,closed=false;
    for(;j<source.length;j++){
     const ch=source[j];
     if(ch==='\n'||ch==='\r')break;
     if(escaped){escaped=false;continue;}
     if(ch==='\\'){escaped=true;continue;}
     if(ch==='[')inClass=true;
     else if(ch===']')inClass=false;
     else if(ch==='/'&&!inClass){closed=true;break;}
    }
    if(closed){
     j++;
     while(j<source.length&&/[a-z]/i.test(source[j]))j++;
     i=j;continue;
    }
   }
  }
  if(c==='"'||c==="'"){frames.push({type:'string',quote:c});i++;continue;}
  if(c==='\x60'){frames.push({type:'template',quote:c});i++;continue;}
  if(f.interpolation){
   if(c==='{')f.braces++;
   if(c==='}'){if(f.braces===0){frames.pop();i++;continue;}f.braces--;}
  }
  emit(i++);
 }
 const chunks=[];for(let k=0;k<out.length;k+=4096)chunks.push(out.slice(k,k+4096).join(''));return chunks.join('');
}

const RULES=Object.freeze([
 {id:'RX001',severity:'high',pattern:/(?<![\w$])(?:globalThis\s*\.\s*)?eval\s*\(/g,message:'eval() wykonuje dynamiczny kod.',advice:'Zastąp eval() bezpieczną funkcją lub parserem.'},
 {id:'RX002',severity:'medium',pattern:/(?:\binnerHTML\s*=|\[\s*['\"]innerHTML['\"]\s*\]\s*=)/g,message:'Przypisanie innerHTML wymaga kontroli danych.',advice:'Dla tekstu użyj textContent; HTML poddaj sanitizacji.'},
 {id:'RX003',severity:'medium',pattern:/\bouterHTML\s*=/g,message:'Przypisanie outerHTML wymaga kontroli danych.',advice:'Nie wstawiaj niezaufanego HTML.'},
 {id:'RX004',severity:'medium',pattern:/\binsertAdjacentHTML\s*\(/g,message:'insertAdjacentHTML() może wstrzyknąć HTML.',advice:'Waliduj i sanitizuj dane wejściowe.'},
 {id:'RX005',severity:'low',pattern:/(?<![\w$.])console\.(?:log|debug|info|warn)\s*\(/g,message:'Logowanie może ujawnić dane.',advice:'Sprawdź, czy log nie zawiera sekretów.'},
 {id:'RX006',severity:'medium',pattern:/(?<![\w$.])document\.write\s*\(/g,message:'document.write() może wstrzyknąć HTML.',advice:'Użyj bezpiecznych metod DOM.'},
 {id:'RX007',severity:'high',pattern:/\bnew\s+Function\s*\(/g,message:'Dynamiczne tworzenie funkcji może wykonać niezaufany kod.',advice:'Unikaj new Function() dla danych z zewnątrz.'},
 {id:'RX008',severity:'medium',pattern:/(?<![\w$.])document\.cookie\s*=/g,message:'Zapis cookie w JavaScript wymaga przeglądu zabezpieczeń.',advice:'Dla sesji rozważ ciasteczka HttpOnly ustawiane przez serwer.'},
 {id:'RX009',severity:'medium',pattern:/(?<![\w$.])(?:window\.)?postMessage\s*\(/g,message:'Sprawdź targetOrigin wywołania postMessage().',advice:'Wskaż konkretny targetOrigin.'},
 {id:'RX010',severity:'medium',pattern:/(?<![\w$.])(?:window\.)?location(?:\.href|\[\s*['\"]href['\"]\s*\])\s*=/g,message:'Przekierowanie wymaga sprawdzenia źródła adresu.',advice:'Waliduj docelowy adres i dozwolone domeny.'},
 {id:'RX011',severity:'medium',pattern:/(?<![\w$.])localStorage\.setItem\s*\(/g,message:'Dane w localStorage są dostępne dla JavaScript.',advice:'Nie przechowuj tokenów sesji ani sekretów w localStorage.'},
 {id:'RX012',severity:'medium',pattern:/(?<![\w$.])window\.open\s*\(/g,message:'Nowe okno wymaga sprawdzenia ochrony przed dostępem do opener.',advice:'Stosuj noopener/noreferrer lub sprawdź ustawienia otwierania.'},
 {id:'RX013',severity:'medium',pattern:/(?<![\w$.])setInterval\s*\(/g,message:'Powtarzany timer wymaga kontroli cyklu życia.',advice:'Sprawdź clearInterval i ogranicz niepotrzebne wykonywanie.'}
]);
function analyzeJavaScript(source){
 const masked=maskJavaScript(source);
 const findings=[];
 // Computed literal properties are masked by the lexer; inspect only narrow,
 // known property writes in original source and verify they are in code context.
 const computedWrites=[
  {id:'RX002',property:'innerHTML',severity:'medium',message:'Przypisanie innerHTML wymaga kontroli danych.',advice:'Dla tekstu użyj textContent; HTML poddaj sanitizacji.'},
  {id:'RX010',property:'href',severity:'medium',message:'Przekierowanie wymaga sprawdzenia źródła adresu.',advice:'Waliduj docelowy adres i dozwolone domeny.'}
 ];
 const extraMatches=[];
 for(const rule of computedWrites){
  const rx=new RegExp('\\\\b([A-Za-z_$][\\\\w$]*)\\\\s*\\\\[\\\\s*([\\"\\\'])'+rule.property+'\\\\2\\\\s*\\\\]\\\\s*=', 'g');
  let match;
  while((match=rx.exec(source))!==null){
   const at=match.index;
   // Require the object identifier and the opening bracket to be executable code.
   if(masked.slice(at,at+match[1].length).trim()!==match[1])continue;
   const bracket=source.indexOf('[',at+match[1].length);
   if(bracket<0||masked[bracket]!=='[')continue;
   if(rule.id==='RX010'&&match[1]!=='location')continue;
   extraMatches.push({offset:at,rule});
  }
 }

 const lineStarts=[0];
 for(let i=source.indexOf('\n');i!==-1;i=source.indexOf('\n',i+1))lineStarts.push(i+1);
 const locate=offset=>{
  let low=0,high=lineStarts.length;
  while(low<high){const mid=(low+high)>>>1;if(lineStarts[mid]<=offset)low=mid+1;else high=mid;}
  const index=low-1;
  return {line:index+1,column:offset-lineStarts[index]+1};
 };
 for(const rule of RULES){
  rule.pattern.lastIndex=0;
  let match;
  while((match=rule.pattern.exec(masked))!==null){
   const offset=match.index;
   const {line,column}=locate(offset);
   findings.push({id:rule.id,severity:rule.severity,line,column,message:rule.message,advice:rule.advice});
   if(match[0].length===0)rule.pattern.lastIndex++;
  }
 }
 for(const item of extraMatches){const {line,column}=locate(item.offset);findings.push({id:item.rule.id,severity:item.rule.severity,line,column,message:item.rule.message,advice:item.rule.advice});}
 // Rules are visited in priority order, but findings need source order.
 // Sort by numeric offset once, avoiding repeated line/column comparisons.
 findings.sort((a,b)=>a.line-b.line||a.column-b.column);
 return {engine:'RX Developer Core',version:'0.3.5',findings,summary:{total:findings.length,...findings.reduce((counts,item)=>{counts[item.severity]++;return counts;},{high:0,medium:0,low:0})}};
}
if(typeof window!=='undefined')window.RXDeveloperCore=Object.freeze({maskJavaScript,analyzeJavaScript});

