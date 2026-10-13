const db = require('./db');
db.prepare('DELETE FROM transacciones').run();
console.log('Todos los registros han sido eliminados de la base de datos.');
