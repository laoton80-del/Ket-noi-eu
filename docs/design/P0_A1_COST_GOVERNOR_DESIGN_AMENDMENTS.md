# P0-A1 Cost Governor Design Amendments

```text
PHỤ LỤC:
A1. AiCostOperation: unique (subjectId, idempotencyKey) thay cho (rail, idempotencyKey); thêm rail, windowStartDay (UTC), windowStartMonth (UTC), dispatchedAt (nullable), expiresAt, ngày tạo/cập nhật. Reserve và việc chốt bảo thủ sau này đều thuộc cửa sổ lúc đặt reserve (lưu trong operation), không trượt sang cửa sổ sau.
A2. Vòng đời: RESERVED -> DISPATCHING phải ghi bền (dispatchedAt) TRƯỚC khi gửi ra provider. RESERVED không có dispatchedAt quá TTL ngắn (mặc định 5 phút) nghĩa là chắc chắn chưa gửi, không còn chiếm slot in-flight, nhưng tiền reserve vẫn ở counter của cửa sổ gốc cho đến khi A1-RECON xử lý (không tự động release). Quy tắc này cũng áp dụng khi process chết trước markDispatching hoặc release thất bại. DISPATCHING không kết quả -> OUTCOME_UNKNOWN theo chính sách 24 giờ trong thiết kế.
A3. Nguồn idempotencyKey: có phạm vi theo subjectId; ưu tiên khóa do client gửi nếu có, nếu không server sinh một khóa cho mỗi lần gọi.
A4. Trần KHÔNG lưu trong DB hay seed; chỉ có biến môi trường ở gói runtime (thiếu hoặc 0 = DENY). Counter chỉ lưu reservedMicrousd và settledMicrousd.
A5. Reserve cho counter dùng câu lệnh có điều kiện nguyên tử (UPDATE ... WHERE settled + reserved + X <= cap RETURNING) cho các hàng đếm; gói A1-CORE phải có thêm test với PostgreSQL thật dùng một lần (50 reserve song song, tổng không bao giờ vượt trần).
A6. Thêm gói A1-AUTHORITY-RPC vào kế hoạch (route nội bộ trên Express với xác thực service-to-service, schema request/response) trước A1-FIREBASE.
A7. Thuật ngữ: dùng VIO/credit. KHÔNG đổi tên model/trường/bảng hiện có (Wallet, Transaction, balanceVIG, tokensBurned...).
```
