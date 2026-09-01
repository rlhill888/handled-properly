import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic();

type ButtonCandidate = { href: string; text: string; start: number; end: number };

export type ButtonCandidateOption = { index: number; text: string; href: string };
export type FormSuggestion = { formId: string; formName: string; candidateIndex: number | null };
export type ButtonMappingResult = {
  formId: string;
  formName: string;
  matched: boolean;
  buttonText: string | null;
};

// Every <a href="...">...</a> in source order, with its exact character
// span in the string — the span (not just the href/text) is what lets a
// chosen candidate be replaced by exact position later, rather than by a
// naive string search that would silently hit the wrong occurrence if the
// same href or button text appears more than once in the document. Pure and
// deterministic — same html in, same candidate list out — which is what
// lets suggestButtonMapping and applyButtonMapping below re-extract from the
// same html independently and still agree on what index N refers to.
function extractButtonCandidates(html: string): ButtonCandidate[] {
  const candidates: ButtonCandidate[] = [];
  const anchorRegex = /<a\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    candidates.push({ href: match[1], text, start: match.index, end: match.index + match[0].length });
  }
  return candidates;
}

const MappingSchema = z.object({
  mappings: z.array(
    z.object({
      formId: z.string(),
      candidateIndex: z.number().nullable(),
    })
  ),
});

// Step 1: analyzes the body HTML's buttons and suggests, per attached form,
// which one it should link to — applies nothing. The admin reviews (and can
// override) these suggestions in ComposeForm.tsx before anything is
// actually changed; see applyButtonMapping below for the step that does the
// substitution, once the admin has confirmed.
//
// Only the extracted candidate list (index, visible text, current href) is
// sent to the model, never the full HTML — Canva exports can be large with
// inline base64 images, and the model only needs enough context to judge
// which button's wording fits which form, not to reproduce the document.
export async function suggestButtonMapping(
  html: string,
  forms: { id: string; name: string }[]
): Promise<{ candidates: ButtonCandidateOption[]; suggestions: FormSuggestion[] }> {
  const candidates = extractButtonCandidates(html);
  const candidateOptions = candidates.map((c, index) => ({ index, text: c.text, href: c.href }));

  if (candidates.length === 0 || forms.length === 0) {
    return {
      candidates: candidateOptions,
      suggestions: forms.map((f) => ({ formId: f.id, formName: f.name, candidateIndex: null })),
    };
  }

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2048,
    system: `You match Forms to the button in an email's HTML that should link to
each one. You're given a numbered list of every button (its visible text and
current href) found in the email, and a list of Forms that need a link.

For each Form, pick the index of the single best-matching button based on
what the button says (e.g. "RSVP Now" fits an RSVP-style form, "Register"
or "Sign Up" fits a registration form) — or null if nothing in the list is
a good fit. Never guess a mediocre match just to fill every Form; a wrong
button is worse than none. Never reuse the same button index for more than
one Form.

This is only a suggestion — the admin reviews and can change it before
anything is applied, so prefer null over a weak guess.`,
    messages: [
      {
        role: "user",
        content: `Buttons found in the email:\n${candidates
          .map((c, i) => `${i}. "${c.text}" (currently links to: ${c.href || "(empty)"})`)
          .join("\n")}\n\nForms that need a link:\n${forms
          .map((f) => `- id ${f.id}: "${f.name}"`)
          .join("\n")}`,
      },
    ],
    output_config: { format: zodOutputFormat(MappingSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("The model's response couldn't be parsed as a button mapping.");
  }

  const usedIndices = new Set<number>();
  const suggestions: FormSuggestion[] = [];
  for (const form of forms) {
    const mapping = response.parsed_output.mappings.find((m) => m.formId === form.id);
    const candidateIndex = mapping?.candidateIndex ?? null;
    const valid = candidateIndex !== null && candidates[candidateIndex] && !usedIndices.has(candidateIndex);
    if (valid) usedIndices.add(candidateIndex!);
    suggestions.push({ formId: form.id, formName: form.name, candidateIndex: valid ? candidateIndex : null });
  }

  return { candidates: candidateOptions, suggestions };
}

// Step 2: applies an admin-confirmed form→button mapping — swaps each
// chosen candidate's href for a {{FORM_LINK_<formId>}} placeholder token,
// the same string-substitution pattern already used elsewhere in this app
// (e.g. {{PHOTO_n}}), resolved to a real fill-out URL server-side at actual
// send time (see sendMassEmail in email-manager/actions.ts). A form left
// mapped to "no button" still gets a plain link appended to the email at
// send time — every attached form always ends up reachable one way or
// another. No AI call here — deterministic, so it's cheap to re-run if the
// admin changes their mind and re-applies.
export function applyButtonMapping(
  html: string,
  mapping: FormSuggestion[]
): { bodyHtml: string; results: ButtonMappingResult[] } {
  const candidates = extractButtonCandidates(html);

  const usedIndices = new Set<number>();
  const replacements: { start: number; end: number; token: string }[] = [];
  const results: ButtonMappingResult[] = [];

  for (const m of mapping) {
    const candidate =
      m.candidateIndex !== null && !usedIndices.has(m.candidateIndex) ? candidates[m.candidateIndex] : undefined;

    if (candidate) {
      usedIndices.add(m.candidateIndex!);
      replacements.push({ start: candidate.start, end: candidate.end, token: `{{FORM_LINK_${m.formId}}}` });
      results.push({ formId: m.formId, formName: m.formName, matched: true, buttonText: candidate.text });
    } else {
      results.push({ formId: m.formId, formName: m.formName, matched: false, buttonText: null });
    }
  }

  // Applied back-to-front by position so replacing one candidate never
  // shifts the character offsets of the ones still to come.
  let bodyHtml = html;
  replacements.sort((a, b) => b.start - a.start);
  for (const r of replacements) {
    const original = bodyHtml.slice(r.start, r.end);
    const updated = original.replace(/href\s*=\s*"[^"]*"/i, `href="${r.token}"`);
    bodyHtml = bodyHtml.slice(0, r.start) + updated + bodyHtml.slice(r.end);
  }

  return { bodyHtml, results };
}
