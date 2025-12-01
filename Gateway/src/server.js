const WebSocket = require('ws');

// Khởi tạo WebSocket server
const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket server running on ws://localhost:8080');
});

// Biến giữ client
let webClient = null;
let agentClient = null; // agent cố định "cpp_server"

wss.on('connection', (ws, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const role = params.get('role');

  if (role === 'web') {
    webClient = ws;
    console.log('Web client connected');
  } else if (role === 'agent') {
    agentClient = ws;
    console.log('Agent (cpp_server) connected');
  } else {
    console.log('Unknown client role, closing connection');
    ws.close();
    return;
  }

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch (e) {
      console.log('Invalid JSON received:', msg.toString());
      return;
    }

    // Nếu message từ web client
  if (ws === webClient) {
    if (agentClient && agentClient.readyState === WebSocket.OPEN) {
      agentClient.send(msg);
    } else {
      console.log('Agent not connected yet, cannot forward');
    }
  }

  // Nếu message từ agent client
  else if (ws === agentClient) {
    if (webClient && webClient.readyState === WebSocket.OPEN) {
      webClient.send(msg);
    } else {
      console.log('Web client not connected yet, cannot forward');
    }
  }
  });

  ws.on('close', () => {
    console.log(`${role} disconnected`);
    if (role === 'web') webClient = null;
    if (role === 'agent') agentClient = null;
  });
});