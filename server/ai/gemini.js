const { GoogleGenAI } = require('@google/genai');
const pool = require('../db');
const {
  MAX_HISTORY_CHARS,
  MAX_HISTORY_MESSAGES,
  MODEL,
} = require('./config');

const TOOL_INSTRUCTIONS = `\n\nCRITICAL TOOL INSTRUCTIONS:
- IMAGE PROCESSING: If the user uploads an image/screenshot, use your vision capabilities to identify the game items shown. If the user asks you to process them or mark them, automatically use the 'mark_offering_complete' tool for every single identified item.
- If the user asks to set a reminder, add a task, or do something related to a checklist, YOU MUST use the 'add_custom_task' tool.
- If the user asks to mark an offering as complete or donated, YOU MUST use the 'mark_offering_complete' tool.
- Tool execution is independent of the game database context. NEVER decline a task simply because it is not found in the context.`;

const TOOLS = [{
  functionDeclarations: [
    {
      name: 'mark_offering_complete',
      description: 'Mark a Lake Temple Goddess Offering item as completed/donated. Use this when the user says they caught, donated, or completed an item that belongs to an offering.',
      parameters: {
        type: 'OBJECT',
        properties: { itemName: { type: 'STRING', description: 'The precise name of the item, e.g. Wasabi' } },
        required: ['itemName'],
      },
    },
    {
      name: 'add_custom_task',
      description: 'Add a task to the user custom daily checklist. Use this when the user asks to be reminded to do something.',
      parameters: {
        type: 'OBJECT',
        properties: { taskName: { type: 'STRING', description: 'The task to add, e.g. Buy potato seeds' } },
        required: ['taskName'],
      },
    },
  ],
}];

function buildHistoryParams(history) {
  return (history || [])
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, MAX_HISTORY_CHARS) }],
    }));
}

function buildStateString(gameState) {
  if (!gameState) return '';
  return `\n[CURRENT GAME STATE: ${gameState.season} Day ${gameState.day || 1}, Time: ${gameState.time}, Weather: ${gameState.weather}, Town Rank: ${gameState.rank || 'F'}]\n`;
}

function buildUserParts({ query, image, gameState, donatedString, context }) {
  const userParts = [{
    text: `User Request: ${query}${buildStateString(gameState)}${donatedString}\n\n---\nFocused Game Database Context (use only if relevant to the request):\n${context}`,
  }];

  if (image) {
    try {
      const matches = image.match(/^data:(image\/[a-zA-Z0-9+]+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        userParts.unshift({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    } catch (e) {
      console.error('Failed to parse image data', e);
    }
  }

  return userParts;
}

async function executeToolCall({ call, userId }) {
  if (call.name === 'mark_offering_complete') {
    const itemName = call.args.itemName;
    if (!userId) {
      return '\n\n**Action Failed:** You must be logged in to mark offerings as complete.';
    }
    const { rows } = await pool.query('SELECT items FROM user_offerings WHERE user_id = $1', [userId]);
    let items = rows.length > 0 ? rows[0].items : [];
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items)) items = [];
    const norm = itemName.trim().toLowerCase();
    if (!items.includes(norm)) items.push(norm);
    await pool.query(
      'INSERT INTO user_offerings (user_id, items) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items',
      [userId, JSON.stringify(items)]
    );
    return `\n\n**Action Taken:** Marked *"${itemName}"* as completed.`;
  }

  if (call.name === 'add_custom_task') {
    const taskName = call.args.taskName;
    if (!userId) {
      return '\n\n**Action Failed:** You must be logged in to save tasks to your itinerary.';
    }
    const { rows } = await pool.query('SELECT tasks FROM user_checklists WHERE user_id = $1', [userId]);
    let tasks = rows.length > 0 ? rows[0].tasks : [];
    if (typeof tasks === 'string') {
      try { tasks = JSON.parse(tasks); } catch { tasks = []; }
    }
    if (!Array.isArray(tasks)) tasks = [];
    tasks.push({ id: Date.now().toString(), text: taskName, completed: false });
    await pool.query(
      'INSERT INTO user_checklists (user_id, tasks) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET tasks = EXCLUDED.tasks',
      [userId, JSON.stringify(tasks)]
    );
    return `\n\n**Action Taken:** Added *"${taskName}"* to your tasks.`;
  }

  return '';
}

async function streamChunks({ streamObj, abort, res, userId }) {
  let yielded = false;
  let usedToolCall = false;
  let fullResponse = '';

  for await (const chunk of streamObj) {
    if (abort.signal.aborted) break;
    if (chunk.functionCalls && chunk.functionCalls.length > 0) {
      usedToolCall = true;
      yielded = true;
      for (const call of chunk.functionCalls) {
        const msg = await executeToolCall({ call, userId });
        fullResponse += msg;
        res.write(msg);
      }
    }
    try {
      if (chunk.text) {
        yielded = true;
        fullResponse += chunk.text;
        res.write(chunk.text);
      }
    } catch {}
  }

  return { yielded, usedToolCall, fullResponse };
}

async function streamGeminiAnswer({
  systemPrompt,
  query,
  image,
  gameState,
  donatedString,
  context,
  history,
  userId,
  res,
  abort,
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const dynamicPrompt = `${systemPrompt}${TOOL_INSTRUCTIONS}`;
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents: [
      ...buildHistoryParams(history),
      { role: 'user', parts: buildUserParts({ query, image, gameState, donatedString, context }) },
    ],
    config: {
      systemInstruction: dynamicPrompt,
      tools: TOOLS,
    },
  });

  let result = await streamChunks({ streamObj: stream, abort, res, userId });

  if (!result.yielded && !abort.signal.aborted) {
    console.log('Model returned empty response. Retrying without context...');
    const fallbackStream = await ai.models.generateContentStream({
      model: MODEL,
      contents: `User Request: ${query}`,
      config: {
        systemInstruction: dynamicPrompt,
        tools: TOOLS,
      },
    });
    const fallback = await streamChunks({ streamObj: fallbackStream, abort, res, userId });
    result = {
      yielded: fallback.yielded,
      usedToolCall: result.usedToolCall || fallback.usedToolCall,
      fullResponse: result.fullResponse + fallback.fullResponse,
    };

    if (!result.yielded) {
      const msg = '\n\nThe AI encountered an issue processing your request. Please try rephrasing.';
      result.fullResponse += msg;
      res.write(msg);
    }
  }

  return result;
}

module.exports = {
  streamGeminiAnswer,
};
