require('dotenv').config();
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const db = require('../db');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function enmascararDatos(texto) {
    if (!texto) return '';
    let seguro = texto.replace(/\b(?:\d[ -]*?){12,15}(\d{4})\b/g, "****-****-****-$1");
    return seguro;
}

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

function logGeminiEvent(model, tipo, inputPayload, outputPayload, status) {
    try {
        if (!currentRunId) currentRunId = Date.now().toString();
        db.prepare(`
            INSERT INTO gemini_logs (run_id, timestamp, model, tipo, input_payload, output_payload, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            currentRunId,
            new Date().toISOString(),
            model,
            tipo,
            typeof inputPayload === 'string' ? inputPayload : JSON.stringify(inputPayload),
            typeof outputPayload === 'string' ? outputPayload : JSON.stringify(outputPayload),
            status
        );
    } catch (e) {
        console.error('[Gemini Log Error]', e.message);
    }
}

async function obtenerCategoriaGemini(comercio) {
    if (!comercio || comercio === "Desconocido") return "Otra";
    const prompt = `
Eres un clasificador financiero.
El comercio es: "${comercio}".
Clasifícalo estrictamente en UNA de estas categorías: Salud, Casa, Remodelaciones, Estudio, Seguro, Supermercado, Transporte, Entretenimiento, Restaurante, Servicios, Otra.

REGLAS DE ORO:
1. Supermercados: "Distribuidora Iris", "Maxi Feria", "Xtra", "SUPER CARNES", "panaderia", "SUPER 99", "RIBA SMITH", "REY", "EL MACHETAZO", "PRICE SMART", "Agropecuaria", "Melo" DEBEN ir a "Supermercado".
2. Servicios: "CW WIRELESS", "Tigo", "+Movil", "Idaan", "naturgy", "cw panama", "CABLE ONDA", "ENS", "ENSA", "CABLE & WIRELESS" DEBEN ir a "Servicios".
3. Restaurantes: "PROCESADORA MONTE AZUL" DEBE ir a "Restaurante".

Devuelve únicamente un JSON válido con la clave "categoria". Ejemplo: {"categoria": "Supermercado"}
    `;
    const model = 'gemini-3.5-flash-lite';
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(response.text);
        logGeminiEvent(model, 'individual', { comercio, prompt }, data, 'SUCCESS');
        return data.categoria || "Otra";
    } catch (error) {
        console.error(`[Gemini API] Error al clasificar ${comercio}:`, error.message);
        logGeminiEvent(model, 'individual', { comercio, prompt }, { error: error.message }, 'ERROR');
        return "Otra"; // Fallback seguro
    }
}
let currentRunId = '';

function logEvent(type, message) {
    const icon = type === 'SUCCESS' ? '✅' : type === 'ERROR' ? '❌' : type === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`[Worker IMAP] ${icon} ${message}`);
    try {
        if (!currentRunId) currentRunId = Date.now().toString();
        db.prepare('INSERT INTO process_logs (run_id, timestamp, type, message) VALUES (?, ?, ?, ?)')
          .run(currentRunId, new Date().toISOString(), type, message);
    } catch (e) {
        // Ignorar si la tabla aún no existe
    }
}

let isSyncing = false;

async function procesarCorreos() {
    if (isSyncing) {
        return;
    }
    isSyncing = true;
    currentRunId = Date.now().toString(); // Generate a new run_id for each sync
    try {
        
        if (!process.env.IMAP_USER || !process.env.GEMINI_API_KEY) {
            logEvent('ERROR', "Faltan variables de entorno en el .env (IMAP o GEMINI).");
            return;
        }
        logEvent('INFO', "Analizando bandeja de correos...");
        const connection = await Promise.race([
            imaps.connect(config),
            new Promise((_, reject) => setTimeout(() => reject(new Error('IMAP Connection timeout tras 30s')), 30000))
        ]);
        const foldersToSearch = ['INBOX', 'Banco/Pago'];
        let allMessages = [];
        
        for (let boxName of foldersToSearch) {
            try {
                await connection.openBox(boxName);
                // No logueamos la búsqueda de carpeta individual para mantener el flujo limpio
                
                const limitDate = new Date();
                limitDate.setDate(limitDate.getDate() - 7);
                
                const searchCriteria = [
                    ['SINCE', limitDate],
                    ['FROM', 'notificacion_pa@pa.bac.net'],
                    ['SUBJECT', 'Transaccion Realizada con su Tarjeta BAC Panama']
                ]; 
                
                // Primero buscamos solo los IDs sin descargar el cuerpo (para que no colapse la memoria)
                const uidMessages = await connection.search(searchCriteria, { bodies: [''] });
                const uids = uidMessages.map(m => m.attributes.uid);
                
                if (uids.length > 0) {
                    logEvent('INFO', `Se identificaron ${uids.length} correos compatibles en ${boxName}. Descargando...`);
                }
                
                // Descargamos en chunks de 100
                for (let i = 0; i < uids.length; i += 100) {
                    const chunk = uids.slice(i, i + 100);
                    const min = Math.min(...chunk);
                    const max = Math.max(...chunk);
                    
                    const fetchOptions = { bodies: ['TEXT'], markSeen: true };
                    // Usamos rango min:max junto con los criterios para no fallar en el string de IMAP
                    const chunkCriteria = [
                        ['UID', `${min}:${max}`],
                        ['SINCE', limitDate],
                        ['FROM', 'notificacion_pa@pa.bac.net'],
                        ['SUBJECT', 'Transaccion Realizada con su Tarjeta BAC Panama']
                    ];
                    
                    const messages = await connection.search(chunkCriteria, fetchOptions);
                    messages.forEach(m => allMessages.push({ boxName, ...m }));
                }
            } catch(e) {
                logEvent('ERROR', `Error accediendo a la carpeta ${boxName}: ${e.message}`);
            }
        }
        
        // Cerrar la conexión IMAP rápido para que no haya timeout
        connection.end();
        logEvent('INFO', `Descarga finalizada. Analizando ${allMessages.length} correos...`);
        
        const transaccionesExtraidas = [];
        const comerciosUnicos = new Set();

        for (let item of allMessages) {
            const email_id = item.attributes.uid.toString();
            const all = item.parts.find(part => part.which === 'TEXT');
            if (!all) continue;
            
            const check = db.prepare("SELECT id FROM transacciones WHERE email_id = ?").get(email_id);
            if (check) {
                continue; // Ya procesado
            }

            const mail = await simpleParser("Imap-Id: "+email_id+"\r\n" + all.body);
            const textoLimpio = enmascararDatos(mail.text);
            
            let tarjeta = "Desconocida";
            let responsable = "Familiar";
            const tarjetaMatch = textoLimpio.match(/tu tarjeta (?:adicional )?([A-Za-z]+) terminada en (\d{4})(?: a nombre de (.*))?/i);
            if (tarjetaMatch) {
                tarjeta = `${tarjetaMatch[1]} ${tarjetaMatch[2]}`.toUpperCase();
                if (tarjetaMatch[2] === "5176") responsable = "Daniel";
                else if (tarjetaMatch[2] === "2857") responsable = "Gedalya";
                else if (tarjetaMatch[3]) responsable = tarjetaMatch[3].trim();
            }

            let comercio = "Desconocido";
            let monto = 0;
            const comercioMatch = textoLimpio.match(/Comercio\s+Monto\s+([\s\S]+?)\s+(?:Fecha y hora|(?:USD|US\$)\s*([\d,\.]+))/i);
            if (comercioMatch) {
                comercio = comercioMatch[1].trim();
                if (comercioMatch[2]) {
                    const montoStr = comercioMatch[2].replace(/[^\d\.]/g, '');
                    monto = parseFloat(montoStr) || 0;
                }
            }

            let fecha = "";
            const fechaMatch = textoLimpio.match(/Fecha y hora\s*(\d{4}\/\d{2}\/\d{2}-\d{2}:\d{2}:\d{2})/i);
            if (fechaMatch) {
                fecha = fechaMatch[1].replace(/\//g, '-').replace(/(\d{4}-\d{2}-\d{2})-/, '$1 ');
            } else {
                fecha = mail.date ? mail.date.toISOString().replace('T', ' ').substring(0, 19) : new Date().toISOString().replace('T', ' ').substring(0, 19);
            }

            if (comercio === "Desconocido") {
                logEvent('WARNING', `El correo UID ${email_id} no pudo ser procesado con RegEx. Saltando.`);
                continue;
            }
            
            const checkDup = db.prepare("SELECT id FROM transacciones WHERE fecha = ? AND comercio = ? AND monto = ?").get(fecha, comercio, monto);
            if (checkDup) {
                continue; // Ya existe en la base de datos (posiblemente de otra carpeta o reenviado)
            }

            const isBeforeSept = fecha < '2026-09-01';
            const pagado = isBeforeSept ? 1 : 0;

            comerciosUnicos.add(comercio);
            transaccionesExtraidas.push({
                email_id, fecha, comercio, monto, responsable, tarjeta,
                pagado,
                fecha_recibido: mail.date ? mail.date.toISOString() : new Date().toISOString()
            });
        }
        
        if (transaccionesExtraidas.length === 0) {
            logEvent('INFO', "No se encontraron nuevas transacciones para registrar.");
            isSyncing = false;
            return 0;
        }

        logEvent('INFO', `Enviando a Gemini ${comerciosUnicos.size} comercios únicos para categorización masiva...`);
        let categoriasMapa = {};
        try {
            const comerciosArray = Array.from(comerciosUnicos);
            const prompt = `
Eres un analista financiero experto en clasificación de gastos (especialmente enfocado en Panamá y Latinoamérica). Tu objetivo es deducir a qué se dedica cada uno de los comercios listados y clasificarlos estrictamente en UNA de estas categorías: Salud, Casa, Remodelaciones, Estudio, Seguro, Supermercado, Transporte, Entretenimiento, Restaurante, Servicios, Otra.

REGLAS DE ORO:
1. Supermercados y Alimentos: "Distribuidora Iris", "Maxi Feria", "Xtra", "SUPER CARNES", "panaderia", "SUPER 99", "RIBA SMITH", "REY", "EL MACHETAZO", "PRICE SMART" DEBEN ir a la categoría "Supermercado".
2. Mascotas y Agropecuaria: Todo lo que diga "Agropecuaria" (ej. "MRP AGROPECUARIA"), "Melo" o lugares de venta de alimentos de animales, clasifícalo en "Supermercado" (es la comida de las mascotas).
3. Servicios Básicos y Telecomunicaciones: "CW WIRELESS", "Tigo", "+Movil", "Idaan", "naturgy", "cw panama", "CABLE ONDA", "ENS", "ENSA", "CABLE & WIRELESS" DEBEN ir a la categoría "Servicios".
4. Restaurantes y Cafeterías: "PROCESADORA MONTE AZUL" DEBE ir a la categoría "Restaurante".
5. Inferencia avanzada: Usa tu conocimiento sobre marcas. Ej: ferreterías a "Remodelaciones", farmacias a "Salud", gasolineras/Uber a "Transporte", comida rápida a "Restaurante", cines/streaming a "Entretenimiento".
6. ELIMINA EL "Otra": Usa "Otra" ÚNICAMENTE como último recurso si el nombre es irreconocible.

Devuelve ÚNICAMENTE un JSON válido (sin texto extra ni bloques de markdown) donde las claves sean los nombres EXACTOS de los comercios proporcionados y los valores sean la categoría asignada.

Comercios a clasificar:
${JSON.stringify(comerciosArray)}
            `;
            
            const wait = (ms) => new Promise(res => setTimeout(res, ms));
            let response;
            const configObj = {
                model: 'gemini-3.5-flash-lite',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            };

            try {
                response = await ai.models.generateContent(configObj);
            } catch (err) {
                if (err.message && (err.message.includes('429') || err.message.includes('Quota'))) {
                    logEvent('WARNING', 'Límite de cuota de Gemini alcanzado (429). Esperando 60 segundos para reintentar...');
                    await wait(60000);
                    response = await ai.models.generateContent(configObj);
                } else {
                    throw err;
                }
            }
            
            categoriasMapa = JSON.parse(response.text);
            const numRecibidos = Object.keys(categoriasMapa).length;
            logGeminiEvent('gemini-3.5-flash-lite', 'masivo', { comercios: comerciosArray, prompt }, categoriasMapa, 'SUCCESS');
            logEvent('SUCCESS', `Gemini envió exitosamente ${numRecibidos} categorías deducidas.`);
        } catch (error) {
            logGeminiEvent('gemini-3.5-flash-lite', 'masivo', { comercios: Array.from(comerciosUnicos) }, { error: error.message }, 'ERROR');
            logEvent('ERROR', `Fallo crítico en Gemini. Detalles: ${error.message}. Se usará 'Otra' por defecto.`);
            console.error("Detalle completo del error Gemini:", error);
        }

        logEvent('INFO', `Asignando categorías e insertando en la base de datos...`);

        const stmt = db.prepare(`
            INSERT INTO transacciones (fecha, comercio, monto, responsable, tarjeta, categoria, responsable_pago, pagado, fecha_recibido, email_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (let t of transaccionesExtraidas) {
            const categoria = categoriasMapa[t.comercio] || "Otra";
            let responsablePago = "Familiar"; // por defecto
            if (t.comercio && t.comercio.toUpperCase().includes("PROCESADORA MONTE AZUL")) {
                responsablePago = "Gedalya";
            }
            try {
                stmt.run(
                    t.fecha, 
                    t.comercio, 
                    t.monto, 
                    t.responsable, 
                    t.tarjeta, 
                    categoria, 
                    responsablePago,
                    t.pagado, 
                    t.fecha_recibido,
                    t.email_id
                );
                // Quitamos el log por transacción para evitar spam y mantener la cascada limpia
            } catch(e) {
                logEvent('ERROR', `Error insertando UID ${t.email_id}: ${e.message || e}`);
            }
        }
        
        logEvent('SUCCESS', `¡Sincronización finalizada! ${transaccionesExtraidas.length} registros insertados con éxito.`);
        return transaccionesExtraidas.length;
    } catch (error) {
        logEvent('ERROR', `Error crítico en proceso: ${error.message}`);
    } finally {
        isSyncing = false;
    }
}

const getSyncStatus = () => isSyncing;

if (require.main === module) {
    procesarCorreos();
}

module.exports = { procesarCorreos, enmascararDatos, getSyncStatus };
