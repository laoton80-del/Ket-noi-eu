# P0 REL1 / REL2 — biến môi trường và giới hạn AI

| Tên biến | Ý nghĩa | Mặc định | Tác động khi tắt, thiếu hoặc để trống |
| --- | --- | --- | --- |
| `VIONA_LLM_PROVIDER_ADMISSION_ENABLED` | Opt-in phía server cho các caller đã nối admission gate. Chuỗi bật phải khớp chính xác parser của gate; đây không phải reservation hay hard-dollar cap. | Không khai báo: DENY. | DENY trước khi đọc key, tạo SDK hoặc gọi provider ở các caller đã nối gate. Các route trả lỗi hoặc fallback trung thực theo hợp đồng của chúng. |
| `VIONA_LLM_PROVIDER_ALLOWED_USER_IDS` | Danh sách CSV các identity phía server được phép; so khớp chính xác, không wildcard. | Không khai báo: DENY. | Policy không hợp lệ hoặc identity không được phép sẽ DENY, kể cả khi biến bật admission đã được cấu hình. |
| `VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES` | Danh sách CSV task type được gate hỗ trợ và cho phép; so khớp chính xác, không wildcard. | Không khai báo: DENY. | Policy không hợp lệ hoặc task không được phép sẽ DENY, kể cả khi biến bật admission đã được cấu hình. |

| Tên biến | Ý nghĩa | Mặc định | Tác động khi tắt, thiếu hoặc để trống |
| --- | --- | --- | --- |
| `AI_PROXY_BLOCK_ANONYMOUS` | Khi bật theo parser, cả `aiProxy` và `analyzeDocumentProxy` từ chối Firebase token có sign-in provider anonymous bằng 403 `anonymous_not_allowed`. | Tắt. | Giữ hành vi cho phép token anonymous hợp lệ; yêu cầu Auth và các kiểm tra khác vẫn áp dụng. |
| `AI_PROXY_EMULATOR_ALLOW_UNAUTHENTICATED` | Cờ dev cho phép `aiProxy` bỏ yêu cầu bearer token chỉ khi đang chạy Functions Emulator và đồng thời có yêu cầu bỏ Auth. | Tắt. | `aiProxy` vẫn yêu cầu đăng nhập. Cờ này không mở đường không Auth cho `analyzeDocumentProxy`. |
| `AI_PROXY_REQUIRE_AUTH` | Yêu cầu Auth của `aiProxy`; yêu cầu tắt chỉ có hiệu lực với `FUNCTIONS_EMULATOR` đúng chuỗi true và cờ dev bật. Ngoài điều kiện đó, ghi log error về cấu hình sai và vẫn yêu cầu đăng nhập. | Bật. | Ngoài emulator vẫn yêu cầu đăng nhập; trong emulator phải có cờ dev mới được bỏ qua token bị thiếu. Token sai vẫn bị từ chối. |

| Hằng số / cấu hình | Ý nghĩa | Mặc định / giá trị cố định | Khi không bật opt-in |
| --- | --- | --- | --- |
| `AI_PROXY_AUTH_BYPASS_REQUESTED` | Trạng thái suy ra từ yêu cầu tắt Auth. | false. | Không yêu cầu bypass. |
| `CHAT_MAX_OUTPUT_TOKENS` | Trần output token cho chat. | 512. | Luôn áp dụng. |
| `CHAT_MAX_IMAGE_PARTS` | Tổng số ảnh tối đa mỗi request chat. | 2. | Luôn áp dụng. |
| `ANALYZE_DOCUMENT_MAX_RPM` | Giới hạn document theo uid và scope riêng, tại từng instance. | 20. | Luôn áp dụng; trả 429 `rate_limited` khi hết lượt. |
| `ANALYZE_DOCUMENT_RATE_WINDOW_MS` | Cửa sổ rate limit document. | 60.000 ms. | Luôn áp dụng. |
| `ANALYZE_DOCUMENT_MAX_COUNTRY_CONTEXT_CHARS` | Độ dài tối đa của countryContext, kiểm tra trước prompt và Gemini. | 100 ký tự. | Vượt trần trả 400 `country_context_too_long`. |
| `ANALYZE_DOCUMENT_MAX_OUTPUT_TOKENS` | generationConfig.maxOutputTokens cho Gemini document. | 1024. | Luôn gửi trong request. |
| `aiProxy.maxInstances`, `analyzeDocumentProxy.maxInstances` | Cấu hình số instance tối đa cho từng hàm. | 10 mỗi hàm. | Cấu hình cố định; chỉ có hiệu lực sau bước build/deploy được duyệt riêng. |

Các giới hạn này không tắt AI, không phải admission gate của Firebase và không phải trần chi tiêu bằng tiền. Rate limit lưu trong bộ nhớ từng instance, không phải quota toàn cục. Cần build lại `functions/lib` trước khi deploy; REL2 không thực hiện build hoặc deploy.
