require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const pool = require('./db');

async function run() {
  const { rows: npcs } = await pool.query('SELECT name, role FROM npcs ORDER BY id LIMIT 5');
  const context = npcs.map(n => `- ${n.name}: ${n.role}`).join('\n');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: `Game database context:\n\n${context}\n\nQuestion: Remind me to buy potato seeds`,
    config: {
      tools: [{
        functionDeclarations: [
          {
            name: "add_custom_task",
            description: "Add a task to the user's custom daily checklist. Use this when the user asks to be reminded to do something.",
            parameters: {
              type: "OBJECT",
              properties: { taskName: { type: "STRING" } },
              required: ["taskName"]
            }
          }
        ]
      }]
    }
  });

  for await (const chunk of stream) {
    if (chunk.functionCalls) {
      console.log('FUNCTION_CALL_FOUND:', JSON.stringify(chunk.functionCalls, null, 2));
    }
    try {
      if (chunk.text) {
        console.log('TEXT:', chunk.text);
      }
    } catch(e) { console.log('ERROR READING TEXT:', e.message); }
  }
  pool.end();
}
run().catch(console.error);
