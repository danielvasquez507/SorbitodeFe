const db = require('./db');

const categorias = {
  "DELTA EL TRAPICHITO": "Transporte",
  "MCDONALDS COSTA VERDE": "Restaurante",
  "SC N15 TRAPICHITO": "Supermercado",
  "KAREN S - LOS ANDES MA": "Otros",
  "EL COSTO SUC LOS ANDES": "Otros",
  "DELTA MILLA 1": "Transporte",
  "CAFE CHORRERANO": "Restaurante",
  "AGROPECUARIA WILLY": "Supermercado",
  "ALMACEN MAS X MENOS": "Otros",
  "TITAN WESTLAND MALL": "Otros",
  "GIORGIOæS WESTLAND": "Restaurante",
  "EL CAMPEON WESTLAND MA": "Otros",
  "SUPER CENTRO EL FUERTE": "Supermercado",
  "ESTACION TEXACO WESTLA": "Transporte",
  "PAYPAL *TEMU": "Otros"
};

const updateStmt = db.prepare('UPDATE transacciones SET categoria = ? WHERE comercio = ? AND (pagado = 0 OR pagado IS NULL)');
db.transaction(() => {
  for (const [comercio, cat] of Object.entries(categorias)) {
    updateStmt.run(cat, comercio);
  }
})();

console.log("Actualización manual completada.");
