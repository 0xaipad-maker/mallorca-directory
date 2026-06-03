const WebSocket = require('ws');
const http = require('http');

async function checkPage() {
  // Get WebSocket URL from CDP
  const res = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const target = res[0];
  if (!target) {
    console.log('No target found');
    return;
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);

  ws.on('open', () => {
    // Enable Console domain
    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
    // Enable Runtime domain for error tracking
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    // Enable Log domain
    ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
    // Reload the page to capture all startup errors
    ws.send(JSON.stringify({ id: 4, method: 'Page.reload' }));
  });

  let messageCount = 0;
  const errors = [];

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Console.messageAdded') {
      const m = msg.params.message;
      messageCount++;
      console.log(`[${m.level}] ${m.text}`);
      if (m.level === 'error' || m.level === 'warning') {
        errors.push(m);
      }
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const m = msg.params;
      const type = m.type;
      const args = m.args.map(a => a.value || a.description || a.text).join(' ');
      messageCount++;
      console.log(`[${type}] ${args}`);
      if (type === 'error' || type === 'warning') {
        errors.push({ type, text: args });
      }
    }
    if (msg.method === 'Log.entryAdded') {
      const m = msg.params.entry;
      messageCount++;
      console.log(`[${m.level}] ${m.text}`);
      if (m.level === 'error' || m.level === 'severe') {
        errors.push(m);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      console.log(`[EXCEPTION] ${d.text}: ${d.exception?.description || ''}`);
      errors.push(d);
    }
  });

  // Wait for page to load and capture errors
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total messages: ${messageCount}`);
  console.log(`Errors/Warnings: ${errors.length}`);

  if (errors.length === 0) {
    console.log('NO ERRORS FOUND');
  } else {
    console.log('\nERROR DETAILS:');
    errors.forEach((e, i) => {
      console.log(`\n--- Error ${i + 1} ---`);
      console.log(JSON.stringify(e, null, 2));
    });
  }

  ws.close();
}

checkPage().catch(console.error);
