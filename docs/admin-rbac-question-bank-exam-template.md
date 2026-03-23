# Admin RBAC, Question Bank, and Exam Template Design

## 1. RBAC scope

This project now uses 3 roles overall:

- `learner`
- `admin`
- `superadmin`

For the admin backoffice scope in this document, only 2 privileged roles are used:

- `admin`
- `superadmin`

### 1.1 Role intent

- `superadmin`
  - Full access to all admin endpoints
  - Can manage users, roles, and system-level settings
  - Acts as bypass role in `RolesGuard`
- `admin`
  - Day-to-day operator role
  - Can manage question bank, exam templates, exam campaigns, results, and credentials

### 1.2 Practical rule

- Public register creates only `learner`
- `superadmin` must be created by seed/manual migration/admin bootstrap script
- `admin` should be created by backoffice invite or privileged bootstrap flow
- Route protection stays role-based with `@Roles(UserRole.ADMIN)` or `@Roles(UserRole.SUPERADMIN)`
- `superadmin` can access every route that requires `admin`

### 1.3 Suggested endpoint split

- `superadmin` only
  - user management
  - role assignment
  - system settings
- `admin` and `superadmin`
  - question bank
  - exam template
  - exam campaign
  - result analytics
  - credential approval and issuance

## 2. Question Bank model

### 2.1 Core design principle

Do not model every TOEIC question as a completely standalone row.

Use `question_groups` as the root aggregate because TOEIC has shared context:

- Part 1: one image can drive one question
- Part 2: often one prompt drives one question
- Part 3-4: one audio drives multiple questions
- Part 6: one passage drives multiple blanks/questions
- Part 7: one or more passages drive multiple questions

### 2.2 Enums

```text
question_part:
  P1, P2, P3, P4, P5, P6, P7

question_level:
  easy, medium, hard, expert

question_group_status:
  draft, in_review, published, archived

asset_kind:
  image, audio, passage, transcript

template_mode:
  practice, mock_test, official_exam

template_status:
  draft, published, archived

template_item_mode:
  manual, rule_based
```

### 2.3 Tables

#### `question_groups`

One logical TOEIC item set.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| code | varchar(50) unique | human-readable internal code |
| title | varchar(255) | short admin label |
| part | enum question_part | root TOEIC part |
| level | enum question_level | difficulty band |
| status | enum question_group_status | publishing workflow |
| stem | text null | prompt/instruction for simple parts |
| explanation | text null | editorial explanation |
| source_type | varchar(30) | manual, import, ai_draft |
| source_ref | varchar(255) null | external ref/import file id |
| created_by | uuid fk users.id | |
| updated_by | uuid fk users.id null | |
| reviewed_by | uuid fk users.id null | |
| published_at | timestamptz null | |
| deleted_at | timestamptz null | soft delete |
| metadata | jsonb default '{}' | flexible fields |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes:

- unique(`code`)
- index(`part`, `status`)
- index(`level`, `status`)
- index(`created_by`)
- gin(`metadata`)

#### `question_group_assets`

Shared assets for a question group.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| question_group_id | uuid fk | |
| kind | enum asset_kind | image, audio, passage, transcript |
| storage_key | varchar(500) | S3/MinIO key |
| public_url | varchar(1000) null | cached serving url |
| mime_type | varchar(100) null | |
| duration_sec | int null | for audio |
| sort_order | int default 0 | |
| content_text | text null | transcript/passage plain text |
| metadata | jsonb default '{}' | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes:

- index(`question_group_id`, `kind`)

#### `questions`

Child questions under a group.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| question_group_id | uuid fk | |
| question_no | int | order inside group |
| prompt | text | actual question text |
| answer_key | varchar(10) | A/B/C/D or domain-specific token |
| rationale | text null | answer explanation |
| time_limit_sec | int null | optional per-item limit |
| score_weight | numeric(6,2) default 1 | |
| metadata | jsonb default '{}' | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Constraints:

- unique(`question_group_id`, `question_no`)

Indexes:

- index(`question_group_id`)

#### `question_options`

Options for a question.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| question_id | uuid fk | |
| option_key | varchar(10) | A/B/C/D |
| content | text | option text |
| is_correct | boolean | keep for convenience, still validate with answer_key |
| sort_order | int | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Constraints:

- unique(`question_id`, `option_key`)

#### `tags`

Reusable tagging system.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| category | varchar(50) | skill, topic, trap, grammar, vocab |
| code | varchar(100) unique | `grammar:tense`, `topic:office` |
| label | varchar(255) | admin label |
| description | text null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `question_group_tags`

Many-to-many between question groups and tags.

| column | type | notes |
|---|---|---|
| question_group_id | uuid fk | |
| tag_id | uuid fk | |
| created_at | timestamptz | |

Constraints:

- pk(`question_group_id`, `tag_id`)

#### `question_group_reviews`

Workflow/audit for publishing.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| question_group_id | uuid fk | |
| action | varchar(30) | submit_review, approve, reject, archive |
| comment | text null | |
| performed_by | uuid fk users.id | |
| created_at | timestamptz | |

## 3. Exam Template model

### 3.1 Core design principle

Separate 3 concepts:

- `Question Bank`: raw content inventory
- `Exam Template`: reusable structure of a test
- `Exam Campaign`: a scheduled delivery of a template to learners

This document covers only `Exam Template`.

### 3.2 Tables

#### `exam_templates`

