const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // install with npm install uuid

const ws = new WebSocket('ws://janusgraph1:8182/gremlin', {
  origin: 'http://localhost',
  headers: {
    'Sec-WebSocket-Protocol': 'v1.0'
  }
});

ws.on('open', () => {
  const message = {
    requestId: uuidv4(),
    op: 'eval',
    processor: '',
    args: {
      gremlin: '1+1',
      bindings: {},
      language: 'gremlin-groovy'
    }
  };
  console.log("Sending request");

  ws.send(JSON.stringify(message));
});

ws.on('message', msg => {
  const res = JSON.parse(msg);
  if (res.status.code === 200) {
    console.log('Healthy');
    process.exit(0);
  } else {
    console.error('Unhealthy:', res.status);
    process.exit(1);
  }
});

ws.on('error', err => {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});
