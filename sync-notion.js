const fs = require('fs');
const token = process.env.NOTION_TOKEN || 'YOUR_NOTION_TOKEN';
const headers = { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };

async function createDatabase() {
  const payload = {
    parent: { type: 'page_id', page_id: '370b79d6-3b87-80b2-b4a3-e92c8fa576e8' },
    title: [{ type: 'text', text: { content: '📋 Todo — Coral Island DB' } }],
    properties: {
      'Task name': { title: {} },
      'Status': {
        status: {
          options: [
            { name: 'To-do', color: 'gray' },
            { name: 'In progress', color: 'blue' },
            { name: 'Done', color: 'green' }
          ]
        }
      }
    }
  };
  const res = await fetch('https://api.notion.com/v1/databases', { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Failed to create DB: ' + err);
  }
  return res.json();
}

async function addTask(dbId, name, status) {
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
  console.log('Creating database...');
  const db = await createDatabase();
  const dbId = db.id;
  console.log('Created database:', dbId);

  const tasks = [
    { name: 'Global Command Palette (Cmd+K / Ctrl+K)', status: 'Done' },
    { name: 'Hybrid View Toggle (Grid/List) for crops', status: 'Done' },
    { name: 'Toast Notification System for saves', status: 'Done' },
    { name: 'Update AI Context with Quality Prices', status: 'Done' },
    { name: 'Add Seed Cost and Profit margins to UI', status: 'Done' },
    { name: 'Add Cave Items hybrid list view', status: 'Done' },
    { name: 'Add Foraging items hybrid list view', status: 'Done' },
    { name: 'Deploy updates to Vercel/Railway', status: 'Done' }
  ];

  console.log('Adding tasks...');
  for (const t of tasks) {
    await addTask(dbId, t.name, t.status);
    console.log('Added:', t.name);
  }
  console.log('Done!');
}
run().catch(console.error);