Reusable exam definition.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| code | varchar(50) unique | internal code |
| name | varchar(255) | |
| mode | enum template_mode | practice, mock_test, official_exam |
| status | enum template_status | draft, published, archived |
| total_duration_sec | int | |
| total_questions | int | |
| instructions | text null | |
| shuffle_question_order | boolean default false | |
| shuffle_option_order | boolean default false | |
| created_by | uuid fk users.id | |
| updated_by | uuid fk users.id null | |
| published_at | timestamptz null | |
| metadata | jsonb default '{}' | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes:

- unique(`code`)
- index(`mode`, `status`)

#### `exam_template_sections`

Per-part blueprint.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| exam_template_id | uuid fk | |
| part | enum question_part | |
| section_order | int | |
| expected_group_count | int | |
| expected_question_count | int | |
| duration_sec | int null | optional by section |
| instructions | text null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Constraints:

- unique(`exam_template_id`, `part`)

#### `exam_template_rules`

Rules for auto-fill and validation.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| exam_template_id | uuid fk | |
| part | enum question_part | |
| level_distribution | jsonb | `{easy: 2, medium: 4, hard: 2}` |
| required_tag_codes | jsonb | `["grammar:tense"]` |
| excluded_tag_codes | jsonb | |
| question_count | int | target questions |
| group_count | int null | target group count |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `exam_template_items`

Resolved items selected into template.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| exam_template_id | uuid fk | |
| section_id | uuid fk exam_template_sections.id | |
| question_group_id | uuid fk | |
| source_mode | enum template_item_mode | manual, rule_based |
| display_order | int | |
| locked | boolean default false | if true, auto-fill cannot replace |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Constraints:

- unique(`exam_template_id`, `question_group_id`)
- unique(`exam_template_id`, `display_order`)

## 4. Recommended implementation order

### Phase A

- tags
- question_groups
- question_group_assets
- questions
- question_options

### Phase B

- search/filter/list
- bulk tag
- publish workflow
- import preview

### Phase C

- exam_templates
- exam_template_sections
- exam_template_rules
- exam_template_items
- validate/preview endpoint

## 5. Admin API list

All endpoints below should live under admin auth and be protected by:

- `@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)` for operational endpoints
- `@Roles(UserRole.SUPERADMIN)` for system-only endpoints

### 5.1 Question Bank

#### Tags

- `GET /admin/tags`
- `POST /admin/tags`
- `PATCH /admin/tags/:id`
- `DELETE /admin/tags/:id`

#### Question groups

- `GET /admin/question-groups`
  - filters: `part`, `level`, `status`, `tag`, `keyword`, `createdBy`
- `POST /admin/question-groups`
- `GET /admin/question-groups/:id`
- `PATCH /admin/question-groups/:id`
- `DELETE /admin/question-groups/:id`

#### Workflow

- `POST /admin/question-groups/:id/submit-review`
- `POST /admin/question-groups/:id/approve`
- `POST /admin/question-groups/:id/reject`
- `POST /admin/question-groups/:id/publish`
- `POST /admin/question-groups/:id/archive`

#### Bulk operations

- `POST /admin/question-groups/bulk-tag`
- `POST /admin/question-groups/bulk-status`

#### Import

- `POST /admin/question-groups/import/presign`
- `POST /admin/question-groups/import/preview`
- `POST /admin/question-groups/import/commit`

#### Assets

- `POST /admin/question-groups/:id/assets/presign`
- `POST /admin/question-groups/:id/assets`
- `DELETE /admin/question-groups/:id/assets/:assetId`

### 5.2 Exam Template

- `GET /admin/exam-templates`
- `POST /admin/exam-templates`
- `GET /admin/exam-templates/:id`
- `PATCH /admin/exam-templates/:id`
- `DELETE /admin/exam-templates/:id`

#### Sections and rules

- `PUT /admin/exam-templates/:id/sections`
- `PUT /admin/exam-templates/:id/rules`

#### Manual composition

- `POST /admin/exam-templates/:id/items/manual`
- `PATCH /admin/exam-templates/:id/items/reorder`
- `DELETE /admin/exam-templates/:id/items/:itemId`

#### Auto fill and preview

- `POST /admin/exam-templates/:id/items/auto-fill`
- `POST /admin/exam-templates/:id/validate`
- `GET /admin/exam-templates/:id/preview`

#### Lifecycle

- `POST /admin/exam-templates/:id/publish`
- `POST /admin/exam-templates/:id/archive`
- `POST /admin/exam-templates/:id/duplicate`

## 6. Validation rules to enforce in backend

### Question Bank

- Part 1-4 must have at least one shared asset of type `audio` or `image` as required by the part
- Every question must have exactly 4 options for MVP
- `answer_key` must match an existing option
- Published question groups cannot be deleted hard
- Part 3, 4, 6, 7 should allow multiple child questions under one group

### Exam Template

- A published template must contain enough items to satisfy every section
- `total_questions` must equal the sum of section question counts
- No duplicate `question_group_id` inside one template
- Section item order must be deterministic after publish
- A published template becomes immutable except duplicate/archive operations

## 7. First coding target after this document

If starting from current codebase, build in this order:

1. `tags`
2. `question_groups`
3. `questions`
4. `question_options`
5. `question_group_assets`
6. `question_group_tags`
7. question group list/detail/create/update endpoints
8. import preview endpoint
9. `exam_templates`
10. template validate/preview endpoint
