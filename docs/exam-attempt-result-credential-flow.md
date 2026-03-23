# Exam Attempt, Result, and Credential Issuance Schema

## 1. Mục tiêu

Tài liệu này thiết kế phần dữ liệu còn thiếu cho luồng:

1. learner làm bài thi
2. hệ thống lưu kết quả thi chuẩn hoá
3. nếu đạt ngưỡng `500` thì tạo yêu cầu cấp chứng chỉ
4. admin duyệt, hệ thống phát hành credential
5. mọi thay đổi sau đó được audit rõ ràng

## 2. Nguyên tắc thiết kế

- `exam_template` là blueprint của đề
- `exam_attempts` là nguồn sự thật cho kết quả thi
- `exam_attempt_answers` lưu từng câu trả lời chi tiết
- phải có snapshot tại thời điểm nộp bài để lịch sử không bị sai nếu question bank hoặc template đổi sau này
- luồng cấp chứng chỉ dùng lại `credential_requests`, `credentials`, `credential_events`
- ngưỡng `500` hiện hardcode ở service, nhưng phải ghi lại snapshot vào dữ liệu để sau này chuyển sang cấu hình được

## 3. Sơ đồ quan hệ

```text
users
  └── exam_attempts
          ├── exam_attempt_answers
          ├── exam_attempt_part_scores
          └── credential_requests (nếu đạt điều kiện)

credential_templates
  └── credential_requests
          └── credentials
                  ├── credential_events
                  └── credential_verification_logs

audit_logs
  └── mọi thay đổi quan trọng: rule, threshold, approve, issue, revoke
```

## 4. Bảng đề xuất

### 4.1 `exam_attempts`

Nguồn sự thật cho một lần làm bài của learner.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk users.id | người làm bài |
| exam_template_id | uuid fk exam_templates.id | template được dùng |
| attempt_no | int | số lần làm bài của user trên cùng template |
| status | enum | `in_progress`, `submitted`, `graded`, `abandoned`, `cancelled` |
| mode | varchar(30) | `practice`, `mock_test`, `official_exam` snapshot từ template |
| started_at | timestamptz | |
| submitted_at | timestamptz null | |
| graded_at | timestamptz null | |
| duration_sec | int null | tổng thời gian thực tế |
| total_questions | int | snapshot tổng câu |
| answered_count | int | số câu đã trả lời |
| correct_count | int | số câu đúng |
| listening_raw_score | numeric(8,2) | điểm thô part nghe |
| reading_raw_score | numeric(8,2) | điểm thô part đọc |
| listening_scaled_score | numeric(8,2) | điểm quy đổi |
| reading_scaled_score | numeric(8,2) | điểm quy đổi |
| total_score | numeric(8,2) | tổng điểm cuối cùng, ví dụ TOEIC `0-990` |
| pass_threshold_snapshot | int | snapshot ngưỡng lúc chấm, hiện = `500` |
| passed | boolean | `true` nếu đạt ngưỡng |
| scoring_version | varchar(50) | version của công thức chấm điểm |
| template_snapshot | jsonb | snapshot template/sections/rules/items lúc bắt đầu bài |
| result_payload | jsonb | breakdown theo part, note, flag, thống kê |
| metadata | jsonb | device, ip, client info, anti-cheat signals |

Indexes and constraints:

- `idx_exam_attempts_user_id`
- `idx_exam_attempts_exam_template_id`
- `idx_exam_attempts_status`
- `idx_exam_attempts_submitted_at`
- unique (`user_id`, `exam_template_id`, `attempt_no`)

### 4.2 `exam_attempt_answers`

Lưu từng câu learner đã chọn gì và kết quả chấm chi tiết.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| exam_attempt_id | uuid fk exam_attempts.id | |
| question_group_id | uuid fk question_groups.id | |
| question_id | uuid fk questions.id | |
| part | enum question_part | snapshot part |
| question_no | int | số thứ tự trong group |
| selected_option_key | varchar(10) null | A/B/C/D hoặc text key |
| selected_option_snapshot | jsonb | snapshot option đã chọn |
| is_correct | boolean | |
| score_weight_snapshot | numeric(6,2) | snapshot score weight của câu |
| score_awarded | numeric(8,2) | số điểm thực nhận |
| answered_at | timestamptz null | |
| time_spent_sec | int null | thời gian trả lời câu này |
| answer_payload | jsonb | context: audio time, revisit flag, device signals |
| metadata | jsonb | |

Indexes and constraints:

