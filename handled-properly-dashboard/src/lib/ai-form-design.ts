import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic();

const FieldTypeSchema = z.enum([
  "text",
  "email",
  "tel",
  "number",
  "date",
  "textarea",
  "select",
  "file",
]);

const AiFormFieldSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  type: FieldTypeSchema,
  required: z.boolean(),
  backgroundColor: z.string().optional(),
  options: z.array(z.string()).optional(),
});

// Mirrors FormTheme (src/components/FormBuilder.tsx), plus two AI-only
// fields for the banner-image flow (see findBannerImageUrl below):
// wantsBannerImage is the model's own creative call; backgroundImage is
// NEVER set by the model (the system prompts forbid it) — only server code
// assigns it, post-hoc, from a verified web-search result.
const AiFormThemeSchema = z.object({
  backgroundColor: z.string(),
  fontSize: z.number().min(12).max(22),
  cardOpacity: z.number().min(0).max(1),
  backgroundMode: z.enum(["banner", "full"]),
  bannerHeight: z.number().min(80).max(1000),
  questionBackgroundColor: z.string(),
  titleFont: z.enum(["sans", "serif", "mono"]),
  titleColor: z.string(),
  titleSize: z.number().min(16).max(500),
  titleMarginBottom: z.number().min(0).max(100),
  descriptionFont: z.enum(["sans", "serif", "mono"]),
  descriptionColor: z.string(),
  descriptionSize: z.number().min(12).max(500),
  descriptionMarginBottom: z.number().min(0).max(100),
  wantsBannerImage: z.boolean().optional(),
  backgroundImage: z.string().optional(),
});

const AiFormDesignSchema = z.object({
  title: z.string(),
  description: z.string(),
  theme: AiFormThemeSchema,
  fields: z.array(AiFormFieldSchema).min(1),
});
export type AiFormDesign = z.infer<typeof AiFormDesignSchema>;

const AiReviewResultSchema = z.object({
  approved: z.boolean(),
  feedback: z.string(),
  // Always present, even when approved:true (the model echoes the same
  // design back), so the structured-output schema stays a plain object
  // rather than a discriminated union.
  revisedDesign: AiFormDesignSchema,
});
export type AiReviewResult = z.infer<typeof AiReviewResultSchema>;

function buildDesignSystemPrompt(bannerImageAvailable: boolean, isEditing: boolean): string {
  const imageGuidance = bannerImageAvailable
    ? `A background/banner image is available for use this round. If a photo
would suit this brief, set "wantsBannerImage" to true and pick backgroundMode
"banner" or "full" with title/description colors and card opacity that stay
legible over a photo (e.g. a light title color, sufficient card contrast).
Never set "backgroundImage" yourself — leave it unset; the system fills it in.
If a photo would not suit the brief, omit "wantsBannerImage" or set it false.`
    : `No background image is available this round — do not set
"wantsBannerImage". Choose backgroundMode "full" or "banner" using only solid
backgroundColor.`;

  const modeGuidance = isEditing
    ? `You are REVISING an existing form based on a follow-up instruction from
the admin, not designing one from scratch. The current design is included in
the user message as JSON, right before the instruction. Change only what the
instruction asks for — keep every other field's label, type, required flag,
options, and description, and every theme value, exactly as they already are,
unless the instruction clearly calls for a broader restyle (e.g. "redesign
this completely"). Return the FULL resulting design (not a diff), in the same
shape as the current one.`
    : `You are designing a brand-new form from scratch based on the brief below.`;

  return `You design the visual theme and question set for an
event-staffing company's intake/application forms. ${modeGuidance}

Field types available: text, email, tel, number, date, textarea, select, file
(image/video upload). For any field with type "select", you MUST include a
non-empty "options" array listing the actual choices (do not describe the
choices in the field's description instead — they must be real, selectable
options). Omit "options" entirely for every other field type.

Theme guidance:
- fontSize: 12-22 (base body text px)
- titleSize: 16-500, descriptionSize: 12-500 (px) — pick something legible for
  a form, not a billboard; typical titleSize is 24-60, descriptionSize 14-20
  unless the brief explicitly asks for something dramatic.
- bannerHeight: 80-1000 (px), only relevant when backgroundMode is "banner"
- cardOpacity: 0-1 (question card background opacity)
- All colors are hex strings (e.g. "#1a1a1a").
- ${imageGuidance}
Produce at least one field. Order fields in a sensible completion order.`;
}

