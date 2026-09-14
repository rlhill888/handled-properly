import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic();

const ApplicationSummarySchema = z.object({
  summary: z.string(),
});

const SYSTEM_PROMPT = `You read a prospective client's intake answers for an
event-staffing company and write ONE short summary sentence (max ~30 words)
an admin can scan to instantly grasp what the event is and what's being
asked for — e.g. "Corporate holiday party for ~150 guests on Dec 20 in
downtown Seattle; needs bartenders and security, budget around $5,000."
Lead with the scale and timing, then anything distinctive from their
message (special requests, timing pressure, unclear scope, what kind of
event it is). Write plain prose, no labels or bullet points. If a field is
missing, just omit it — never say "not provided" or similar.`;

export type ApplicationSummaryInput = {
  eventDate: string | null;
  guestCount: number | null;
  location: string | null;
  budget: string | null;
  message: string;
};

export async function generateApplicationSummary(
  input: ApplicationSummaryInput,
): Promise<string> {
  const lines = [
    input.eventDate ? `Event date: ${input.eventDate}` : null,
    input.guestCount ? `Guest count: ${input.guestCount}` : null,
    input.location ? `Location: ${input.location}` : null,
    input.budget ? `Budget: ${input.budget}` : null,
    `Message: ${input.message}`,
  ].filter(Boolean);

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: lines.join("\n") }],
    output_config: { format: zodOutputFormat(ApplicationSummarySchema) },
  });

  if (!response.parsed_output) {
    throw new Error("The model's response couldn't be parsed as a summary.");
  }

  return response.parsed_output.summary;
}
