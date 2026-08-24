import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic();

const EmailDraftSchema = z.object({
  subject: z.string(),
  bodyHtml: z.string(),
});

export type EmailDraft = z.infer<typeof EmailDraftSchema>;

export async function generateEmailDraft(prompt: string): Promise<EmailDraft> {
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system:
      "You draft mass emails for an event-staffing company's admin. Given a plain-language " +
      "request, write a subject line and a complete HTML email body (semantic tags like <p>, " +
      "<strong>, <ul> — no <html>/<head>/<body> wrapper, no inline <style> block, no markdown). " +
      "Keep the tone professional and concise.",
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(EmailDraftSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("The model's response couldn't be parsed as an email draft.");
  }

  return response.parsed_output;
}