export async function generateFormDesign(
  prompt: string,
  bannerImageAvailable: boolean,
  currentDesign: unknown | null = null,
): Promise<AiFormDesign> {
  const userContent = currentDesign
    ? `Current form design (JSON):\n${JSON.stringify(currentDesign)}\n\nInstruction: ${prompt}`
    : prompt;

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: buildDesignSystemPrompt(bannerImageAvailable, currentDesign !== null),
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(AiFormDesignSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("The model's response couldn't be parsed as a form design.");
  }

  return response.parsed_output;
}

const BANNER_SEARCH_SYSTEM_PROMPT = `You find one real, currently-accessible
image to use as a form's banner/background photo. Given a plain-language brief
for the form, infer a fitting visual concept (e.g. the kind of event, mood, or
subject implied), then use the web_search tool to find ONE real image that
matches — prefer openly-licensed sources such as Wikimedia Commons, Unsplash,
Pexels, Pixabay, or public-domain/government archives.

Respond with ONLY the direct URL to the image file itself (not a webpage that
merely contains it) as your final message — no markdown, no explanation, no
surrounding text. If you can't find a suitable, directly-linkable image,
respond with exactly: NONE`;

// Best-effort helper: finds a real image URL via Claude's web search tool for
// use as a form banner. Never throws — any failure (search unavailable for
// this org, no result, unreachable/non-image URL) resolves to null, since
// this must never block the core form-generation flow.
export async function findBannerImageUrl(prompt: string): Promise<string | null> {
  try {
    const tools = [
      { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 3 },
    ];

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: BANNER_SEARCH_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      tools,
    });

    let finalContent = response.content;
    if (response.stop_reason === "pause_turn") {
      // Server-side search loop paused (hit its internal iteration cap) —
      // resend the assistant's own content verbatim to let it finish. The
      // API detects the trailing server_tool_use block itself; no synthetic
      // "Continue" message is needed.
      const resumed = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 1024,
        system: BANNER_SEARCH_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: response.content },
        ],
        tools,
      });
      finalContent = resumed.content;
    }

    const textBlock = [...finalContent].reverse().find((block) => block.type === "text");
    const candidate = textBlock?.text.trim();
    if (!candidate || candidate === "NONE") return null;

    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    // Web search results are page URLs as often as direct image files —
    // confirm this one is actually fetchable as an image before trusting it.
    const isImage = async (method: "HEAD" | "GET") => {
      const res = await fetch(url, { method, signal: AbortSignal.timeout(5000) });
      return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
    };
    if (!(await isImage("HEAD").catch(() => false))) {
      if (!(await isImage("GET").catch(() => false))) return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

const REVIEW_SYSTEM_PROMPT = `You review a screenshot of a rendered form against
the admin's original brief and the JSON design that produced it. Judge layout,
color/contrast, spacing, and whether the questions match what was asked for.
If it looks good and matches the brief, set approved:true and echo the same
design back unchanged in revisedDesign. If not, set approved:false, explain why
in feedback, and return a corrected design in revisedDesign using the same
field/theme constraints you were given when designing forms from scratch
(including: every "select" field must carry a non-empty "options" array).`;

export async function reviewFormScreenshot(
  prompt: string,
  screenshotBase64: string,
  currentDesign: AiFormDesign,
): Promise<AiReviewResult> {
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: REVIEW_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: screenshotBase64 },
          },
          {
            type: "text",
            text:
              `Original brief: ${prompt}\n\n` +
              `Design JSON that produced this screenshot:\n${JSON.stringify(currentDesign)}`,
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(AiReviewResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("The model's response couldn't be parsed as a review result.");
  }

  return response.parsed_output;
}
