const fs = require('fs');
const token = process.env.NOTION_TOKEN || 'YOUR_NOTION_TOKEN';
const headers = { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };

const dbId = '37db79d6-3b87-8188-9d08-c3c833a805b5';

async function addTask(name, status) {
  const payload = {
    parent: { database_id: dbId },
    properties: {
      'Task name': { title: [{ text: { content: name } }] },
      'Status': { status: { name: status } }
    }
  };
  const res = await fetch('https://api.notion.com/v1/pages', { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to add task:', name, err);
  }
}

async function run() {
  const bugs = [
    { name: '🐛 BUG (Perf): requireAuth hits Supabase API on every request instead of local JWT validation', status: 'To-do' },
    { name: '🐛 BUG (UI): Missing key prop in AdminPage.jsx table headers', status: 'To-do' },
    { name: '🛠️ DEBT: Split Vite frontend bundle (currently > 500kb)', status: 'To-do' },
    { name: '🛠️ DEBT: Setup Postgres Pool connection limits', status: 'To-do' },
    { name: '🛠️ DEBT: Protect database against destructive seeds in production', status: 'To-do' }
  ];

  console.log('Adding audit tasks...');
  for (const t of bugs) {
    await addTask(t.name, t.status);
    console.log('Added:', t.name);
  }
  console.log('Done!');
}
run().catch(console.error);
