require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
    try {
        console.log("Listing models...");
        const response = await ai.models.list();
        let i = 0;
        for await (const model of response) {
            console.log(model.name);
            i++;
            if (i > 20) break;
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
run();
