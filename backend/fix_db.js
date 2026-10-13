const db = require('./db');

const comerciosServicios = [
  'CW WIRELESS', 'Tigo', '+Movil', 'Idaan', 'naturgy', 'cw panama', 'CABLE ONDA', 'ENS', 'ENSA', 'CABLE & WIRELESS'
];

const comerciosSupermercado = [
  'MRP AGROPECUARIA', 'SUPER CARNES', 'panaderia', 'maxi feria', 'xtra', 'SUPER 99', 'RIBA SMITH', 'REY', 'EL MACHETAZO', 'PRICE SMART'
];

console.log("Actualizando categoría Servicios...");
const stmtServicios = db.prepare(`UPDATE transacciones SET categoria = 'Servicios' WHERE comercio LIKE ? COLLATE NOCASE`);
for (let c of comerciosServicios) {
  const info = stmtServicios.run('%' + c + '%');
  if (info.changes > 0) console.log(`Actualizados ${info.changes} registros para ${c} -> Servicios`);
}

console.log("Actualizando categoría Supermercado...");
const stmtSupermercado = db.prepare(`UPDATE transacciones SET categoria = 'Supermercado' WHERE comercio LIKE ? COLLATE NOCASE`);
for (let c of comerciosSupermercado) {
  const info = stmtSupermercado.run('%' + c + '%');
  if (info.changes > 0) console.log(`Actualizados ${info.changes} registros para ${c} -> Supermercado`);
}

console.log('Proceso de actualización terminado.');
