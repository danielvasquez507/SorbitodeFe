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
        console.log("Connecting...");
        const connection = await imaps.connect(config);
        console.log("Connected. Getting boxes...");
        const boxes = await connection.getBoxes();
        console.log("Available boxes:", Object.keys(boxes));
        
        console.log("Opening Banco/Pago...");
        await connection.openBox('Banco/Pago');
        console.log("Opened. Searching...");
        
        const searchCriteria = [
            ['FROM', 'notificacion_pa@pa.bac.net'],
            ['SUBJECT', 'Transaccion Realizada con su Tarjeta BAC Panama']
        ]; 
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
        
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} messages in Banco/Pago`);
        connection.end();
    } catch (e) {
        console.error("ERROR:", e);
    }
}
run();
