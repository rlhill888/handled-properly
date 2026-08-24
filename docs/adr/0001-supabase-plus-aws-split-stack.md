---
status: accepted
---

# Split stack: Supabase for data/auth/storage/realtime, AWS for hosting/email/AI

The project started as "build it all on AWS," but the data model (relational, many-to-many-heavy: Roster, Assignments, Conversations, Form Attachments) needs Postgres, real-time messaging, file storage, and user auth — building all of that natively on AWS (RDS + Cognito + S3 + AppSync/WebSocket API) is significantly more setup for a single-admin-scale product. We chose Supabase (Postgres + Auth + Storage + Realtime) as the data/auth layer, and kept AWS for what it's genuinely needed for: the app runs on AWS Amplify Hosting, mass email goes through AWS SES, and AI email drafting uses the Anthropic Claude API.

This is a deliberate narrowing of "on AWS" to hosting + email, not the full stack — worth remembering so nobody "fixes" the Supabase dependency later assuming it was an oversight.
