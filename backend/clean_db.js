const db = require('./db.js');

const info = db.prepare(`
    DELETE FROM transacciones 
    WHERE id NOT IN (
        SELECT MIN(id) 
        FROM transacciones 
        GROUP BY fecha, comercio, monto
    )
`).run();

console.log("Deleted", info.changes, "duplicate rows.");
