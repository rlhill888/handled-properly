import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic();

export const FILL_LINK_PLACEHOLDER = "{{FILL_LINK}}";
// The admin's own verbatim Subject/Body text — the model designs a styled
// container and places these tokens literally where the content belongs,
// exactly like {{PHOTO_n}}/{{FILL_LINK}} below. It never invents the actual
// wording; the client splices the real text in afterward via plain string
// substitution (see resolveContentPlaceholders in ComposeForm.tsx).
export const BODY_CONTENT_PLACEHOLDER = "{{BODY_CONTENT}}";
export const SUBJECT_PLACEHOLDER = "{{SUBJECT}}";

const EmailHtmlSchema = z.object({
  bodyHtml: z.string(),
});

function buildSystemPrompt(
  context: { subject?: string; formName?: string | null; photoCount: number },
  isRevision: boolean,
): string {
  const modeGuidance = isRevision
    ? `You are REVISING existing email HTML based on a follow-up instruction
below, not designing one from scratch. The current HTML is included in the
user message as context. Apply only the requested change — keep every other
part of the layout, wording, colors, and structure exactly as it already is,
unless the instruction clearly calls for a broader redesign. Return the FULL
resulting HTML (not a diff), following the same constraints below.`
    : `You are designing a brand-new email from scratch based on the brief below.`;

  const photoGuidance =
    context.photoCount > 0
      ? `Exactly ${context.photoCount} photo(s) are available, referenced ONLY as the
literal tokens {{PHOTO_1}}${context.photoCount > 1 ? ` through {{PHOTO_${context.photoCount}}}` : ""}
inside <img> "src" attributes — never a real URL, never a token number higher
than ${context.photoCount}. Use each token at most once. A common strong
layout: {{PHOTO_1}} as a full-width hero/banner image near the top, any
remaining photos as supporting images further down (e.g. side by side in a
table row, or stacked). Not every photo needs to be used if it doesn't fit.`
      : `No photos are available this time — do not reference any {{PHOTO_n}}
token. Rely on bold color blocks and typography instead of imagery.`;

  const formGuidance = context.formName
    ? `A form ("${context.formName}") is attached to this email. Include EXACTLY
ONE prominent call-to-action styled as a button with href="${FILL_LINK_PLACEHOLDER}"
(that literal token, verbatim — never invent a different URL). Word it
naturally for the content (e.g. "Fill Out the Form", "RSVP Now", "Register").`
    : `No form is attached — do not reference ${FILL_LINK_PLACEHOLDER} at all.`;

  const contentGuidance = `You do NOT write the actual message wording yourself — it's
supplied verbatim by the admin and must appear completely unedited (no
rewriting, no summarizing, no fixing grammar/tone). Instead:
- Design a styled container for it (typography, spacing, background, max
  line-width) and place the literal token ${BODY_CONTENT_PLACEHOLDER} exactly
  once, wrapped in that container, wherever the message content belongs. The
  admin's content is itself HTML (it may already contain <p>, <b>, <img>,
  etc.) — don't wrap individual lines yourself, just provide the surrounding
  styled box and drop the token inside it.
- You may optionally give the email a prominent heading near the top using
  the literal token ${SUBJECT_PLACEHOLDER} in place of the subject text — use
  it at most once, and never type out the subject's actual words yourself.
  Skip it entirely if a heading doesn't suit the design.`;

  const revisionTokenReminder = isRevision
    ? `\nThe current HTML above still contains ${BODY_CONTENT_PLACEHOLDER}${
        context.subject ? ` and possibly ${SUBJECT_PLACEHOLDER}` : ""
      } as literal, unresolved tokens (along with any {{PHOTO_n}}/${FILL_LINK_PLACEHOLDER} tokens) — keep them exactly as literal tokens in your revised output, don't resolve or remove them.`
    : "";

  return `You write the HTML body for a marketing-style email, for an
event-staffing company communicating with staff and contacts. The result
must be genuinely well-designed — bold typography, deliberate color choices,
generous spacing, a clear visual hierarchy — like a professional event invite
or product-launch email, not a plain letter with a couple of styled tags.

${modeGuidance}
${revisionTokenReminder}

This HTML is sent as a raw email body via Amazon SES with NO further
wrapping, so it must follow real email-client constraints (Outlook, Gmail,
Apple Mail all render HTML email very differently from a browser):
- One outer container (a <table width="100%"> or a <div>) with an inner
  block capped around max-width:600px, centered — the "one big styled card"
  look.
- EVERY styled element uses an inline style="..." attribute. Do not use
  <style> blocks or CSS classes — many clients strip <head> entirely.
- No JavaScript. No CSS Grid or Flexbox (poor/no Outlook support) — build
  side-by-side content with <table> columns or fixed-width
  display:inline-block blocks instead.
- No text-gradient / background-clip effects — use solid, bold colors for
  text. A simple two-color linear-gradient BACKGROUND is fine as a visual
  flourish as long as a plain background-color is declared first as a
  fallback.
- Email-safe font stacks only, e.g. "Arial, Helvetica, sans-serif" or
  "Georgia, 'Times New Roman', serif" — never a custom or Google font.
- "Buttons" are <a> tags styled with padding, background-color, color,
  border-radius, and text-decoration:none — never a <button> element.
- For icons or bullets, use plain Unicode/emoji characters (e.g. 🎤 💻 🤝) —
  never inline SVG (Outlook does not render it) and never an icon font.

${photoGuidance}

${formGuidance}

${contentGuidance}

Produce the complete HTML fragment as "bodyHtml".`;
}

export async function generateEmailHtml(
  designBrief: string,
  bodyContent: string,
  context: { subject?: string; formName?: string | null; photoCount: number },
  currentHtml?: string | null,
): Promise<string> {
  const userContent = currentHtml
    ? `Current HTML:\n${currentHtml}\n\nInstruction: ${designBrief}`
    : [
        `What the email should look like: ${designBrief}`,
        context.subject ? `Subject (place via ${SUBJECT_PLACEHOLDER} if it fits): ${context.subject}` : null,
        `The verbatim message content — place exactly as-is via ${BODY_CONTENT_PLACEHOLDER}, do not rewrite or summarize it:\n${bodyContent}`,
      ]
        .filter(Boolean)
        .join("\n\n");

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8192,
    system: buildSystemPrompt(context, Boolean(currentHtml)),
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(EmailHtmlSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("The model's response couldn't be parsed as email HTML.");
  }

  return response.parsed_output.bodyHtml;
}
