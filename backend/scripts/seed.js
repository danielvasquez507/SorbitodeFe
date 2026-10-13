const db = require('../db');

function seed() {
    console.log("Limpiando transacciones antiguas...");
    db.exec('DELETE FROM transacciones');

    const stmt = db.prepare(`
        INSERT INTO transacciones (fecha, comercio, monto, responsable, tarjeta, categoria, responsable_pago, pagado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Datos basados en tu captura de pantalla
    const mockData = [
        ['01/09/2026', 'GAS N GO', 3.75, 'Gedalya', 'Visa', 'Gasolina', 'Gedalya', 1],
        ['02/09/2026', '1869577 MAXI FERIA PUE', 54.70, 'Daniel', 'Mastercard', 'Supermercado', 'Familiar', 1],
        ['02/09/2026', 'SUPER CARNES N15 EL TR', 55.40, 'Daniel', 'Mastercard', 'Supermercado', 'Familiar', 1],
        ['03/09/2026', 'AGROPECUARIA WILLY', 8.50, 'Daniel', 'Visa', 'Otro', 'Familiar', 1],
        ['03/09/2026', 'DIST IRIS PANAMA 2', 13.65, 'Gedalya', 'Visa', 'Supermercado', 'Familiar', 1],
        ['05/09/2026', 'MCDONALDS', 15.00, 'Daniel', 'Visa', 'Comida', 'Daniel', 0],
        ['06/09/2026', 'DELTA', 25.00, 'Gedalya', 'Mastercard', 'Gasolina', 'Familiar', 0],
        ['08/09/2026', 'SUPER 99', 45.20, 'Gedalya', 'Visa', 'Supermercado', 'Familiar', 0],
    ];

    db.transaction(() => {
        for (const row of mockData) {
            stmt.run(row);
        }
    })();

    console.log("Datos de prueba insertados exitosamente.");
}

seed();
