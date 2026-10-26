'use strict';
const {createRXDNAStore}=require('./rx-dna-store-server.cjs');
function createStagingGateway({baseUrl,publicKey,request}){
 if(typeof request!=='function')throw Error('request adapter required');
 return createRXDNAStore({
  authorize:async session=>Boolean(session&&typeof session.token==='string'&&session.token.length>20),
  read:async(id,session)=>request({baseUrl,publicKey,token:session.token,procedure:'rx_dna_staging_read',params:{p_ant_id:id}}),
  write:async(id,snapshot,revision,session)=>request({baseUrl,publicKey,token:session.token,procedure:'rx_dna_staging_write',params:{p_ant_id:id,p_snapshot:snapshot,p_expected_revision:revision}})
 });
}
module.exports={createStagingGateway};
