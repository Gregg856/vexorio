'use strict';
// RX LANGUAGE TOKENIZER 1.0 — original deterministic Polish-first reversible UTF-8 byte tokenizer.
// No third-party packages, user text retention, external API or executable commands.
// Byte IDs 0..255; reserved 256 BOS, 257 EOS, 258 PAD, 259 UNK.
const {TextEncoder,TextDecoder}=require('node:util');
const encoder=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
const BOS=256,EOS=257,PAD=258,UNK=259;
const MAX_BYTES=16384;
function tokenize(text,{boundary=true,maxBytes=MAX_BYTES}={}){
 if(typeof text!=='string'||typeof boundary!=='boolean'||!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>MAX_BYTES)throw Error('Invalid tokenizer input');
 const bytes=encoder.encode(text);
 if(bytes.length>maxBytes)throw Error('RX text too long');
 const ids=Array.from(bytes);
 if(boundary){ids.unshift(BOS);ids.push(EOS);}
 return {schema:1,kind:'rx-language-tokens',ids,byteLength:bytes.length,tokenCount:ids.length};
}
function detokenize(ids,{allowPartial=false}={}){
 if(!Array.isArray(ids)&&!(ids instanceof Uint16Array))throw Error('Invalid token ids');
 if(ids.length>MAX_BYTES+2||typeof allowPartial!=='boolean')throw Error('Invalid token sequence');
 const bytes=[];let ended=false;
 for(let i=0;i<ids.length;i++){
  const id=ids[i];
  if(!Number.isSafeInteger(id)||id<0||id>UNK)throw Error('Invalid token id');
  if(id===BOS){if(i!==0)throw Error('Unexpected BOS');continue;}
  if(id===EOS){if(i!==ids.length-1)throw Error('Unexpected EOS');ended=true;continue;}
  if(id===PAD){if(!ended&&!allowPartial)throw Error('Unexpected PAD');continue;}
  if(id===UNK)throw Error('Cannot decode unknown token');
  if(ended)throw Error('Data after EOS');
  bytes.push(id);
 }
 return decoder.decode(Uint8Array.from(bytes));
}
function toFrequencyVector(text){
 const {ids,byteLength}=tokenize(text,{boundary:false});
 const vector=new Float32Array(256);
 if(byteLength)for(const id of ids)vector[id]+=1/byteLength;
 return vector;
}
function toBigramVector(text){
 const ids=tokenize(text,{boundary:false}).ids;
 const result=new Float32Array(256);
 if(ids.length<2)return toFrequencyVector(text);
 for(let i=1;i<ids.length;i++)result[(ids[i-1]*131+ids[i])%256]+=1/(ids.length-1);
 return result;
}
module.exports={BOS,EOS,PAD,UNK,MAX_BYTES,tokenize,detokenize,toFrequencyVector,toBigramVector};
