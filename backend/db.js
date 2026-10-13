const Database = require('better-sqlite3');
const path = require('path');

// Connect to SQLite DB inside the mounted volume
const dbPath = path.join(__dirname, 'database', 'sorbito.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize Schema
function initDB() {
    const createTable = `
        CREATE TABLE IF NOT EXISTS transacciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            comercio TEXT NOT NULL,
            monto REAL NOT NULL,
            responsable TEXT NOT NULL,
            tarjeta TEXT,
            categoria TEXT,
            responsable_pago TEXT,
            pagado BOOLEAN DEFAULT 0,
            fecha_recibido TEXT,
            email_id TEXT UNIQUE
        );
    `;
    const createLogsTable = `
        CREATE TABLE IF NOT EXISTS process_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL
        );
    `;
    db.exec(createTable);
    db.exec(createLogsTable);
    console.log("Database initialized successfully.");
}

initDB();

module.exports = db;