- `idx_exam_attempt_answers_attempt_id`
- `idx_exam_attempt_answers_question_id`
- `idx_exam_attempt_answers_part`
- unique (`exam_attempt_id`, `question_id`)

### 4.3 `exam_attempt_part_scores`

Denormalized bảng tổng hợp theo Part để dashboard, report, và audit dễ hơn.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| exam_attempt_id | uuid fk exam_attempts.id | |
| part | enum question_part | |
| section_order | int | thứ tự section trong template |
| question_count | int | |
| correct_count | int | |
| raw_score | numeric(8,2) | |
| scaled_score | numeric(8,2) | |
| duration_sec | int null | |
| metadata | jsonb | |

Indexes and constraints:

- `idx_exam_attempt_part_scores_attempt_id`
- `idx_exam_attempt_part_scores_part`
- unique (`exam_attempt_id`, `part`)

### 4.4 `credential_requests`

Schema hiện có đã đúng hướng, nhưng nên bổ sung một FK thật tới kết quả thi.

Đề xuất thêm:

| column | type | notes |
|---|---|---|
| exam_attempt_id | uuid fk exam_attempts.id null | source chuẩn khi cấp từ kết quả thi |
| eligibility_score | numeric(8,2) null | điểm dùng để xét duyệt |
| pass_threshold_snapshot | int null | snapshot ngưỡng, hiện hardcode `500` |
| eligibility_source | varchar(50) | `exam_result`, `manual`, `batch_import` |
| source_ref | varchar(255) null | giữ cho nguồn ngoài hệ thống hoặc legacy |

Rules:

- nếu `eligibility_source = 'exam_result'` thì `exam_attempt_id` phải có giá trị
- `source_ref` vẫn giữ để hỗ trợ import thủ công hoặc nguồn ngoài
- `approved_payload` nên chứa:
  - `examAttemptId`
  - `score`
  - `threshold`
  - `scoringVersion`
  - `templateId`

### 4.5 `credentials`

Giữ nguyên schema hiện tại.

Nó là bản phát hành cuối cùng:

- `request_id` liên kết tới `credential_requests`
- `credential_payload` là payload VC cuối cùng
- `credential_events` ghi timeline phát hành
- `credential_verification_logs` ghi log verify public

### 4.6 `audit_logs`

Giữ nguyên schema hiện tại và bắt buộc log các thay đổi sau:

- thay đổi ngưỡng cấp chứng chỉ
- approve/reject/issue/revoke credential
- chỉnh template chứng chỉ
- chỉnh rule cấp chứng chỉ

## 5. Luồng dữ liệu đề xuất

```text
1. learner start exam
2. hệ thống tạo exam_attempts
3. mỗi câu trả lời đi vào exam_attempt_answers
4. khi submit, hệ thống tính điểm và ghi exam_attempt_part_scores
5. cập nhật exam_attempts.total_score, passed, result_payload
6. nếu total_score >= 500 thì tạo credential_requests
7. admin duyệt request
8. hệ thống tạo credentials
9. phát sinh credential_events
10. mọi thao tác quan trọng đi vào audit_logs
```

## 6. Quy tắc điểm 500

Hiện tại:

- hardcode ở service cấp chứng chỉ
- check trực tiếp: `if (totalScore >= 500)`
- snapshot giá trị này vào:
  - `exam_attempts.pass_threshold_snapshot`
  - `credential_requests.pass_threshold_snapshot`
  - `credential_requests.approved_payload.threshold`

Sau này:

- chuyển ngưỡng sang `credential_templates.pass_score_threshold`
- hoặc nếu muốn global thì đưa vào `system_settings`
- mọi thay đổi threshold phải ghi `audit_logs`

## 7. Vì sao phải có snapshot

Nếu không snapshot:

- question bank đổi đáp án
- exam template đổi item
- rule chấm điểm đổi

thì lịch sử kết quả sẽ bị lệch.

Vì vậy schema phải lưu snapshot ở mức:

- template snapshot trong `exam_attempts`
- answer snapshot trong `exam_attempt_answers`
- threshold snapshot trong `exam_attempts` và `credential_requests`

## 8. Thứ tự nên triển khai

1. `exam_attempts`
2. `exam_attempt_answers`
3. `exam_attempt_part_scores`
4. nối `credential_requests.exam_attempt_id`
5. service submit bài + tính điểm
6. auto-create credential request khi đạt `500`
7. approve/issue credential
8. audit log cho threshold và issuance

