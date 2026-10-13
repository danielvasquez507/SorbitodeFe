const db = require('./db');

console.log("Actualizando PROCESADORA MONTE AZUL...");
const stmt = db.prepare(`UPDATE transacciones SET categoria = 'Restaurante', responsable_pago = 'Gedalya' WHERE comercio LIKE '%PROCESADORA MONTE AZUL%' COLLATE NOCASE`);
const info = stmt.run();
console.log(`Actualizados ${info.changes} registros para PROCESADORA MONTE AZUL`);

