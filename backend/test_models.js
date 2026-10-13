require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName) {
  console.log(`\nConsultando a ${modelName}...`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hola, responde únicamente con la palabra 'Conectado'.",
    });
    console.log(`✅ [${modelName}]: ${response.text.trim()}`);
  } catch (error) {
    console.log(`❌ ERROR [${modelName}]: ${error.message}`);
  }
}

async function runTests() {
  await testModel('gemini-3.1-pro-preview');
  await testModel('gemini-3.5-flash-lite');
}

runTests();
