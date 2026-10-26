'use strict';
// RX Developer Core: lexical scanner; never executes input.
function maskJavaScript(source) {
 if(typeof source!=='string')throw new TypeError('Expected source text');
 const out=Array(source.length).fill(' ');
 const frames=[{type:'code',interpolation:false,braces:0}];
 const top=()=>frames[frames.length-1];
 const emit=i=>{out[i]=source[i];};
 const blank=i=>{if(source[i]==='\n'||source[i]==='\r')emit(i);};
 for(let i=0;i<source.length;){
  const c=source[i],n=source[i+1],f=top();
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
 return out.join('');
}

const RULES=Object.freeze([
 {id:'RX001',severity:'high',pattern:/\beval\s*\(/g,message:'eval() wykonuje dynamiczny kod.',advice:'Zastąp eval() bezpieczną funkcją lub parserem.'},
 {id:'RX002',severity:'medium',pattern:/\binnerHTML\s*=/g,message:'Przypisanie innerHTML wymaga kontroli danych.',advice:'Dla tekstu użyj textContent; HTML poddaj sanitizacji.'},
 {id:'RX003',severity:'medium',pattern:/\bouterHTML\s*=/g,message:'Przypisanie outerHTML wymaga kontroli danych.',advice:'Nie wstawiaj niezaufanego HTML.'},
 {id:'RX004',severity:'medium',pattern:/\binsertAdjacentHTML\s*\(/g,message:'insertAdjacentHTML() może wstrzyknąć HTML.',advice:'Waliduj i sanitizuj dane wejściowe.'},
 {id:'RX005',severity:'low',pattern:/\bconsole\.(?:log|debug|info)\s*\(/g,message:'Logowanie może ujawnić dane.',advice:'Sprawdź, czy log nie zawiera sekretów.'},
 {id:'RX006',severity:'medium',pattern:/\bdocument\.write\s*\(/g,message:'document.write() może wstrzyknąć HTML.',advice:'Użyj bezpiecznych metod DOM.'}
]);
function analyzeJavaScript(source){
 const masked=maskJavaScript(source);
 const findings=[];
 for(const rule of RULES){
  rule.pattern.lastIndex=0;
  let match;
  while((match=rule.pattern.exec(masked))!==null){
   const offset=match.index;
   const line=source.slice(0,offset).split('\n').length;
   findings.push({id:rule.id,severity:rule.severity,line,column:offset-source.lastIndexOf('\n',offset-1),message:rule.message,advice:rule.advice});
   if(match[0].length===0)rule.pattern.lastIndex++;
  }
 }
 const rank={high:0,medium:1,low:2};
 findings.sort((a,b)=>a.line-b.line||a.column-b.column||rank[a.severity]-rank[b.severity]);
 return {engine:'RX Developer Core',version:'0.1.0',findings,summary:{total:findings.length,high:findings.filter(x=>x.severity==='high').length,medium:findings.filter(x=>x.severity==='medium').length,low:findings.filter(x=>x.severity==='low').length}};
}
module.exports={maskJavaScript,analyzeJavaScript};

