const WebSocket = require('ws');
const http = require('http');

async function checkDeployed() {
  const res = await new Promise((resolve, reject) => {
    http.get('http://localhost:9333/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const target = res[0];
  if (!target) { console.log('No target'); return; }

  console.log('Target URL:', target.url);

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
      console.log(`[EXCEPTION] ${d.text}: ${(d.exception?.description || '').substring(0, 1000)}`);
    }
    if (msg.method === 'Log.entryAdded') {
      const e = msg.params.entry;
      console.log(`[LOG.${e.level}] ${e.text}`);
    }
  });

  await new Promise(r => ws.on('open', r));

  await send(ws, { id: ++msgId, method: 'Runtime.enable' });
  await send(ws, { id: ++msgId, method: 'Console.enable' });
  await send(ws, { id: ++msgId, method: 'Log.enable' });
  await send(ws, { id: ++msgId, method: 'Page.enable' });

  // Wait for page to load
  await new Promise(r => setTimeout(r, 8000));

  // Check DOM
  await send(ws, { id: ++msgId, method: 'Runtime.evaluate', params: {
    expression: `(function() {
      const root = document.getElementById('root');
      return JSON.stringify({
        rootChildren: root ? root.children.length : -1,
        rootHTML: root ? root.innerHTML.substring(0, 300) : 'no_root',
        bodyText: document.body ? document.body.innerText.substring(0, 200) : 'no_body',
        pathname: window.location.pathname,
        scripts: document.scripts.length
      });
    })()`,
    returnByValue: true
  }});

  // Check for errors
  await send(ws, { id: ++msgId, method: 'Runtime.evaluate', params: {
    expression: `(function() {
      try {
        // Check React root
        const root = document.getElementById('root');
        if (!root) return 'NO_ROOT';
        if (root.children.length === 0) return 'EMPTY_ROOT';
        return 'HAS_CONTENT';
      } catch(e) {
        return 'ERROR: ' + e.message;
      }
    })()`,
    returnByValue: true
  }});

  await new Promise(r => setTimeout(r, 3000));

  for (const [id, msg] of Object.entries(responses)) {
    if (msg.result && msg.result.result) {
      console.log(`\n[EVAL ${id}] ${JSON.stringify(msg.result.result.value)}`);
    }
    if (msg.error) {
      console.log(`[ERROR ${id}] ${JSON.stringify(msg.error)}`);
    }
  }

  ws.close();
}

function send(ws, msg) {
  return new Promise((resolve) => {
    ws.send(JSON.stringify(msg));
    setTimeout(resolve, 100);
  });
}

checkDeployed().catch(console.error);
