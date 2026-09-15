---
status: accepted
---

# Content Block HTML is sanitized server-side before storage

Every other place this codebase stores admin-authored HTML verbatim, unsanitized — most notably Email Send's `body_html` (`src/app/portal/admin/email-manager/ComposeForm.tsx`'s `.richBody` editor). The first draft of the Content Block feature followed that precedent and stored `text`/`image_text` block HTML as-is too.

That precedent doesn't transfer. Email Send's HTML is rendered inside recipients' email clients (Gmail, Outlook, ...), which already strip `<script>` tags and event-handler attributes as a matter of course — the rendering environment itself is hardened. Content Block HTML is rendered with `dangerouslySetInnerHTML` straight into a public page's live DOM (`/about`, `/events/[slug]`), with no equivalent safety net. If an admin's session were ever compromised (phishing, credential stuffing, a compromised device — the realistic threat, not "the admin attacks their own site"), unsanitized block HTML would become a stored XSS hitting every visitor to those public pages, not just the portal.

`sanitizeBlockHtml` (`src/lib/blocks.ts`) allowlists only the tags/attributes the `RichTextEditor` toolbar can actually produce (bold, italic, a highlight `span`, headings) and strips everything else, applied once server-side in `createBlogPost`/`updateBlogPost`/`updateAboutContent` before the row is written. What's in the database is already safe; rendering never needs to re-sanitize.

A reader extending Email Send's editor with the same toolbar, or otherwise starting to render `body_html` outside an email client, should sanitize that path too rather than assuming its current lack of sanitization is a safe pattern to copy.
