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
module.exports={maskJavaScript};
