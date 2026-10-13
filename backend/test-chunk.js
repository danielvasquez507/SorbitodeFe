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
        await connection.openBox('Banco/Pago');
        
        console.log("Testing range:");
        try {
            const m2 = await connection.search([['UID', '1094:1100']], { bodies: ['TEXT'] });
            console.log("Range returned:", m2.length);
        } catch(e) { console.log(e.message); }
        
        connection.end();
    } catch (e) {
        console.error("ERROR:", e);
    }
}
run();
