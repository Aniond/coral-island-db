const http = require('http');
const req = http.request('http://localhost:3001/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', chunk => console.log('CHUNK:', chunk.toString()));
  res.on('end', () => console.log('END'));
});
req.on('error', console.error);
req.write(JSON.stringify({ query: 'Remind me to buy potato seeds' }));
req.end();
