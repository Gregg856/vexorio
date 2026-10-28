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
 {id:'RX001',severity:'high',pattern:/(?<![\w$.])(?:globalThis\s*\.\s*)?eval\s*\(/g,message:'eval() wykonuje dynamiczny kod.',advice:'Zastąp eval() bezpieczną funkcją lub parserem.'},
 {id:'RX002',severity:'medium',pattern:/(?:\binnerHTML\s*(?:\+=|=)|\[\s*['\"]innerHTML['\"]\s*\]\s*=)/g,message:'Przypisanie innerHTML wymaga kontroli danych.',advice:'Dla tekstu użyj textContent; HTML poddaj sanitizacji.'},
 {id:'RX003',severity:'medium',pattern:/\bouterHTML\s*=/g,message:'Przypisanie outerHTML wymaga kontroli danych.',advice:'Nie wstawiaj niezaufanego HTML.'},
 {id:'RX004',severity:'medium',pattern:/\binsertAdjacentHTML\s*\(/g,message:'insertAdjacentHTML() może wstrzyknąć HTML.',advice:'Waliduj i sanitizuj dane wejściowe.'},
 {id:'RX005',severity:'low',pattern:/(?<![\w$.])console(?:\.|\?\.)(?:log|debug|info|warn|error)\s*\(/g,message:'Logowanie może ujawnić dane.',advice:'Sprawdź, czy log nie zawiera sekretów.'},
 {id:'RX006',severity:'medium',pattern:/(?<![\w$.])document(?:\.|\?\.)write\s*\(/g,message:'document.write() może wstrzyknąć HTML.',advice:'Użyj bezpiecznych metod DOM.'},
 {id:'RX007',severity:'high',pattern:/\b(?:new\s+)?Function\s*\(/g,message:'Dynamiczne tworzenie funkcji może wykonać niezaufany kod.',advice:'Unikaj new Function() dla danych z zewnątrz.'},
 {id:'RX008',severity:'medium',pattern:/(?<![\w$.])document\.cookie\s*=/g,message:'Zapis cookie w JavaScript wymaga przeglądu zabezpieczeń.',advice:'Dla sesji rozważ ciasteczka HttpOnly ustawiane przez serwer.'},
 {id:'RX009',severity:'medium',pattern:/(?<![\w$.])(?:window\.)?postMessage\s*\(/g,message:'Sprawdź targetOrigin wywołania postMessage().',advice:'Wskaż konkretny targetOrigin.'},
 {id:'RX010',severity:'medium',pattern:/(?<![\w$.])(?:window\.)?location(?:\.href|\[\s*['\"]href['\"]\s*\])\s*=/g,message:'Przekierowanie wymaga sprawdzenia źródła adresu.',advice:'Waliduj docelowy adres i dozwolone domeny.'},
 {id:'RX011',severity:'medium',pattern:/(?<![\w$.])(?:localStorage|sessionStorage)\.setItem\s*\(/g,message:'Dane w localStorage są dostępne dla JavaScript.',advice:'Nie przechowuj tokenów sesji ani sekretów w localStorage.'},
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
  const rx=new RegExp(String.raw`\b([A-Za-z_$][\w$]*)\s*\[\s*(['"])`+rule.property+String.raw`\2\s*\]\s*(?:\+=|=)`, 'g');
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

 // Computed calls: literal property strings are masked, so verify executable prefixes.
 const computedCalls=[
  {pattern:/\b(?:globalThis|window)\s*\[\s*(['"])eval\1\s*\]\s*\(/g,id:'RX001',severity:'high',message:'Pośrednie wywołanie eval() wykonuje kod.',advice:'Unikaj dynamicznego wykonywania tekstu.'},
  {pattern:/\bdocument\s*\[\s*(['"])write\1\s*\]\s*\(/g,id:'RX006',severity:'medium',message:'document.write() może wstrzyknąć HTML.',advice:'Użyj bezpiecznych metod DOM.'},
  {pattern:/\bconsole\s*\[\s*(['"])(?:log|error|warn|info|debug)\1\s*\]\s*\(/g,id:'RX005',severity:'low',message:'Logowanie może ujawnić dane.',advice:'Sprawdź logowanie sekretów.'}
 ];
 for(const rule of computedCalls){let m;while((m=rule.pattern.exec(source))!==null){
  const opening=source.indexOf('[',m.index);
  if(masked.slice(m.index,opening).trim()!==source.slice(m.index,opening).trim()||masked[opening]!=='[')continue;
  extraMatches.push({offset:m.index,rule});
 }}

 // Template-literal property names: validate the object and bracket are executable code.
 const templateCalls=[
  {pattern:/\bdocument\s*\[\s*`write`\s*\]\s*\(/g,id:'RX006',severity:'medium',message:'Computed document.write() may inject HTML.',advice:'Use safe DOM APIs.'}
 ];
 for(const rule of templateCalls){let match;while((match=rule.pattern.exec(source))!==null){
  const bracket=source.indexOf('[',match.index);
  if(masked.slice(match.index,bracket).trim()!==source.slice(match.index,bracket).trim()||masked[bracket]!=='[')continue;
  extraMatches.push({offset:match.index,rule});
 }}
 const templateHref=/\blocation\s*\[\s*`href`\s*\]\s*=/g;
 let hrefMatch;
 while((hrefMatch=templateHref.exec(source))!==null){
  const bracket=source.indexOf('[',hrefMatch.index);
  if(masked.slice(hrefMatch.index,bracket).trim()!==source.slice(hrefMatch.index,bracket).trim()||masked[bracket]!=='[')continue;
  extraMatches.push({offset:hrefMatch.index,rule:{id:'RX010',severity:'medium',message:'Computed location redirect needs validation.',advice:'Validate destination URLs.'}});
 }

 // Explicit global object access bypasses local aliases of document, console and location.
 const explicitGlobals=[
  {pattern:/\b(?:window|globalThis)\.document\.write\s*\(/g,id:'RX006',severity:'medium',message:'Global document.write() can inject HTML.',advice:'Use safe DOM APIs.'},
  {pattern:/\bglobalThis\.console\.(?:log|debug|info|warn|error)\s*\(/g,id:'RX005',severity:'low',message:'Global console logging can expose secrets.',advice:'Review sensitive logs.'},
  {pattern:/\bglobalThis\.location\.href\s*=/g,id:'RX010',severity:'medium',message:'Global location redirect needs validation.',advice:'Validate destination URLs.'}
 ];
 for(const rule of explicitGlobals){let match;while((match=rule.pattern.exec(masked))!==null)extraMatches.push({offset:match.index,rule});}

 // Location navigation methods require the same destination validation as href writes.
 const locationNavigation=/\blocation\.(?:assign|replace)\s*\(/g;
 let navigationMatch;
 while((navigationMatch=locationNavigation.exec(masked))!==null)extraMatches.push({offset:navigationMatch.index,rule:{id:'RX010',severity:'medium',message:'Navigation destination requires validation.',advice:'Validate redirect URLs.'}});

 // Additional narrow patterns: global eval indirection and static template property writes.
 const indirectGlobalEval=/\(\s*0\s*,\s*globalThis\.eval\s*\)\s*\(/g;
 let globalEvalMatch;
 while((globalEvalMatch=indirectGlobalEval.exec(masked))!==null)extraMatches.push({offset:globalEvalMatch.index,rule:{id:'RX001',severity:'high',message:'Indirect global eval call.',advice:'Avoid executing untrusted code.'}});
 const templateProperty=/\b([A-Za-z_$][\w$]*)\s*\[\s*`innerHTML`\s*\]\s*=/g;
 let templateMatch;
 while((templateMatch=templateProperty.exec(source))!==null){
  const at=templateMatch.index;
  const bracket=source.indexOf('[',at+templateMatch[1].length);
  if(masked.slice(at,at+templateMatch[1].length).trim()===templateMatch[1]&&masked[bracket]==='[')extraMatches.push({offset:at,rule:{id:'RX002',severity:'medium',message:'Computed innerHTML assignment.',advice:'Use textContent or sanitize HTML.'}});
 }

 // Conservative detection of direct, unmodified aliases within the same source.
 // No interprocedural or control-flow claim: reassignment invalidates an alias.
 const indirectEval=/\(\s*0\s*,\s*eval\s*\)\s*\(/g;
 let indirect;
 while((indirect=indirectEval.exec(masked))!==null){
  extraMatches.push({offset:indirect.index,rule:{id:'RX001',severity:'high',message:'Pośrednie eval() wykonuje dynamiczny kod.',advice:'Nie wykonuj niezaufanego tekstu jako kodu.'}});
 }
 const aliasDeclaration=/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(eval|localStorage)\b/g;
 let declaration;
 while((declaration=aliasDeclaration.exec(masked))!==null){
  const alias=declaration[1],kind=declaration[2];
  const after=masked.slice(declaration.index+declaration[0].length);
  const name=alias;
  const call=kind==='eval'?new RegExp(String.raw`\b`+name+String.raw`\s*(?:\(\s*|\?\.\s*\(\s*|(?:\?|)\.\s*(?:call|apply|bind)\s*\()`,'g'):new RegExp(String.raw`\b`+name+String.raw`\s*\.\s*setItem\s*\(`,'g');
  const assignments=new RegExp(String.raw`\b`+name+String.raw`\s*(?:=(?!=)|\+\+|--|\+=|-=)`,'g');
  // Limit suppression to calls inside a function whose parameter shadows this alias.
  const shadowRanges=[];
  const shadow=new RegExp(String.raw`\bfunction\s*[A-Za-z_$\w]*\s*\([^)]*\b`+name+String.raw`\b[^)]*\)\s*\{`,'g');
  let fn;
  while((fn=shadow.exec(after))!==null){
   const opening=after.indexOf('{',fn.index+fn[0].length-1);
   let depth=1,end=opening+1;
   for(;end<after.length&&depth;end++){if(after[end]==='{')depth++;else if(after[end]==='}')depth--;}
   shadowRanges.push([fn.index,end]);
  }
  const arrow=new RegExp(String.raw`\(\s*`+name+String.raw`\s*\)\s*=>\s*`,'g');
  while((fn=arrow.exec(after))!==null){
   const begin=fn.index,opening=arrow.lastIndex;
   if(after[opening]==='{'){let depth=1,end=opening+1;for(;end<after.length&&depth;end++){if(after[end]==='{')depth++;else if(after[end]==='}')depth--;}shadowRanges.push([begin,end]);}
   else {const end=after.indexOf(';',opening);shadowRanges.push([begin,end<0?after.length:end]);}
  }
  // Block-scoped shadow declarations must not invalidate an outer alias.
  const blockShadows=[];
  const shadowDecl=new RegExp(String.raw`\b(?:const|let)\s+`+name+String.raw`\s*=`,'g');
  let localDecl;
  while((localDecl=shadowDecl.exec(after))!==null){
   const before=after.slice(0,localDecl.index);
   const openings=[];
   for(let i=0;i<before.length;i++){if(before[i]==='{')openings.push(i);else if(before[i]==='}')openings.pop();}
   if(!openings.length)continue;
   const start=openings[openings.length-1];
   let depth=1,end=start+1;
   for(;end<after.length&&depth;end++){if(after[end]==='{')depth++;else if(after[end]==='}')depth--;}
   blockShadows.push([localDecl.index,end]);
  }
  const inShadow=index=>shadowRanges.some(([start,end])=>index>=start&&index<end)||blockShadows.some(([start,end])=>index>=start&&index<end);
  const reassignments=[];let assignment;
  while((assignment=assignments.exec(after))!==null)if(!inShadow(assignment.index))reassignments.push(assignment.index);
  let found;
  while((found=call.exec(after))!==null){
   if(inShadow(found.index))continue;
   // A reassignment before a call invalidates the alias; later ones do not.
   if(reassignments.some(index=>index<found.index))continue;
   extraMatches.push({offset:declaration.index+declaration[0].length+found.index,rule:kind==='eval'?{id:'RX001',severity:'high',message:'Alias eval() wykonuje dynamiczny kod.',advice:'Unikaj aliasowania eval() dla niezaufanego wejścia.'}:{id:'RX011',severity:'medium',message:'Alias localStorage.setItem() wymaga kontroli danych.',advice:'Nie przechowuj sekretów w localStorage.'}});
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
   // Skip known locally shadowed browser globals; conservative file-level check.
   const shadowName=rule.id==='RX005'?'console':rule.id==='RX006'||rule.id==='RX008'?'document':rule.id==='RX010'?'location':rule.id==='RX011'?'sessionStorage':rule.id==='RX012'?'window':rule.id==='RX013'?'setInterval':rule.id==='RX007'?'Function':null;
   if(shadowName){
    const prefix=masked.slice(0,offset);
    const shadowPattern=new RegExp('\\b(?:const|let|var)\\s+'+shadowName+'\\s*=\\s*\\{');
    if(shadowPattern.test(prefix))continue;
    if((shadowName==='setInterval'||shadowName==='Function')&&new RegExp('\\b(?:const|let|var)\\s+'+shadowName+'\\s*=').test(prefix))continue;
    // A parameter with the same name shadows the browser global inside its function body.
    const paramShadow=new RegExp(String.raw`\bfunction\s*[A-Za-z_$\w]*\s*\([^)]*\b`+shadowName+String.raw`\b[^)]*\)\s*\{`,'g');
    let localFunction,insideShadow=false;
    while((localFunction=paramShadow.exec(masked))!==null){
     const open=masked.indexOf('{',localFunction.index+localFunction[0].length-1);
     if(open>=offset)continue;
     let depth=1,end=open+1;
     for(;end<masked.length&&depth;end++){if(masked[end]==='{')depth++;else if(masked[end]==='}')depth--;}
     if(offset<end){insideShadow=true;break;}
    }
    if(insideShadow)continue;
   }
   // A method named eval on an object is not the global eval function.
   if(rule.id==='RX001'&&/^eval\s*\(/.test(match[0])){
    const prior=masked.slice(0,offset);
    if(/(?:\b(?:const|let|var)\s+\w+\s*=\s*\{[^{}]*|\{[^{}]*)$/.test(prior)&&/\b[A-Za-z_$][\w$]*\s*\([^()]*\)\s*\{/.test(masked.slice(offset,offset+100)))continue;
   }
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

