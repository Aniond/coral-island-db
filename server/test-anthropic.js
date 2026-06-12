const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: 'c:/Projects/CIAPP/server/.env' });

async function test() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello" }]
    });
    console.log("Success! Key is valid.", msg.content);
  } catch (err) {
    console.error("Error:", err.status, err.message);
  }
}

test();
