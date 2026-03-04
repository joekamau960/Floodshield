let wss=null; export function setWSS(s){ wss=s; } export function broadcastWS(obj){ if(!wss) return; const msg=JSON.stringify(obj); wss.clients.forEach(c=>{ try{ c.send(msg); }catch{} }); }
