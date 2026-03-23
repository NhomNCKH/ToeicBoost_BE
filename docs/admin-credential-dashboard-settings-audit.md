# Admin Credential, Dashboard, Settings, and Audit Design

## 1. Current status in codebase

Already implemented:

- RBAC base with project roles `learner`, `admin`, and `superadmin`
- Question Bank admin APIs
- Exam Template admin APIs

Not implemented yet as runtime APIs:

- admin user management APIs
- credential approval and issuance APIs
- dashboard and reporting APIs
- system settings and audit APIs

This document defines the database schema and API contract for those remaining admin areas.

## 2. RBAC for a 3-role project

### 2.1 Source of truth

- `users.role` remains the only role source of truth
- Project roles are `learner`, `admin`, and `superadmin`
- Admin backoffice uses only the privileged subset: `admin` and `superadmin`
- No dynamic role table is needed for this project stage
- Route protection still uses `@Roles(UserRole.ADMIN)` and `@Roles(UserRole.SUPERADMIN)`
- `superadmin` bypasses all `admin` routes in `RolesGuard`

### 2.2 Why no permission table yet

Because the project now has only 3 fixed roles and only 2 privileged admin roles, a dynamic `permissions` table adds complexity without giving real value.

The clean approach is:

- keep role in `users`
- keep permission matrix in code
- audit role changes in `audit_logs`
- use `admin_invites` to control who can join admin backoffice

### 2.3 RBAC-related admin tables

#### `admin_invites`

Purpose:

- invite a new `admin` or `superadmin`
- avoid public creation of privileged users
- track invite lifecycle

Columns:

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| email | varchar(255) indexed | invited email |
| role | user_role | only `admin` or `superadmin` |
| token_hash | varchar(255) unique | do not store raw token |
| status | enum | `pending`, `accepted`, `expired`, `revoked` |
| expires_at | timestamptz | |
| accepted_at | timestamptz null | |
| revoked_at | timestamptz null | |
| accepted_user_id | uuid fk users.id null | user created from invite |
| invited_by | uuid fk users.id | inviter |
| metadata | jsonb | IP, note, campaign, etc. |

### 2.4 RBAC admin API list

`superadmin` only:

- `GET /admin/admin-users`
- `GET /admin/admin-users/:id`
- `PATCH /admin/admin-users/:id/role`
- `PATCH /admin/admin-users/:id/status`
- `POST /admin/admin-users/:id/reset-mfa`
- `POST /admin/admin-users/:id/unlock`
- `GET /admin/admin-invites`
- `POST /admin/admin-invites`
- `POST /admin/admin-invites/:id/revoke`
- `POST /admin/admin-invites/:id/resend`

## 3. Credential approval and issuance

### 3.1 Core flow

1. learner becomes eligible from exam result or manual review
2. system creates `credential_request`
3. admin approves or rejects
4. system issues `credential`
5. blockchain/IPFS sync updates the credential
6. public verification logs are stored
7. revocation is tracked on both credential row and event log

The source of truth for exam results is defined separately in [exam-attempt-result-credential-flow.md](./exam-attempt-result-credential-flow.md).

### 3.2 Tables

#### `credential_templates`

Reusable certificate design and issuance rules.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| code | varchar(50) unique | internal code |
| name | varchar(255) | admin label |
| title | varchar(255) | certificate title |
| description | text null | |
| status | enum | `draft`, `published`, `archived` |
| issuer_name | varchar(255) | |
| issuer_did | varchar(255) null | |
| pass_score_threshold | int null | optional auto-eligibility rule |
| validity_days | int null | null = no expiry |
| artwork_storage_key | varchar(500) null | |
| artwork_public_url | varchar(1000) null | |
| template_payload | jsonb | verifiable credential body template |
| published_at | timestamptz null | |
| metadata | jsonb | |
| created_by | uuid fk users.id | |
| updated_by | uuid fk users.id null | |

#### `credential_requests`

Approval queue before issuance.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| status | enum | `pending`, `approved`, `rejected`, `issued`, `failed` |
| user_id | uuid fk users.id | target learner |
| credential_template_id | uuid fk credential_templates.id | |
| exam_template_id | uuid fk exam_templates.id null | originating test blueprint |
| eligibility_source | varchar(50) | `exam_result`, `manual`, `batch_import` |
| source_ref | varchar(255) null | external result id |
| requested_at | timestamptz | |
| decision_at | timestamptz null | |
| decided_by | uuid fk users.id null | approving admin |
| rejection_reason | text null | |
| approved_payload | jsonb | final payload inputs |
| metadata | jsonb | |

