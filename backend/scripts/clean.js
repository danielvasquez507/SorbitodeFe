require('better-sqlite3')('database/sorbito.db').exec('DELETE FROM transacciones;'); console.log('Deleted all rows');
