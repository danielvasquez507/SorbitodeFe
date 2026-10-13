require('dotenv').config();
const imaps = require('imap-simple');

const config = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 15000
    }
};

async function run() {
    try {
        const connection = await imaps.connect(config);
        console.log("Connected. Opening Banco/Pago...");
        await connection.openBox('Banco/Pago');
        console.log("Opened. Searching just UIDs...");
        
        const searchCriteria = [
            ['FROM', 'notificacion_pa@pa.bac.net'],
            ['SUBJECT', 'Transaccion Realizada con su Tarjeta BAC Panama']
        ]; 
        // No fetch body, just uid
        const fetchOptions = { bodies: [''] }; 
        
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} messages in Banco/Pago`);
        connection.end();
    } catch (e) {
        console.error("ERROR:", e);
    }
}
run();
