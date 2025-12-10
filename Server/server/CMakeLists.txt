cmake_minimum_required(VERSION 3.16)

project(Server LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(OpenCV REQUIRED)
include_directories(${OpenCV_INCLUDE_DIRS})
include_directories(../lib)  # Thư mục chứa service.h

set(SOURCES
    service/server.cpp
    service/capture_photo.cpp
    service/download_file.cpp
    service/list_apps.cpp
    service/list_process.cpp
    service/record_video.cpp
    service/restart.cpp
    service/shutdown.cpp
    service/start_app.cpp
    service/start_process.cpp
    service/stop_app.cpp
    service/stop_process.cpp
    service/key_logger.cpp
   
)

add_executable(server ${SOURCES})

 #Link thư viện cần thiết
target_link_libraries(server PRIVATE
    ws2_32        # WinSock
    ${OpenCV_LIBS}
)
