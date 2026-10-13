const db = require('./db');
try {
  db.prepare("DELETE FROM transacciones").run();
  db.prepare("DELETE FROM process_logs").run();
  console.log("Transacciones y logs han sido borrados de la base de datos.");
} catch(e) {
  console.error("Error al borrar logs:", e);
}