#### `credentials`

Issued digital credential.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| serial_number | varchar(100) unique | internal serial |
| vc_id | varchar(255) unique | credential id / DID VC id |
| status | enum | `issued`, `revoked`, `failed` |
| user_id | uuid fk users.id | owner |
| credential_template_id | uuid fk credential_templates.id | |
| request_id | uuid fk credential_requests.id unique null | 1 request -> 1 issued credential |
| subject_did | varchar(255) null | |
| issuer_did | varchar(255) null | |
| storage_uri | varchar(1000) null | immutable document location |
| ipfs_cid | varchar(255) null | |
| qr_token | varchar(255) unique | verify token |
| qr_url | varchar(1000) null | public verify link |
| network | varchar(100) null | `polygon-amoy`, `sepolia`, etc. |
| contract_address | varchar(255) null | |
| token_id | varchar(255) null | NFT/SBT token id |
| tx_hash | varchar(255) null | |
| issued_at | timestamptz | |
| expires_at | timestamptz null | |
| revoked_at | timestamptz null | |
| revoked_by | uuid fk users.id null | |
| revocation_reason | text null | |
| credential_payload | jsonb | final VC payload |
| metadata | jsonb | |

#### `credential_events`

Immutable lifecycle timeline.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| event_type | enum | requested, approved, rejected, issued, synced_onchain, verified, revoked, failed |
| credential_id | uuid fk credentials.id null | |
| credential_request_id | uuid fk credential_requests.id null | |
| actor_id | uuid fk users.id null | admin/system actor |
| note | text null | |
| payload | jsonb | full context |
| occurred_at | timestamptz | |

#### `credential_verification_logs`

Public verify analytics and debugging.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| credential_id | uuid fk credentials.id null | |
| verification_source | varchar(50) | `public_verify`, `qr_scan`, `api` |
| verifier_ip | varchar(100) null | |
| user_agent | varchar(1000) null | |
| is_success | boolean | |
| error_code | varchar(100) null | |
| checked_at | timestamptz | |
| metadata | jsonb | |

### 3.3 Credential admin API list

Admin and superadmin:

- `GET /admin/credential-templates`
- `POST /admin/credential-templates`
- `GET /admin/credential-templates/:id`
- `PATCH /admin/credential-templates/:id`
- `POST /admin/credential-templates/:id/publish`
- `POST /admin/credential-templates/:id/archive`
- `GET /admin/credential-requests`
- `GET /admin/credential-requests/:id`
- `POST /admin/credential-requests/:id/approve`
- `POST /admin/credential-requests/:id/reject`
- `POST /admin/credential-requests/:id/issue`
- `POST /admin/credential-requests/batch-approve`
- `GET /admin/credentials`
- `GET /admin/credentials/:id`
- `GET /admin/credentials/:id/events`
- `GET /admin/credentials/:id/verifications`
- `POST /admin/credentials/:id/revoke`
- `POST /admin/credentials/:id/resync`

## 4. Dashboard, KPI, and reporting

### 4.1 Design principle

Do not build admin dashboard only with heavy ad-hoc queries over transactional tables.

Use snapshot tables for:

- stable dashboard speed
- easier report export
- low query cost at scale
- historical comparisons by date

### 4.2 Tables

#### `dashboard_kpi_snapshots`

Daily high-level counters.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| snapshot_date | date | bucket date |
| scope_type | enum | `global`, `template`, `credential` |
| scope_ref | varchar(255) | `''` for global, otherwise target object id |
| active_learners | int | |
| active_admins | int | |
| new_users | int | |
| practice_attempts | int | |
| mock_test_attempts | int | |
| average_score | numeric(8,2) | |
| pass_rate | numeric(5,2) | |
| credentials_issued | int | |
| credentials_revoked | int | |
| metadata | jsonb | |

Unique key:

- (`snapshot_date`, `scope_type`, `scope_ref`)

#### `question_quality_snapshots`

Daily item quality signals.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| snapshot_date | date | |
| question_group_id | uuid fk question_groups.id | |
| attempts_count | int | |
| correct_count | int | |
| accuracy_rate | numeric(5,2) | |
| avg_time_sec | numeric(8,2) | |
| discrimination_index | numeric(5,2) null | optional later |
| flagged_count | int | admin/manual flags |
| metadata | jsonb | |

Unique key:

- (`snapshot_date`, `question_group_id`)

