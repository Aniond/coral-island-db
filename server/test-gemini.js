const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: 'c:/Projects/CIAPP/server/.env' });

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: "Say hello world!",
    });
    console.log("Stream started...");
    for await (const chunk of responseStream) {
      process.stdout.write(chunk.text);
    }
    console.log("\nSuccess!");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
