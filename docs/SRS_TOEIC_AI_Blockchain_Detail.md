# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

## Nền tảng Hỗ trợ Học TOEIC bằng AI & Cấp/Xác minh Chứng chỉ Blockchain

| Thông tin              | Chi tiết                                                     |
| ---------------------- | ------------------------------------------------------------ |
| **Phiên bản tài liệu** | 2.0                                                          |
| **Ngày cập nhật**      | 17/03/2026                                                   |
| **Trạng thái**         | Draft – Chờ review                                           |
| **Tác giả**            | Tiến Đạt                                                     |
| **Đối tượng đọc**      | Product Owner, Developer, Designer, QA, DevOps, Stakeholders |

---

## Mục lục

1. [Giới thiệu & Thông tin chung](#1-giới-thiệu--thông-tin-chung)
2. [Bối cảnh & Phân tích vấn đề](#2-bối-cảnh--phân-tích-vấn-đề)
3. [Nhóm liên quan (Stakeholders)](#3-nhóm-liên-quan-stakeholders)
4. [Chân dung người dùng (Personas)](#4-chân-dung-người-dùng-personas)
5. [Hành trình người dùng (User Journeys)](#5-hành-trình-người-dùng-user-journeys)
6. [Yêu cầu chức năng (Functional Requirements)](#6-yêu-cầu-chức-năng-functional-requirements)
7. [Yêu cầu phi chức năng (Non-Functional Requirements)](#7-yêu-cầu-phi-chức-năng-non-functional-requirements)
8. [Kiến trúc hệ thống](#8-kiến-trúc-hệ-thống)
9. [Thiết kế API chi tiết](#9-thiết-kế-api-chi-tiết)
10. [Mô hình dữ liệu](#10-mô-hình-dữ-liệu)
11. [Thuật toán & AI Engine](#11-thuật-toán--ai-engine)
12. [Blockchain & Hệ thống Danh tính Phi tập trung](#12-blockchain--hệ-thống-danh-tính-phi-tập-trung)
13. [Bảo mật & Tuân thủ](#13-bảo-mật--tuân-thủ)
14. [Khả năng quan sát & Vận hành](#14-khả-năng-quan-sát--vận-hành)
15. [Tiêu chí chấp nhận & User Stories](#15-tiêu-chí-chấp-nhận--user-stories)
16. [Kế hoạch kiểm thử](#16-kế-hoạch-kiểm-thử)
17. [Lộ trình phát triển (Roadmap)](#17-lộ-trình-phát-triển-roadmap)
18. [Phân tích rủi ro & Giảm thiểu](#18-phân-tích-rủi-ro--giảm-thiểu)
19. [Tiêu chí thành công & KPI](#19-tiêu-chí-thành-công--kpi)
20. [Wireframe & Luồng UI](#20-wireframe--luồng-ui)
21. [Phụ lục](#21-phụ-lục)

---

## 1. Giới thiệu & Thông tin chung

### 1.1. Mục đích tài liệu

Tài liệu này đặc tả toàn bộ yêu cầu phần mềm cho **Nền tảng hỗ trợ học TOEIC bằng AI với hệ thống cấp và xác minh chứng chỉ bảo mật bằng Blockchain**. Tài liệu phục vụ làm cơ sở chung cho toàn bộ team phát triển (Product, Engineering, Design, QA, DevOps) trong suốt vòng đời dự án từ thiết kế, phát triển, kiểm thử đến triển khai và vận hành.

### 1.2. Phạm vi tài liệu

Tài liệu bao gồm:

- Yêu cầu chức năng và phi chức năng đầy đủ
- Thiết kế kiến trúc hệ thống ở cấp high-level và mid-level
- Đặc tả API cho từng microservice
- Mô hình dữ liệu chi tiết (ERD)
- Thiết kế thuật toán AI và Blockchain
- Kế hoạch kiểm thử, bảo mật, vận hành
- Lộ trình phát triển theo giai đoạn
- Wireframe và luồng UI chính

### 1.3. Tên dự án

**TOEIC AI Learning Platform** (Tên nội bộ: `toeic-ai`)

### 1.4. Đối tượng chính

| Đối tượng                        | Mô tả                                                             |
| -------------------------------- | ----------------------------------------------------------------- |
| Sinh viên đại học/cao đẳng       | Cần đạt chuẩn TOEIC để tốt nghiệp (thường 450-600+)               |
| Người đi làm                     | Cần nâng điểm TOEIC cho thăng tiến, chuyển việc (thường 700-900+) |
| Giảng viên / Trung tâm ngoại ngữ | Quản lý nội dung, theo dõi tiến độ học viên, tổ chức thi          |
| Nhà tuyển dụng / Đối tác         | Xác minh chứng chỉ TOEIC của ứng viên                             |

### 1.5. Mục tiêu tổng quát

| #   | Mục tiêu                         | Mô tả chi tiết                                                                                                                                                    |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Cá nhân hóa lộ trình học         | AI phân tích năng lực, điểm mạnh/yếu của từng người học để tạo lộ trình TOEIC phù hợp nhất, bao gồm cả Listening & Reading (MVP), mở rộng Speaking & Writing (v2) |
| G2  | Chấm điểm & phân tích thông minh | Tự động chấm điểm, phân tích lỗi theo từng kỹ năng vi mô, giải thích đáp án bằng AI, gợi ý bài tập bù phù hợp                                                     |
| G3  | Tổ chức thi & đánh giá           | Cung cấp hệ thống thi thử mô phỏng format TOEIC mới nhất, có thể mở rộng thành nền tảng thi chính thức cho các tổ chức                                            |
| G4  | Chứng chỉ số bất biến            | Phát hành chứng chỉ số (Verifiable Credential) bảo mật, chống giả mạo bằng Blockchain, cho phép xác minh tức thời                                                 |
| G5  | Xác minh minh bạch               | Bất kỳ tổ chức/nhà tuyển dụng nào đều có thể xác minh chứng chỉ tức thời, không cần đăng nhập, thông qua QR code hoặc link verify                                 |

### 1.6. Phạm vi MVP (Minimum Viable Product)

**Bao gồm (In-scope):**

- Web application (responsive, hỗ trợ desktop và mobile browser)
- Hệ thống đăng ký/đăng nhập (email + password, Google SSO, OTP)
- Bài khảo sát đầu vào (Placement Test) để đánh giá trình độ
- Luyện tập câu hỏi theo Part 1-7 (Listening & Reading) với AI giải thích
- Thi thử full TOEIC (200 câu L&R) có đồng hồ đếm ngược
- Dashboard tiến độ học tập với biểu đồ
- Hệ thống quản trị nội dung (import câu hỏi, gắn thẻ, tạo đề)
- Cấp chứng chỉ số (Verifiable Credential) trên blockchain testnet
- Trang xác minh chứng chỉ công khai (không cần đăng nhập)
- Ví danh tính DID managed (server-side) với khả năng export key
- CI/CD, logging, monitoring cơ bản

**Không bao gồm trong MVP (Out-of-scope):**

- Mobile native app (React Native/Flutter)
- Speaking & Writing assessment (ASR/TTS)
- Hệ thống thanh toán / billing
- Anti-cheat nâng cao (proctoring, face detection)
- Ví người dùng tự quản (WalletConnect)
- Mainnet deployment
- Bảng xếp hạng / Gamification nâng cao
- Tích hợp LMS bên thứ ba

### 1.7. Thuật ngữ & Từ viết tắt

| Viết tắt    | Đầy đủ                                | Giải thích                               |
| ----------- | ------------------------------------- | ---------------------------------------- |
| **AI**      | Artificial Intelligence               | Trí tuệ nhân tạo                         |
| **ASR**     | Automatic Speech Recognition          | Nhận dạng giọng nói tự động              |
| **TTS**     | Text-to-Speech                        | Chuyển văn bản thành giọng nói           |
| **VC**      | Verifiable Credential                 | Chứng chỉ xác minh được (theo chuẩn W3C) |
| **DID**     | Decentralized Identifier              | Định danh phi tập trung                  |
| **LMS**     | Learning Management System            | Hệ thống quản lý học tập                 |
| **MVP**     | Minimum Viable Product                | Sản phẩm khả thi tối thiểu               |
| **IRT**     | Item Response Theory                  | Lý thuyết phản hồi câu hỏi               |
| **BKT**     | Bayesian Knowledge Tracing            | Theo dõi kiến thức Bayesian              |
| **SRS**     | Spaced Repetition System              | Hệ thống lặp lại cách quãng              |
| **EVM**     | Ethereum Virtual Machine              | Máy ảo Ethereum                          |
| **IPFS**    | InterPlanetary File System            | Hệ thống lưu trữ phi tập trung           |
| **RBAC**    | Role-Based Access Control             | Kiểm soát truy cập theo vai trò          |
| **PII**     | Personally Identifiable Information   | Thông tin nhận dạng cá nhân              |
| **MAU/DAU** | Monthly/Daily Active Users            | Người dùng hoạt động tháng/ngày          |
| **L&R**     | Listening & Reading                   | Nghe và Đọc                              |
| **S&W**     | Speaking & Writing                    | Nói và Viết                              |
| **WCAG**    | Web Content Accessibility Guidelines  | Hướng dẫn truy cập nội dung web          |
| **OWASP**   | Open Web Application Security Project | Dự án bảo mật ứng dụng web mở            |
| **KMS**     | Key Management Service                | Dịch vụ quản lý khóa mã hóa              |

### 1.8. Tài liệu tham chiếu

| Tài liệu                                  | Mô tả                                 |
| ----------------------------------------- | ------------------------------------- |
| TOEIC Test Format (ETS)                   | Format bài thi TOEIC chính thức L&R   |
| W3C Verifiable Credentials Data Model 1.1 | Chuẩn VC cho chứng chỉ số             |
| W3C Decentralized Identifiers (DIDs) v1.0 | Chuẩn DID cho danh tính phi tập trung |
| OWASP Top 10 (2021)                       | Top 10 lỗ hổng bảo mật web            |
| WCAG 2.1 AA                               | Tiêu chuẩn truy cập web               |

---

## 2. Bối cảnh & Phân tích vấn đề

### 2.1. Thực trạng thị trường

Thị trường luyện thi TOEIC tại Việt Nam hiện có nhiều vấn đề:

**Về phía người học:**

- Lộ trình học thường được thiết kế chung cho tất cả, không phân biệt điểm mạnh/yếu cá nhân, dẫn đến lãng phí thời gian ôn những phần đã giỏi và thiếu tập trung vào phần yếu
- Việc thi thử thường rời rạc, trên nhiều nền tảng khác nhau, khó theo dõi tiến bộ theo thời gian
- Phản hồi sau khi làm bài thường chỉ dừng ở đáp án đúng/sai, thiếu giải thích chi tiết tại sao sai và cách cải thiện
- Không có hệ thống gợi ý bài tập bù dựa trên lỗ hổng kiến thức cụ thể

**Về phía tổ chức giáo dục:**

- Quản lý ngân hàng câu hỏi thủ công, khó gắn thẻ và phân loại hiệu quả
- Thiếu công cụ phân tích dữ liệu học tập của sinh viên ở cấp độ kỹ năng vi mô
- Quy trình cấp chứng nhận/chứng chỉ nội bộ tốn thời gian và dễ bị giả mạo

**Về phía nhà tuyển dụng:**

- Quá trình xác minh chứng chỉ TOEIC thủ công, phải liên hệ trung tâm, mất thời gian
- Rủi ro chứng chỉ giả mạo không thể phát hiện ngay
- Không có kênh xác minh tức thời, tự động

### 2.2. Giải pháp đề xuất

Nền tảng giải quyết ba vấn đề cốt lõi thông qua ba trụ cột công nghệ:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOEIC AI LEARNING PLATFORM                   │
├───────────────────┬──────────────────┬──────────────────────────┤
│   TRỤ CỘT 1:     │   TRỤ CỘT 2:    │   TRỤ CỘT 3:            │
│   AI Engine       │   Assessment     │   Blockchain Credential  │
│                   │   Engine         │                          │
│ • Phân tích năng  │ • Kho câu hỏi   │ • Chứng chỉ số VC/DID   │
│   lực cá nhân     │   thông minh     │ • Hash bất biến on-chain │
│ • Lộ trình thích  │ • Thi thử mô    │ • Verify tức thời        │
│   ứng (IRT/BKT)   │   phỏng TOEIC   │ • Chống giả mạo 100%    │
│ • Giải thích đáp  │ • Chấm điểm     │ • QR/Link công khai      │
│   án chi tiết     │   real-time      │ • Revoke/Expire minh     │
│ • Gợi ý bài tập  │ • Analytics theo │   bạch                   │
│   bù thông minh   │   kỹ năng vi mô │                          │
└───────────────────┴──────────────────┴──────────────────────────┘
```

### 2.3. Lợi ích kỳ vọng

| Đối tượng          | Lợi ích                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Người học**      | Tiết kiệm 30-40% thời gian ôn luyện nhờ lộ trình cá nhân hóa; hiểu rõ điểm yếu qua phân tích AI; có chứng chỉ số uy tín để sử dụng xin việc |
| **Giảng viên**     | Giảm 60% thời gian soạn đề và chấm bài; có báo cáo phân tích lớp chi tiết; dễ dàng quản lý ngân hàng câu hỏi                                |
| **Tổ chức**        | Tự động hóa quy trình cấp chứng chỉ; giảm rủi ro giả mạo; nâng cao uy tín thương hiệu                                                       |
| **Nhà tuyển dụng** | Xác minh chứng chỉ trong < 2 giây; không cần đăng nhập; minh bạch và đáng tin cậy                                                           |

---

## 3. Nhóm liên quan (Stakeholders)

### 3.1. Bảng phân loại Stakeholders

| Vai trò                          | Mô tả                                       | Quyền hạn chính                                                     | Mức độ ưu tiên |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- | -------------- |
| **Learner (Học viên)**           | Sinh viên, người đi làm cần luyện thi TOEIC | Học, luyện, thi thử, nhận chứng chỉ, quản lý hồ sơ cá nhân          | Cao nhất       |
| **Instructor (Giảng viên)**      | Giáo viên, giảng viên dạy TOEIC             | Soạn câu hỏi, gắn thẻ, tạo đề, xem thống kê lớp                     | Cao            |
| **Content Curator**              | Chuyên gia nội dung, biên tập viên          | Duyệt nội dung, kiểm soát chất lượng câu hỏi, quản lý ngân hàng đề  | Cao            |
| **Org Admin (Quản trị tổ chức)** | Trưởng khoa, giám đốc trung tâm ngoại ngữ   | Quản lý lớp, kỳ thi, phê duyệt cấp chứng chỉ, xem báo cáo tổng quan | Cao            |
| **Verifier (Người xác minh)**    | Nhà tuyển dụng, HR, đối tác                 | Xác minh chứng chỉ qua QR/link (không cần đăng nhập)                | Trung bình     |
| **System Admin**                 | Quản trị hệ thống                           | Quản lý cấu hình, user, quyền, giám sát hệ thống                    | Trung bình     |
| **DevOps Engineer**              | Vận hành kỹ thuật                           | CI/CD, monitoring, deployment, incident response                    | Trung bình     |

### 3.2. Ma trận RACI (Responsible – Accountable – Consulted – Informed)

| Hoạt động           | Learner | Instructor | Curator | Org Admin | Verifier | Sys Admin |
| ------------------- | ------- | ---------- | ------- | --------- | -------- | --------- |
| Đăng ký/Đăng nhập   | R       | R          | R       | R         | -        | A         |
| Làm bài placement   | R       | I          | -       | I         | -        | -         |
| Luyện tập câu hỏi   | R       | I          | -       | I         | -        | -         |
| Thi thử mock test   | R       | I          | -       | A         | -        | -         |
| Soạn câu hỏi        | -       | R          | A       | I         | -        | -         |
| Duyệt nội dung      | -       | C          | R       | A         | -        | -         |
| Tạo kỳ thi          | -       | R          | C       | A         | -        | -         |
| Phê duyệt chứng chỉ | I       | C          | -       | R/A       | -        | -         |
| Xác minh chứng chỉ  | I       | -          | -       | I         | R        | -         |
| Quản lý hệ thống    | -       | -          | -       | C         | -        | R/A       |

---

## 4. Chân dung người dùng (Personas)

### 4.1. Persona 1: Minh – Sinh viên năm 3

| Thuộc tính              | Chi tiết                                                      |
| ----------------------- | ------------------------------------------------------------- |
| **Tuổi**                | 21                                                            |
| **Nghề nghiệp**         | Sinh viên ĐH Bách Khoa, ngành CNTT                            |
| **Mục tiêu TOEIC**      | 700+ (yêu cầu tốt nghiệp)                                     |
| **Deadline**            | 3 tháng                                                       |
| **Trình độ hiện tại**   | ~500 (ước lượng), mạnh Reading, yếu Listening                 |
| **Thiết bị**            | Chủ yếu smartphone, thỉnh thoảng laptop                       |
| **Thói quen học**       | Học ngắn (15-30 phút/lần) xen kẽ giữa các tiết, buổi tối 1-2h |
| **Pain points**         | Không biết bắt đầu từ đâu, sợ nghe tiếng Anh, thiếu động lực  |
| **Kỳ vọng**             | Lộ trình rõ ràng theo ngày, bài ngắn, có thông báo nhắc học   |
| **Hành vi kỹ thuật số** | Quen dùng app, thích giao diện đơn giản, hay dùng mạng xã hội |

**Câu chuyện (Scenario):** Minh cần 700+ TOEIC để tốt nghiệp trong 3 tháng tới. Anh từng tự học trên YouTube nhưng không biết mình yếu phần nào nhất. Anh muốn một hệ thống tự đánh giá trình độ, gợi ý bài học theo ngày, và cho biết liệu mình đang đi đúng hướng không.

### 4.2. Persona 2: Lan – Người đi làm

| Thuộc tính              | Chi tiết                                                                          |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Tuổi**                | 28                                                                                |
| **Nghề nghiệp**         | Nhân viên kế toán tại công ty đa quốc gia                                         |
| **Mục tiêu TOEIC**      | 800+ (xét thăng tiến lên Senior)                                                  |
| **Deadline**            | 6 tháng                                                                           |
| **Trình độ hiện tại**   | ~650, khá đều các part, yếu Part 7 (đọc hiểu dài)                                 |
| **Thiết bị**            | Laptop tại nhà, tablet đi công tác                                                |
| **Thói quen học**       | Buổi tối 20h-22h (sau khi con ngủ), cuối tuần 2-3h                                |
| **Pain points**         | Thời gian hạn chế, cần báo cáo tiến độ rõ ràng để biết mình có kịp deadline không |
| **Kỳ vọng**             | Dashboard tiến độ chi tiết, so sánh các lần thi thử, phân tích cụ thể Part 7      |
| **Hành vi kỹ thuật số** | Quen dùng công cụ văn phòng, thích giao diện chuyên nghiệp, gọn gàng              |

**Câu chuyện (Scenario):** Lan đã có 650 nhưng cần đạt 800 để thăng tiến. Chị có ít thời gian nên cần tập trung đúng điểm yếu. Chị muốn mỗi tuần biết mình tiến bộ bao nhiêu điểm và liệu có kịp deadline 6 tháng không.

### 4.3. Persona 3: Thầy Dũng – Giảng viên

| Thuộc tính                | Chi tiết                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| **Tuổi**                  | 42                                                                                        |
| **Nghề nghiệp**           | Giảng viên tiếng Anh tại ĐH Kinh tế                                                       |
| **Vai trò trên hệ thống** | Instructor / Content Curator                                                              |
| **Số lớp quản lý**        | 3-4 lớp/kỳ, mỗi lớp 40-60 sinh viên                                                       |
| **Pain points**           | Mất nhiều giờ soạn đề và chấm bài; không thể theo dõi từng sinh viên; câu hỏi lưu rải rác |
| **Kỳ vọng**               | Import câu hỏi hàng loạt, tạo đề nhanh, xem thống kê lớp chi tiết, cấp chứng nhận tự động |
| **Hành vi kỹ thuật số**   | Dùng laptop, quen Excel, muốn giao diện trực quan                                         |

**Câu chuyện (Scenario):** Thầy Dũng có ngân hàng 2000+ câu hỏi TOEIC trong Excel. Thầy muốn import hàng loạt lên hệ thống, tự động gắn thẻ, và tạo đề thi cho sinh viên. Sau kỳ thi, thầy muốn xem báo cáo sinh viên nào đạt ngưỡng 700 để cấp chứng nhận.

### 4.4. Persona 4: HR Hạnh – Verifier

| Thuộc tính                | Chi tiết                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **Tuổi**                  | 35                                                                                     |
| **Nghề nghiệp**           | Trưởng phòng HR tại công ty công nghệ                                                  |
| **Vai trò trên hệ thống** | Verifier (không cần tài khoản)                                                         |
| **Tần suất sử dụng**      | 5-10 lần/tháng (mỗi đợt tuyển dụng)                                                    |
| **Pain points**           | Mất 2-3 ngày để xác minh chứng chỉ TOEIC qua kênh truyền thống; từng gặp chứng chỉ giả |
| **Kỳ vọng**               | Xác minh trong 30 giây, không cần tạo tài khoản, kết quả rõ ràng                       |
| **Hành vi kỹ thuật số**   | Dùng laptop, hay dùng email và HR software                                             |

**Câu chuyện (Scenario):** Hạnh nhận được CV của ứng viên kèm QR code chứng chỉ TOEIC 815. Chị quét QR trên điện thoại, hệ thống hiển thị ngay: Valid, Issuer: ĐH Kinh tế, Score: 815, Date: 27/02/2025. Chỉ mất 10 giây.

### 4.5. Persona 5: Admin Tuấn – Quản trị tổ chức

| Thuộc tính                | Chi tiết                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------ |
| **Tuổi**                  | 45                                                                                   |
| **Nghề nghiệp**           | Giám đốc Trung tâm Ngoại ngữ trường ĐH                                               |
| **Vai trò trên hệ thống** | Org Admin                                                                            |
| **Trách nhiệm**           | Phê duyệt cấp chứng chỉ, quản lý giảng viên, theo dõi KPI trung tâm                  |
| **Pain points**           | Quy trình cấp giấy chứng nhận thủ công, tốn giấy, dễ mất; không có dữ liệu tổng quan |
| **Kỳ vọng**               | Dashboard tổng quan, phê duyệt hàng loạt, audit trail đầy đủ                         |

---

## 5. Hành trình người dùng (User Journeys)

### 5.1. Journey 1: Learner – Từ đăng ký đến nhận chứng chỉ

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. Đăng  │───>│ 2. Khảo  │───>│ 3. Nhận  │───>│ 4. Học   │
│    ký    │    │ sát đầu  │    │ lộ trình │    │ bài tập  │
│          │    │ vào      │    │ cá nhân  │    │ vi mô    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
┌──────────┐    ┌──────────┐    ┌──────────┐          │
│ 8. Chia  │<───│ 7. Nhận  │<───│ 6. Hoàn  │<───┌──────────┐
│ sẻ link  │    │ chứng    │    │ thành    │    │ 5. Thi   │
│ verify   │    │ chỉ số   │    │ khóa     │    │ thử định │
└──────────┘    └──────────┘    └──────────┘    │ kỳ       │
                                                └──────────┘
```

**Chi tiết từng bước:**

| Bước | Hành động                                 | Hệ thống phản hồi                           | Touchpoint           |
| ---- | ----------------------------------------- | ------------------------------------------- | -------------------- |
| 1    | Đăng ký bằng email/Google                 | Xác nhận email, tạo tài khoản               | Web – Trang đăng ký  |
| 2    | Làm bài khảo sát 20-40 câu                | Đánh giá năng lực theo Part & kỹ năng vi mô | Web – Placement Test |
| 3    | Xem lộ trình được AI tạo                  | Hiển thị modules, thời lượng, cột mốc       | Web – Dashboard      |
| 4    | Làm bài tập hàng ngày theo gợi ý          | Chấm điểm, giải thích AI, ghi nhận tiến độ  | Web – Practice       |
| 5    | Thi thử full TOEIC định kỳ (2-4 tuần/lần) | Điểm ước lượng, phân tích chi tiết, so sánh | Web – Mock Test      |
| 6    | Đạt ngưỡng điểm (VD: ≥700)                | Thông báo đủ điều kiện nhận chứng chỉ       | Web – Dashboard      |
| 7    | Admin phê duyệt, hệ thống cấp VC          | Nhận email + thông báo, credential trong ví | Web – Credential     |
| 8    | Copy link verify / tải QR                 | Gửi cho nhà tuyển dụng hoặc đăng LinkedIn   | Web – Profile        |

### 5.2. Journey 2: Instructor/Curator – Quản lý nội dung & tổ chức thi

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. Đăng  │───>│ 2. Import│───>│ 3. Gắn   │───>│ 4. Tạo   │
│ nhập     │    │ câu hỏi  │    │ thẻ &    │    │ đề thi   │
│          │    │ (CSV/    │    │ duyệt    │    │          │
│          │    │ JSON)    │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
┌──────────┐    ┌──────────┐    ┌──────────┐          │
│ 8. Xem   │<───│ 7. Phê   │<───│ 6. Xem   │<───┌──────────┐
│ thống kê │    │ duyệt cấp│    │ kết quả  │    │ 5. Mở kỳ │
│ chi tiết │    │ chứng chỉ│    │ thi      │    │ thi cho  │
└──────────┘    └──────────┘    └──────────┘    │ học viên │
                                                └──────────┘
```

**Chi tiết từng bước:**

| Bước | Hành động                                               | Mô tả                                                           |
| ---- | ------------------------------------------------------- | --------------------------------------------------------------- |
| 1    | Đăng nhập với vai trò Instructor                        | Được chuyển đến Instructor Dashboard                            |
| 2    | Import ngân hàng câu hỏi từ file CSV/Excel/JSON         | Hệ thống validate format, báo lỗi nếu có, preview trước khi lưu |
| 3    | Gắn thẻ hàng loạt (Part, chủ đề, độ khó, kỹ năng vi mô) | UI kéo-thả/multi-select, AI gợi ý thẻ tự động                   |
| 4    | Tạo đề thi (chọn manual hoặc AI tự sinh adaptive)       | Preview đề, kiểm tra phân bố câu hỏi                            |
| 5    | Mở kỳ thi cho nhóm/lớp học viên                         | Cấu hình thời gian, format, anti-cheat                          |
| 6    | Xem kết quả thi của từng học viên và lớp                | Biểu đồ phân bố điểm, phân tích theo Part                       |
| 7    | Chọn học viên đạt ngưỡng, phê duyệt cấp chứng chỉ       | Danh sách batch, nút phê duyệt hàng loạt                        |
| 8    | Xem thống kê chi tiết lớp theo thời gian                | Xu hướng điểm, câu hỏi khó nhất, completion rate                |

### 5.3. Journey 3: Verifier – Xác minh chứng chỉ

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 1. Nhận QR   │───>│ 2. Scan QR   │───>│ 3. Xem kết   │
│ hoặc link    │    │ hoặc nhập    │    │ quả xác minh │
│ từ ứng viên  │    │ mã chứng chỉ │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

**Chi tiết:**

| Bước | Hành động                                                        | Hệ thống phản hồi                                                                      |
| ---- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1    | Nhận QR code / link verify từ ứng viên (qua email, CV, LinkedIn) | -                                                                                      |
| 2    | Truy cập link hoặc scan QR → redirect đến trang verify           | Trang verify không yêu cầu đăng nhập                                                   |
| 3    | Hệ thống kiểm tra on-chain + off-chain                           | Hiển thị: trạng thái (Valid/Revoked/Expired), tên issuer, ngày cấp, điểm, loại bài thi |

### 5.4. Journey 4: Org Admin – Quản lý & phê duyệt

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. Xem   │───>│ 2. Quản  │───>│ 3. Tạo   │───>│ 4. Phê   │
│ Dashboard│    │ lý giảng │    │ kỳ thi   │    │ duyệt    │
│ tổng quan│    │ viên &   │    │ chính    │    │ chứng chỉ│
│          │    │ lớp học  │    │ thức     │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                ┌──────────┐    ┌──────────┐          │
                │ 6. Xuất  │<───│ 5. Theo  │<─────────┘
                │ báo cáo  │    │ dõi KPI  │
                └──────────┘    └──────────┘
```

---

## 6. Yêu cầu chức năng (Functional Requirements)

### 6.1. Module: Xác thực & Quản lý danh tính (AUTH)

#### FR-AUTH-001: Đăng ký tài khoản

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-AUTH-001                                                                                                                                                                                                                                             |
| **Mô tả**          | Người dùng có thể đăng ký tài khoản mới bằng email + mật khẩu hoặc qua Google SSO                                                                                                                                                                       |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                                                                                                         |
| **Actor**          | Learner, Instructor, Admin                                                                                                                                                                                                                              |
| **Precondition**   | Email chưa được đăng ký                                                                                                                                                                                                                                 |
| **Postcondition**  | Tài khoản được tạo, email xác nhận được gửi                                                                                                                                                                                                             |
| **Business Rules** | - Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt<br>- Email phải hợp lệ và chưa tồn tại trong hệ thống<br>- Gửi OTP xác minh email trong 5 phút<br>- Tài khoản ở trạng thái `pending_verification` cho đến khi xác minh email |
| **Luồng chính**    | 1. User nhập email, mật khẩu, họ tên<br>2. Hệ thống validate input<br>3. Gửi OTP qua email<br>4. User nhập OTP<br>5. Hệ thống kích hoạt tài khoản<br>6. Redirect đến trang profile setup                                                                |
| **Luồng thay thế** | Google SSO: click "Đăng nhập bằng Google" → OAuth consent → tạo tài khoản (bỏ qua OTP)                                                                                                                                                                  |
| **Luồng ngoại lệ** | - Email đã tồn tại → hiển thị lỗi + gợi ý đăng nhập<br>- OTP hết hạn → cho phép gửi lại (max 3 lần/giờ)<br>- Mật khẩu không đủ mạnh → hiển thị yêu cầu cụ thể                                                                                           |

#### FR-AUTH-002: Đăng nhập

| Thuộc tính         | Chi tiết                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-AUTH-002                                                                                                                                                               |
| **Mô tả**          | Người dùng đăng nhập bằng email/password hoặc Google SSO                                                                                                                  |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                           |
| **Business Rules** | - Khóa tài khoản sau 5 lần đăng nhập sai liên tiếp (khóa 15 phút)<br>- Phát hành JWT access token (15 phút) + refresh token (7 ngày)<br>- Admin/Issuer yêu cầu MFA (v1.1) |
| **Luồng chính**    | 1. User nhập email/password<br>2. Hệ thống xác thực<br>3. Trả access token + refresh token<br>4. Redirect đến dashboard theo vai trò                                      |

#### FR-AUTH-003: Quản lý hồ sơ người học

| Thuộc tính        | Chi tiết                                                                                                                                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**            | FR-AUTH-003                                                                                                                                                                                                                                                                      |
| **Mô tả**         | Learner thiết lập và cập nhật hồ sơ học tập cá nhân                                                                                                                                                                                                                              |
| **Ưu tiên**       | Must-have (MVP)                                                                                                                                                                                                                                                                  |
| **Dữ liệu hồ sơ** | - Mục tiêu điểm TOEIC (VD: 700, 800, 900)<br>- Deadline (ngày thi dự kiến)<br>- Trình độ hiện tại (tự đánh giá hoặc sau placement)<br>- Lịch rảnh (các khung giờ trong tuần có thể học)<br>- Thời lượng học mong muốn/ngày<br>- Lý do học (tốt nghiệp, thăng tiến, du học, v.v.) |

#### FR-AUTH-004: Ví danh tính DID

| Thuộc tính         | Chi tiết                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**             | FR-AUTH-004                                                                                                                                                                                |
| **Mô tả**          | Tạo và quản lý Decentralized Identifier (DID) cho mỗi người dùng                                                                                                                           |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                                            |
| **MVP**            | DID được tạo và quản lý server-side; người dùng có thể export private key                                                                                                                  |
| **v2**             | Hỗ trợ liên kết ví ngoài (MetaMask, WalletConnect)                                                                                                                                         |
| **Business Rules** | - Mỗi user có đúng 1 DID<br>- DID được tạo tự động khi đăng ký hoặc khi yêu cầu credential lần đầu<br>- Private key mã hóa AES-256 trước khi lưu<br>- Export key yêu cầu xác minh mật khẩu |

#### FR-AUTH-005: Quản lý phiên và token

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-AUTH-005                                                                                                                                                                                                                                                                                                   |
| **Mô tả**          | Quản lý phiên đăng nhập, refresh token, và đăng xuất                                                                                                                                                                                                                                                          |
| **Business Rules** | - Access token: JWT, hết hạn sau 15 phút<br>- Refresh token: opaque token, hết hạn sau 7 ngày, lưu trong DB<br>- Hỗ trợ refresh token rotation (mỗi lần refresh tạo token mới, vô hiệu token cũ)<br>- Đăng xuất: vô hiệu refresh token, xóa access token phía client<br>- Max 5 phiên active đồng thời / user |

#### FR-AUTH-006: Quên mật khẩu

| Thuộc tính | Chi tiết                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| **ID**     | FR-AUTH-006                                                                                                             |
| **Mô tả**  | Người dùng khôi phục mật khẩu qua email                                                                                 |
| **Luồng**  | 1. Nhập email<br>2. Nhận link reset (hết hạn sau 30 phút)<br>3. Đặt mật khẩu mới<br>4. Vô hiệu tất cả phiên đang active |

---

### 6.2. Module: Khảo sát đầu vào & Lộ trình thích ứng (PLACEMENT)

#### FR-PLMT-001: Bài khảo sát đầu vào (Placement Test)

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**             | FR-PLMT-001                                                                                                                                                                                                                                                  |
| **Mô tả**          | Bài test ngắn để đánh giá trình độ ban đầu của người học                                                                                                                                                                                                     |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                                                                                                              |
| **Đặc tả**         | - 20-40 câu hỏi bao quát Part 1-7 TOEIC<br>- Adaptive: độ khó câu tiếp theo dựa trên kết quả câu trước<br>- Thời gian tối đa: 30 phút (không bắt buộc dùng hết)<br>- Bao gồm cả Listening (audio) và Reading<br>- Mỗi câu có giới hạn thời gian riêng        |
| **Output**         | - Điểm ước lượng tổng (band score)<br>- Điểm theo từng Part (1-7)<br>- Điểm theo kỹ năng vi mô: từ vựng, ngữ pháp, nghe chi tiết, nghe đại ý, đọc hiểu chính, suy luận, v.v.<br>- Xếp loại trình độ: Beginner / Intermediate / Upper-Intermediate / Advanced |
| **Business Rules** | - Placement test chỉ được làm lại sau 30 ngày<br>- Phải hoàn thành ≥90% câu hỏi để nhận kết quả<br>- Kết quả lưu vĩnh viễn trong lịch sử                                                                                                                     |

#### FR-PLMT-002: Sinh lộ trình học cá nhân hóa (Learning Path)

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-PLMT-002                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Mô tả**          | AI sinh lộ trình học tùy chỉnh dựa trên kết quả placement và hồ sơ người học                                                                                                                                                                                                                                                                                                                                            |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Input**          | - Kết quả placement test (điểm theo Part & kỹ năng vi mô)<br>- Mục tiêu điểm<br>- Deadline<br>- Lịch rảnh + thời lượng học/ngày                                                                                                                                                                                                                                                                                         |
| **Output**         | Lộ trình gồm:<br>- **Modules** (nhóm bài học theo chủ đề/kỹ năng, VD: "Part 5 – Ngữ pháp câu điều kiện")<br>- **Lịch tuần**: phân bổ module theo ngày, thời lượng gợi ý<br>- **Cột mốc (Milestones)**: mục tiêu điểm tại các mốc thời gian (VD: tuần 4 đạt 600, tuần 8 đạt 650, tuần 12 đạt 700)<br>- **Thi thử định kỳ**: lịch thi thử gợi ý (mỗi 2-4 tuần)<br>- Tổng thời lượng ước tính: 3-5 giờ/tuần (tùy mục tiêu) |
| **Business Rules** | - Lộ trình tập trung vào các kỹ năng yếu nhất (weight 60-70%)<br>- Duy trì các kỹ năng mạnh (weight 30-40%)<br>- Tự động điều chỉnh sau mỗi lần thi thử hoặc khi người dùng yêu cầu                                                                                                                                                                                                                                     |

#### FR-PLMT-003: Điều chỉnh lộ trình

| Thuộc tính           | Chi tiết                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**               | FR-PLMT-003                                                                                                                                              |
| **Mô tả**            | Hệ thống tự động hoặc người dùng yêu cầu điều chỉnh lộ trình                                                                                             |
| **Trigger tự động**  | - Sau mỗi mock test: cập nhật weight các kỹ năng<br>- Khi người dùng thay đổi mục tiêu/deadline<br>- Khi phát hiện người dùng học nhanh/chậm hơn dự kiến |
| **Trigger thủ công** | Người dùng nhấn "Điều chỉnh lộ trình" trên Dashboard                                                                                                     |

---

### 6.3. Module: Luyện tập câu hỏi vi mô (PRACTICE)

#### FR-PRAC-001: Kho câu hỏi thông minh

| Thuộc tính                          | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**                              | FR-PRAC-001                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Mô tả**                           | Hệ thống quản lý kho câu hỏi với tagging đa chiều                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Ưu tiên**                         | Must-have (MVP)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Cấu trúc câu hỏi**                | Mỗi câu hỏi bao gồm:<br>- `part`: Part 1-7<br>- `level`: easy / medium / hard / expert<br>- `tags[]`: mảng thẻ đa chiều (chủ đề, kỹ năng, dạng bẫy)<br>- `stem`: nội dung câu hỏi<br>- `options[]`: các đáp án (A, B, C, D)<br>- `answer`: đáp án đúng (index)<br>- `transcript`: bản ghi audio (cho Listening)<br>- `mediaUrl`: link file audio/hình ảnh<br>- `rationale`: lý giải đáp án (dành cho AI reference)<br>- `timeLimitSec`: thời gian giới hạn cho câu<br>- `microSkills[]`: kỹ năng vi mô liên quan                                                                                                                                                                                                                                                                                 |
| **Hệ thống thẻ (Tagging taxonomy)** | - **Part**: `P1` (Photographs), `P2` (Question-Response), `P3` (Conversations), `P4` (Talks), `P5` (Incomplete Sentences), `P6` (Text Completion), `P7` (Reading Comprehension)<br>- **Skill**: `grammar:tense`, `grammar:inversion`, `grammar:relative-clause`, `vocab:business`, `vocab:synonym`, `listening:main-idea`, `listening:detail`, `listening:inference`, `reading:main-idea`, `reading:detail`, `reading:vocabulary-in-context`, `reading:inference`<br>- **Topic**: `office`, `travel`, `finance`, `technology`, `health`, `education`, `manufacturing`, `marketing`<br>- **Trap type**: `similar-sound`, `repeated-word`, `opposite-meaning`, `partial-info`, `out-of-scope`<br>- **Difficulty**: `easy` (band 300-500), `medium` (500-700), `hard` (700-850), `expert` (850-990) |

#### FR-PRAC-002: Bộ sinh đề thích ứng (Adaptive Question Selector)

| Thuộc tính          | Chi tiết                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | FR-PRAC-002                                                                                                                                                                                      |
| **Mô tả**           | Thuật toán chọn câu hỏi phù hợp với năng lực hiện tại và lỗ hổng kỹ năng                                                                                                                         |
| **Ưu tiên**         | Must-have (MVP – phiên bản đơn giản, v1.1 nâng cao IRT)                                                                                                                                          |
| **Thuật toán MVP**  | - Chọn câu theo level phù hợp với band hiện tại (±1 level)<br>- Ưu tiên câu thuộc kỹ năng vi mô yếu nhất<br>- Tránh câu đã làm trong 7 ngày gần nhất<br>- Đảm bảo đa dạng chủ đề trong 1 session |
| **Thuật toán v1.1** | - Áp dụng IRT (Item Response Theory) 2 tham số<br>- Chọn câu tối đa hóa thông tin Fisher<br>- Cập nhật ước lượng năng lực θ sau mỗi câu trả lời                                                  |

#### FR-PRAC-003: Phiên luyện tập

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-PRAC-003                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Mô tả**     | Người học thực hiện phiên luyện tập câu hỏi                                                                                                                                                                                                                                                                                                                                                                    |
| **Ưu tiên**   | Must-have (MVP)                                                                                                                                                                                                                                                                                                                                                                                                |
| **Tính năng** | - Hiển thị câu hỏi với đồng hồ đếm ngược (per-item)<br>- Phát audio cho câu Listening (play/pause/replay max 2 lần)<br>- Chọn đáp án, có thể đánh dấu (flag) để xem lại<br>- Ghi chú cá nhân cho từng câu<br>- Sau khi trả lời: hiển thị đáp án đúng + giải thích AI<br>- Nút "Xem bài học liên quan" (link đến module củng cố)<br>- Session có thể pause/resume<br>- Mỗi session: 10-30 câu (người dùng chọn) |

#### FR-PRAC-004: Giải thích đáp án bằng AI

| Thuộc tính              | Chi tiết                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**                  | FR-PRAC-004                                                                                                                                                                                                                                                        |
| **Mô tả**               | AI giải thích chi tiết tại sao đáp án đúng/sai cho mỗi câu hỏi                                                                                                                                                                                                     |
| **Ưu tiên**             | Must-have (MVP)                                                                                                                                                                                                                                                    |
| **Nội dung giải thích** | - Lý do đáp án đúng (trích dẫn từ transcript/passage)<br>- Lý do từng đáp án sai (chỉ ra bẫy cụ thể)<br>- Từ/cụm từ khóa quan trọng (highlight)<br>- Mẹo làm nhanh cho dạng câu tương tự<br>- Quy tắc ngữ pháp/từ vựng liên quan<br>- Liên kết đến bài học củng cố |
| **Constraints**         | - Giải thích phải grounded (dựa trên dữ liệu câu hỏi, không hallucinate)<br>- Không được đưa ra đáp án khác với answer key<br>- Ngôn ngữ giải thích: song ngữ Anh-Việt (mặc định Việt, toggle sang Anh)<br>- Thời gian phản hồi < 3 giây                           |

---

### 6.4. Module: Thi thử (MOCK TEST)

#### FR-MOCK-001: Tạo phiên thi thử

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-MOCK-001                                                                                                                                                                                                                                                                                                      |
| **Mô tả**     | Người học bắt đầu phiên thi thử TOEIC full test                                                                                                                                                                                                                                                                  |
| **Ưu tiên**   | Must-have (MVP)                                                                                                                                                                                                                                                                                                  |
| **Format**    | Mô phỏng format TOEIC L&R chính thức:<br>- **Listening** (45 phút): Part 1 (6 câu), Part 2 (25 câu), Part 3 (39 câu), Part 4 (30 câu) = 100 câu<br>- **Reading** (75 phút): Part 5 (30 câu), Part 6 (16 câu), Part 7 (54 câu) = 100 câu<br>- **Tổng**: 200 câu, 120 phút                                         |
| **Tính năng** | - Đồng hồ đếm ngược tổng + hiển thị thời gian từng section<br>- Navigation panel (bản đồ câu hỏi, đánh dấu câu đã làm/chưa làm/flag)<br>- Flag câu hỏi để review<br>- Auto-submit khi hết giờ<br>- Cảnh báo khi còn 10 phút và 5 phút<br>- Không cho phép quay lại section Listening sau khi chuyển sang Reading |

#### FR-MOCK-002: Chấm điểm & phân tích kết quả

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**             | FR-MOCK-002                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Mô tả**          | Hệ thống chấm điểm và cung cấp phân tích chi tiết sau khi nộp bài                                                                                                                                                                                                                                                                                                                                                              |
| **Output**         | - **Điểm ước lượng tổng** (dựa trên bảng quy đổi TOEIC): VD 815/990<br>- **Điểm Listening** & **Điểm Reading** riêng<br>- **Breakdown theo Part**: % đúng mỗi Part (1-7)<br>- **Breakdown theo kỹ năng vi mô**: radar chart<br>- **Top 5 lỗi phổ biến nhất** trong bài thi này<br>- **Danh sách câu sai** với giải thích AI<br>- **Thời gian trung bình / câu** so với khuyến nghị<br>- **So sánh với lần thi trước** (nếu có) |
| **Business Rules** | - Điểm chỉ hiển thị sau khi nộp bài (không preview)<br>- Cho phép review lại đề sau khi có kết quả<br>- Kết quả lưu vĩnh viễn                                                                                                                                                                                                                                                                                                  |

#### FR-MOCK-003: Lịch sử thi thử & xu hướng

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-MOCK-003                                                                                                                                                                                                                                        |
| **Mô tả**     | Theo dõi lịch sử tất cả các lần thi thử                                                                                                                                                                                                            |
| **Tính năng** | - Biểu đồ đường (line chart) điểm theo thời gian<br>- So sánh side-by-side 2 lần thi bất kỳ<br>- Xu hướng tiến bộ theo từng Part<br>- Dự đoán điểm cho kỳ thi tiếp theo (trendline)<br>- Đề xuất bài tập bù dựa trên điểm yếu của lần thi gần nhất |

---

### 6.5. Module: Từ vựng & Ngữ pháp (VOCAB)

#### FR-VOCAB-001: Sổ từ vựng cá nhân

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-VOCAB-001                                                                                                                                                                                                                                                                                                                                                           |
| **Mô tả**     | Mỗi người học có sổ từ vựng cá nhân với hệ thống Spaced Repetition                                                                                                                                                                                                                                                                                                     |
| **Ưu tiên**   | Should-have (v1.1)                                                                                                                                                                                                                                                                                                                                                     |
| **Tính năng** | - Thêm từ mới (manual hoặc auto từ câu sai)<br>- Mỗi từ: nghĩa, phiên âm, ví dụ trong ngữ cảnh TOEIC, audio phát âm<br>- Spaced Repetition: lịch ôn theo thuật toán SM-2/FSRS<br>- Quiz nhanh: flashcard, multiple choice, điền từ<br>- Phân nhóm theo chủ đề TOEIC: Business, Travel, Finance, Office, v.v.<br>- Thống kê: số từ đã học, tỉ lệ nhớ, từ cần ôn hôm nay |

#### FR-VOCAB-002: Bài học ngữ pháp

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-VOCAB-002                                                                                                                                                                                                                                                                                                                              |
| **Mô tả**     | Hệ thống bài học ngữ pháp ngắn gọn, trong ngữ cảnh TOEIC                                                                                                                                                                                                                                                                                  |
| **Ưu tiên**   | Should-have (v1.1)                                                                                                                                                                                                                                                                                                                        |
| **Tính năng** | - Bài học ngắn (5-10 phút): lý thuyết + ví dụ từ đề TOEIC thật<br>- Kiểm tra nhanh đầu bài (pre-test), giữa bài (checkpoint), cuối bài (post-test)<br>- Chủ đề: tense, conditionals, relative clause, gerund/infinitive, comparative, preposition, conjunction, v.v.<br>- AI gợi ý bài ngữ pháp dựa trên lỗi sai trong practice/mock test |

---

### 6.6. Module: Dashboard tiến độ & Gamification (DASHBOARD)

#### FR-DASH-001: Dashboard tiến độ học tập

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-DASH-001                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Mô tả**          | Trang tổng quan hiển thị tiến độ học tập của Learner                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Thành phần UI**  | - **Score Tracker**: điểm ước lượng hiện tại vs mục tiêu (progress bar)<br>- **Skill Heatmap**: radar chart/heatmap các kỹ năng vi mô (xanh = mạnh, đỏ = yếu)<br>- **Study Streak**: số ngày học liên tiếp, calendar heatmap<br>- **Weekly Summary**: giờ học, câu đã làm, accuracy, so sánh tuần trước<br>- **Upcoming**: bài tập tiếp theo, lịch thi thử gợi ý<br>- **Mock Test History**: biểu đồ điểm qua các lần thi<br>- **Milestone Progress**: tiến độ đạt các cột mốc trong lộ trình |
| **Business Rules** | - Dữ liệu cập nhật real-time sau mỗi phiên luyện tập<br>- Hỗ trợ filter theo khoảng thời gian (7 ngày, 30 ngày, 3 tháng, all)                                                                                                                                                                                                                                                                                                                                                                 |

#### FR-DASH-002: Gamification

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-DASH-002                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Mô tả**     | Hệ thống gamification để tăng động lực học tập                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Ưu tiên**   | Nice-to-have (v1.1)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Tính năng** | - **Huy hiệu (Badges)**: First Test, 7-Day Streak, 30-Day Streak, Part Master, Score 700+, Score 800+, v.v.<br>- **Nhiệm vụ tuần (Weekly Quests)**: "Hoàn thành 5 bài tập Part 5", "Thi thử 1 lần", v.v.<br>- **Bảng xếp hạng (Leaderboard)**: theo lớp/nhóm (opt-in), xếp hạng theo điểm / streak / XP<br>- **XP (Experience Points)**: tích lũy qua luyện tập, thi thử, streak<br>- **Level**: Beginner → Intermediate → Advanced → Master (dựa trên XP) |

---

### 6.7. Module: Quản trị nội dung (CONTENT)

#### FR-CONT-001: Import ngân hàng câu hỏi

| Thuộc tính           | Chi tiết                                                                                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**               | FR-CONT-001                                                                                                                                                                                                                                                 |
| **Mô tả**            | Instructor/Curator import câu hỏi hàng loạt từ file                                                                                                                                                                                                         |
| **Ưu tiên**          | Must-have (MVP)                                                                                                                                                                                                                                             |
| **Định dạng hỗ trợ** | CSV, Excel (.xlsx), JSON                                                                                                                                                                                                                                    |
| **Luồng**            | 1. Upload file<br>2. Hệ thống parse & validate (kiểm tra format, trường bắt buộc, đáp án hợp lệ)<br>3. Hiển thị preview (bao gồm lỗi nếu có)<br>4. User xác nhận import<br>5. Câu hỏi lưu ở trạng thái `draft`<br>6. Báo cáo import: success/failed/skipped |
| **Validation rules** | - `part` phải trong [1-7]<br>- `options` phải có đúng 4 phần tử<br>- `answer` phải là index hợp lệ (1-4)<br>- Part 1-4 bắt buộc có `mediaUrl` hoặc `transcript`<br>- `level` phải trong [easy, medium, hard, expert]                                        |

#### FR-CONT-002: Gắn thẻ và quản lý câu hỏi

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-CONT-002                                                                                                                                                                                                                                                                                                                             |
| **Mô tả**     | UI quản lý, tìm kiếm, gắn thẻ câu hỏi                                                                                                                                                                                                                                                                                                   |
| **Tính năng** | - Danh sách câu hỏi với filter: Part, level, tags, status, author<br>- Search full-text trong stem/options/transcript<br>- Gắn thẻ hàng loạt (multi-select + bulk tag)<br>- AI gợi ý thẻ tự động dựa trên nội dung câu hỏi<br>- Edit câu hỏi inline hoặc detail view<br>- Xem lịch sử chỉnh sửa (versioning)<br>- Xóa mềm (soft delete) |

#### FR-CONT-003: Workflow duyệt nội dung

| Thuộc tính         | Chi tiết                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-CONT-003                                                                                                                                 |
| **Mô tả**          | Quy trình duyệt nội dung trước khi publish                                                                                                  |
| **Các trạng thái** | `draft` → `in_review` → `approved` → `published` (hoặc `rejected` → `draft`)                                                                |
| **Quyền**          | - Instructor: tạo `draft`, submit `in_review`<br>- Curator: review, approve/reject với comment<br>- Admin: override approve/reject          |
| **Business Rules** | - Câu hỏi chỉ xuất hiện trong đề thi/practice khi ở trạng thái `published`<br>- Reject phải kèm lý do<br>- Mỗi lần thay đổi tạo version mới |

#### FR-CONT-004: Tạo đề thi

| Thuộc tính        | Chi tiết                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**            | FR-CONT-004                                                                                                                                                                               |
| **Mô tả**         | Instructor/Admin tạo đề thi cho mock test hoặc kỳ thi                                                                                                                                     |
| **Chế độ tạo đề** | - **Manual**: chọn từng câu từ ngân hàng<br>- **Auto (Adaptive)**: AI tự chọn câu dựa trên format TOEIC + phân bố độ khó + đa dạng chủ đề<br>- **Template**: dựa trên đề mẫu đã tạo trước |
| **Validation**    | - Full test phải đủ 200 câu đúng phân bố Part<br>- Mỗi Part phải có đủ số câu theo format TOEIC<br>- Không trùng câu trong cùng 1 đề<br>- Preview đề trước khi publish                    |

#### FR-CONT-005: Quản lý media

| Thuộc tính | Chi tiết                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**     | FR-CONT-005                                                                                                                                                                                 |
| **Mô tả**  | Upload và quản lý file audio/hình ảnh cho câu hỏi                                                                                                                                           |
| **Hỗ trợ** | - Audio: MP3, WAV, OGG (max 10MB/file)<br>- Hình ảnh: JPG, PNG, WebP (max 5MB/file)<br>- Tự động convert & optimize (compress, normalize audio level)<br>- CDN distribution cho performance |

---

### 6.8. Module: Kỳ thi & Cấp chứng chỉ số (CREDENTIAL)

#### FR-CRED-001: Tạo và quản lý kỳ thi

| Thuộc tính                  | Chi tiết                                                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                      | FR-CRED-001                                                                                                                                                                                                                |
| **Mô tả**                   | Admin/Instructor tạo kỳ thi chính thức cho nhóm/lớp                                                                                                                                                                        |
| **Ưu tiên**                 | Must-have (MVP)                                                                                                                                                                                                            |
| **Cấu hình kỳ thi**         | - Tên kỳ thi, mô tả<br>- Thời gian bắt đầu – kết thúc<br>- Đề thi (chọn từ đề đã tạo)<br>- Danh sách thí sinh (thêm thủ công hoặc import)<br>- Ngưỡng điểm để đạt chứng chỉ (VD: ≥700)<br>- Anti-cheat level (MVP: cơ bản) |
| **Anti-cheat cơ bản (MVP)** | - Randomize thứ tự câu hỏi<br>- Randomize thứ tự đáp án (trừ Part có ngữ cảnh)<br>- Phát hiện chuyển tab (cảnh báo + ghi log)<br>- Giới hạn thời gian nghiêm ngặt (auto-submit)                                            |

#### FR-CRED-002: Phát hành chứng chỉ số (Verifiable Credential)

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-CRED-002                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Mô tả**          | Phát hành chứng chỉ số bất biến trên blockchain khi thí sinh đạt ngưỡng                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Luồng chi tiết** | 1. Thí sinh hoàn thành kỳ thi và đạt ngưỡng điểm<br>2. Hệ thống tự động đưa vào danh sách "Đủ điều kiện"<br>3. Admin review và phê duyệt (single hoặc batch)<br>4. Admin nhấn "Phát hành chứng chỉ"<br>5. Credential Service tạo VC JSON theo chuẩn W3C<br>6. Ký VC bằng Issuer private key (ECDSA secp256k1)<br>7. Hash VC → gửi lên Smart Contract `issueCredential(hash, holderDid)`<br>8. Nhận `txHash` từ blockchain<br>9. Lưu VC full (off-chain: IPFS + DB backup)<br>10. Sinh QR code + Link verify<br>11. Gửi email thông báo cho Holder kèm QR + link<br>12. Cập nhật trạng thái credential: `issued` |
| **Cấu trúc VC**    | Theo chuẩn W3C Verifiable Credentials 1.1 (chi tiết tại mục 12)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

#### FR-CRED-003: Thu hồi chứng chỉ (Revoke)

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-CRED-003                                                                                                                                                                                                                                                                 |
| **Mô tả**          | Admin thu hồi chứng chỉ đã phát hành                                                                                                                                                                                                                                        |
| **Ưu tiên**        | Must-have (MVP)                                                                                                                                                                                                                                                             |
| **Luồng**          | 1. Admin chọn credential cần revoke<br>2. Nhập lý do (bắt buộc)<br>3. Xác nhận bằng mật khẩu/MFA<br>4. Smart Contract gọi `revokeCredential(credentialId)`<br>5. Ghi event `Revoked` on-chain<br>6. Cập nhật trạng thái off-chain: `revoked`<br>7. Gửi thông báo cho Holder |
| **Business Rules** | - Chỉ Admin/Org Admin có quyền revoke<br>- Không thể revoke credential đã expired<br>- Lý do revoke lưu on-chain (hash) và off-chain (plaintext)<br>- Sau revoke, trang verify hiển thị "Revoked" với ngày thu hồi                                                          |

#### FR-CRED-004: Quản lý chứng chỉ (Holder)

| Thuộc tính    | Chi tiết                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**        | FR-CRED-004                                                                                                                                                                                                                                                 |
| **Mô tả**     | Người học xem và quản lý chứng chỉ đã nhận                                                                                                                                                                                                                  |
| **Tính năng** | - Danh sách chứng chỉ đã nhận (status: valid/revoked/expired)<br>- Xem chi tiết: điểm, issuer, ngày cấp, QR, link verify<br>- Tải QR code (PNG)<br>- Copy link verify<br>- Chia sẻ lên LinkedIn / email<br>- Export private key (yêu cầu xác minh mật khẩu) |

---

### 6.9. Module: Xác minh chứng chỉ (VERIFY)

#### FR-VERI-001: Trang xác minh công khai

| Thuộc tính          | Chi tiết                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | FR-VERI-001                                                                                                                                                                                                                                                                                                                                                             |
| **Mô tả**           | Trang web công khai cho phép bất kỳ ai xác minh chứng chỉ                                                                                                                                                                                                                                                                                                               |
| **Ưu tiên**         | Must-have (MVP)                                                                                                                                                                                                                                                                                                                                                         |
| **Truy cập**        | - Không yêu cầu đăng nhập<br>- URL format: `https://verify.toeic-ai.com/{credentialId}`<br>- Hỗ trợ QR scan (redirect đến URL trên)                                                                                                                                                                                                                                     |
| **Input**           | Credential ID (từ URL hoặc nhập thủ công)                                                                                                                                                                                                                                                                                                                               |
| **Output hiển thị** | - **Trạng thái**: `✅ Valid` / `❌ Revoked` / `⏰ Expired`<br>- **Issuer**: Tên tổ chức phát hành<br>- **Holder**: Tên (hoặc DID ẩn danh nếu chọn privacy)<br>- **Ngày cấp**<br>- **Loại bài thi**: TOEIC L&R<br>- **Điểm**: VD 815/990<br>- **Blockchain proof**: link đến transaction on-chain<br>- **Lưu ý**: Không hiển thị PII không cần thiết (privacy by design) |
| **Performance**     | Thời gian phản hồi < 2 giây (p95)                                                                                                                                                                                                                                                                                                                                       |

#### FR-VERI-002: API xác minh công khai

| Thuộc tính         | Chi tiết                                                             |
| ------------------ | -------------------------------------------------------------------- |
| **ID**             | FR-VERI-002                                                          |
| **Mô tả**          | RESTful API cho phép tổ chức tích hợp xác minh tự động               |
| **Endpoint**       | `GET /api/v1/verify/{credentialId}`                                  |
| **Response**       | `{ status, issuer, issuanceDate, examType, score, blockchainProof }` |
| **Rate limiting**  | 100 requests/phút/IP (free), 1000 requests/phút (API key – v2)       |
| **Authentication** | Không cần auth (public), API key tùy chọn cho rate limit cao hơn     |

---

### 6.10. Module: Thông báo (NOTIFICATION)

#### FR-NOTI-001: Hệ thống thông báo

| Thuộc tính         | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | FR-NOTI-001                                                                                                                                                                                                                                                                                                                                                                                         |
| **Mô tả**          | Gửi thông báo đa kênh cho người dùng                                                                                                                                                                                                                                                                                                                                                                |
| **Kênh**           | - Email (MVP)<br>- In-app notification (MVP)<br>- Push notification (v2 – mobile)                                                                                                                                                                                                                                                                                                                   |
| **Loại thông báo** | - **Nhắc học**: "Hôm nay bạn chưa luyện tập! Hãy dành 15 phút cho Part 5."<br>- **Kết quả thi thử**: "Bạn vừa đạt 720 trong mock test! Tăng 35 điểm so với lần trước."<br>- **Chứng chỉ**: "Chúc mừng! Chứng chỉ TOEIC 815 đã được phát hành. Xem tại [link]."<br>- **Cột mốc**: "Bạn đã đạt streak 7 ngày! Tiếp tục phát huy!"<br>- **Hệ thống**: "Kỳ thi Mock Test #5 sẽ bắt đầu vào 15/04/2026." |
| **Cấu hình**       | Người dùng có thể bật/tắt từng loại thông báo trong Settings                                                                                                                                                                                                                                                                                                                                        |

---

### 6.11. Module: Thanh toán (BILLING) – v2

#### FR-BILL-001: Hệ thống thanh toán

| Thuộc tính            | Chi tiết                                                                                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | FR-BILL-001                                                                                                                                                                                                                                                                         |
| **Mô tả**             | Mua khóa học, đề nâng cao, gói thi                                                                                                                                                                                                                                                  |
| **Ưu tiên**           | v2 (không trong MVP)                                                                                                                                                                                                                                                                |
| **Tính năng dự kiến** | - Gói miễn phí: placement test, practice hạn chế, 1 mock test/tháng<br>- Gói Premium: unlimited practice, mock test, AI giải thích chi tiết, SRS<br>- Gói Organization: quản lý lớp, cấp chứng chỉ, analytics<br>- Mã kích hoạt do tổ chức cấp<br>- Thanh toán: Stripe, VNPay, MoMo |

---

## 7. Yêu cầu phi chức năng (Non-Functional Requirements)

### 7.1. Hiệu năng (Performance)

| Metric                                       | Yêu cầu MVP       | Mục tiêu v2 |
| -------------------------------------------- | ----------------- | ----------- |
| Thời gian tải trang (First Contentful Paint) | < 2s trên mạng 4G | < 1.5s      |
| Time to Interactive (TTI)                    | < 3.5s            | < 2.5s      |
| API response time (p50)                      | < 200ms           | < 100ms     |
| API response time (p95)                      | < 500ms           | < 300ms     |
| API response time (p99)                      | < 1000ms          | < 500ms     |
| Mock test item processing latency            | < 100ms/item      | < 50ms/item |
| AI explanation generation                    | < 3s              | < 2s        |
| Blockchain verify lookup                     | < 2s (p95)        | < 1s (p95)  |
| Audio streaming start                        | < 1s              | < 500ms     |
| File upload (10MB)                           | < 5s              | < 3s        |
| Concurrent mock test users                   | 500               | 5,000       |

### 7.2. Khả năng mở rộng (Scalability)

| Metric                     | MVP    | v1.x   | v2       |
| -------------------------- | ------ | ------ | -------- |
| Monthly Active Users (MAU) | 10,000 | 50,000 | 100,000+ |
| Daily Active Users (DAU)   | 2,000  | 10,000 | 30,000+  |
| Câu hỏi trong ngân hàng    | 5,000  | 20,000 | 50,000+  |
| Chứng chỉ phát hành/tháng  | 500    | 5,000  | 20,000+  |
| Verify requests/ngày       | 1,000  | 10,000 | 50,000+  |
| Media storage              | 50GB   | 200GB  | 1TB+     |

**Chiến lược scale:**

- Horizontal scaling cho stateless services (behind load balancer)
- Database read replicas cho báo cáo/analytics
- Redis cluster cho cache & session
- CDN cho static assets & media
- Queue-based processing cho AI tasks & blockchain transactions
- Database partitioning theo thời gian (cho sessions, verifications)

### 7.3. Độ sẵn sàng (Availability)

| Metric                         | Yêu cầu                                    |
| ------------------------------ | ------------------------------------------ |
| Uptime SLA                     | ≥ 99.5% (MVP), ≥ 99.9% (v2)                |
| Planned downtime               | < 4 giờ/tháng, ngoài giờ cao điểm (22h-6h) |
| Recovery Time Objective (RTO)  | < 1 giờ (MVP), < 15 phút (v2)              |
| Recovery Point Objective (RPO) | < 1 giờ (MVP), < 5 phút (v2)               |
| Database backup                | Daily full + hourly incremental            |
| Disaster recovery              | Multi-AZ (v2)                              |

### 7.4. Bảo mật (Security)

| Yêu cầu             | Chi tiết                                                           |
| ------------------- | ------------------------------------------------------------------ |
| OWASP Top 10        | Tuân thủ đầy đủ, kiểm tra định kỳ                                  |
| Authentication      | JWT (RS256) + Refresh Token rotation                               |
| Authorization       | RBAC với 5 vai trò: Admin, Org Admin, Instructor, Curator, Learner |
| Transport           | TLS 1.2+ cho tất cả traffic                                        |
| Data at rest        | AES-256 encryption cho PII và sensitive data                       |
| Secrets management  | Environment variables + HashiCorp Vault (production)               |
| Key rotation        | Quarterly cho application keys, annually cho encryption keys       |
| Rate limiting       | Per-endpoint, per-user, per-IP                                     |
| Input validation    | Server-side validation cho tất cả input (whitelist approach)       |
| SQL injection       | Parameterized queries (ORM: Prisma)                                |
| XSS                 | Content Security Policy, output encoding                           |
| CSRF                | CSRF token cho form submissions                                    |
| File upload         | Type validation, size limits, virus scan                           |
| Dependency scanning | Automated (Dependabot/Snyk)                                        |

### 7.5. Quyền riêng tư (Privacy)

| Yêu cầu           | Chi tiết                                            |
| ----------------- | --------------------------------------------------- |
| PII on-chain      | KHÔNG lưu PII on-chain; chỉ hash + DID ẩn danh      |
| PII off-chain     | Mã hóa AES-256, tách biệt khỏi operational data     |
| Right to erasure  | Người dùng có thể yêu cầu xóa dữ liệu cá nhân       |
| Data portability  | Export dữ liệu cá nhân (JSON/CSV)                   |
| Consent           | Rõ ràng, granular consent cho từng mục đích sử dụng |
| Data minimization | Chỉ thu thập dữ liệu cần thiết cho mục đích cụ thể  |
| Terms of Service  | Rõ ràng, phiên bản tiếng Việt và tiếng Anh          |
| Privacy Policy    | Công khai, cập nhật khi có thay đổi                 |

### 7.6. Truy cập & Đa nền tảng (Accessibility & Cross-platform)

| Yêu cầu             | Chi tiết                                                   |
| ------------------- | ---------------------------------------------------------- |
| Responsive          | Hỗ trợ desktop (≥1024px), tablet (≥768px), mobile (≥320px) |
| WCAG                | WCAG 2.1 Level AA                                          |
| Đa ngôn ngữ         | Tiếng Việt (mặc định), Tiếng Anh                           |
| Browser             | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+              |
| Keyboard navigation | Đầy đủ cho tất cả chức năng chính                          |
| Screen reader       | Hỗ trợ ARIA labels                                         |
| Color contrast      | Tối thiểu 4.5:1 cho text thường, 3:1 cho text lớn          |

### 7.7. Quan sát (Observability)

| Thành phần        | Công cụ gợi ý              | Mục đích                                 |
| ----------------- | -------------------------- | ---------------------------------------- |
| Logging           | ELK Stack / Loki + Grafana | Structured logging với correlation ID    |
| Metrics           | Prometheus + Grafana       | Application & infrastructure metrics     |
| Tracing           | Jaeger / OpenTelemetry     | Distributed tracing across microservices |
| Alerting          | Grafana Alerts / PagerDuty | Cảnh báo khi vượt ngưỡng                 |
| Audit trail       | Custom audit log table     | Ghi nhận mọi thao tác nhạy cảm           |
| Error tracking    | Sentry                     | Track & group errors, stack traces       |
| Uptime monitoring | UptimeRobot / Grafana      | Monitor endpoint availability            |

---

## 8. Kiến trúc hệ thống

### 8.1. Technology Stack

| Layer                | Công nghệ                                      | Lý do chọn                                                   |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| **Frontend Web**     | React 18 + Next.js 14 (App Router)             | SSR/SSG tốt cho SEO, performance; ecosystem lớn; TypeScript  |
| **UI Framework**     | Tailwind CSS + shadcn/ui                       | Customizable, modern, accessible components                  |
| **State Management** | Zustand + React Query                          | Lightweight, server state caching tốt                        |
| **Mobile (v2)**      | React Native hoặc Flutter                      | Cross-platform, code reuse                                   |
| **Backend**          | Node.js + NestJS (TypeScript)                  | Type-safe, modular, microservice-ready; cùng ngôn ngữ với FE |
| **API Style**        | RESTful + WebSocket (real-time)                | REST cho CRUD, WebSocket cho thi thử real-time               |
| **Database**         | PostgreSQL 16                                  | ACID, JSON support, mature, extensible                       |
| **ORM**              | Prisma                                         | Type-safe, migration support, great DX                       |
| **Cache**            | Redis 7                                        | In-memory cache, session store, rate limiting, pub/sub       |
| **Search**           | Elasticsearch 8 (hoặc Meilisearch)             | Full-text search cho câu hỏi                                 |
| **Message Queue**    | RabbitMQ hoặc Redis Streams                    | Async processing (AI, blockchain, email)                     |
| **Object Storage**   | MinIO (dev) / AWS S3 (production)              | Audio, images, VC documents                                  |
| **AI/ML**            | OpenAI GPT-4o API + custom fine-tuned models   | Explanation, adaptive engine                                 |
| **Blockchain**       | EVM-compatible (Polygon/Base/Arbitrum)         | Low gas fee, fast finality, EVM ecosystem                    |
| **Smart Contract**   | Solidity + Hardhat                             | Mature tooling, well-documented                              |
| **IPFS**             | Pinata / Infura IPFS                           | Decentralized storage cho VC metadata                        |
| **Auth**             | Custom (NestJS + Passport) hoặc Keycloak       | Flexible, DID integration                                    |
| **CI/CD**            | GitHub Actions                                 | Free for public repos, great ecosystem                       |
| **Container**        | Docker + Docker Compose (dev)                  | Consistent environments                                      |
| **Orchestration**    | Kubernetes (production) / Docker Compose (dev) | Scalable, self-healing                                       |
| **Monitoring**       | Prometheus + Grafana + Loki                    | Full observability stack                                     |
| **Error Tracking**   | Sentry                                         | Real-time error tracking                                     |

### 8.2. Kiến trúc Microservices

```
                            ┌─────────────────┐
                            │   CDN / WAF      │
                            │ (CloudFlare)     │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  Load Balancer   │
                            │  (Nginx/Traefik) │
                            └────────┬────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
        ┌────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
        │   Web Frontend  │ │  API Gateway   │ │  Verify Page   │
        │   (Next.js SSR) │ │  (NestJS)      │ │  (Static/SSR)  │
        └─────────────────┘ └───────┬────────┘ └───────┬────────┘
                                    │                   │
              ┌─────────────────────┼───────────────────┘
              │                     │
    ┌─────────┼──────────┬──────────┼──────────┬─────────────────┐
    │         │          │          │          │                 │
┌───▼───┐ ┌──▼───┐ ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐ ┌───────▼────┐
│ Auth  │ │Cont- │ │Assess- │ │  AI    │ │Creden-   │ │ Notifi-    │
│ &     │ │ent   │ │ment    │ │ Tutor  │ │tial      │ │ cation     │
│Profile│ │Svc   │ │Svc     │ │ Svc    │ │Svc       │ │ Svc        │
└───┬───┘ └──┬───┘ └────┬───┘ └───┬────┘ └───┬──────┘ └────┬───────┘
    │        │          │         │          │              │
    └────────┴──────────┴─────────┴──────────┴──────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼──┐    ┌────────────▼──┐    ┌─────────────▼──┐
    │ PostgreSQL │    │    Redis      │    │  RabbitMQ /    │
    │ (Primary + │    │  (Cache +     │    │  Redis Streams │
    │  Replicas) │    │   Session)    │    │  (Queue)       │
    └────────────┘    └───────────────┘    └────────────────┘
              │
    ┌─────────┼──────────────────┐
    │         │                  │
┌───▼────┐ ┌─▼───────────┐ ┌───▼──────────┐
│  S3 /  │ │Elasticsearch│ │  Blockchain  │
│ MinIO  │ │ (Search)    │ │  (EVM Node)  │
│(Media) │ └─────────────┘ │  + IPFS      │
└────────┘                 └──────────────┘
```

### 8.3. Chi tiết từng Microservice

#### 8.3.1. Auth & Profile Service

| Thuộc tính      | Chi tiết                                       |
| --------------- | ---------------------------------------------- |
| **Trách nhiệm** | Đăng ký, đăng nhập, quản lý profile, DID, RBAC |
| **Database**    | `auth_db` (PostgreSQL)                         |
| **Cache**       | Redis (session, token blacklist, rate limit)   |
| **External**    | Google OAuth, Email Service (SES/SendGrid)     |
| **Port**        | 3001                                           |

#### 8.3.2. Content Service

| Thuộc tính      | Chi tiết                                                |
| --------------- | ------------------------------------------------------- |
| **Trách nhiệm** | Quản lý câu hỏi, đề thi, media, tagging, workflow duyệt |
| **Database**    | `content_db` (PostgreSQL)                               |
| **Storage**     | S3/MinIO (audio, images)                                |
| **Search**      | Elasticsearch (full-text search câu hỏi)                |
| **Port**        | 3002                                                    |

#### 8.3.3. Assessment Service

| Thuộc tính      | Chi tiết                                                    |
| --------------- | ----------------------------------------------------------- |
| **Trách nhiệm** | Tạo phiên thi, chấm điểm, phân tích kết quả, placement test |
| **Database**    | `assessment_db` (PostgreSQL)                                |
| **Cache**       | Redis (session state, timer)                                |
| **Queue**       | Publish events đến AI Tutor Service & Credential Service    |
| **Port**        | 3003                                                        |

#### 8.3.4. AI Tutor Service

| Thuộc tính      | Chi tiết                                                         |
| --------------- | ---------------------------------------------------------------- |
| **Trách nhiệm** | Giải thích đáp án, sinh lộ trình, gợi ý bài tập, adaptive engine |
| **Database**    | `ai_db` (PostgreSQL – lưu explanation cache, model metrics)      |
| **External**    | OpenAI API, custom ML models                                     |
| **Queue**       | Subscribe từ Assessment Service                                  |
| **Port**        | 3004                                                             |

#### 8.3.5. Credential Service

| Thuộc tính      | Chi tiết                                                     |
| --------------- | ------------------------------------------------------------ |
| **Trách nhiệm** | Phát hành VC, revoke, verify, tương tác smart contract, IPFS |
| **Database**    | `credential_db` (PostgreSQL)                                 |
| **External**    | Blockchain node (RPC), IPFS (Pinata), KMS                    |
| **Queue**       | Subscribe từ Assessment Service (auto-qualify check)         |
| **Port**        | 3005                                                         |

#### 8.3.6. Notification Service

| Thuộc tính      | Chi tiết                                                         |
| --------------- | ---------------------------------------------------------------- |
| **Trách nhiệm** | Gửi email, in-app notification, push notification (v2)           |
| **Database**    | `notification_db` (PostgreSQL – templates, history, preferences) |
| **External**    | SES/SendGrid (email), Firebase Cloud Messaging (v2 – push)       |
| **Queue**       | Subscribe từ tất cả services                                     |
| **Port**        | 3006                                                             |

### 8.4. Luồng xử lý chính

#### Luồng 1: Learner làm bài và nhận phân tích AI

```
Learner                Frontend          Assessment Svc      AI Tutor Svc      Content Svc
  │                      │                    │                   │                 │
  │──Start Practice──────>│                    │                   │                 │
  │                      │──Create Session───>│                    │                 │
  │                      │                    │──Get Questions────>│                 │
  │                      │                    │<──Questions────────│                 │
  │                      │<──Session+Items────│                    │                 │
  │                      │                    │                   │                 │
  │──Submit Answer──────>│                    │                   │                 │
  │                      │──Submit Answer────>│                    │                 │
  │                      │                    │──Score + Request──>│                 │
  │                      │                    │  Explanation       │                 │
  │                      │                    │<──Explanation──────│                 │
  │                      │<──Result+Explain───│                    │                 │
  │<──Show Result────────│                    │                   │                 │
```

#### Luồng 2: Cấp chứng chỉ (Credential Issuance)

```
Admin         Frontend        Assessment     Credential Svc    Blockchain    IPFS    Notification
  │              │                │                │               │          │           │
  │──View────────>│                │                │               │          │           │
  │  Eligible     │──Get List─────>│                │               │          │           │
  │  Students     │<──Students─────│                │               │          │           │
  │<──List────────│                │                │               │          │           │
  │               │                │                │               │          │           │
  │──Approve &────>│                │                │               │          │           │
  │  Issue         │──Issue Request─────────────────>│               │          │           │
  │               │                │                │──Create VC────│          │           │
  │               │                │                │──Sign VC──────│          │           │
  │               │                │                │──Hash VC──────>│          │           │
  │               │                │                │<──txHash───────│          │           │
  │               │                │                │──Store VC─────>│──Pin ──>│           │
  │               │                │                │<──CID──────────│<────────│           │
  │               │                │                │──Gen QR/Link──│          │           │
  │               │                │                │──Notify───────>│──────────>│──Email──>│
  │<──Confirmed───│                │                │               │          │           │
```

#### Luồng 3: Xác minh chứng chỉ (Verification)

```
Verifier        Verify Page       Credential Svc      Blockchain      IPFS
  │                │                    │                  │             │
  │──Scan QR/──────>│                    │                  │             │
  │  Enter Code     │──Verify Request──>│                  │             │
  │                │                    │──Check hash──────>│             │
  │                │                    │<──on-chain state──│             │
  │                │                    │──Fetch VC─────────>│────────────>│
  │                │                    │<──VC metadata──────│<────────────│
  │                │                    │──Verify signature──│             │
  │                │<──Verify Result────│                  │             │
  │<──Display──────│                    │                  │             │
  │  Result        │                    │                  │             │
```

---

## 9. Thiết kế API chi tiết

### 9.1. Quy ước chung

| Quy ước           | Chi tiết                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| **Base URL**      | `https://api.toeic-ai.com/v1`                                                       |
| **Format**        | JSON (application/json)                                                             |
| **Auth**          | Bearer Token (JWT) trong header `Authorization`                                     |
| **Pagination**    | `?page=1&limit=20` (default: page=1, limit=20, max: 100)                            |
| **Sorting**       | `?sort=createdAt&order=desc`                                                        |
| **Error format**  | `{ "statusCode": 400, "error": "Bad Request", "message": "...", "details": [...] }` |
| **Date format**   | ISO 8601 (`2026-03-17T10:00:00.000Z`)                                               |
| **Rate limiting** | Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`          |
| **Versioning**    | URL-based: `/v1/`, `/v2/`                                                           |
| **CORS**          | Allowed origins: `*.toeic-ai.com`, localhost (dev)                                  |

### 9.2. Auth & Profile Service APIs

#### POST /auth/register

Đăng ký tài khoản mới.

**Request:**

```json
{
  "email": "minh@example.com",
  "password": "SecureP@ss123",
  "name": "Nguyen Van Minh",
  "role": "learner"
}
```

**Response (201):**

```json
{
  "id": "usr_abc123",
  "email": "minh@example.com",
  "name": "Nguyen Van Minh",
  "role": "learner",
  "status": "pending_verification",
  "createdAt": "2026-03-17T10:00:00.000Z",
  "message": "OTP sent to email. Please verify within 5 minutes."
}
```

**Errors:** `409` Email already exists, `422` Validation error

#### POST /auth/verify-email

Xác minh email bằng OTP.

**Request:**

```json
{
  "email": "minh@example.com",
  "otp": "123456"
}
```

**Response (200):**

```json
{
  "message": "Email verified successfully",
  "accessToken": "eyJ...",
  "refreshToken": "ref_...",
  "expiresIn": 900
}
```

#### POST /auth/login

Đăng nhập.

**Request:**

```json
{
  "email": "minh@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "ref_...",
  "expiresIn": 900,
  "user": {
    "id": "usr_abc123",
    "email": "minh@example.com",
    "name": "Nguyen Van Minh",
    "role": "learner",
    "avatarUrl": null
  }
}
```

**Errors:** `401` Invalid credentials, `403` Account locked, `403` Email not verified

#### POST /auth/refresh

Refresh access token.

**Request:**

```json
{
  "refreshToken": "ref_..."
}
```

**Response (200):**

```json
{
  "accessToken": "eyJ...(new)",
  "refreshToken": "ref_...(new)",
  "expiresIn": 900
}
```

#### POST /auth/logout

Đăng xuất (invalidate refresh token).

**Request:** Header `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

#### POST /auth/forgot-password

Gửi link reset mật khẩu.

**Request:**

```json
{
  "email": "minh@example.com"
}
```

**Response (200):**

```json
{
  "message": "Password reset link sent to email"
}
```

#### POST /auth/reset-password

Reset mật khẩu bằng token từ email.

**Request:**

```json
{
  "token": "rst_...",
  "newPassword": "NewSecureP@ss456"
}
```

#### GET /auth/me

Lấy thông tin profile hiện tại.

**Response (200):**

```json
{
  "id": "usr_abc123",
  "email": "minh@example.com",
  "name": "Nguyen Van Minh",
  "role": "learner",
  "avatarUrl": "https://s3.../avatar.jpg",
  "profile": {
    "targetScore": 700,
    "deadline": "2026-06-30",
    "currentLevel": "intermediate",
    "estimatedScore": 520,
    "studySlots": [
      { "day": "mon", "from": "20:00", "to": "22:00" },
      { "day": "wed", "from": "20:00", "to": "22:00" },
      { "day": "sat", "from": "09:00", "to": "12:00" }
    ],
    "dailyStudyMinutes": 60,
    "reason": "graduation",
    "did": "did:key:z6Mk...",
    "walletAddress": null
  },
  "stats": {
    "totalPracticeSessions": 45,
    "totalMockTests": 3,
    "currentStreak": 7,
    "longestStreak": 14,
    "lastActiveAt": "2026-03-16T21:00:00.000Z"
  },
  "createdAt": "2026-01-15T08:00:00.000Z"
}
```

#### PATCH /auth/me

Cập nhật profile.

**Request:**

```json
{
  "name": "Nguyen Van Minh",
  "targetScore": 750,
  "deadline": "2026-07-31",
  "studySlots": [{ "day": "mon", "from": "19:00", "to": "21:00" }],
  "dailyStudyMinutes": 90
}
```

#### POST /auth/did/create

Tạo DID cho user (nếu chưa có).

**Response (201):**

```json
{
  "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "method": "did:key",
  "createdAt": "2026-03-17T10:00:00.000Z",
  "message": "DID created. You can export your private key from Settings."
}
```

#### POST /auth/did/export-key

Export private key (yêu cầu xác minh mật khẩu).

**Request:**

```json
{
  "password": "SecureP@ss123"
}
```

**Response (200):**

```json
{
  "did": "did:key:z6Mk...",
  "privateKeyJwk": { "kty": "EC", "crv": "secp256k1", "...": "..." },
  "warning": "Keep this key safe. Anyone with this key can control your DID."
}
```

---

### 9.3. Content Service APIs

#### POST /content/items/import

Import câu hỏi hàng loạt.

**Request:** `multipart/form-data`

- `file`: CSV/Excel/JSON file
- `defaultPart` (optional): default part nếu không có trong file
- `defaultLevel` (optional): default level nếu không có trong file

**Response (200):**

```json
{
  "total": 150,
  "imported": 142,
  "failed": 5,
  "skipped": 3,
  "errors": [
    { "row": 23, "field": "answer", "message": "Answer index out of range" },
    { "row": 45, "field": "part", "message": "Invalid part value: 8" }
  ],
  "importId": "imp_abc123"
}
```

#### GET /content/items

Lấy danh sách câu hỏi với filter.

**Query params:**

- `part`: 1-7
- `level`: easy, medium, hard, expert
- `tags`: comma-separated (VD: `grammar:tense,vocab:business`)
- `status`: draft, in_review, approved, published
- `search`: full-text search trong stem
- `author`: user ID
- `page`, `limit`, `sort`, `order`

**Response (200):**

```json
{
  "data": [
    {
      "id": "item_abc123",
      "part": 5,
      "level": "medium",
      "tags": ["grammar:tense", "topic:office"],
      "microSkills": [
        "grammar:present-perfect",
        "vocab:business-correspondence"
      ],
      "stem": "The quarterly report _____ already been submitted to the board.",
      "options": ["has", "have", "had", "having"],
      "answer": 1,
      "transcript": null,
      "mediaUrl": null,
      "rationale": "Subject 'report' is singular, requires 'has' with present perfect.",
      "timeLimitSec": 30,
      "status": "published",
      "author": "usr_xyz789",
      "version": 2,
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-15T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 342,
    "totalPages": 18
  }
}
```

#### POST /content/items

Tạo câu hỏi mới.

**Request:**

```json
{
  "part": 5,
  "level": "medium",
  "tags": ["grammar:tense", "topic:office"],
  "microSkills": ["grammar:present-perfect"],
  "stem": "The quarterly report _____ already been submitted to the board.",
  "options": ["has", "have", "had", "having"],
  "answer": 1,
  "rationale": "Subject 'report' is singular, requires 'has' with present perfect.",
  "timeLimitSec": 30
}
```

#### PUT /content/items/{id}

Cập nhật câu hỏi (tạo version mới).

#### PATCH /content/items/{id}/status

Chuyển trạng thái câu hỏi (workflow).

**Request:**

```json
{
  "status": "in_review",
  "comment": "Ready for review"
}
```

#### POST /content/items/bulk-tag

Gắn thẻ hàng loạt.

**Request:**

```json
{
  "itemIds": ["item_abc123", "item_def456"],
  "addTags": ["topic:finance"],
  "removeTags": ["topic:general"]
}
```

#### POST /content/exams

Tạo đề thi.

**Request:**

```json
{
  "name": "Mock Test #5 - March 2026",
  "type": "mock",
  "mode": "auto",
  "config": {
    "part1": 6,
    "part2": 25,
    "part3": 39,
    "part4": 30,
    "part5": 30,
    "part6": 16,
    "part7": 54,
    "levelDistribution": {
      "easy": 0.3,
      "medium": 0.4,
      "hard": 0.25,
      "expert": 0.05
    },
    "excludeItemIds": ["item_used_recently_1"],
    "topicDiversity": true
  }
}
```

**Response (201):**

```json
{
  "id": "exam_abc123",
  "name": "Mock Test #5 - March 2026",
  "type": "mock",
  "totalItems": 200,
  "status": "draft",
  "parts": {
    "part1": { "count": 6, "items": ["item_..."] },
    "part2": { "count": 25, "items": ["item_..."] }
  },
  "createdAt": "2026-03-17T10:00:00.000Z"
}
```

#### POST /content/media/upload

Upload media file.

**Request:** `multipart/form-data`

- `file`: audio/image file
- `type`: "audio" | "image"
- `itemId` (optional): link đến câu hỏi

**Response (201):**

```json
{
  "id": "media_abc123",
  "url": "https://cdn.toeic-ai.com/media/abc123.mp3",
  "type": "audio",
  "format": "mp3",
  "size": 524288,
  "duration": 45.2,
  "createdAt": "2026-03-17T10:00:00.000Z"
}
```

---

### 9.4. Assessment Service APIs

#### POST /assessment/sessions

Tạo phiên làm bài mới.

**Request:**

```json
{
  "type": "mock",
  "examId": "exam_abc123"
}
```

**Response (201):**

```json
{
  "id": "sess_abc123",
  "type": "mock",
  "examId": "exam_abc123",
  "startAt": "2026-03-17T14:00:00.000Z",
  "endAt": null,
  "timeLimit": 7200,
  "state": "in_progress",
  "sections": [
    {
      "name": "Listening",
      "parts": [1, 2, 3, 4],
      "timeLimit": 2700,
      "itemCount": 100,
      "items": [
        {
          "index": 1,
          "itemId": "item_001",
          "part": 1,
          "stem": "Look at the photograph...",
          "options": ["A", "B", "C", "D"],
          "mediaUrl": "https://cdn.../p1_001.mp3",
          "timeLimitSec": 30
        }
      ]
    },
    {
      "name": "Reading",
      "parts": [5, 6, 7],
      "timeLimit": 4500,
      "itemCount": 100,
      "items": ["..."]
    }
  ]
}
```

#### POST /assessment/sessions/{id}/answer

Ghi nhận câu trả lời (real-time).

**Request:**

```json
{
  "itemId": "item_001",
  "answer": 2,
  "timeSpent": 18,
  "flagged": false
}
```

#### POST /assessment/sessions/{id}/submit

Nộp bài.

**Response (200):**

```json
{
  "sessionId": "sess_abc123",
  "submitted": true,
  "submittedAt": "2026-03-17T16:00:00.000Z",
  "resultId": "result_abc123"
}
```

#### GET /assessment/results/{id}

Lấy kết quả chi tiết.

**Response (200):**

```json
{
  "id": "result_abc123",
  "sessionId": "sess_abc123",
  "type": "mock",
  "estimatedScore": {
    "total": 815,
    "listening": 420,
    "reading": 395
  },
  "rawScore": {
    "total": { "correct": 172, "total": 200, "accuracy": 0.86 },
    "listening": { "correct": 88, "total": 100, "accuracy": 0.88 },
    "reading": { "correct": 84, "total": 100, "accuracy": 0.84 }
  },
  "partBreakdown": {
    "part1": { "correct": 6, "total": 6, "accuracy": 1.0 },
    "part2": { "correct": 22, "total": 25, "accuracy": 0.88 },
    "part3": { "correct": 33, "total": 39, "accuracy": 0.85 },
    "part4": { "correct": 27, "total": 30, "accuracy": 0.9 },
    "part5": { "correct": 27, "total": 30, "accuracy": 0.9 },
    "part6": { "correct": 13, "total": 16, "accuracy": 0.81 },
    "part7": { "correct": 44, "total": 54, "accuracy": 0.81 }
  },
  "microSkillBreakdown": [
    { "skill": "grammar:tense", "correct": 15, "total": 18, "accuracy": 0.83 },
    { "skill": "vocab:business", "correct": 12, "total": 14, "accuracy": 0.86 },
    {
      "skill": "listening:detail",
      "correct": 28,
      "total": 35,
      "accuracy": 0.8
    },
    {
      "skill": "reading:inference",
      "correct": 10,
      "total": 15,
      "accuracy": 0.67
    }
  ],
  "topErrors": [
    {
      "itemId": "item_045",
      "part": 3,
      "skill": "listening:inference",
      "trap": "similar-sound",
      "userAnswer": 2,
      "correctAnswer": 4
    }
  ],
  "timeAnalysis": {
    "totalTime": 6840,
    "avgTimePerItem": 34.2,
    "listeningAvg": 22.1,
    "readingAvg": 46.3,
    "slowestPart": "part7"
  },
  "comparison": {
    "previousScore": 780,
    "scoreDelta": 35,
    "improvedSkills": ["grammar:tense", "listening:main-idea"],
    "declinedSkills": ["reading:inference"]
  },
  "recommendations": [
    {
      "type": "practice",
      "skill": "reading:inference",
      "message": "Focus on Part 7 inference questions. Practice identifying implied information.",
      "suggestedItems": 20
    }
  ],
  "completedAt": "2026-03-17T16:00:00.000Z"
}
```

#### GET /assessment/history

Lấy lịch sử thi thử.

**Response (200):**

```json
{
  "data": [
    {
      "sessionId": "sess_abc123",
      "type": "mock",
      "estimatedScore": 815,
      "listening": 420,
      "reading": 395,
      "completedAt": "2026-03-17T16:00:00.000Z"
    },
    {
      "sessionId": "sess_xyz789",
      "type": "mock",
      "estimatedScore": 780,
      "listening": 400,
      "reading": 380,
      "completedAt": "2026-03-03T16:00:00.000Z"
    }
  ],
  "trend": {
    "direction": "up",
    "avgDelta": 17.5,
    "projectedScore": 850,
    "projectedDate": "2026-04-15"
  }
}
```

#### POST /assessment/placement

Tạo phiên placement test.

**Request:**

```json
{
  "type": "placement"
}
```

---

### 9.5. AI Tutor Service APIs

#### POST /ai/explain

Giải thích đáp án cho một câu hỏi.

**Request:**

```json
{
  "itemId": "item_045",
  "userAnswer": 2,
  "language": "vi"
}
```

**Response (200):**

```json
{
  "itemId": "item_045",
  "correctAnswer": 4,
  "userAnswer": 2,
  "isCorrect": false,
  "explanation": {
    "whyCorrect": "Đáp án D đúng vì trong đoạn hội thoại, người nói đề cập 'I'll reschedule the meeting to next Monday' (dòng 3 transcript). Từ khóa 'reschedule' cho thấy mục đích là dời lịch họp.",
    "whyUserWrong": "Đáp án B sai vì mặc dù có nhắc đến 'order' trong câu đầu, đây chỉ là bối cảnh, không phải mục đích chính của cuộc hội thoại.",
    "trap": "Bẫy 'repeated-word': từ 'order' xuất hiện trong cả passage và đáp án B, dễ gây nhầm lẫn.",
    "keyWords": ["reschedule", "next Monday", "meeting"],
    "tip": "Với câu hỏi 'What is the purpose...', hãy tập trung vào hành động chính, không bị phân tâm bởi chi tiết phụ.",
    "relatedGrammar": null,
    "relatedVocab": ["reschedule (v): dời lịch", "upcoming (adj): sắp tới"],
    "relatedLessonId": "lesson_p3_inference_01"
  }
}
```

#### POST /ai/plan

Sinh/cập nhật lộ trình học.

**Request:**

```json
{
  "profileId": "usr_abc123",
  "latestScores": {
    "total": 520,
    "listening": 260,
    "reading": 260,
    "microSkills": {
      "grammar:tense": 0.65,
      "vocab:business": 0.7,
      "listening:detail": 0.55,
      "reading:inference": 0.5
    }
  },
  "targetScore": 700,
  "deadline": "2026-06-30",
  "availableHoursPerWeek": 10
}
```

**Response (200):**

```json
{
  "learningPath": {
    "totalWeeks": 14,
    "hoursPerWeek": 10,
    "milestones": [
      { "week": 4, "targetScore": 580, "focus": "Listening fundamentals" },
      { "week": 8, "targetScore": 640, "focus": "Reading speed & accuracy" },
      { "week": 12, "targetScore": 690, "focus": "Weak skill remediation" },
      { "week": 14, "targetScore": 700, "focus": "Full test simulation" }
    ],
    "weeklyPlan": [
      {
        "week": 1,
        "modules": [
          {
            "id": "mod_listen_detail_01",
            "name": "Listening Part 3: Chi tiết hội thoại",
            "skill": "listening:detail",
            "estimatedMinutes": 120,
            "activities": [
              {
                "type": "lesson",
                "title": "Kỹ thuật nghe chi tiết",
                "minutes": 20
              },
              { "type": "practice", "itemCount": 30, "minutes": 60 },
              { "type": "review", "title": "Review câu sai", "minutes": 20 },
              { "type": "quiz", "title": "Mini quiz", "minutes": 20 }
            ]
          },
          {
            "id": "mod_read_inference_01",
            "name": "Reading Part 7: Suy luận",
            "skill": "reading:inference",
            "estimatedMinutes": 150,
            "activities": ["..."]
          }
        ],
        "mockTest": null,
        "totalMinutes": 600
      }
    ],
    "mockTestSchedule": [
      { "week": 4, "type": "full", "description": "Đánh giá giữa kỳ 1" },
      { "week": 8, "type": "full", "description": "Đánh giá giữa kỳ 2" },
      { "week": 12, "type": "full", "description": "Đánh giá cuối kỳ" },
      { "week": 14, "type": "full", "description": "Thi thử final" }
    ]
  }
}
```

#### POST /ai/recommend

Gợi ý bài tập bù.

**Request:**

```json
{
  "userId": "usr_abc123",
  "basedOn": "latest_mock"
}
```

**Response (200):**

```json
{
  "recommendations": [
    {
      "priority": 1,
      "skill": "reading:inference",
      "currentAccuracy": 0.5,
      "targetAccuracy": 0.75,
      "suggestedPractice": {
        "itemCount": 20,
        "estimatedMinutes": 40,
        "parts": [7],
        "levels": ["medium", "hard"]
      },
      "reason": "Kỹ năng suy luận Part 7 là điểm yếu lớn nhất, ảnh hưởng trực tiếp đến 15% tổng điểm."
    },
    {
      "priority": 2,
      "skill": "listening:detail",
      "currentAccuracy": 0.55,
      "targetAccuracy": 0.75,
      "suggestedPractice": {
        "itemCount": 15,
        "estimatedMinutes": 30,
        "parts": [3, 4],
        "levels": ["medium"]
      },
      "reason": "Nghe chi tiết Part 3-4 cần cải thiện. Tập trung vào câu hỏi about time, place, numbers."
    }
  ]
}
```

#### POST /ai/speaking/score (v2)

Chấm điểm Speaking.

**Request:** `multipart/form-data`

- `audio`: file ghi âm (WAV/MP3)
- `promptId`: ID câu prompt
- `taskType`: "read-aloud" | "describe-picture" | "respond-to-question"

**Response (200):**

```json
{
  "overallScore": 7.5,
  "pronunciation": {
    "score": 7.0,
    "issues": [
      {
        "word": "schedule",
        "expected": "ˈʃedjuːl",
        "detected": "ˈskedʒuːl",
        "severity": "minor"
      }
    ]
  },
  "fluency": { "score": 8.0, "pauseCount": 2, "avgPauseDuration": 0.8 },
  "vocabulary": { "score": 7.5, "uniqueWords": 45, "advancedWords": 8 },
  "grammar": { "score": 7.5, "errors": [] },
  "suggestions": [
    "Phát âm 'schedule' theo British English: /ˈʃedjuːl/",
    "Thêm từ nối (moreover, furthermore) để tăng điểm fluency"
  ],
  "modelAudio": "https://cdn.../model_response_001.mp3"
}
```

---

### 9.6. Credential Service APIs

#### POST /credential/issue

Phát hành chứng chỉ số.

**Request:**

```json
{
  "holderUserId": "usr_abc123",
  "examSessionId": "sess_abc123",
  "type": "TOEIC_LR",
  "score": 815,
  "examDate": "2026-03-17",
  "expiresAt": "2028-03-17T00:00:00.000Z"
}
```

**Response (201):**

```json
{
  "credentialId": "cred_abc123",
  "holderDid": "did:key:z6Mk...",
  "issuerDid": "did:key:z6Mk...(issuer)",
  "type": "TOEIC_LR",
  "score": 815,
  "status": "issued",
  "issuedAt": "2026-03-17T16:30:00.000Z",
  "expiresAt": "2028-03-17T00:00:00.000Z",
  "blockchain": {
    "txHash": "0xabc...def",
    "network": "polygon-amoy",
    "contentHash": "0x123...789",
    "blockNumber": 12345678
  },
  "ipfs": {
    "cid": "QmXyz...",
    "url": "https://gateway.pinata.cloud/ipfs/QmXyz..."
  },
  "verifyUrl": "https://verify.toeic-ai.com/cred_abc123",
  "qrCodeUrl": "https://api.toeic-ai.com/v1/credential/cred_abc123/qr"
}
```

#### POST /credential/issue/batch

Phát hành hàng loạt.

**Request:**

```json
{
  "credentials": [
    { "holderUserId": "usr_abc123", "examSessionId": "sess_001", "score": 815 },
    { "holderUserId": "usr_def456", "examSessionId": "sess_002", "score": 720 }
  ],
  "type": "TOEIC_LR",
  "examDate": "2026-03-17",
  "expiresAt": "2028-03-17T00:00:00.000Z"
}
```

#### POST /credential/revoke

Thu hồi chứng chỉ.

**Request:**

```json
{
  "credentialId": "cred_abc123",
  "reason": "Score invalidated due to irregularity during exam"
}
```

**Response (200):**

```json
{
  "credentialId": "cred_abc123",
  "status": "revoked",
  "revokedAt": "2026-03-18T10:00:00.000Z",
  "reason": "Score invalidated due to irregularity during exam",
  "blockchain": {
    "revokeTxHash": "0xdef...abc",
    "blockNumber": 12345700
  }
}
```

#### GET /credential/verify/{credentialId}

Xác minh chứng chỉ (public, không cần auth).

**Response (200):**

```json
{
  "credentialId": "cred_abc123",
  "status": "valid",
  "issuer": {
    "name": "Trung tâm Ngoại ngữ - ĐH Kinh tế TP.HCM",
    "did": "did:key:z6Mk...(issuer)"
  },
  "holder": {
    "name": "Nguyen Van Minh",
    "did": "did:key:z6Mk..."
  },
  "credential": {
    "type": "TOEIC_LR",
    "score": 815,
    "examDate": "2026-03-17",
    "issuedAt": "2026-03-17T16:30:00.000Z",
    "expiresAt": "2028-03-17T00:00:00.000Z"
  },
  "blockchainProof": {
    "network": "polygon-amoy",
    "txHash": "0xabc...def",
    "blockNumber": 12345678,
    "contentHash": "0x123...789",
    "explorerUrl": "https://amoy.polygonscan.com/tx/0xabc...def"
  },
  "signatureValid": true,
  "verifiedAt": "2026-03-18T09:00:00.000Z"
}
```

#### GET /credential/cred_abc123/qr

Tải QR code (PNG image).

**Response:** PNG image (200x200px)

---

### 9.7. Notification Service APIs

#### POST /notify/send

Gửi thông báo (internal use).

**Request:**

```json
{
  "userId": "usr_abc123",
  "channel": ["email", "in_app"],
  "template": "credential_issued",
  "data": {
    "credentialId": "cred_abc123",
    "score": 815,
    "verifyUrl": "https://verify.toeic-ai.com/cred_abc123"
  }
}
```

#### GET /notifications

Lấy danh sách thông báo in-app.

**Response (200):**

```json
{
  "data": [
    {
      "id": "noti_abc123",
      "type": "credential_issued",
      "title": "Chứng chỉ TOEIC đã được phát hành!",
      "body": "Chúc mừng! Bạn đã nhận chứng chỉ TOEIC 815 điểm.",
      "read": false,
      "actionUrl": "/credentials/cred_abc123",
      "createdAt": "2026-03-17T16:30:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

#### PATCH /notifications/{id}/read

Đánh dấu đã đọc.

---

## 10. Mô hình dữ liệu

### 10.1. Entity-Relationship Diagram (ERD)

```
┌──────────────────┐     1:1     ┌──────────────────┐
│     Users         │────────────│    Profiles       │
│──────────────────│            │──────────────────│
│ id (PK)          │            │ id (PK)          │
│ email (UNIQUE)   │            │ userId (FK, UQ)  │
│ passwordHash     │            │ targetScore      │
│ name             │            │ deadline         │
│ role (enum)      │            │ currentLevel     │
│ status (enum)    │            │ estimatedScore   │
│ avatarUrl        │            │ studySlots (JSON)│
│ mfaEnabled       │            │ dailyStudyMins   │
│ createdAt        │            │ reason           │
│ updatedAt        │            │ did              │
└──────┬───────────┘            │ walletAddress    │
       │                        │ didPrivateKeyEnc │
       │                        └──────────────────┘
       │
       │ 1:N
       │
┌──────▼───────────┐
│   Sessions        │
│──────────────────│
│ id (PK)          │
│ userId (FK)      │
│ examId (FK)      │
│ type (enum)      │    N:1    ┌──────────────────┐
│ startAt          │───────────│     Exams         │
│ endAt            │           │──────────────────│
│ state (enum)     │           │ id (PK)          │
│ rawScore (JSON)  │           │ name             │
│ estScore (JSON)  │           │ type (enum)      │
│ analytics (JSON) │           │ config (JSON)    │
│ timeSpent        │           │ status (enum)    │
│ createdAt        │           │ authorId (FK)    │
└──────┬───────────┘           │ createdAt        │
       │                       └──────┬───────────┘
       │ 1:N                          │ N:M
       │                              │
┌──────▼───────────┐    ┌─────────────▼────────────┐
│ SessionAnswers    │    │     ExamItems (junction) │
│──────────────────│    │─────────────────────────│
│ id (PK)          │    │ examId (FK)             │
│ sessionId (FK)   │    │ itemId (FK)             │
│ itemId (FK)      │    │ orderIndex              │
│ userAnswer       │    │ section                  │
│ isCorrect        │    └─────────────┬────────────┘
│ timeSpent        │                  │
│ flagged          │                  │ N:1
│ createdAt        │                  │
└──────────────────┘    ┌─────────────▼────────────┐
                        │       Items              │
┌──────────────────┐    │─────────────────────────│
│  Explanations    │    │ id (PK)                 │
│──────────────────│    │ part (1-7)              │
│ id (PK)          │    │ level (enum)            │
│ sessionId (FK)   │    │ tags (TEXT[])            │
│ itemId (FK)      │    │ microSkills (TEXT[])     │
│ userId (FK)      │    │ stem (TEXT)              │
│ content (TEXT)   │    │ options (JSON)           │
│ language         │    │ answer (INT)             │
│ createdAt        │    │ transcript (TEXT)        │
└──────────────────┘    │ mediaUrl                │
                        │ rationale (TEXT)         │
                        │ timeLimitSec             │
                        │ status (enum)            │
┌──────────────────┐    │ authorId (FK)           │
│  Credentials     │    │ version (INT)            │
│──────────────────│    │ createdAt                │
│ id (PK)          │    │ updatedAt                │
│ userId (FK)      │    └──────────────────────────┘
│ holderDid        │
│ issuerDid        │
│ type (enum)      │    ┌──────────────────┐
│ score            │    │  Verifications   │
│ examSessionId(FK)│    │──────────────────│
│ vcJson (TEXT)    │    │ id (PK)          │
│ contentHash      │    │ credentialId(FK) │
│ issueTxHash      │    │ ip               │
│ revokeTxHash     │    │ userAgent        │
│ ipfsCid          │    │ result (enum)    │
│ status (enum)    │    │ responseTime     │
│ issuedAt         │    │ createdAt        │
│ revokedAt        │    └──────────────────┘
│ expiresAt        │
│ revokeReason     │    ┌──────────────────┐
│ createdAt        │    │  Notifications   │
└──────────────────┘    │──────────────────│
                        │ id (PK)          │
┌──────────────────┐    │ userId (FK)      │
│  LearningPaths   │    │ type (enum)      │
│──────────────────│    │ title            │
│ id (PK)          │    │ body (TEXT)      │
│ userId (FK)      │    │ actionUrl        │
│ version (INT)    │    │ read (BOOL)      │
│ pathJson (JSON)  │    │ channel (enum)   │
│ isActive (BOOL)  │    │ sentAt           │
│ generatedAt      │    │ createdAt        │
│ updatedAt        │    └──────────────────┘
└──────────────────┘
                        ┌──────────────────┐
┌──────────────────┐    │  VocabEntries    │
│  StudyStreaks    │    │──────────────────│
│──────────────────│    │ id (PK)          │
│ id (PK)          │    │ userId (FK)      │
│ userId (FK)      │    │ word             │
│ date (DATE)      │    │ meaning          │
│ minutesStudied   │    │ phonetic         │
│ itemsCompleted   │    │ audioUrl         │
│ createdAt        │    │ context          │
└──────────────────┘    │ tags (TEXT[])     │
                        │ nextReviewAt     │
                        │ interval (INT)   │
                        │ easeFactor       │
                        │ repetitions      │
                        │ createdAt        │
                        └──────────────────┘
```

### 10.2. Enum Definitions

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'org_admin', 'instructor', 'curator', 'learner');

-- User status
CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended', 'deleted');

-- Item status (content workflow)
CREATE TYPE item_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');

-- Item level
CREATE TYPE item_level AS ENUM ('easy', 'medium', 'hard', 'expert');

-- Session type
CREATE TYPE session_type AS ENUM ('placement', 'mock', 'practice', 'exam');

-- Session state
CREATE TYPE session_state AS ENUM ('in_progress', 'submitted', 'scored', 'expired');

-- Exam type
CREATE TYPE exam_type AS ENUM ('placement', 'mock', 'official');

-- Credential status
CREATE TYPE credential_status AS ENUM ('pending', 'issued', 'revoked', 'expired');

-- Credential type
CREATE TYPE credential_type AS ENUM ('TOEIC_LR', 'TOEIC_SW', 'COURSE_COMPLETION');

-- Verification result
CREATE TYPE verification_result AS ENUM ('valid', 'revoked', 'expired', 'not_found');

-- Notification channel
CREATE TYPE notification_channel AS ENUM ('email', 'in_app', 'push');
```

### 10.3. Indexes quan trọng

```sql
-- Performance-critical indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_type ON sessions(userId, type);
CREATE INDEX idx_sessions_user_created ON sessions(userId, createdAt DESC);
CREATE INDEX idx_items_part_level_status ON items(part, level, status);
CREATE INDEX idx_items_tags ON items USING GIN(tags);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_credentials_user ON credentials(userId);
CREATE INDEX idx_credentials_holder_did ON credentials(holderDid);
CREATE INDEX idx_credentials_content_hash ON credentials(contentHash);
CREATE INDEX idx_credentials_status ON credentials(status);
CREATE INDEX idx_verifications_credential ON verifications(credentialId);
CREATE INDEX idx_notifications_user_read ON notifications(userId, read);
CREATE INDEX idx_study_streaks_user_date ON study_streaks(userId, date);
CREATE INDEX idx_vocab_user_review ON vocab_entries(userId, nextReviewAt);
```

---

## 11. Thuật toán & AI Engine

### 11.1. Ước lượng điểm & Adaptive Engine

#### 11.1.1. Placement Test – Computerized Adaptive Testing (CAT)

**Thuật toán:**

1. Bắt đầu với câu hỏi mức trung bình (medium)
2. Áp dụng **IRT 2-Parameter Logistic Model**:
   - `P(θ) = 1 / (1 + e^(-a(θ-b)))` trong đó:
     - `θ`: năng lực ước lượng của thí sinh
     - `a`: độ phân biệt (discrimination) của câu hỏi
     - `b`: độ khó (difficulty) của câu hỏi
3. Sau mỗi câu trả lời, cập nhật `θ` bằng **Maximum Likelihood Estimation (MLE)** hoặc **Expected A Posteriori (EAP)**
4. Chọn câu tiếp theo tối đa hóa **Fisher Information** tại `θ` hiện tại
5. Dừng khi:
   - Đạt số câu tối đa (40 câu), HOẶC
   - Standard Error (SE) < 0.3, HOẶC
   - Đã cover đủ các Part
6. Mapping `θ` sang điểm TOEIC ước lượng (bảng quy đổi calibrated)

**MVP simplified:** Sử dụng rule-based adaptive:

- Trả lời đúng → câu tiếp khó hơn 1 bậc
- Trả lời sai → câu tiếp dễ hơn 1 bậc
- Score = weighted sum theo level đạt được

#### 11.1.2. Micro-skill Tracking – Bayesian Knowledge Tracing (BKT)

Theo dõi xác suất mastery cho mỗi kỹ năng vi mô:

**Parameters:**

- `P(L0)`: xác suất đã biết ban đầu (prior, từ placement)
- `P(T)`: xác suất chuyển từ chưa biết → biết (learning rate)
- `P(G)`: xác suất đoán đúng (guess)
- `P(S)`: xác suất nhầm (slip)

**Update rule sau mỗi câu trả lời:**

```
Nếu trả lời đúng:
  P(L_n | correct) = P(L_{n-1}) * (1 - P(S)) / P(correct)

Nếu trả lời sai:
  P(L_n | wrong) = P(L_{n-1}) * P(S) / P(wrong)

Sau đó:
  P(L_n) = P(L_n | evidence) + (1 - P(L_n | evidence)) * P(T)
```

**Ứng dụng:**

- Khi `P(L_n) > 0.95` → mastered → giảm weight trong lộ trình
- Khi `P(L_n) < 0.4` → needs work → tăng weight, gợi ý bài tập
- Sử dụng cho mỗi kỹ năng vi mô: `grammar:tense`, `listening:detail`, v.v.

### 11.2. Giải thích đáp án (NLP Engine)

#### 11.2.1. Architecture

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐    ┌────────────┐
│ Input:       │───>│ Retrieval:   │───>│ Generation:   │───>│ Validation │
│ item + user  │    │ Get relevant │    │ LLM generates │    │ & Output   │
│ answer       │    │ context      │    │ explanation   │    │            │
└─────────────┘    └──────────────┘    └───────────────┘    └────────────┘
```

#### 11.2.2. Prompt Template (Grounded Explanation)

```
System: You are a TOEIC tutor. Generate explanations in Vietnamese.

Context:
- Question: {stem}
- Options: {options}
- Correct answer: {correct_answer} (index: {answer_index})
- User's answer: {user_answer}
- Part: {part}
- Transcript/Passage: {transcript}
- Rationale (reference): {rationale}
- Micro-skills: {micro_skills}

Rules:
1. MUST match the provided correct answer. NEVER suggest a different answer.
2. Quote specific words/phrases from the transcript/passage as evidence.
3. Explain why each wrong option is incorrect (identify traps).
4. Provide a practical tip for similar question types.
5. If grammar-related, state the rule concisely.
6. Keep explanation under 200 words.
7. Use bilingual format: Vietnamese with key English terms.

Generate explanation:
```

#### 11.2.3. Guardrails

| Guardrail               | Mô tả                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| Answer consistency      | Validate AI explanation matches answer key (reject nếu không khớp) |
| Grounding check         | Verify quoted text exists in transcript/passage                    |
| Hallucination detection | Cross-check facts against question data                            |
| Length limit            | Max 200 từ cho explanation chính                                   |
| Language check          | Ensure bilingual output (Vietnamese primary)                       |
| Toxicity filter         | Filter inappropriate content                                       |
| Retry logic             | Max 3 retries nếu fail guardrails                                  |

### 11.3. Đánh giá chất lượng AI

| Metric            | Phương pháp                  | Target                                |
| ----------------- | ---------------------------- | ------------------------------------- |
| Correctness       | Human review 50 mẫu/release  | ≥ 95%                                 |
| Helpfulness       | User rating (1-5 stars)      | ≥ 4.0                                 |
| Consistency       | Answer matches key 100%      | 100%                                  |
| Groundedness      | Evidence traceable to source | ≥ 98%                                 |
| Latency           | P95 response time            | < 3s                                  |
| User satisfaction | A/B test vs no explanation   | Statistically significant improvement |

### 11.4. Speaking Assessment (v2)

**Pipeline:**

```
Audio Input → ASR (Whisper) → Text Normalization → Multi-dimensional Scoring
                                                         │
                                    ┌────────────────────┼──────────────┐
                                    │                    │              │
                              Pronunciation        Fluency       Grammar/Vocab
                              Score Engine         Score Engine   Score Engine
                                    │                    │              │
                                    └────────────────────┼──────────────┘
                                                         │
                                                   Aggregation → Score + Feedback
```

**Pronunciation scoring:**

- Goodness of Pronunciation (GoP) score per phoneme
- Compare against native speaker reference
- Highlight mispronounced words

---

## 12. Blockchain & Hệ thống Danh tính Phi tập trung

### 12.1. Mô hình ba vai trò (Trust Triangle)

```
                    ┌──────────────┐
                    │   ISSUER     │
                    │  (Tổ chức    │
                    │  giáo dục)   │
                    └──────┬───────┘
                           │
              Issues VC    │    Verifier checks
              (ký & ghi    │    on-chain
               on-chain)   │
                           │
            ┌──────────────▼──────────────┐
            │                             │
     ┌──────▼──────┐              ┌───────▼─────┐
     │   HOLDER    │              │  VERIFIER   │
     │  (Học viên) │─────────────>│ (Nhà tuyển  │
     │             │  Presents    │  dụng)      │
     └─────────────┘  credential  └─────────────┘
```

### 12.2. Chuẩn áp dụng

| Chuẩn                         | Phiên bản | Mục đích                             |
| ----------------------------- | --------- | ------------------------------------ |
| W3C Verifiable Credentials    | v1.1      | Format chứng chỉ số                  |
| W3C Decentralized Identifiers | v1.0      | Định danh phi tập trung              |
| ECDSA secp256k1               | -         | Thuật toán ký số                     |
| EIP-712                       | -         | Typed structured data signing        |
| ERC-1056                      | -         | DID registry on Ethereum (tham khảo) |

### 12.3. Cấu trúc Verifiable Credential đầy đủ

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://toeic-ai.com/credentials/v1"
  ],
  "id": "https://toeic-ai.com/credentials/cred_abc123",
  "type": ["VerifiableCredential", "TOEICAchievementCredential"],
  "issuer": {
    "id": "did:key:z6MkIssuer...",
    "name": "Trung tâm Ngoại ngữ - ĐH Kinh tế TP.HCM"
  },
  "issuanceDate": "2026-03-17T16:30:00.000Z",
  "expirationDate": "2028-03-17T00:00:00.000Z",
  "credentialSubject": {
    "id": "did:key:z6MkHolder...",
    "name": "Nguyen Van Minh",
    "achievement": {
      "type": "TOEIC_LR",
      "score": {
        "total": 815,
        "listening": 420,
        "reading": 395
      },
      "examDate": "2026-03-17",
      "examSessionId": "sess_abc123"
    }
  },
  "credentialStatus": {
    "id": "https://toeic-ai.com/credentials/status/cred_abc123",
    "type": "BlockchainCredentialStatus2024"
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "created": "2026-03-17T16:30:00.000Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:key:z6MkIssuer...#key-1",
    "jws": "eyJhbGciOiJFUzI1NksiLCJiNjQiOmZhbHNlLCJjcml0IjpbImI2NCJdfQ...<signature>"
  },
  "chainProof": {
    "network": "polygon-amoy",
    "contractAddress": "0x1234...5678",
    "txHash": "0xabc...def",
    "blockNumber": 12345678,
    "contentHash": "0x9876...5432",
    "timestamp": 1710693000
  }
}
```

### 12.4. Smart Contract Design

#### 12.4.1. Contract: ToeicCredentialRegistry

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ToeicCredentialRegistry is AccessControl, Pausable {

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    enum CredentialStatus { None, Issued, Revoked }

    struct Credential {
        bytes32 contentHash;
        string holderDid;
        CredentialStatus status;
        uint256 issuedAt;
        uint256 revokedAt;
        string revokeReason;
    }

    mapping(string => Credential) private credentials; // credentialId => Credential
    mapping(bytes32 => bool) private hashExists;        // contentHash => exists

    event CredentialIssued(
        string indexed credentialId,
        string holderDid,
        bytes32 contentHash,
        uint256 issuedAt
    );

    event CredentialRevoked(
        string indexed credentialId,
        string reason,
        uint256 revokedAt
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
    }

    function issueCredential(
        string calldata credentialId,
        string calldata holderDid,
        bytes32 contentHash
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(credentials[credentialId].status == CredentialStatus.None, "Already exists");
        require(!hashExists[contentHash], "Hash already registered");

        credentials[credentialId] = Credential({
            contentHash: contentHash,
            holderDid: holderDid,
            status: CredentialStatus.Issued,
            issuedAt: block.timestamp,
            revokedAt: 0,
            revokeReason: ""
        });

        hashExists[contentHash] = true;

        emit CredentialIssued(credentialId, holderDid, contentHash, block.timestamp);
    }

    function revokeCredential(
        string calldata credentialId,
        string calldata reason
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(credentials[credentialId].status == CredentialStatus.Issued, "Not issued");

        credentials[credentialId].status = CredentialStatus.Revoked;
        credentials[credentialId].revokedAt = block.timestamp;
        credentials[credentialId].revokeReason = reason;

        emit CredentialRevoked(credentialId, reason, block.timestamp);
    }

    function getCredential(string calldata credentialId)
        external view returns (Credential memory)
    {
        return credentials[credentialId];
    }

    function isValid(bytes32 contentHash) external view returns (bool) {
        return hashExists[contentHash];
    }

    function getStatusByHash(bytes32 contentHash, string calldata credentialId)
        external view returns (CredentialStatus)
    {
        Credential memory cred = credentials[credentialId];
        if (cred.contentHash == contentHash) {
            return cred.status;
        }
        return CredentialStatus.None;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
```

### 12.5. Blockchain Network Selection

| Tiêu chí               | Polygon PoS               | Base          | Arbitrum One |
| ---------------------- | ------------------------- | ------------- | ------------ |
| Gas fee (avg)          | ~$0.001-0.01              | ~$0.001-0.005 | ~$0.01-0.05  |
| Finality               | ~2s                       | ~2s           | ~1s          |
| EVM compatible         | ✅                        | ✅            | ✅           |
| Ecosystem maturity     | Cao                       | Trung bình    | Cao          |
| Testnet                | Amoy                      | Sepolia       | Sepolia      |
| **Đề xuất MVP**        | ✅ Polygon Amoy (testnet) | -             | -            |
| **Đề xuất Production** | ✅ Polygon PoS            | Backup option | -            |

**Lý do chọn Polygon:** Gas fee thấp nhất, finality nhanh, ecosystem lớn, có nhiều dự án credential tương tự, documentation tốt.

### 12.6. IPFS Integration

| Thuộc tính            | Chi tiết                                                 |
| --------------------- | -------------------------------------------------------- |
| Provider              | Pinata (managed IPFS pinning)                            |
| Dữ liệu lưu trên IPFS | VC JSON đầy đủ (đã mã hóa PII nếu cần)                   |
| Pinning strategy      | Pin khi issue, unpin khi expire (sau grace period 1 năm) |
| Gateway               | Pinata dedicated gateway hoặc public gateway             |
| Backup                | Copy VC JSON trên S3                                     |

### 12.7. Ví & Quản lý khóa

**MVP (Managed DID):**

- Server tạo keypair (secp256k1) cho mỗi user
- Private key mã hóa AES-256-GCM trước khi lưu DB
- Encryption key lưu trong KMS (HashiCorp Vault)
- User có thể export private key (yêu cầu xác minh password)

**v2 (Self-custodial):**

- Hỗ trợ WalletConnect / MetaMask
- User ký transaction từ ví riêng
- Server không lưu private key

### 12.8. Privacy Design

| Nguyên tắc                | Triển khai                                                             |
| ------------------------- | ---------------------------------------------------------------------- |
| No PII on-chain           | Chỉ lưu `credentialId`, `holderDid` (ẩn danh), `contentHash`, `status` |
| Minimal disclosure        | Trang verify chỉ hiển thị thông tin tối thiểu cần thiết                |
| Holder consent            | Holder chủ động chia sẻ link verify                                    |
| Selective disclosure (v2) | Zero-knowledge proof cho "score ≥ 700" mà không tiết lộ điểm chính xác |

---

## 13. Bảo mật & Tuân thủ

### 13.1. Role-Based Access Control (RBAC)

| Quyền / Vai trò       | Admin | Org Admin | Instructor | Curator | Learner | Public |
| --------------------- | ----- | --------- | ---------- | ------- | ------- | ------ |
| Quản lý users         | ✅    | Trong org | ❌         | ❌      | ❌      | ❌     |
| Quản lý roles         | ✅    | Trong org | ❌         | ❌      | ❌      | ❌     |
| Import câu hỏi        | ✅    | ✅        | ✅         | ✅      | ❌      | ❌     |
| Duyệt câu hỏi         | ✅    | ✅        | ❌         | ✅      | ❌      | ❌     |
| Tạo đề thi            | ✅    | ✅        | ✅         | ❌      | ❌      | ❌     |
| Tạo kỳ thi            | ✅    | ✅        | ✅         | ❌      | ❌      | ❌     |
| Phê duyệt chứng chỉ   | ✅    | ✅        | ❌         | ❌      | ❌      | ❌     |
| Revoke chứng chỉ      | ✅    | ✅        | ❌         | ❌      | ❌      | ❌     |
| Làm bài tập           | ✅    | ✅        | ✅         | ❌      | ✅      | ❌     |
| Thi thử               | ✅    | ✅        | ✅         | ❌      | ✅      | ❌     |
| Xem dashboard cá nhân | ✅    | ✅        | ✅         | ❌      | ✅      | ❌     |
| Xem thống kê lớp      | ✅    | ✅        | ✅         | ❌      | ❌      | ❌     |
| Verify chứng chỉ      | ✅    | ✅        | ✅         | ✅      | ✅      | ✅     |
| System settings       | ✅    | ❌        | ❌         | ❌      | ❌      | ❌     |

### 13.2. Authentication Security

| Biện pháp              | Chi tiết                                             |
| ---------------------- | ---------------------------------------------------- |
| Password hashing       | bcrypt (cost factor 12)                              |
| JWT signing            | RS256 (asymmetric)                                   |
| Token lifetime         | Access: 15 min, Refresh: 7 days                      |
| Refresh token rotation | Mỗi lần refresh tạo token mới, vô hiệu cũ            |
| Brute force protection | Lock after 5 failed attempts (15 min lockout)        |
| MFA                    | TOTP cho Admin/Org Admin (v1.1), optional cho others |
| Session limit          | Max 5 concurrent sessions per user                   |
| Password policy        | Min 8 chars, uppercase + lowercase + digit + special |

### 13.3. Anti-cheat (Exam Security)

**MVP:**
| Biện pháp | Mô tả |
|-----------|-------|
| Question randomization | Thứ tự câu hỏi ngẫu nhiên cho mỗi thí sinh |
| Option randomization | Thứ tự đáp án ngẫu nhiên (trừ Part có context) |
| Tab switch detection | Phát hiện khi thí sinh chuyển tab, ghi log + cảnh báo |
| Timer enforcement | Auto-submit khi hết giờ, server-side validation |
| Copy-paste disabled | Vô hiệu hóa copy/paste trong phiên thi |
| IP logging | Ghi nhận IP thí sinh |

**v2 (Nâng cao):**
| Biện pháp | Mô tả |
|-----------|-------|
| Webcam proctoring | Chụp ảnh ngẫu nhiên (opt-in, có consent) |
| Face detection | Phát hiện khi không có người / nhiều người |
| Anomaly detection | AI phát hiện pattern bất thường (thời gian trả lời, accuracy spike) |
| Browser lockdown | Fullscreen mode bắt buộc |
| Screen recording detection | Phát hiện phần mềm ghi màn hình |

### 13.4. Data Encryption

| Dữ liệu                | Phương pháp      | Chi tiết                                  |
| ---------------------- | ---------------- | ----------------------------------------- |
| Data in transit        | TLS 1.2+         | Tất cả HTTP traffic qua HTTPS             |
| Data at rest (DB)      | AES-256          | PII columns: email, name, passwordHash    |
| Data at rest (Storage) | SSE-S3 / SSE-KMS | File audio, images                        |
| DID private keys       | AES-256-GCM      | Encrypted trước khi lưu DB, key trong KMS |
| Backup                 | AES-256          | Encrypted backups                         |
| Secrets                | HashiCorp Vault  | API keys, DB credentials, blockchain keys |

### 13.5. Compliance Checklist

| Yêu cầu                        | Trạng thái | Ghi chú                                 |
| ------------------------------ | ---------- | --------------------------------------- |
| OWASP Top 10                   | Planned    | Kiểm tra trong mỗi sprint               |
| Input validation (server-side) | Planned    | Whitelist approach, Joi/class-validator |
| SQL injection prevention       | Planned    | Prisma ORM (parameterized queries)      |
| XSS prevention                 | Planned    | CSP headers, React auto-escaping        |
| CSRF protection                | Planned    | SameSite cookies + CSRF token           |
| Rate limiting                  | Planned    | Per-endpoint, per-user                  |
| Dependency scanning            | Planned    | Dependabot + Snyk                       |
| Penetration testing            | Planned    | Trước production launch                 |
| Privacy policy                 | Planned    | Vietnamese + English                    |
| Terms of Service               | Planned    | Vietnamese + English                    |
| Data export/deletion           | Planned    | GDPR-like compliance                    |
| Audit logging                  | Planned    | Sensitive operations                    |

---

## 14. Khả năng quan sát & Vận hành

### 14.1. Logging

| Thuộc tính     | Chi tiết                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| Format         | Structured JSON (timestamp, level, service, correlationId, message, metadata) |
| Levels         | error, warn, info, debug                                                      |
| Storage        | Loki + Grafana (hoặc ELK Stack)                                               |
| Retention      | 30 ngày (info+), 90 ngày (warn+), 1 năm (error)                               |
| Correlation ID | UUID truyền qua tất cả services cho 1 request                                 |
| Sensitive data | KHÔNG log PII, passwords, tokens; mask nếu cần                                |

**Log format mẫu:**

```json
{
  "timestamp": "2026-03-17T16:30:00.000Z",
  "level": "info",
  "service": "credential-svc",
  "correlationId": "req_abc123",
  "userId": "usr_abc123",
  "action": "credential.issue",
  "credentialId": "cred_abc123",
  "txHash": "0xabc...def",
  "duration": 2340,
  "message": "Credential issued successfully"
}
```

### 14.2. Audit Trail

Ghi nhận tất cả thao tác nhạy cảm:

| Hành động          | Dữ liệu ghi                                    |
| ------------------ | ---------------------------------------------- |
| Login/Logout       | userId, IP, userAgent, timestamp, success/fail |
| Role change        | actorId, targetUserId, oldRole, newRole        |
| Content publish    | actorId, itemId, oldStatus, newStatus          |
| Credential issue   | actorId, credentialId, holderDid, txHash       |
| Credential revoke  | actorId, credentialId, reason, txHash          |
| Password change    | userId, timestamp                              |
| Data export/delete | userId, requestType, timestamp                 |

### 14.3. Metrics

| Category           | Metrics                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Business**       | MAU, DAU, new registrations, placement completions, mock tests/day, avg score, score improvement rate, credentials issued, verify requests |
| **Technical**      | Request rate, error rate, p50/p95/p99 latency, DB connection pool, Redis hit ratio, queue depth, queue processing time                     |
| **AI**             | Explanation generation latency, explanation quality score (user rating), cache hit rate, API cost/request                                  |
| **Blockchain**     | Transaction success rate, gas used, confirmation time, IPFS pin success rate                                                               |
| **Infrastructure** | CPU/Memory/Disk utilization, container restarts, network I/O                                                                               |

### 14.4. Alerting

| Alert                    | Condition                      | Severity | Channel           |
| ------------------------ | ------------------------------ | -------- | ----------------- |
| High error rate          | Error rate > 5% (5 min window) | Critical | PagerDuty + Slack |
| High latency             | P95 > 2s (5 min window)        | Warning  | Slack             |
| DB connection exhaustion | Available connections < 10%    | Critical | PagerDuty         |
| Queue backlog            | Queue depth > 1000             | Warning  | Slack             |
| Disk space               | > 85% used                     | Warning  | Slack             |
| Blockchain tx failure    | Failed tx > 3 in 10 min        | Critical | PagerDuty + Slack |
| Certificate expiry       | SSL cert expires in < 14 days  | Warning  | Email             |
| Uptime                   | Service down > 2 min           | Critical | PagerDuty         |

---

## 15. Tiêu chí chấp nhận & User Stories

### 15.1. Epic 1: Authentication & Profile

#### US-001: Đăng ký tài khoản

**Là** một người dùng mới, **tôi muốn** đăng ký tài khoản bằng email, **để** bắt đầu sử dụng hệ thống.

**Acceptance Criteria:**

- [x] Form đăng ký với email, mật khẩu, họ tên
- [x] Validate email format, mật khẩu (≥8 chars, hoa+thường+số+đặc biệt)
- [x] Gửi OTP 6 số qua email, hết hạn sau 5 phút
- [x] Cho phép gửi lại OTP (max 3 lần/giờ)
- [x] Sau xác minh → redirect đến trang setup profile
- [x] Hiển thị lỗi rõ ràng nếu email đã tồn tại
- [x] Hỗ trợ đăng ký qua Google SSO (bỏ qua OTP)

#### US-002: Đăng nhập

**Là** người dùng đã có tài khoản, **tôi muốn** đăng nhập, **để** truy cập hệ thống.

**Acceptance Criteria:**

- [x] Đăng nhập bằng email + password hoặc Google SSO
- [x] Khóa tài khoản sau 5 lần sai liên tiếp (15 phút)
- [x] Redirect đến dashboard phù hợp theo vai trò
- [x] Hiển thị thông báo lỗi cụ thể (sai mật khẩu, tài khoản chưa xác minh, tài khoản bị khóa)

#### US-003: Setup profile học tập

**Là** Learner mới đăng ký, **tôi muốn** thiết lập mục tiêu học, **để** hệ thống tạo lộ trình phù hợp.

**Acceptance Criteria:**

- [x] Form nhập: mục tiêu điểm (dropdown 450-990), deadline (date picker), lịch rảnh (multi-select), lý do học
- [x] Validate deadline ≥ 30 ngày từ hiện tại
- [x] Lưu thành công → hiển thị nút "Làm bài khảo sát đầu vào"

---

### 15.2. Epic 2: Placement & Learning Path

#### US-010: Làm bài placement test

**Là** Learner, **tôi muốn** làm bài khảo sát đầu vào, **để** biết trình độ và nhận lộ trình.

**Acceptance Criteria:**

- [x] Bài test 20-40 câu, cover Part 1-7
- [x] Mỗi câu có timer riêng, audio cho Listening
- [x] Hoàn thành ≥90% câu → tính kết quả
- [x] Hiển thị kết quả: điểm ước lượng, breakdown Part, kỹ năng vi mô (radar chart)
- [x] Nút "Xem lộ trình học" → chuyển đến learning path

#### US-011: Nhận lộ trình cá nhân hóa

**Là** Learner, **tôi muốn** nhận lộ trình học tùy chỉnh theo kết quả placement, **để** học hiệu quả nhất.

**Acceptance Criteria:**

- [x] Lộ trình hiển thị: modules theo tuần, thời lượng gợi ý, cột mốc điểm
- [x] Tối thiểu 3 modules trong tuần đầu tiên
- [x] Thời lượng đề xuất phù hợp với lịch rảnh đã khai báo
- [x] Có nút "Bắt đầu học" cho module đầu tiên
- [x] Có thể xem toàn bộ lộ trình hoặc chỉ tuần hiện tại

---

### 15.3. Epic 3: Practice & Assessment

#### US-020: Luyện tập câu hỏi theo Part

**Là** Learner, **tôi muốn** luyện tập câu hỏi theo từng Part, **để** cải thiện kỹ năng yếu.

**Acceptance Criteria:**

- [x] Chọn Part (1-7), số câu (10/20/30), bắt đầu
- [x] Mỗi câu có timer, audio (nếu Listening), 4 đáp án
- [x] Sau khi trả lời → hiển thị đúng/sai + giải thích AI
- [x] Có thể flag câu, ghi chú cá nhân
- [x] Kết thúc session → tóm tắt: accuracy, thời gian, kỹ năng cần cải thiện

#### US-021: Thi thử full TOEIC

**Là** Learner, **tôi muốn** thi thử full TOEIC 200 câu với timer, **để** đánh giá trình độ thực tế.

**Acceptance Criteria:**

- [x] Đề 200 câu đúng format TOEIC (100 Listening + 100 Reading)
- [x] Timer tổng (120 phút) + timer section
- [x] Navigation panel: bản đồ câu, flag, chưa làm/đã làm
- [x] Cảnh báo khi còn 10 phút và 5 phút
- [x] Auto-submit khi hết giờ
- [x] Không quay lại Listening section sau khi sang Reading
- [x] Kết quả: điểm ước lượng, breakdown Part, top 5 lỗi, so sánh lần trước

#### US-022: Xem phân tích chi tiết sau thi thử

**Là** Learner, **tôi muốn** xem phân tích chi tiết sau mock test, **để** biết cần cải thiện gì.

**Acceptance Criteria:**

- [x] Điểm tổng + Listening + Reading
- [x] Breakdown từng Part: % đúng, so sánh với lần trước
- [x] Radar chart kỹ năng vi mô
- [x] Top 5 lỗi phổ biến với giải thích
- [x] Danh sách tất cả câu sai có thể click xem giải thích
- [x] Đề xuất bài tập bù (link trực tiếp đến practice)
- [x] Thời gian trung bình/câu so với khuyến nghị

---

### 15.4. Epic 4: Content Management

#### US-030: Import câu hỏi hàng loạt

**Là** Instructor, **tôi muốn** import câu hỏi từ file Excel/CSV, **để** tiết kiệm thời gian nhập liệu.

**Acceptance Criteria:**

- [x] Upload file CSV/Excel/JSON
- [x] Preview trước khi import: hiển thị dữ liệu parsed, highlight lỗi
- [x] Báo cáo import: số success/failed/skipped, chi tiết lỗi từng dòng
- [x] Câu hỏi import ở trạng thái `draft`
- [x] Template file mẫu có thể tải xuống

#### US-031: Gắn thẻ câu hỏi hàng loạt

**Là** Curator, **tôi muốn** gắn thẻ nhiều câu hỏi cùng lúc, **để** phân loại nhanh.

**Acceptance Criteria:**

- [x] Multi-select câu hỏi từ danh sách
- [x] Bulk action: thêm tags, xóa tags, đổi level
- [x] AI gợi ý thẻ tự động (optional accept)
- [x] Confirm trước khi áp dụng

---

### 15.5. Epic 5: Credential & Verification

#### US-040: Admin cấp chứng chỉ số

**Là** Org Admin, **tôi muốn** cấp chứng chỉ cho sinh viên đạt ngưỡng, **để** chứng nhận kết quả.

**Acceptance Criteria:**

- [x] Trang danh sách SV đủ điều kiện (điểm ≥ ngưỡng)
- [x] Chọn single hoặc batch
- [x] Nút "Phát hành chứng chỉ" → confirm dialog
- [x] Sau phát hành: sinh QR + link verify, ghi `Issued` on-chain
- [x] Gửi email thông báo cho SV
- [x] Hiển thị trạng thái: pending → issuing → issued (real-time)

#### US-041: Verifier xác minh chứng chỉ

**Là** nhà tuyển dụng, **tôi muốn** xác minh chứng chỉ TOEIC bằng QR code, **để** biết chứng chỉ có hợp lệ.

**Acceptance Criteria:**

- [x] Truy cập không cần đăng nhập
- [x] Scan QR hoặc nhập mã → hiển thị kết quả
- [x] Kết quả hiển thị: trạng thái (Valid/Revoked/Expired), issuer, ngày cấp, score, blockchain proof
- [x] Thời gian phản hồi < 2s (p95)
- [x] UI rõ ràng: xanh = valid, đỏ = revoked, vàng = expired
- [x] Link đến blockchain explorer để verify independently

#### US-042: Learner xem và chia sẻ chứng chỉ

**Là** Learner, **tôi muốn** xem chứng chỉ đã nhận và chia sẻ link verify, **để** sử dụng cho xin việc.

**Acceptance Criteria:**

- [x] Danh sách chứng chỉ với status badge
- [x] Click vào → chi tiết: QR, link verify, blockchain info
- [x] Nút "Copy link", "Tải QR (PNG)", "Chia sẻ LinkedIn"
- [x] QR code chứa URL verify đầy đủ

---

## 16. Kế hoạch kiểm thử

### 16.1. Chiến lược kiểm thử

```
                    ┌─────────────────────┐
                    │    E2E Tests        │  ← Ít nhất (critical paths)
                    │    (Cypress/         │
                    │     Playwright)      │
                    ├─────────────────────┤
                    │  Integration Tests  │  ← Trung bình
                    │  (API, DB, Queue)   │
                    ├─────────────────────┤
                    │    Unit Tests       │  ← Nhiều nhất
                    │  (Jest/Vitest)      │
                    └─────────────────────┘
                    Testing Pyramid
```

### 16.2. Unit Tests

| Service        | Focus areas                                             | Coverage target |
| -------------- | ------------------------------------------------------- | --------------- |
| Auth & Profile | Password validation, JWT generation, RBAC checks        | ≥ 80%           |
| Content        | Import parsing, tag validation, workflow transitions    | ≥ 80%           |
| Assessment     | Score calculation, time validation, adaptive selection  | ≥ 85%           |
| AI Tutor       | Prompt generation, guardrail checks, response parsing   | ≥ 70%           |
| Credential     | VC generation, hash computation, signature verification | ≥ 90%           |
| Notification   | Template rendering, channel routing                     | ≥ 75%           |

**Công cụ:** Jest (backend), Vitest (frontend), React Testing Library (components)

### 16.3. Integration Tests

| Test suite       | Mô tả                                            |
| ---------------- | ------------------------------------------------ |
| Auth flow        | Register → Verify → Login → Refresh → Logout     |
| Content workflow | Create item → Review → Approve → Publish         |
| Assessment flow  | Create session → Answer items → Submit → Score   |
| Credential flow  | Qualify → Issue → Verify → Revoke → Verify again |
| AI explanation   | Mock question → Generate explanation → Validate  |
| Notification     | Trigger event → Queue → Process → Deliver        |

**Công cụ:** Supertest (API testing), Testcontainers (DB, Redis, queue)

### 16.4. End-to-End Tests

| Test case                     | Luồng                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| E2E-001: Full learner journey | Register → Setup profile → Placement → View path → Practice → Mock test → View results |
| E2E-002: Content management   | Login as Instructor → Import questions → Tag → Create exam → Publish                   |
| E2E-003: Credential lifecycle | Admin approve → Issue credential → Learner view → Verifier verify                      |
| E2E-004: Revocation           | Admin revoke → Verify shows "Revoked"                                                  |

**Công cụ:** Playwright (cross-browser)

### 16.5. Load Testing

| Scenario                  | Target                     | Tool |
| ------------------------- | -------------------------- | ---- |
| Concurrent mock tests     | 2,000 users simultaneously | k6   |
| Verify endpoint           | 100 rps sustained          | k6   |
| Practice sessions         | 1,000 concurrent           | k6   |
| Content search            | 500 queries/min            | k6   |
| Credential issuance batch | 100 credentials/batch      | k6   |

### 16.6. Security Testing

| Test type                  | Tool                | Scope                               |
| -------------------------- | ------------------- | ----------------------------------- |
| OWASP ZAP scan             | OWASP ZAP           | All public endpoints                |
| Dependency vulnerabilities | Snyk / npm audit    | All dependencies                    |
| Penetration testing        | Manual + Burp Suite | Auth, credential, payment endpoints |
| PII leakage check          | Custom scripts      | API responses, logs, error messages |
| Smart contract audit       | Slither + manual    | ToeicCredentialRegistry contract    |

### 16.7. Smart Contract Testing

| Test case | Mô tả                                      |
| --------- | ------------------------------------------ |
| SC-001    | Issue credential → verify hash exists      |
| SC-002    | Issue duplicate → should revert            |
| SC-003    | Revoke credential → status changes         |
| SC-004    | Revoke non-existent → should revert        |
| SC-005    | Non-issuer tries to issue → should revert  |
| SC-006    | Pause contract → all write operations fail |
| SC-007    | Gas estimation for batch operations        |
| SC-008    | Event emission verification                |

**Công cụ:** Hardhat + Chai + ethers.js

### 16.8. AI Quality Testing

| Test type            | Phương pháp                       | Target                                |
| -------------------- | --------------------------------- | ------------------------------------- |
| Correctness          | Human review 50 samples/release   | ≥ 95% match with answer key           |
| Helpfulness          | User rating (1-5) trên production | ≥ 4.0 average                         |
| Groundedness         | Auto-check quotes exist in source | ≥ 98%                                 |
| Hallucination rate   | Human eval                        | ≤ 2%                                  |
| Response quality A/B | Compare v1 vs v2 explanations     | Statistically significant improvement |
| Latency              | Automated monitoring              | P95 < 3s                              |

---

## 17. Lộ trình phát triển (Roadmap)

### 17.1. Phase 1: MVP (Tuần 1-12)

#### Sprint 1-2 (Tuần 1-4): Foundation

| Task                                     | Service         | Priority |
| ---------------------------------------- | --------------- | -------- |
| Setup monorepo, CI/CD, Docker            | DevOps          | P0       |
| Database schema & migrations             | All             | P0       |
| Auth: Register, Login, JWT, Google SSO   | Auth Service    | P0       |
| Profile: CRUD, setup wizard              | Auth Service    | P0       |
| Content: Item CRUD, import CSV/JSON      | Content Service | P0       |
| Content: Tagging UI, search              | Content Service | P0       |
| Frontend: Design system, layout, routing | Frontend        | P0       |

#### Sprint 3-4 (Tuần 5-8): Core Learning

| Task                                 | Service            | Priority |
| ------------------------------------ | ------------------ | -------- |
| Placement test (rule-based adaptive) | Assessment Service | P0       |
| Learning path generation (basic)     | AI Tutor Service   | P0       |
| Practice sessions (Part 1-7)         | Assessment Service | P0       |
| AI explanation generation            | AI Tutor Service   | P0       |
| Mock test (full 200 questions)       | Assessment Service | P0       |
| Scoring & analytics                  | Assessment Service | P0       |
| Dashboard: progress charts, streak   | Frontend           | P0       |
| Exam management (create, publish)    | Content Service    | P0       |

#### Sprint 5-6 (Tuần 9-12): Blockchain & Polish

| Task                                     | Service              | Priority |
| ---------------------------------------- | -------------------- | -------- |
| Smart contract development & testing     | Credential Service   | P0       |
| DID creation (managed)                   | Auth Service         | P0       |
| VC issuance flow                         | Credential Service   | P0       |
| IPFS integration                         | Credential Service   | P0       |
| Verify page (public)                     | Frontend             | P0       |
| Revoke flow                              | Credential Service   | P0       |
| Notification: email (templates)          | Notification Service | P1       |
| Content workflow (review/approve)        | Content Service      | P1       |
| Bug fixing, performance tuning           | All                  | P0       |
| Load testing, security review            | QA                   | P0       |
| Deploy to staging → production (testnet) | DevOps               | P0       |

### 17.2. Phase 2: Enhancement (Tuần 13-20)

| Feature                                    | Service               | Priority |
| ------------------------------------------ | --------------------- | -------- |
| IRT-based adaptive engine                  | AI Tutor              | P1       |
| Vocabulary SRS (Spaced Repetition)         | Content + Frontend    | P1       |
| Grammar lessons                            | Content + Frontend    | P1       |
| Gamification (badges, quests, leaderboard) | Frontend + Assessment | P2       |
| Bulk import improvements                   | Content               | P1       |
| Class/group analytics                      | Assessment + Frontend | P1       |
| In-app notifications                       | Notification          | P1       |
| MFA for Admin/Org Admin                    | Auth                  | P1       |
| API rate limiting refinement               | API Gateway           | P1       |
| Multi-language support (EN)                | Frontend              | P2       |

### 17.3. Phase 3: Advanced (Tuần 21-32)

| Feature                               | Service               | Priority |
| ------------------------------------- | --------------------- | -------- |
| Speaking assessment (ASR/TTS)         | AI Tutor              | P2       |
| Writing assessment                    | AI Tutor              | P2       |
| Advanced anti-cheat (proctoring)      | Assessment            | P2       |
| Self-custodial wallet (WalletConnect) | Auth + Credential     | P2       |
| Mainnet deployment                    | Credential + DevOps   | P1       |
| Billing & subscription                | Billing Service (new) | P1       |
| Mobile app (React Native)             | Mobile Frontend       | P2       |
| Push notifications                    | Notification          | P2       |
| Selective disclosure (ZKP)            | Credential            | P3       |
| LMS integration (LTI)                 | Integration Service   | P3       |

### 17.4. Timeline trực quan

```
Tuần:  1────4────8────12────16────20────24────28────32
       │         │          │           │           │
Phase 1│ MVP     │          │           │           │
       │ Foundation  Core   Blockchain  │           │
       │         │  Learning│  & Polish │           │
       ├─────────┼──────────┤           │           │
       │                    │           │           │
Phase 2│                    │Enhancement│           │
       │                    │ IRT, SRS  │           │
       │                    │ Gamify    │           │
       │                    ├───────────┤           │
       │                    │           │           │
Phase 3│                    │           │ Advanced  │
       │                    │           │ Speaking  │
       │                    │           │ Mainnet   │
       │                    │           │ Billing   │
       │                    │           ├───────────┤
```

---

## 18. Phân tích rủi ro & Giảm thiểu

### 18.1. Ma trận rủi ro

| ID  | Rủi ro                                        | Xác suất   | Tác động   | Mức độ  | Giảm thiểu                                                                                                                                                             |
| --- | --------------------------------------------- | ---------- | ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Chi phí gas blockchain cao/biến động**      | Trung bình | Cao        | 🔴 Cao  | - Chọn L2 (Polygon) có gas thấp<br>- Batch issuance (gom nhiều VC/1 tx)<br>- Gas estimation + retry logic<br>- Off-chain first, on-chain asynchronous                  |
| R2  | **Chất lượng giải thích AI không đạt**        | Trung bình | Trung bình | 🟡 TB   | - Human-in-the-loop review<br>- Guardrails (answer consistency, grounding)<br>- A/B testing mỗi release<br>- Fallback sang pre-written explanations                    |
| R3  | **Bản quyền nội dung câu hỏi**                | Thấp       | Cao        | 🟡 TB   | - Tự soạn nội dung hoặc license rõ ràng<br>- Watermark/trace để chống leak<br>- Terms of Service rõ ràng về IP                                                         |
| R4  | **Rò rỉ dữ liệu cá nhân (PII)**               | Thấp       | Rất cao    | 🔴 Cao  | - Encryption at-rest & in-transit<br>- Hash-only on-chain<br>- PII tách riêng off-chain<br>- Consent rõ ràng<br>- Penetration testing<br>- Security audit trước launch |
| R5  | **Gian lận trong thi cử**                     | Trung bình | Trung bình | 🟡 TB   | - Randomize questions/options<br>- Tab switch detection<br>- Anomaly detection (v2)<br>- Proctoring option (v2)<br>- Disclaimer về tính chất chứng nhận                |
| R6  | **Smart contract bug/vulnerability**          | Thấp       | Rất cao    | 🔴 Cao  | - Thorough testing (unit + integration)<br>- Slither static analysis<br>- External audit trước mainnet<br>- Pausable pattern<br>- Upgradeable proxy (v2)               |
| R7  | **Scalability bottleneck**                    | Trung bình | Trung bình | 🟡 TB   | - Horizontal scaling design<br>- Load testing mỗi sprint<br>- Database read replicas<br>- Cache strategy (Redis)                                                       |
| R8  | **Key team member rời đi**                    | Thấp       | Trung bình | 🟢 Thấp | - Documentation đầy đủ<br>- Code review bắt buộc<br>- Knowledge sharing sessions<br>- Coding standards enforce bằng lint                                               |
| R9  | **Third-party API downtime (OpenAI, Pinata)** | Trung bình | Trung bình | 🟡 TB   | - Circuit breaker pattern<br>- Fallback/cache cho AI explanations<br>- IPFS backup trên S3<br>- Multi-provider strategy                                                |
| R10 | **Blockchain network congestion/downtime**    | Thấp       | Trung bình | 🟢 Thấp | - Off-chain first design<br>- Queue & retry cho blockchain tx<br>- Multi-chain fallback (v2)                                                                           |

---

## 19. Tiêu chí thành công & KPI

### 19.1. KPI theo giai đoạn

#### MVP (3 tháng sau launch)

| KPI                        | Mục tiêu      | Cách đo                            |
| -------------------------- | ------------- | ---------------------------------- |
| Số đăng ký                 | ≥ 1,000 users | DB count                           |
| MAU                        | ≥ 500         | Analytics                          |
| Placement completion rate  | ≥ 70%         | (completed / started)              |
| Avg sessions/user/week     | ≥ 3           | Analytics                          |
| Mock test completion rate  | ≥ 80%         | (submitted / started)              |
| AI explanation helpfulness | ≥ 3.5/5       | User rating                        |
| Credentials issued         | ≥ 50          | DB count                           |
| Verify success rate        | ≥ 99%         | (valid responses / total requests) |
| P95 response time          | < 500ms       | Monitoring                         |
| Uptime                     | ≥ 99.5%       | Monitoring                         |

#### 6 tháng sau launch

| KPI                        | Mục tiêu                        | Cách đo                |
| -------------------------- | ------------------------------- | ---------------------- |
| MAU                        | ≥ 5,000                         | Analytics              |
| Score improvement          | ≥ 20% avg tăng điểm sau 1 tháng | Before/after mock test |
| Learner retention (30-day) | ≥ 40%                           | DAU/MAU ratio          |
| Avg study streak           | ≥ 5 ngày                        | Analytics              |
| Credentials issued         | ≥ 500                           | DB count               |
| Verify requests/tháng      | ≥ 1,000                         | Analytics              |
| NPS (Net Promoter Score)   | ≥ 30                            | Survey                 |

#### 12 tháng sau launch

| KPI                      | Mục tiêu   | Cách đo    |
| ------------------------ | ---------- | ---------- |
| MAU                      | ≥ 20,000   | Analytics  |
| Organizations onboarded  | ≥ 10       | DB count   |
| Credentials issued/tháng | ≥ 2,000    | DB count   |
| Revenue (nếu có billing) | Break-even | Financials |

### 19.2. KPI kỹ thuật (ongoing)

| Metric                         | Target                    |
| ------------------------------ | ------------------------- |
| Code coverage (unit tests)     | ≥ 70% (MVP), ≥ 80% (v1.1) |
| Build success rate             | ≥ 95%                     |
| Deploy frequency               | ≥ 2 lần/tuần              |
| Mean Time to Recovery (MTTR)   | < 1 giờ                   |
| P95 API latency                | < 500ms                   |
| Error rate                     | < 1%                      |
| Vulnerability count (critical) | 0                         |

---

## 20. Wireframe & Luồng UI

### 20.1. Sitemap

```
🏠 Landing Page
├── 📝 Register
├── 🔐 Login
├── 📊 Learner Dashboard
│   ├── 🎯 Score Tracker
│   ├── 📈 Skill Heatmap
│   ├── 🔥 Study Streak
│   ├── 📅 Weekly Plan
│   └── 🏆 Achievements
├── 📖 Learning Path
│   ├── Module List
│   └── Module Detail
├── ✏️ Practice
│   ├── Part Selection
│   ├── Practice Session
│   └── Session Review
├── 📝 Mock Test
│   ├── Test Lobby
│   ├── Test Session
│   │   ├── Listening Section
│   │   └── Reading Section
│   └── Test Results
│       ├── Score Summary
│       ├── Part Breakdown
│       ├── Skill Analysis
│       └── Wrong Answers Review
├── 📜 My Credentials
│   ├── Credential List
│   └── Credential Detail (QR, Share)
├── 📚 Vocabulary (v1.1)
│   ├── Word List
│   ├── Flashcards
│   └── Quiz
├── ⚙️ Settings
│   ├── Profile
│   ├── Notifications
│   ├── DID / Wallet
│   └── Data Export/Delete
├── 👨‍🏫 Instructor Panel
│   ├── Question Bank
│   │   ├── Import
│   │   ├── List / Search
│   │   ├── Edit / Tag
│   │   └── Review Queue
│   ├── Exam Builder
│   ├── Class Management
│   └── Class Analytics
├── 🏛️ Admin Panel
│   ├── User Management
│   ├── Organization Settings
│   ├── Exam Management
│   ├── Credential Issuance
│   │   ├── Eligible Students
│   │   └── Issued Credentials
│   ├── System Analytics
│   └── System Settings
└── ✅ Verify Page (Public)
    ├── QR Scanner
    ├── Manual Input
    └── Verification Result
```

### 20.2. Mô tả trang chính

#### 20.2.1. Landing Page

- Hero section: slogan + CTA "Bắt đầu miễn phí"
- 3 trụ cột: AI Personalized Learning, Smart Assessment, Blockchain Certificate
- Testimonials (sau khi có users)
- Pricing (v2)
- Footer: About, Terms, Privacy, Contact

#### 20.2.2. Learner Dashboard

- **Top bar:** Avatar, notifications bell, settings
- **Left sidebar:** Navigation (Dashboard, Learn, Practice, Mock Test, Credentials, Vocab)
- **Main area:**
  - Score progress card (current vs target, progress bar)
  - Radar chart (kỹ năng vi mô)
  - Calendar heatmap (study streak)
  - "Continue Learning" card (next module)
  - Weekly summary cards (hours, items, accuracy)
  - Mock test history mini chart

#### 20.2.3. Mock Test Session

- **Header:** Timer (countdown), section name, progress
- **Left panel:** Navigation map (câu 1-200, color-coded: answered/unanswered/flagged)
- **Center:** Question stem + options (radio buttons)
- **Bottom:** Prev/Next, Flag button, Submit button
- **Audio player:** (for Listening) play/pause/progress bar

#### 20.2.4. Verify Page

- Clean, simple design (no login required)
- **Input area:** QR scanner (camera) OR text input (credential ID)
- **Result card:**
  - Large status badge (✅ Valid / ❌ Revoked / ⏰ Expired)
  - Issuer name + logo
  - Holder name
  - Score + exam type
  - Issue date
  - Blockchain proof link
- **Branding:** "Powered by TOEIC AI" footer

---

## 21. Phụ lục

### 21.1. Sơ đồ tuần tự: Credential Issuance (chi tiết)

```
┌──────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ ┌───────┐
│Admin │ │Frontend│ │API       │ │Credential│ │Blockchain│ │ IPFS │ │Notify │
│      │ │        │ │Gateway   │ │Service   │ │(Contract)│ │      │ │Service│
└──┬───┘ └───┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬───┘ └───┬───┘
   │         │           │            │            │           │         │
   │──Click──>│           │            │            │           │         │
   │ "Issue"  │──POST────>│            │            │           │         │
   │         │ /cred/    │──Forward──>│            │           │         │
   │         │ issue     │           │──1.Create──│           │         │
   │         │           │            │  VC JSON   │           │         │
   │         │           │            │            │           │         │
   │         │           │            │──2.Sign VC─│           │         │
   │         │           │            │  (ECDSA)   │           │         │
   │         │           │            │            │           │         │
   │         │           │            │──3.Hash VC─│           │         │
   │         │           │            │  (SHA-256) │           │         │
   │         │           │            │            │           │         │
   │         │           │            │──4.Issue───>│           │         │
   │         │           │            │  Credential│──Write──>│         │
   │         │           │            │  (hash,DID)│ on-chain  │         │
   │         │           │            │            │           │         │
   │         │           │            │<─txHash────│           │         │
   │         │           │            │            │           │         │
   │         │           │            │──5.Pin VC──>│──────────>│         │
   │         │           │            │  to IPFS   │<──CID─────│         │
   │         │           │            │            │           │         │
   │         │           │            │──6.Save DB─│           │         │
   │         │           │            │  (VC+tx+   │           │         │
   │         │           │            │   CID)     │           │         │
   │         │           │            │            │           │         │
   │         │           │            │──7.Gen QR──│           │         │
   │         │           │            │  + Link    │           │         │
   │         │           │            │            │           │         │
   │         │           │            │──8.Notify──>│──────────>│──Email─>│
   │         │           │            │            │           │ to      │
   │         │           │<──Result───│            │           │ Holder  │
   │         │<──200 OK──│            │            │           │         │
   │<──Show──│           │            │            │           │         │
   │ Success │           │            │            │           │         │
```

### 21.2. Mẫu Schema câu hỏi (JSON đầy đủ)

```json
{
  "id": "item_P7_001",
  "part": 7,
  "level": "medium",
  "tags": ["inference", "business-email", "topic:office"],
  "microSkills": ["reading:inference", "vocab:business-correspondence"],
  "stem": "What is the purpose of the email?",
  "passage": "From: Sarah Johnson <sjohnson@techcorp.com>\nTo: All Staff\nSubject: Updated Meeting Schedule\n\nDear team,\n\nDue to the client visit on Thursday, the weekly team meeting has been rescheduled from Wednesday 2 PM to Friday 10 AM. Please update your calendars accordingly.\n\nAlso, please prepare your project status reports by Thursday morning so I can compile them before the client presentation.\n\nBest regards,\nSarah",
  "options": [
    "To confirm a client order",
    "To request project status reports",
    "To announce a schedule change",
    "To cancel the weekly meeting"
  ],
  "answer": 3,
  "transcript": null,
  "mediaUrl": null,
  "rationale": "The primary purpose is announced in the first paragraph: 'the weekly team meeting has been rescheduled'. While option B mentions something in the email, it's a secondary request, not the main purpose. Option A is not mentioned. Option D is incorrect because the meeting is rescheduled, not cancelled.",
  "timeLimitSec": 45,
  "trapTypes": ["partial-info", "similar-meaning"],
  "status": "published",
  "authorId": "usr_instructor_001",
  "version": 1,
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-01T10:00:00.000Z"
}
```

### 21.3. Mẫu Schema câu hỏi Listening (Part 3)

```json
{
  "id": "item_P3_001",
  "part": 3,
  "level": "hard",
  "tags": ["inference", "conversation", "topic:travel"],
  "microSkills": ["listening:inference", "listening:detail"],
  "questionGroup": "group_P3_001",
  "groupContext": "Questions 32-34 refer to the following conversation.",
  "stem": "What does the man suggest?",
  "options": [
    "Booking an earlier flight",
    "Taking a different airline",
    "Driving to the conference",
    "Postponing the trip"
  ],
  "answer": 1,
  "transcript": "W: I just checked the flight schedule, and the 3 PM flight to Chicago is fully booked.\nM: What about the morning flight? If we take the 8 AM one, we'd still have plenty of time before the conference starts at 2.\nW: That's a good idea. Let me check if there are seats available.\nM: Great. And we should probably book a hotel near the venue too.",
  "mediaUrl": "https://cdn.toeic-ai.com/audio/P3_001.mp3",
  "audioDuration": 28.5,
  "rationale": "The man says 'What about the morning flight? If we take the 8 AM one...' which suggests booking an earlier flight (option A). Options B, C, D are not mentioned.",
  "timeLimitSec": 40,
  "trapTypes": ["similar-sound"],
  "status": "published"
}
```

### 21.4. Quy ước đặt tên & Tagging

#### Tag Taxonomy

```
Tags hierarchy:
├── part:P1, part:P2, ..., part:P7
├── skill:
│   ├── grammar:tense
│   ├── grammar:inversion
│   ├── grammar:relative-clause
│   ├── grammar:conditional
│   ├── grammar:gerund-infinitive
│   ├── grammar:comparative
│   ├── grammar:preposition
│   ├── grammar:conjunction
│   ├── grammar:subject-verb-agreement
│   ├── grammar:passive-voice
│   ├── vocab:business
│   ├── vocab:synonym
│   ├── vocab:collocation
│   ├── vocab:phrasal-verb
│   ├── vocab:word-form
│   ├── listening:main-idea
│   ├── listening:detail
│   ├── listening:inference
│   ├── listening:speaker-intent
│   ├── reading:main-idea
│   ├── reading:detail
│   ├── reading:inference
│   ├── reading:vocabulary-in-context
│   └── reading:text-structure
├── topic:
│   ├── topic:office
│   ├── topic:travel
│   ├── topic:finance
│   ├── topic:technology
│   ├── topic:health
│   ├── topic:education
│   ├── topic:manufacturing
│   ├── topic:marketing
│   ├── topic:restaurant
│   ├── topic:shopping
│   └── topic:environment
├── trap:
│   ├── trap:similar-sound
│   ├── trap:repeated-word
│   ├── trap:opposite-meaning
│   ├── trap:partial-info
│   ├── trap:out-of-scope
│   └── trap:similar-meaning
└── difficulty:
    ├── difficulty:band-300-500
    ├── difficulty:band-500-700
    ├── difficulty:band-700-850
    └── difficulty:band-850-990
```

### 21.5. TOEIC Score Conversion Table (Ước lượng)

| Raw Score (Listening) | Estimated Scaled Score | Raw Score (Reading) | Estimated Scaled Score |
| --------------------- | ---------------------- | ------------------- | ---------------------- |
| 96-100                | 475-495                | 96-100              | 460-495                |
| 91-95                 | 435-475                | 91-95               | 425-460                |
| 86-90                 | 400-435                | 86-90               | 390-425                |
| 81-85                 | 370-400                | 81-85               | 355-390                |
| 76-80                 | 340-370                | 76-80               | 325-355                |
| 71-75                 | 310-340                | 71-75               | 295-325                |
| 66-70                 | 280-310                | 66-70               | 265-295                |
| 61-65                 | 250-280                | 61-65               | 235-265                |
| 56-60                 | 220-250                | 56-60               | 210-235                |
| 51-55                 | 195-220                | 51-55               | 185-210                |
| ≤50                   | 5-195                  | ≤50                 | 5-185                  |

_Ghi chú: Bảng trên là ước lượng. Bảng chính thức cần calibrate với dữ liệu thực tế._

### 21.6. Hướng dẫn triển khai (Blueprint kỹ thuật)

#### Repository Structure

```
toeic-ai/                          # Monorepo root
├── apps/
│   ├── web/                       # Next.js frontend
│   ├── verify/                    # Verify page (static/SSR)
│   └── mobile/                    # React Native (v2)
├── services/
│   ├── svc-auth/                  # Auth & Profile service
│   ├── svc-content/               # Content service
│   ├── svc-assessment/            # Assessment service
│   ├── svc-ai/                    # AI Tutor service
│   ├── svc-credential/            # Credential service
│   └── svc-notify/                # Notification service
├── packages/
│   ├── shared/                    # Shared types, utils, constants
│   ├── ui/                        # Shared UI components
│   └── contracts/                 # Smart contracts (Hardhat)
├── infra/
│   ├── docker/                    # Dockerfiles
│   ├── docker-compose.yml         # Local development
│   ├── k8s/                       # Kubernetes manifests
│   └── terraform/                 # Infrastructure as Code (v2)
├── docs/
│   ├── SRS_TOEIC_AI_Blockchain_Detail.md  # This document
│   ├── api/                       # API documentation (OpenAPI)
│   └── architecture/              # Architecture diagrams
├── .github/
│   └── workflows/                 # GitHub Actions CI/CD
├── package.json                   # Root workspace config
├── turbo.json                     # Turborepo config
└── README.md
```

#### Môi trường triển khai

| Môi trường     | Mục đích               | Infrastructure                | Blockchain           |
| -------------- | ---------------------- | ----------------------------- | -------------------- |
| **local**      | Development            | Docker Compose (all services) | Hardhat local node   |
| **dev**        | Integration testing    | Docker Compose trên VM        | Polygon Amoy testnet |
| **staging**    | Pre-production testing | K8s cluster (nhỏ)             | Polygon Amoy testnet |
| **production** | Live environment       | K8s cluster (production)      | Polygon PoS mainnet  |

#### CI/CD Pipeline

```
Push to branch
    │
    ├── Lint + Type Check ──────────> ❌ Fail → Block
    ├── Unit Tests ─────────────────> ❌ Fail → Block
    ├── Build ──────────────────────> ❌ Fail → Block
    │
    ▼ (PR to main)
    ├── Integration Tests ──────────> ❌ Fail → Block PR
    ├── E2E Tests (critical paths) ─> ❌ Fail → Block PR
    ├── Security Scan ──────────────> ⚠️ Warn/Block
    │
    ▼ (Merge to main)
    ├── Build Docker images
    ├── Push to registry
    ├── Deploy to staging ──────────> Auto
    ├── Run smoke tests ────────────> ❌ Fail → Rollback
    │
    ▼ (Manual approval)
    └── Deploy to production ───────> Manual trigger
```

#### Coding Standards

| Rule                           | Tool                               |
| ------------------------------ | ---------------------------------- |
| TypeScript strict mode         | `tsconfig.json`                    |
| ESLint (Airbnb + custom rules) | `.eslintrc`                        |
| Prettier (formatting)          | `.prettierrc`                      |
| Commit message                 | Conventional Commits (commitlint)  |
| Branch naming                  | `feat/xxx`, `fix/xxx`, `chore/xxx` |
| PR reviews                     | Minimum 1 approval required        |
| Unit test coverage             | ≥ 70% (enforced in CI)             |
| No console.log in production   | ESLint rule                        |

### 21.7. Glossary (Bảng thuật ngữ bổ sung)

| Thuật ngữ       | Định nghĩa                                                                        |
| --------------- | --------------------------------------------------------------------------------- |
| Micro-skill     | Kỹ năng vi mô, đơn vị nhỏ nhất của năng lực (VD: grammar:tense, listening:detail) |
| Band score      | Phạm vi điểm TOEIC (VD: 300-500 = Beginner)                                       |
| Adaptive        | Thích ứng – điều chỉnh nội dung dựa trên năng lực người học                       |
| Grounding       | Kỹ thuật đảm bảo AI chỉ trả lời dựa trên dữ liệu có sẵn, không bịa                |
| Hallucination   | AI sinh ra thông tin không có trong nguồn dữ liệu                                 |
| Gas fee         | Phí giao dịch trên blockchain                                                     |
| Finality        | Thời gian để giao dịch blockchain được xác nhận vĩnh viễn                         |
| Pinning         | Lưu trữ lâu dài dữ liệu trên IPFS                                                 |
| Circuit breaker | Pattern ngắt kết nối đến service lỗi để tránh cascade failure                     |
| Correlation ID  | Mã định danh duy nhất theo dõi 1 request qua nhiều service                        |

---

## Lịch sử thay đổi tài liệu

| Phiên bản | Ngày       | Thay đổi                                                                                                                                          | Người thực hiện |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1.0       | -          | Bản SRS gốc (khung sơ bộ)                                                                                                                         | Tiến Đạt        |
| 2.0       | 17/03/2026 | Phát triển chi tiết toàn bộ: mở rộng personas, user stories, API spec, data model, smart contract, security, testing, wireframe, deployment guide | Tiến Đạt        |

---

_Tài liệu này là bản đặc tả yêu cầu phần mềm hoàn chỉnh, đủ chi tiết để bắt đầu thiết kế UI/UX và phát triển. Khi team rõ ràng, hãy bổ sung: mockup UI chi tiết (Figma), test case cụ thể cho từng user story, và sprint planning chi tiết._