#### `exam_performance_snapshots`

Daily performance per template.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| snapshot_date | date | |
| exam_template_id | uuid fk exam_templates.id | |
| attempts_count | int | |
| completed_count | int | |
| abandoned_count | int | |
| average_score | numeric(8,2) | |
| pass_rate | numeric(5,2) | |
| avg_duration_sec | numeric(8,2) | |
| p90_duration_sec | numeric(8,2) null | |
| metadata | jsonb | |

Unique key:

- (`snapshot_date`, `exam_template_id`)

#### `report_jobs`

Async report exports.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| type | enum | dashboard_summary, question_quality, exam_performance, credential_registry, audit_export |
| status | enum | queued, processing, completed, failed, cancelled |
| requested_by | uuid fk users.id | |
| file_storage_key | varchar(500) null | exported file key |
| file_public_url | varchar(1000) null | signed/public URL |
| filters | jsonb | request filter payload |
| started_at | timestamptz null | |
| completed_at | timestamptz null | |
| error_message | text null | |
| rows_exported | int null | |
| metadata | jsonb | |

### 4.3 Dashboard and reporting API list

Admin and superadmin:

- `GET /admin/dashboard/overview`
- `GET /admin/dashboard/score-trend`
- `GET /admin/dashboard/question-quality`
- `GET /admin/dashboard/exam-performance`
- `GET /admin/dashboard/credential-kpis`
- `POST /admin/reports`
- `GET /admin/reports`
- `GET /admin/reports/:id`
- `GET /admin/reports/:id/download`
- `POST /admin/reports/:id/retry`
- `POST /admin/reports/:id/cancel`

## 5. Settings and audit

### 5.1 Tables

#### `system_settings`

Central key-value system config.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| key | varchar(150) unique | `auth.password.min_length` |
| group_name | varchar(100) | `auth`, `email`, `credential`, `storage` |
| data_type | enum | string, number, boolean, json |
| value_json | jsonb | normalized value |
| is_secret | boolean | if true, mask in response |
| is_public | boolean | safe for FE consumption |
| description | text null | |
| updated_by | uuid fk users.id null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `feature_flags`

Operational feature control without deploy.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| key | varchar(150) unique | |
| name | varchar(255) | |
| description | text null | |
| is_enabled | boolean | |
| rollout_percentage | int | 0-100 |
| conditions | jsonb | role, env, org, allowlist |
| updated_by | uuid fk users.id null | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `audit_logs`

Immutable operational audit.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| actor_id | uuid fk users.id null | admin or system user |
| actor_email | varchar(255) null | denormalized snapshot |
| action | varchar(100) | `credential.approve`, `setting.update` |
| resource_type | varchar(100) | `credential`, `system_setting`, `user` |
| resource_id | varchar(255) null | |
| route | varchar(255) null | request route |
| method | varchar(20) null | |
| ip_address | varchar(100) null | |
| user_agent | varchar(1000) null | |
| status_code | int null | |
| success | boolean | |
| changes | jsonb | before/after diff |
| metadata | jsonb | request id, correlation id |
| occurred_at | timestamptz | business event time |
| created_at | timestamptz | insert time |
| updated_at | timestamptz | should remain unchanged |

### 5.2 Settings and audit API list

`superadmin` only:

- `GET /admin/system-settings`
- `GET /admin/system-settings/:key`
- `PATCH /admin/system-settings/:key`
- `GET /admin/feature-flags`
- `GET /admin/feature-flags/:key`
- `PATCH /admin/feature-flags/:key`
- `GET /admin/audit-logs`
- `GET /admin/audit-logs/:id`
- `POST /admin/audit-logs/export`

## 6. Implementation order I recommend

1. `admin_invites` + admin user management endpoints
2. `credential_templates`
3. `credential_requests`
4. `credentials`
5. `credential_events` + revoke flow
6. `system_settings` + `feature_flags`
7. `audit_logs`
8. `dashboard_kpi_snapshots` + `report_jobs`
9. `question_quality_snapshots` + `exam_performance_snapshots`

## 7. Important backend rules

- `superadmin` is the only actor allowed to create another `superadmin`
- role changes must always write `audit_logs`
- issued credentials must never be hard-deleted
- revocation must update both `credentials.status` and `credential_events`
- public verification must only expose safe fields, never raw internal metadata
- dashboard endpoints should read from snapshot/report tables, not from live heavy joins by default
- `system_settings.is_secret = true` must be masked in API responses
