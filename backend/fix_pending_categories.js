require('dotenv').config();
const db = require('./db');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function fixCategories() {
  const transacciones = db.prepare(`
    SELECT id, comercio, categoria 
    FROM transacciones 
    WHERE (pagado = 0 OR pagado IS NULL) 
      AND (categoria IS NULL OR categoria = '' OR categoria = 'Otro' OR categoria = 'Otros')
  `).all();

  if (transacciones.length === 0) {
    console.log("No hay transacciones pendientes sin categoría o con categoría 'Otro'.");
    return;
  }

  const comerciosUnicos = [...new Set(transacciones.map(t => t.comercio))];

  const prompt = `Actúa como un categorizador financiero experto para Panamá.
    Dada la siguiente lista de nombres de comercios extraídos de comprobantes de tarjetas de crédito, 
    devuelve un objeto JSON donde las claves sean el nombre exacto del comercio provisto y el valor sea la mejor categoría.
    Solo puedes usar las siguientes categorías exactas:
    "Salud", "Casa", "Remodelaciones", "Estudio", "Seguro", "Supermercado", "Transporte", "Entretenimiento", "Restaurante", "Servicios", "Otros"
    Comercios:\n${comerciosUnicos.join("\n")}`;

  let mapaCategorias = {};
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    mapaCategorias = JSON.parse(response.text);
    console.log("Respuesta:", mapaCategorias);
  } catch (err) {
    console.error("Error Gemini:", err);
    return;
  }

  const updateStmt = db.prepare('UPDATE transacciones SET categoria = ? WHERE id = ?');
  const updateMany = db.transaction((txs) => {
    let actualizadas = 0;
    for (const t of txs) {
      const nuevaCat = mapaCategorias[t.comercio];
      if (nuevaCat && nuevaCat !== 'Otro' && nuevaCat !== 'Otros') {
        updateStmt.run(nuevaCat, t.id);
        actualizadas++;
      } else {
        updateStmt.run('Otros', t.id); // Guardar estrictamente como Otros si hay duda
        actualizadas++;
      }
    }
    return actualizadas;
  });

  const numActualizadas = updateMany(transacciones);
  console.log(`Se actualizaron exitosamente ${numActualizadas} transacciones.`);
}

fixCategories().catch(console.error);
