import {prepareQueenHandoff} from './rx-queen-approval.mjs';
import {appendQueenReport} from './rx-queen-history.mjs';
import {saveQueenHistory,loadQueenHistory} from './rx-queen-cloud.mjs';

// Safe controller for Queen panel. Explicit user click required for persistence.
export function createQueenPanelController(client) {
 let history=Object.freeze([]);
 return Object.freeze({
  preview(message,label='RX report') {
   const handoff=prepareQueenHandoff(message);
   history=appendQueenReport(history,handoff,label);
   return history.at(-1);
  },
  history(){return history;},
  async save(label='RX report'){return saveQueenHistory(client,history,label);},
  async load(id){history=await loadQueenHistory(client,id);return history;}
 });
}
