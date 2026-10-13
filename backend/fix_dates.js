const db = require('./db');
const trans = db.prepare('SELECT id, fecha FROM transacciones').all();

let count = 0;
for (let t of trans) {
    if (t.fecha && t.fecha.match(/^\d{4} \d{2}-\d{2}-\d{2}:\d{2}:\d{2}$/)) {
        // Formato incorrecto: "2026 08-31-21:25:08"
        // Cambiar primer espacio por guion, y ultimo guion por espacio
        const newFecha = t.fecha.replace(' ', '-').replace(/-(\d{2}:\d{2}:\d{2})$/, ' $1');
        db.prepare('UPDATE transacciones SET fecha = ? WHERE id = ?').run(newFecha, t.id);
        count++;
    }
}
console.log(`Corregidas ${count} fechas en la BD.`);
