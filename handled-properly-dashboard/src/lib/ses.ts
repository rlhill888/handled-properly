import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client({ region: process.env.AWS_REGION ?? "us-east-1" });

// SES v2 has no single call that sends distinct content to many
// recipients — SendBulkEmail exists but requires a saved template, which
// is out of scope until #14. Looping individual sends is fine at this
// admin-only, low-volume scale.
export async function sendEmail(input: { to: string; subject: string; bodyHtml: string }) {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) throw new Error("SES_FROM_EMAIL is not configured.");

  await client.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [input.to] },
      Content: {
        Simple: {
          Subject: { Data: input.subject, Charset: "UTF-8" },
          Body: { Html: { Data: input.bodyHtml, Charset: "UTF-8" } },
        },
      },
    })
  );
}
