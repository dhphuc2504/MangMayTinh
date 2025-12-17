Sửa đổi UI và chỉnh sửa cơ chế hoạt động của gateway.
Gateway sẽ hoạt động theo cách tạo các endpoint và web client cần gửi lệnh vào các endpoint đó (xem rõ hơn ở file JSON_packet)
Thêm cơ chế auto quit (quit theo ngữ cảnh):
Gateway sẽ lưu giữ trạng thái hiện tại của server(ví dụ như APPLICATION), nếu mà nhận lệnh mới từ web client từ nhóm khác(ví dụ như nhóm PROCESS) thì sẽ tự động gửi lệnh QUIT về server trước khi gửi lệnh của web client đến server.
Coi như message từ server gửi đến web sẽ có dạng như sau: 
{
  type: 
  data: 
}