try { require('better-sqlite3')('database/sorbito.db').exec('ALTER TABLE transacciones ADD COLUMN fecha_recibido TEXT;'); console.log('Columna agregada'); } catch(e) { console.log('Ya existe'); }
