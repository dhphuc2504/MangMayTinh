const WebSocket = require('ws');


// Khởi tạo WebSocket server
const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket server running on ws://localhost:8080');
});

// Biến giữ client
let webClient = null;
let agentClient = null; // agent cố định "cpp_server"

wss.on("connection", (ws) => {
  console.log("A client connected. Waiting for register...");

  ws.role = null;

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.log("Invalid JSON:", msg);
      return; // ignore non-JSON messages
    }

    // Handle registration
    if (data.type === "register") {
      ws.role = data.role;
      console.log("Client registered as:", ws.role);

      if (ws.role === "web_client") {
        webClient = ws;
        console.log("Web client connected");
      } else if (ws.role === "agent") {
        agentClient = ws;
        console.log("Agent (cpp_server) connected");
      } else {
        console.log("Unknown role, disconnecting");
        ws.close();
      }
      return;
    }

    // --- ROUTING LOGIC ---
    if (ws === webClient && agentClient) {
      agentClient.send(msg);
    } else if (ws === agentClient && webClient) {
      webClient.send(msg);
    }
  });

  ws.on('close', () => {
    console.log(`${ws.role} disconnected`);
    if (ws.role === 'web_client') webClient = null;
    if (ws.role === 'agent') agentClient = null;
  });
});