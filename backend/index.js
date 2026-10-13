require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sorbito de Fé API is running' });
});

// Get all transactions
app.get('/api/transacciones', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM transacciones ORDER BY fecha DESC');
        const transacciones = stmt.all();
        res.json(transacciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transacciones', (req, res) => {
    try {
        const { fecha, comercio, monto, responsable, tarjeta, categoria, responsable_pago, pagado } = req.body;
        
        if (!fecha || !comercio || monto === undefined) {
            return res.status(400).json({ error: "Faltan campos obligatorios (fecha, comercio, monto)" });
        }

        const stmt = db.prepare(`
            INSERT INTO transacciones 
            (fecha, comercio, monto, responsable, tarjeta, categoria, responsable_pago, pagado, email_id, fecha_recibido) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const now = new Date().toISOString();
        const info = stmt.run(
            fecha,
            comercio,
            monto,
            responsable || 'Manual',
            tarjeta || 'N/A',
            categoria || 'Otro',
            responsable_pago || null,
            pagado ? 1 : 0,
            'MANUAL-' + Date.now(),
            now
        );
        
        res.status(201).json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/transacciones/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { categoria, responsable_pago, pagado } = req.body;
        
        let query = 'UPDATE transacciones SET ';
        const params = [];
        const updates = [];
        
        if (categoria !== undefined) { updates.push('categoria = ?'); params.push(categoria); }
        if (responsable_pago !== undefined) { updates.push('responsable_pago = ?'); params.push(responsable_pago); }
        if (pagado !== undefined) { updates.push('pagado = ?'); params.push(pagado ? 1 : 0); }
        
        if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
        
        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);
        
        const info = db.prepare(query).run(params);
        if (info.changes === 0) return res.status(404).json({ error: "Transaction not found" });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/logs', (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM (SELECT * FROM process_logs ORDER BY id DESC LIMIT 500) ORDER BY id ASC").all();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/matriz', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT responsable_pago, categoria, SUM(monto) as total 
            FROM transacciones 
            WHERE responsable_pago IS NOT NULL AND responsable_pago != ''
            GROUP BY responsable_pago, categoria
        `);
        const rows = stmt.all();
        
        const matriz = {};
        rows.forEach(row => {
            if (!matriz[row.responsable_pago]) matriz[row.responsable_pago] = {};
            matriz[row.responsable_pago][row.categoria] = row.total;
        });
        
        res.json(matriz);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sync', async (req, res) => {
    const { procesarCorreos } = require('./worker/imap');
    try {
        const count = await procesarCorreos();
        res.json({ success: true, count, message: `Finalizada la sincronización: ${count || 0} registros nuevos` });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/sync/status', (req, res) => {
    const { getSyncStatus } = require('./worker/imap');
    res.json({ isSyncing: getSyncStatus() });
});

const cron = require('node-cron');

app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    
    // Iniciar el worker IMAP
    const { procesarCorreos } = require('./worker/imap');
    console.log("[Worker] Inicializando lectura de correos programada...");
    
    // Ejecutar inmediatamente al arrancar
    procesarCorreos();
    
    // Tarea 1: De 12:00 AM a 5:59 AM, ejecutarse 1 vez por hora (en el minuto 0)
    cron.schedule('0 0-5 * * *', () => {
        console.log("[Worker] Sincronización horaria de madrugada");
        procesarCorreos();
    }, { timezone: "America/Panama" });

    // Tarea 2: De 6:00 AM a 11:59 PM, ejecutarse cada 5 minutos
    cron.schedule('*/5 6-23 * * *', () => {
        console.log("[Worker] Sincronización de rutina (cada 5 min)");
        procesarCorreos();
    }, { timezone: "America/Panama" });
});
