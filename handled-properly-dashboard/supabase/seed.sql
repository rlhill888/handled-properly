-- Sample data for local/test development. Applied automatically by `supabase db reset`
-- (and by `supabase start` on first run) against the local Postgres instance only.
-- Every table gets at least 2 rows, wired together as a coherent small dataset:
-- two clients, each with an event series, staffed by two event staff members,
-- with assignments, a roster, conversations, mass email, and a couple of forms.

-- Auth users backing the two admins and one logged-in event staff member.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin1@handledproperly.test', 'seed-placeholder-not-a-real-hash', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'admin2@handledproperly.test', 'seed-placeholder-not-a-real-hash', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'priya.nandan@handledproperly.test', 'seed-placeholder-not-a-real-hash', now(), now(), now());

insert into contacts (id, name, email, phone) values
  ('11111111-0000-0000-0000-000000000001', 'Dana Lee', 'dana.lee@leeevents.test', '555-010-1001'),
  ('11111111-0000-0000-0000-000000000002', 'Marcus Ito', 'marcus.ito@itoproductions.test', '555-010-1002'),
  ('11111111-0000-0000-0000-000000000003', 'Priya Nandan', 'priya.nandan@handledproperly.test', '555-010-1003'),
  ('11111111-0000-0000-0000-000000000004', 'Sam Okafor', 'sam.okafor@handledproperly.test', null),
  ('11111111-0000-0000-0000-000000000005', 'Wendy Chu', 'wendy.chu@example.test', '555-010-1005'),
  ('11111111-0000-0000-0000-000000000006', 'Leo Griffin', 'leo.griffin@example.test', null);

insert into categories (id, name) values
  ('22222222-0000-0000-0000-000000000001', 'VIP'),
  ('22222222-0000-0000-0000-000000000002', 'Repeat Client');

insert into contact_categories (contact_id, category_id) values
  ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001'),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002');

insert into clients (id, contact_id, company_name, notes) values
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Lee Events Co', 'Prefers evening load-in.'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Ito Productions', null);

insert into event_staff (id, contact_id, auth_user_id, invite_status, invited_at) values
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000003', 'active', now() - interval '30 days'),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', null, 'invited', now() - interval '2 days');

insert into admins (id, auth_user_id) values
  ('66666666-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001'),
  ('66666666-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002');

insert into event_series (id, client_id, label) values
  ('77777777-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Downtown Gala Series'),
  ('77777777-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'Ito Monthly Mixer');

insert into events (id, client_id, series_id, name, starts_at, location, status, completed_at, staff_can_start_conversations) values
  ('88888888-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'Fall Gala 2026', '2026-09-19 18:00:00+00', 'Grand Hall Downtown', 'active', null, false),
  ('88888888-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', 'Winter Gala 2026', '2026-12-12 18:00:00+00', 'Grand Hall Downtown', 'active', null, false),
  ('88888888-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000002', null, 'Ito Product Launch', '2026-07-15 17:00:00+00', 'Ito Studio A', 'completed', '2026-07-16 09:00:00+00', true),
  ('88888888-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000002', 'Ito Monthly Mixer - Sept', '2026-09-05 19:00:00+00', 'Ito Rooftop', 'active', null, true);

insert into roster_entries (event_id, event_staff_id) values
  ('88888888-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001'),
  ('88888888-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002'),
  ('88888888-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001');

insert into event_attendance (id, event_id, contact_id, source) values
  ('11111112-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'manual'),
  ('11111112-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006', 'form_submission');

insert into assignments (id, event_id, parent_assignment_id, title, description, status, tags, due_date, priority, pickup_setting) values
  ('99999999-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', null, 'Set up registration table', 'Table, iPad check-in, and signage near the main entrance.', 'ready', '{setup,front-of-house}', '2026-09-19', 'medium', 'open_pickup'),
  ('99999999-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000001', null, 'Confirm AV vendor', 'Call to confirm load-in time and mic count.', 'in_progress', '{vendor}', '2026-09-12', 'high', 'admin_only'),
  ('99999999-0000-0000-0000-000000000003', '88888888-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 'Print name badges', 'Pull the RSVP list and print badges the morning of.', 'ready', '{setup}', '2026-09-19', 'medium', 'open_pickup'),
  ('99999999-0000-0000-0000-000000000004', '88888888-0000-0000-0000-000000000003', null, 'Post-event survey follow-up', 'Email non-responders a reminder to fill out the survey.', 'done', '{follow-up}', '2026-07-20', 'low', 'admin_only');

insert into assignment_assignees (assignment_id, event_staff_id, assigned_via) values
  ('99999999-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', 'pickup'),
  ('99999999-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 'admin');

insert into forms (id, name, theme, target_type, target_id, staff_visible) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Fall Gala Registration', '{}', 'event', '88888888-0000-0000-0000-000000000001', false),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Post-Event Survey', '{}', 'email_send', 'cccccccc-0000-0000-0000-000000000002', false);

insert into email_sends (id, subject, body_html, sent_at, form_id) values
  ('cccccccc-0000-0000-0000-000000000001', 'Fall Gala Staffing Update', '<p>Hi team, here''s the latest on the Fall Gala.</p>', now() - interval '5 days', null),
  ('cccccccc-0000-0000-0000-000000000002', 'Please complete our post-event survey', '<p>Thanks for coming to the Ito Product Launch — tell us how it went.</p>', now() - interval '40 days', 'bbbbbbbb-0000-0000-0000-000000000002');

insert into email_recipients (email_send_id, contact_id) values
  ('cccccccc-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003'),
  ('cccccccc-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004'),
  ('cccccccc-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000005'),
  ('cccccccc-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006');

insert into roster_categories (id, event_id, name) values
  ('dddddddd-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', 'Security'),
  ('dddddddd-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000001', 'Bar Staff');

insert into roster_entry_categories (event_staff_id, category_id) values
  ('55555555-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001'),
  ('55555555-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000002');

insert into conversations (id, event_id, created_by_admin_id, created_by_event_staff_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', null),
  ('aaaaaaaa-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000004', null, '55555555-0000-0000-0000-000000000001');

insert into conversation_participants (conversation_id, event_staff_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001');

insert into messages (id, conversation_id, sender_admin_id, sender_event_staff_id, body) values
  ('12121212-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', null, 'Hi team, let''s coordinate setup time for the gala.'),
  ('12121212-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', null, '55555555-0000-0000-0000-000000000001', 'Sounds good, I''ll be there at 3pm to help set up.'),
  ('12121212-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', null, '55555555-0000-0000-0000-000000000001', 'Looking forward to the mixer this month!');

insert into form_fields (id, form_id, position, label, description, field_type, required, styling) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 1, 'Full Name', null, 'text', true, '{}'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 2, 'Email Address', null, 'email', true, '{}'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 1, 'Overall Rating', 'From 1 (poor) to 5 (excellent)', 'select', true, '{}'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002', 2, 'Comments', null, 'textarea', false, '{}');

insert into submissions (id, form_id, contact_id, submitted_at) values
  ('ffffffff-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', now() - interval '10 days'),
  ('ffffffff-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006', now() - interval '38 days');

insert into submission_answers (id, submission_id, form_field_id, value, file_ref) values
  ('12345678-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'Wendy Chu', null),
  ('12345678-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'wendy.chu@example.test', null),
  ('12345678-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003', '5', null),
  ('12345678-0000-0000-0000-000000000004', 'ffffffff-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000004', 'Great event, well organized!', null);
