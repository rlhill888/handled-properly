-- Requests gain an explicit Request Type (file / text / checkbox) instead of
-- the single requires_file boolean — each type gets its own answer column,
-- and Fulfillment Setting now governs all three uniformly (previously it
-- only made sense for file requests).
create type request_type as enum ('file', 'text', 'checkbox');

alter table requests add column request_type request_type not null default 'file';
alter table requests add column response_text text;
-- checked_at mirrors fulfilled_at for the checkbox type: unlike file/text
-- (where file_path/response_text being set already means "client acted"),
-- checkbox needs its own marker to distinguish "checked, awaiting admin
-- review" from "not yet checked" under a manual_review Fulfillment Setting.
alter table requests add column checked_at timestamptz;

-- Backfill: requires_file=false rows had no client-facing action at all
-- (admin marked fulfilled by hand) — closest new equivalent is checkbox.
update requests set request_type = case when requires_file then 'file' else 'checkbox' end::request_type;

alter table requests drop constraint requests_auto_requires_file;
alter table requests drop column requires_file;

-- Each type-specific answer column can only be populated for its matching
-- Request Type.
alter table requests add constraint requests_file_path_matches_type
  check (file_path is null or request_type = 'file');
alter table requests add constraint requests_response_text_matches_type
  check (response_text is null or request_type = 'text');
alter table requests add constraint requests_checked_at_matches_type
  check (checked_at is null or request_type = 'checkbox');

-- Request Comment: a lightweight, chronological note either the admin or
-- the Request's Client can leave. Mirrors assignment_comments' dual-author
-- shape (exactly one of author_admin_id/author_client_id is set), but the
-- other author is a Client instead of Event Staff, and (unlike requests
-- itself, which deliberately has no client write policy — the Client's one
-- write goes through the service-role client) this table gets a real client
-- INSERT policy, matching how staff can post directly to assignment_comments.
create table request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  author_admin_id uuid references admins (id),
  author_client_id uuid references clients (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint request_comments_single_author check (
    (author_admin_id is not null)::int + (author_client_id is not null)::int = 1
  )
);
create index request_comments_request_idx on request_comments (request_id, created_at);

alter table request_comments enable row level security;

create policy admin_all on request_comments for all
  using (is_admin()) with check (is_admin());

create policy client_select_own_request_comments on request_comments for select
  using (request_id in (select id from requests where is_client_for_event(event_id)));

create policy client_insert_own_request_comments on request_comments for insert
  with check (
    author_client_id = current_client_id()
    and request_id in (select id from requests where is_client_for_event(event_id))
  );
