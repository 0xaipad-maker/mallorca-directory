const WebSocket = require('ws');
const http = require('http');

function send(ws, msg) {
  return new Promise((resolve) => {
    ws.send(JSON.stringify(msg));
    // We just fire-and-forget, responses come as messages
    resolve();
  });
}

async function checkPage() {
  const res = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const target = res[0];
  if (!target) { console.log('No target'); return; }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const responses = {};
  let msgId = 0;

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id) responses[msg.id] = msg;
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[CONSOLE.${msg.params.type}] ${args}`);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      console.log(`[EXCEPTION] ${d.text}: ${d.exception?.description?.substring(0, 500) || ''}`);
    }
    if (msg.method === 'Log.entryAdded') {
      const e = msg.params.entry;
      console.log(`[LOG.${e.level}] ${e.text}`);
    }
  });

  await new Promise(r => ws.on('open', r));

  // Enable all domains
  await send(ws, { id: ++msgId, method: 'Runtime.enable' });
  await send(ws, { id: ++msgId, method: 'Console.enable' });
  await send(ws, { id: ++msgId, method: 'Log.enable' });
  await send(ws, { id: ++msgId, method: 'Page.enable' });

  // Wait a bit for any pending events
  await new Promise(r => setTimeout(r, 2000));

  // Check the DOM for rendered content
  await send(ws, { id: ++msgId, method: 'Runtime.evaluate', params: {
    expression: `(function() {
      const root = document.getElementById('root');
      const children = root ? root.children.length : -1;
      const html = root ? root.innerHTML.substring(0, 200) : 'NO_ROOT';
      return { children, html };
    })()`,
    returnByValue: true
  }});

  // Check for global errors
  await send(ws, { id: ++msgId, method: 'Runtime.evaluate', params: {
    expression: `(function() {
      return window.__error_inits || 'NO_ERRORS';
    })()`,
    returnByValue: true
  }});

  // Check if Firebase was initialized
  await send(ws, { id: ++msgId, method: 'Runtime.evaluate', params: {
    expression: `(function() {
      try {
        const fb = require('firebase/app');
        return 'Firebase available';
      } catch(e) {
        try {
          const fb = window.firebase;
          return fb ? 'Firebase on window' : 'No Firebase found';
        } catch(e2) {
          return 'Firebase error: ' + e2.message;
        }
      }
    })()`,
    returnByValue: true
  }});

  // List all script errors on the page
  await send(ws, { id: ++msgId, method: 'Runtime.evaluate', params: {
    expression: `(function() {
      const errors = [];
      // Check if React root is present
      const root = document.getElementById('root');
      errors.push('root_children: ' + (root ? root.children.length : -1));
      errors.push('root_inner: ' + (root ? root.innerHTML.substring(0, 100) : 'none'));
      errors.push('scripts_loaded: ' + document.scripts.length);
      // Check for visible text
      const body = document.body;
      errors.push('body_children: ' + (body ? body.children.length : -1));
      errors.push('body_text: ' + (body ? (body.innerText || '').substring(0, 100) : 'none'));
      return errors.join('\\n');
    })()`,
    returnByValue: true
  }});

  // Wait for responses
  await new Promise(r => setTimeout(r, 3000));

  // Print responses
  for (const [id, msg] of Object.entries(responses)) {
    if (msg.result && msg.result.result) {
      console.log(`\n[EVAL ${id}] ${JSON.stringify(msg.result.result.value)}`);
    }
  }

  ws.close();
}

checkPage().catch(console.error);
