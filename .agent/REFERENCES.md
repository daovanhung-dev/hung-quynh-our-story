# Nguồn tham khảo cho context AI

Các nguồn dưới đây góp ý về cấu trúc bộ context. Chúng không thay thế yêu cầu của người dùng hoặc hành vi hiện tại trong repo.

| Nguồn | Cách áp dụng |
| --- | --- |
| [Định dạng mở AGENTS.md](https://agents.md/) | Dùng Markdown thuần làm hướng dẫn dùng chung: tổng quan, lệnh, quy ước, bảo mật và triển khai. |
| [Hướng dẫn prompting Codex của OpenAI](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide) | Đặt chỉ dẫn dự án ở file context gốc mà agent tìm thấy; làm rõ phạm vi áp dụng của hướng dẫn cục bộ. |
| [Hướng dẫn tùy chỉnh Copilot CLI của GitHub](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions) | Tách chỉ dẫn toàn repo khỏi chi tiết chỉ cần cho một task; Copilot CLI hỗ trợ `AGENTS.md` như một nguồn hướng dẫn trong repo. |
| [Custom agents của GitHub](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/invoke-custom-agents) | Giao chuyên môn với phạm vi cụ thể và bàn giao rõ ràng. Context repo có thể không tự truyền tới mọi subagent, vì vậy hãy gửi đúng tài liệu cùng ràng buộc. |
| [Memory và `AGENTS.md` trong Claude Code](https://code.claude.com/docs/en/memory) | Claude Code hiện có thể đọc `AGENTS.md`; giữ hướng dẫn bền vững ngắn gọn và chỉ nạp chi tiết theo chủ đề khi cần. |
| [File context của Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html) | Cấu hình `context.fileName` để Gemini CLI dùng chung `AGENTS.md`, tránh duy trì một bộ hướng dẫn trùng lặp. |
| [Kiến trúc context của Google ADK](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/) | Tách thông tin dự án bền vững khỏi context theo task; chỉ gửi cho chuyên gia phần context nhỏ nhất đủ dùng và tóm tắt bằng chứng. |
| [Custom workflows của GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) | Build site tĩnh, upload Pages artifact và deploy với environment cùng permissions/OIDC phù hợp. |

## Cách duy trì

- Các trang này mô tả mẫu sử dụng, không đảm bảo mọi phiên bản client hoạt động giống nhau. Kiểm tra tài liệu nền tảng khi đổi cấu hình adapter hoặc quy tắc tìm file context.
- Cập nhật bảng khi nguồn chuyển chỗ hoặc thay đổi đáng kể. Ưu tiên tài liệu chính thức của nền tảng thay vì ví dụ cộng đồng.
- Phân biệt nguồn trích dẫn với sự thật của repo: tài liệu ngoài nói về khả năng nền tảng; code và workflow của dự án quyết định hành vi thực tế ở đây.
