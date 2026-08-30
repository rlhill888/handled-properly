-- Remove the Email Template feature. It was a saved, reusable HTML email
-- body distinct from the Email Send it produces, but nothing in the app
-- ever created one (no insert path anywhere in the codebase) and it holds
-- zero rows live. Dropped rather than left as dead functionality.
drop policy if exists admin_all on email_templates;
drop table if exists email_templates;
drop type if exists email_template_source;
