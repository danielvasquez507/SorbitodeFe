require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
    try {
        console.log("Testing gemini-1.5-pro...");
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: "Hola, responde solo la palabra OK",
        });
        console.log("SUCCESS:", response.text);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
run();
