# P0 REL1 — biến môi trường admission

| Tên biến | Ý nghĩa | Mặc định | Tác động khi tắt, thiếu hoặc để trống |
| --- | --- | --- | --- |
| `VIONA_LLM_PROVIDER_ADMISSION_ENABLED` | Opt-in phía server cho các caller đã nối admission gate. Chuỗi bật phải khớp chính xác parser của gate; đây không phải reservation hay hard-dollar cap. | Không khai báo: DENY. | DENY trước khi đọc key, tạo SDK hoặc gọi provider ở các caller đã nối gate. Các route trả lỗi hoặc fallback trung thực theo hợp đồng của chúng. |
| `VIONA_LLM_PROVIDER_ALLOWED_USER_IDS` | Danh sách CSV các identity phía server được phép; so khớp chính xác, không wildcard. | Không khai báo: DENY. | Policy không hợp lệ hoặc identity không được phép sẽ DENY, kể cả khi biến bật admission đã được cấu hình. |
| `VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES` | Danh sách CSV task type được gate hỗ trợ và cho phép; so khớp chính xác, không wildcard. | Không khai báo: DENY. | Policy không hợp lệ hoặc task không được phép sẽ DENY, kể cả khi biến bật admission đã được cấu hình. |
